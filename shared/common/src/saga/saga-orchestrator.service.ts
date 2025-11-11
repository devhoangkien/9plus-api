import { Injectable, Logger } from '@nestjs/common';
import {
  ISagaOrchestrator,
  SagaConfig,
  SagaContext,
  SagaResult,
  SagaStatus,
  SagaStep,
  SagaStepStatus,
  SagaEvent,
  SagaEventType,
  ISagaEventPublisher,
  ISagaStateStore,
} from './saga.interface';

/**
 * Default Saga orchestrator implementation
 * Coordinates execution of Saga steps and compensation
 */
@Injectable()
export class SagaOrchestrator implements ISagaOrchestrator {
  private readonly logger = new Logger(SagaOrchestrator.name);

  constructor(
    private readonly eventPublisher?: ISagaEventPublisher,
    private readonly stateStore?: ISagaStateStore,
  ) {}

  /**
   * Execute a Saga with the given steps
   */
  async execute<T = any>(
    config: SagaConfig,
    steps: SagaStep<T>[],
    initialData: T,
  ): Promise<SagaResult<T>> {
    const startTime = Date.now();
    const sortedSteps = this.sortSteps(steps);
    
    const context: SagaContext<T> = {
      sagaId: config.sagaId,
      correlationId: config.sagaId,
      data: initialData,
      metadata: {
        startedAt: new Date(),
        source: config.name,
      },
      stepResults: new Map(),
    };

    this.logger.log(`[${config.sagaId}] Starting Saga: ${config.name}`);
    await this.publishEvent({
      sagaId: config.sagaId,
      eventType: SagaEventType.SAGA_STARTED,
      timestamp: new Date(),
      data: { name: config.name },
    });

    // Save initial state
    if (this.stateStore) {
      await this.stateStore.save(config.sagaId, {
        status: SagaStatus.IN_PROGRESS,
        context,
        completedSteps: [],
      });
    }

    const completedSteps: SagaStep<T>[] = [];
    let failedStep: string | undefined;
    let lastError: Error | undefined;

    try {
      // Execute each step in order
      for (const step of sortedSteps) {
        try {
          await this.executeStep(config, step, context);
          completedSteps.push(step);
        } catch (error) {
          lastError = error as Error;
          failedStep = step.name;
          this.logger.error(
            `[${config.sagaId}] Step ${step.name} failed: ${error.message}`,
            error.stack,
          );
          
          // Publish failure event
          await this.publishEvent({
            sagaId: config.sagaId,
            eventType: SagaEventType.STEP_FAILED,
            timestamp: new Date(),
            stepName: step.name,
            error: error as Error,
          });

          // Execute compensation for all completed steps
          await this.compensate(context, completedSteps.reverse());
          
          break;
        }
      }

      const duration = Date.now() - startTime;

      // Determine final status
      let status: SagaStatus;
      if (failedStep) {
        status = SagaStatus.COMPENSATED;
        context.metadata.failedAt = new Date();
        
        await this.publishEvent({
          sagaId: config.sagaId,
          eventType: SagaEventType.SAGA_COMPENSATED,
          timestamp: new Date(),
          status,
        });
      } else {
        status = SagaStatus.COMPLETED;
        context.metadata.completedAt = new Date();
        
        await this.publishEvent({
          sagaId: config.sagaId,
          eventType: SagaEventType.SAGA_COMPLETED,
          timestamp: new Date(),
          status,
        });
      }

      this.logger.log(
        `[${config.sagaId}] Saga ${status} in ${duration}ms`,
      );

      // Update state
      if (this.stateStore) {
        await this.stateStore.update(config.sagaId, {
          status,
          context,
          completedSteps: completedSteps.map(s => s.name),
          failedStep,
          duration,
        });
      }

      return {
        sagaId: config.sagaId,
        status,
        context,
        completedSteps: completedSteps.map(s => s.name),
        failedStep,
        error: lastError,
        duration,
      };
    } catch (error) {
      this.logger.error(
        `[${config.sagaId}] Saga execution failed: ${error.message}`,
        error.stack,
      );
      
      await this.publishEvent({
        sagaId: config.sagaId,
        eventType: SagaEventType.SAGA_FAILED,
        timestamp: new Date(),
        error: error as Error,
      });

      const duration = Date.now() - startTime;
      return {
        sagaId: config.sagaId,
        status: SagaStatus.FAILED,
        context,
        completedSteps: completedSteps.map(s => s.name),
        failedStep,
        error: error as Error,
        duration,
      };
    }
  }

  /**
   * Execute a single Saga step
   */
  private async executeStep<T>(
    config: SagaConfig,
    step: SagaStep<T>,
    context: SagaContext<T>,
  ): Promise<void> {
    this.logger.debug(`[${config.sagaId}] Executing step: ${step.name}`);
    
    await this.publishEvent({
      sagaId: config.sagaId,
      eventType: SagaEventType.STEP_STARTED,
      timestamp: new Date(),
      stepName: step.name,
      status: SagaStepStatus.IN_PROGRESS,
    });

    try {
      const result = await this.executeWithTimeout(
        step.execute(context),
        config.timeout,
      );
      
      // Store step result
      context.stepResults.set(step.name, result);
      
      // Call optional completion hook
      if (step.onStepComplete) {
        await step.onStepComplete(context, result);
      }

      this.logger.debug(`[${config.sagaId}] Step ${step.name} completed`);
      
      await this.publishEvent({
        sagaId: config.sagaId,
        eventType: SagaEventType.STEP_COMPLETED,
        timestamp: new Date(),
        stepName: step.name,
        status: SagaStepStatus.COMPLETED,
        data: result,
      });
    } catch (error) {
      // Call optional failure hook
      if (step.onStepFailed) {
        await step.onStepFailed(context, error as Error);
      }
      throw error;
    }
  }

  /**
   * Compensate all completed steps in reverse order
   */
  async compensate<T = any>(
    context: SagaContext<T>,
    completedSteps: SagaStep<T>[],
  ): Promise<void> {
    this.logger.warn(
      `[${context.sagaId}] Starting compensation for ${completedSteps.length} steps`,
    );

    await this.publishEvent({
      sagaId: context.sagaId,
      eventType: SagaEventType.SAGA_COMPENSATING,
      timestamp: new Date(),
      status: SagaStatus.COMPENSATING,
    });

    for (const step of completedSteps) {
      try {
        this.logger.debug(`[${context.sagaId}] Compensating step: ${step.name}`);
        
        await this.publishEvent({
          sagaId: context.sagaId,
          eventType: SagaEventType.STEP_COMPENSATING,
          timestamp: new Date(),
          stepName: step.name,
        });

        const stepResult = context.stepResults.get(step.name);
        await step.compensate(context, stepResult);
        
        await this.publishEvent({
          sagaId: context.sagaId,
          eventType: SagaEventType.STEP_COMPENSATED,
          timestamp: new Date(),
          stepName: step.name,
          status: SagaStepStatus.COMPENSATED,
        });

        this.logger.debug(
          `[${context.sagaId}] Step ${step.name} compensated successfully`,
        );
      } catch (error) {
        this.logger.error(
          `[${context.sagaId}] Failed to compensate step ${step.name}: ${error.message}`,
          error.stack,
        );
        // Continue with other compensations even if one fails
      }
    }

    this.logger.log(`[${context.sagaId}] Compensation completed`);
  }

  /**
   * Get the current status of a Saga
   */
  async getStatus(sagaId: string): Promise<SagaStatus | null> {
    if (!this.stateStore) {
      return null;
    }

    const state = await this.stateStore.get(sagaId);
    return state?.status || null;
  }

  /**
   * Sort steps by their order property
   */
  private sortSteps<T>(steps: SagaStep<T>[]): SagaStep<T>[] {
    return [...steps].sort((a, b) => a.order - b.order);
  }

  /**
   * Execute a promise with timeout
   */
  private async executeWithTimeout<R>(
    promise: Promise<R>,
    timeout?: number,
  ): Promise<R> {
    if (!timeout) {
      return promise;
    }

    return Promise.race([
      promise,
      new Promise<R>((_, reject) =>
        setTimeout(() => reject(new Error('Step execution timeout')), timeout),
      ),
    ]);
  }

  /**
   * Publish a Saga event
   */
  private async publishEvent(event: SagaEvent): Promise<void> {
    if (this.eventPublisher) {
      try {
        await this.eventPublisher.publish(event);
      } catch (error) {
        this.logger.error(
          `Failed to publish event ${event.eventType}: ${error.message}`,
        );
        // Don't fail the saga if event publishing fails
      }
    }
  }
}
