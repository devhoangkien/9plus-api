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
  description?: string | null;

  @Field(() => ID, { nullable: true })
  defaultModelId?: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  settings?: Record<string, any> | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string | null;
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
  description?: string | null;

  @Field(() => TestType)
  type: TestType;

  @Field(() => [TestStepModel], { nullable: true })
  steps?: TestStepModel[] | null;

  @Field({ nullable: true })
  script?: string | null;

  @Field({ nullable: true })
  generatedBy?: string | null;

  @Field({ nullable: true })
  originalPrompt?: string | null;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string | null;
}

// ==================== Test Run Types ====================

@ObjectType()
export class StepResultModel {
  @Field(() => Int)
  stepIndex: number;

  @Field(() => TestResultStatus)
  status: TestResultStatus;

  @Field({ nullable: true })
  startedAt?: Date | null;

  @Field({ nullable: true })
  finishedAt?: Date | null;

  @Field(() => Int, { nullable: true })
  duration?: number | null;

  @Field({ nullable: true })
  log?: string | null;

  @Field({ nullable: true })
  errorMessage?: string | null;

  @Field({ nullable: true })
  screenshotUrl?: string | null;
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
  startedAt?: Date | null;

  @Field({ nullable: true })
  finishedAt?: Date | null;

  @Field(() => Int, { nullable: true })
  duration?: number | null;

  @Field({ nullable: true })
  logs?: string | null;

  @Field({ nullable: true })
  errorMessage?: string | null;

  @Field({ nullable: true })
  errorStack?: string | null;

  @Field({ nullable: true })
  screenshotUrl?: string | null;

  @Field(() => [String], { nullable: true })
  artifacts?: string[] | null;

  @Field(() => [StepResultModel], { nullable: true })
  stepResults?: StepResultModel[] | null;

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
  name?: string | null;

  @Field({ nullable: true })
  description?: string | null;

  @Field(() => TestRunStatus)
  status: TestRunStatus;

  @Field(() => TestRunTriggerSource)
  triggerSource: TestRunTriggerSource;

  @Field({ nullable: true })
  startedAt?: Date | null;

  @Field({ nullable: true })
  finishedAt?: Date | null;

  @Field({ nullable: true })
  environment?: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  config?: Record<string, any> | null;

  @Field(() => Int)
  totalTests: number;

  @Field(() => Int)
  passedTests: number;

  @Field(() => Int)
  failedTests: number;

  @Field(() => Int)
  skippedTests: number;

  @Field({ nullable: true })
  buildId?: string | null;

  @Field({ nullable: true })
  commitSha?: string | null;

  @Field({ nullable: true })
  branch?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string | null;
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
  duration?: number | null;

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
  parameters?: Record<string, any> | null;

  @Field()
  isDefault: boolean;

  @Field()
  isActive: boolean;

  @Field(() => ID, { nullable: true })
  projectId?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string | null;
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
