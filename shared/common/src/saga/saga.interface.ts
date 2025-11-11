/**
 * Saga Pattern Implementation
 * 
 * This module provides the core interfaces and types for implementing
 * the Saga pattern for distributed transactions across microservices.
 */

/**
 * Represents the possible states of a Saga step
 */
export enum SagaStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED',
  COMPENSATION_FAILED = 'COMPENSATION_FAILED',
}

/**
 * Represents the overall status of a Saga
 */
export enum SagaStatus {
  INITIATED = 'INITIATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED',
  COMPENSATION_FAILED = 'COMPENSATION_FAILED',
}

/**
 * Context object passed through Saga execution
 */
export interface SagaContext<T = any> {
  sagaId: string;
  correlationId: string;
  data: T;
  metadata: {
    startedAt: Date;
    completedAt?: Date;
    failedAt?: Date;
    userId?: string;
    source?: string;
    [key: string]: any;
  };
  stepResults: Map<string, any>;
}

/**
 * Represents a single step in a Saga
 */
export interface SagaStep<T = any, R = any> {
  name: string;
  order: number;
  execute: (context: SagaContext<T>) => Promise<R>;
  compensate: (context: SagaContext<T>, result?: R) => Promise<void>;
  onStepComplete?: (context: SagaContext<T>, result: R) => Promise<void>;
  onStepFailed?: (context: SagaContext<T>, error: Error) => Promise<void>;
}

/**
 * Configuration for Saga execution
 */
export interface SagaConfig {
  sagaId: string;
  name: string;
  timeout?: number; // milliseconds
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
  continueOnError?: boolean;
}

/**
 * Result of a Saga execution
 */
export interface SagaResult<T = any> {
  sagaId: string;
  status: SagaStatus;
  context: SagaContext<T>;
  completedSteps: string[];
  failedStep?: string;
  error?: Error;
  duration: number; // milliseconds
}

/**
 * Event emitted during Saga execution
 */
export interface SagaEvent {
  sagaId: string;
  eventType: SagaEventType;
  timestamp: Date;
  stepName?: string;
  status?: SagaStatus | SagaStepStatus;
  data?: any;
  error?: Error;
}

/**
 * Types of events emitted during Saga execution
 */
export enum SagaEventType {
  SAGA_STARTED = 'SAGA_STARTED',
  SAGA_COMPLETED = 'SAGA_COMPLETED',
  SAGA_FAILED = 'SAGA_FAILED',
  SAGA_COMPENSATING = 'SAGA_COMPENSATING',
  SAGA_COMPENSATED = 'SAGA_COMPENSATED',
  STEP_STARTED = 'STEP_STARTED',
  STEP_COMPLETED = 'STEP_COMPLETED',
  STEP_FAILED = 'STEP_FAILED',
  STEP_COMPENSATING = 'STEP_COMPENSATING',
  STEP_COMPENSATED = 'STEP_COMPENSATED',
}

// Re-export interfaces from the interfaces directory
export * from './interfaces';

