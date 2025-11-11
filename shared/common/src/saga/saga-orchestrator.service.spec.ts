import { Test, TestingModule } from '@nestjs/testing';
import { SagaOrchestrator } from './saga-orchestrator.service';
import { SagaEventPublisher } from './saga-event-publisher.service';
import { SagaStateStore } from './saga-state-store.service';
import {
  SagaConfig,
  SagaStep,
  SagaStatus,
  SagaContext,
  SagaStepStatus,
} from './saga.interface';

describe('SagaOrchestrator', () => {
  let orchestrator: SagaOrchestrator;
  let eventPublisher: SagaEventPublisher;
  let stateStore: SagaStateStore;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SagaOrchestrator,
        SagaEventPublisher,
        SagaStateStore,
      ],
    }).compile();

    orchestrator = module.get<SagaOrchestrator>(SagaOrchestrator);
    eventPublisher = module.get<SagaEventPublisher>(SagaEventPublisher);
    stateStore = module.get<SagaStateStore>(SagaStateStore);
  });

  afterEach(async () => {
    // Clean up state
    await stateStore.clear();
    eventPublisher.clearAll();
  });

  describe('execute', () => {
    it('should execute all steps successfully', async () => {
      const config: SagaConfig = {
        sagaId: 'test-saga-1',
        name: 'TestSaga',
      };

      const steps: SagaStep<any>[] = [
        {
          name: 'Step1',
          order: 1,
          execute: jest.fn().mockResolvedValue({ result: 'step1' }),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
        {
          name: 'Step2',
          order: 2,
          execute: jest.fn().mockResolvedValue({ result: 'step2' }),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
      ];

      const result = await orchestrator.execute(config, steps, { data: 'test' });

      expect(result.status).toBe(SagaStatus.COMPLETED);
      expect(result.completedSteps).toEqual(['Step1', 'Step2']);
      expect(result.error).toBeUndefined();
      expect(steps[0].execute).toHaveBeenCalled();
      expect(steps[1].execute).toHaveBeenCalled();
      expect(steps[0].compensate).not.toHaveBeenCalled();
      expect(steps[1].compensate).not.toHaveBeenCalled();
    });

    it('should compensate completed steps on failure', async () => {
      const config: SagaConfig = {
        sagaId: 'test-saga-2',
        name: 'TestSaga',
      };

      const steps: SagaStep<any>[] = [
        {
          name: 'Step1',
          order: 1,
          execute: jest.fn().mockResolvedValue({ result: 'step1' }),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
        {
          name: 'Step2',
          order: 2,
          execute: jest.fn().mockRejectedValue(new Error('Step2 failed')),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
        {
          name: 'Step3',
          order: 3,
          execute: jest.fn().mockResolvedValue({ result: 'step3' }),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
      ];

      const result = await orchestrator.execute(config, steps, { data: 'test' });

      expect(result.status).toBe(SagaStatus.COMPENSATED);
      expect(result.failedStep).toBe('Step2');
      expect(result.completedSteps).toEqual(['Step1']);
      expect(result.error?.message).toBe('Step2 failed');
      
      // Only Step1 should execute and be compensated
      expect(steps[0].execute).toHaveBeenCalled();
      expect(steps[0].compensate).toHaveBeenCalled();
      expect(steps[1].execute).toHaveBeenCalled();
      expect(steps[1].compensate).not.toHaveBeenCalled(); // Failed step not compensated
      expect(steps[2].execute).not.toHaveBeenCalled(); // Step3 never executed
    });

    it('should execute steps in correct order', async () => {
      const executionOrder: string[] = [];
      
      const config: SagaConfig = {
        sagaId: 'test-saga-3',
        name: 'TestSaga',
      };

      const steps: SagaStep<any>[] = [
        {
          name: 'Step3',
          order: 3,
          execute: jest.fn().mockImplementation(async () => {
            executionOrder.push('Step3');
            return {};
          }),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
        {
          name: 'Step1',
          order: 1,
          execute: jest.fn().mockImplementation(async () => {
            executionOrder.push('Step1');
            return {};
          }),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
        {
          name: 'Step2',
          order: 2,
          execute: jest.fn().mockImplementation(async () => {
            executionOrder.push('Step2');
            return {};
          }),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
      ];

      await orchestrator.execute(config, steps, { data: 'test' });

      expect(executionOrder).toEqual(['Step1', 'Step2', 'Step3']);
    });

    it('should store step results in context', async () => {
      const config: SagaConfig = {
        sagaId: 'test-saga-4',
        name: 'TestSaga',
      };

      let capturedContext: SagaContext | null = null;

      const steps: SagaStep<any>[] = [
        {
          name: 'Step1',
          order: 1,
          execute: jest.fn().mockResolvedValue({ value: 'result1' }),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
        {
          name: 'Step2',
          order: 2,
          execute: jest.fn().mockImplementation(async (context) => {
            capturedContext = context;
            return { value: 'result2' };
          }),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
      ];

      await orchestrator.execute(config, steps, { data: 'test' });

      expect(capturedContext).not.toBeNull();
      expect(capturedContext?.stepResults.get('Step1')).toEqual({ value: 'result1' });
    });

    it('should handle timeout', async () => {
      const config: SagaConfig = {
        sagaId: 'test-saga-5',
        name: 'TestSaga',
        timeout: 100, // 100ms timeout
      };

      const steps: SagaStep<any>[] = [
        {
          name: 'SlowStep',
          order: 1,
          execute: jest.fn().mockImplementation(async () => {
            // Wait longer than timeout
            await new Promise(resolve => setTimeout(resolve, 200));
            return {};
          }),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
      ];

      const result = await orchestrator.execute(config, steps, { data: 'test' });

      expect(result.status).toBe(SagaStatus.COMPENSATED);
      expect(result.error?.message).toContain('timeout');
    });

    it('should call onStepComplete hook on success', async () => {
      const onStepComplete = jest.fn();
      
      const config: SagaConfig = {
        sagaId: 'test-saga-6',
        name: 'TestSaga',
      };

      const steps: SagaStep<any>[] = [
        {
          name: 'Step1',
          order: 1,
          execute: jest.fn().mockResolvedValue({ result: 'data' }),
          compensate: jest.fn().mockResolvedValue(undefined),
          onStepComplete,
        },
      ];

      await orchestrator.execute(config, steps, { data: 'test' });

      expect(onStepComplete).toHaveBeenCalled();
    });

    it('should call onStepFailed hook on failure', async () => {
      const onStepFailed = jest.fn();
      
      const config: SagaConfig = {
        sagaId: 'test-saga-7',
        name: 'TestSaga',
      };

      const steps: SagaStep<any>[] = [
        {
          name: 'FailingStep',
          order: 1,
          execute: jest.fn().mockRejectedValue(new Error('Failed')),
          compensate: jest.fn().mockResolvedValue(undefined),
          onStepFailed,
        },
      ];

      await orchestrator.execute(config, steps, { data: 'test' });

      expect(onStepFailed).toHaveBeenCalled();
    });
  });

  describe('compensate', () => {
    it('should compensate steps in reverse order', async () => {
      const compensationOrder: string[] = [];
      
      const steps: SagaStep<any>[] = [
        {
          name: 'Step1',
          order: 1,
          execute: jest.fn(),
          compensate: jest.fn().mockImplementation(async () => {
            compensationOrder.push('Step1');
          }),
        },
        {
          name: 'Step2',
          order: 2,
          execute: jest.fn(),
          compensate: jest.fn().mockImplementation(async () => {
            compensationOrder.push('Step2');
          }),
        },
        {
          name: 'Step3',
          order: 3,
          execute: jest.fn(),
          compensate: jest.fn().mockImplementation(async () => {
            compensationOrder.push('Step3');
          }),
        },
      ];

      const context: SagaContext = {
        sagaId: 'test-saga-8',
        correlationId: 'test-saga-8',
        data: {},
        metadata: { startedAt: new Date() },
        stepResults: new Map(),
      };

      await orchestrator.compensate(context, steps);

      expect(compensationOrder).toEqual(['Step3', 'Step2', 'Step1']);
    });

    it('should continue compensation even if one step fails', async () => {
      const steps: SagaStep<any>[] = [
        {
          name: 'Step1',
          order: 1,
          execute: jest.fn(),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
        {
          name: 'Step2',
          order: 2,
          execute: jest.fn(),
          compensate: jest.fn().mockRejectedValue(new Error('Compensation failed')),
        },
        {
          name: 'Step3',
          order: 3,
          execute: jest.fn(),
          compensate: jest.fn().mockResolvedValue(undefined),
        },
      ];

      const context: SagaContext = {
        sagaId: 'test-saga-9',
        correlationId: 'test-saga-9',
        data: {},
        metadata: { startedAt: new Date() },
        stepResults: new Map(),
      };

      // Should not throw
      await orchestrator.compensate(context, steps);

      // All compensations should be attempted
      expect(steps[0].compensate).toHaveBeenCalled();
      expect(steps[1].compensate).toHaveBeenCalled();
      expect(steps[2].compensate).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return saga status from store', async () => {
      const sagaId = 'test-saga-10';
      
      await stateStore.save(sagaId, {
        status: SagaStatus.COMPLETED,
      });

      const status = await orchestrator.getStatus(sagaId);

      expect(status).toBe(SagaStatus.COMPLETED);
    });

    it('should return null if saga not found', async () => {
      const status = await orchestrator.getStatus('non-existent-saga');

      expect(status).toBeNull();
    });
  });
});
