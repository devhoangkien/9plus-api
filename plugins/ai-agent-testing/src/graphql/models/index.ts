import { ObjectType, Field, ID, Int, Float, registerEnumType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import {
  TestType,
  TestRunStatus,
  TestResultStatus,
  TestRunTriggerSource,
  ModelProvider,
  TestStepType,
} from '../../domain/entities';

// Register enums
registerEnumType(TestRunStatus, { name: 'TestRunStatus' });
registerEnumType(TestResultStatus, { name: 'TestResultStatus' });

// ==================== Project Types ====================

@ObjectType()
export class ProjectModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ID, { nullable: true })
  defaultModelId?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  settings?: Record<string, any>;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string;
}

// ==================== Test Case Types ====================

@ObjectType()
export class TestStepModel {
  @Field(() => Int)
  order: number;

  @Field(() => TestStepType)
  type: TestStepType;

  @Field()
  description: string;

  @Field({ nullable: true })
  target?: string;

  @Field({ nullable: true })
  value?: string;

  @Field(() => Int, { nullable: true })
  timeout?: number;

  @Field(() => GraphQLJSON, { nullable: true })
  options?: Record<string, any>;
}

@ObjectType()
export class TestCaseModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  projectId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => TestType)
  type: TestType;

  @Field(() => [TestStepModel], { nullable: true })
  steps?: TestStepModel[];

  @Field({ nullable: true })
  script?: string;

  @Field({ nullable: true })
  generatedBy?: string;

  @Field({ nullable: true })
  originalPrompt?: string;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string;
}

// ==================== Test Run Types ====================

@ObjectType()
export class StepResultModel {
  @Field(() => Int)
  stepIndex: number;

  @Field(() => TestResultStatus)
  status: TestResultStatus;

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  finishedAt?: Date;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field({ nullable: true })
  log?: string;

  @Field({ nullable: true })
  errorMessage?: string;

  @Field({ nullable: true })
  screenshotUrl?: string;
}

@ObjectType()
export class TestRunResultModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  testRunId: string;

  @Field(() => ID)
  testCaseId: string;

  @Field(() => TestResultStatus)
  status: TestResultStatus;

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  finishedAt?: Date;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field({ nullable: true })
  logs?: string;

  @Field({ nullable: true })
  errorMessage?: string;

  @Field({ nullable: true })
  errorStack?: string;

  @Field({ nullable: true })
  screenshotUrl?: string;

  @Field(() => [String], { nullable: true })
  artifacts?: string[];

  @Field(() => [StepResultModel], { nullable: true })
  stepResults?: StepResultModel[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class TestRunModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  projectId: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => TestRunStatus)
  status: TestRunStatus;

  @Field(() => TestRunTriggerSource)
  triggerSource: TestRunTriggerSource;

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  finishedAt?: Date;

  @Field({ nullable: true })
  environment?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  config?: Record<string, any>;

  @Field(() => Int)
  totalTests: number;

  @Field(() => Int)
  passedTests: number;

  @Field(() => Int)
  failedTests: number;

  @Field(() => Int)
  skippedTests: number;

  @Field({ nullable: true })
  buildId?: string;

  @Field({ nullable: true })
  commitSha?: string;

  @Field({ nullable: true })
  branch?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string;
}

@ObjectType()
export class TestRunSummaryModel {
  @Field(() => ID)
  testRunId: string;

  @Field(() => TestRunStatus)
  status: TestRunStatus;

  @Field(() => Int)
  totalTests: number;

  @Field(() => Int)
  passedTests: number;

  @Field(() => Int)
  failedTests: number;

  @Field(() => Int)
  skippedTests: number;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field(() => Float)
  passRate: number;
}

// ==================== Model Config Types ====================

@ObjectType()
export class ModelConfigModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => ModelProvider)
  provider: ModelProvider;

  @Field()
  modelName: string;

  @Field()
  apiBaseUrl: string;

  @Field()
  apiKeyRef: string;

  @Field(() => GraphQLJSON, { nullable: true })
  parameters?: Record<string, any>;

  @Field()
  isDefault: boolean;

  @Field()
  isActive: boolean;

  @Field(() => ID, { nullable: true })
  projectId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string;
}

// ==================== AI Agent Types ====================

@ObjectType()
export class GeneratedTestCaseModel {
  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => [TestStepModel])
  steps: TestStepModel[];

  @Field({ nullable: true })
  script?: string;
}
