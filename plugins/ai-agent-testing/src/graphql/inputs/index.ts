import { InputType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TestType, TestRunTriggerSource, ModelProvider, TestStepType } from '../../domain/entities';

// Register enums with GraphQL
registerEnumType(TestType, { name: 'TestType' });
registerEnumType(TestRunTriggerSource, { name: 'TestRunTriggerSource' });
registerEnumType(ModelProvider, { name: 'ModelProvider' });
registerEnumType(TestStepType, { name: 'TestStepType' });

// ==================== Project Inputs ====================

@InputType()
export class CreateProjectInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  defaultModelId?: string;
}

@InputType()
export class UpdateProjectInput {
  @Field(() => ID)
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  defaultModelId?: string;
}

// ==================== Test Case Inputs ====================

@InputType()
export class TestStepInput {
  @Field()
  order: number;

  @Field(() => TestStepType)
  type: TestStepType;

  @Field()
  description: string;

  @Field({ nullable: true })
  @IsOptional()
  target?: string;

  @Field({ nullable: true })
  @IsOptional()
  value?: string;

  @Field({ nullable: true })
  @IsOptional()
  timeout?: number;
}

@InputType()
export class CreateTestCaseInput {
  @Field(() => ID)
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => TestType)
  type: TestType;

  @Field(() => [TestStepInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestStepInput)
  steps?: TestStepInput[];

  @Field({ nullable: true })
  @IsOptional()
  script?: string;
}

@InputType()
export class UpdateTestCaseInput {
  @Field(() => ID)
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => [TestStepInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestStepInput)
  steps?: TestStepInput[];

  @Field({ nullable: true })
  @IsOptional()
  script?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== AI Agent Inputs ====================

@InputType()
export class GenerateTestCaseInput {
  @Field(() => ID)
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsNotEmpty()
  description: string;

  @Field(() => TestType)
  type: TestType;

  @Field({ nullable: true, defaultValue: 'en' })
  @IsOptional()
  language?: string;

  @Field({ nullable: true, defaultValue: 'STEP_BY_STEP' })
  @IsOptional()
  style?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  modelId?: string;
}

// ==================== Test Run Inputs ====================

@InputType()
export class CreateTestRunInput {
  @Field(() => ID)
  @IsNotEmpty()
  projectId: string;

  @Field({ nullable: true })
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => TestRunTriggerSource, { nullable: true, defaultValue: TestRunTriggerSource.MANUAL })
  @IsOptional()
  triggerSource?: TestRunTriggerSource;

  @Field(() => [ID])
  @IsNotEmpty()
  @IsArray()
  testCaseIds: string[];

  @Field({ nullable: true })
  @IsOptional()
  environment?: string;

  @Field({ nullable: true })
  @IsOptional()
  buildId?: string;

  @Field({ nullable: true })
  @IsOptional()
  commitSha?: string;

  @Field({ nullable: true })
  @IsOptional()
  branch?: string;
}

// ==================== Model Config Inputs ====================

@InputType()
export class CreateModelConfigInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field(() => ModelProvider)
  provider: ModelProvider;

  @Field()
  @IsNotEmpty()
  modelName: string;

  @Field()
  @IsNotEmpty()
  apiBaseUrl: string;

  @Field()
  @IsNotEmpty()
  apiKeyRef: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  projectId?: string;
}

@InputType()
export class UpdateModelConfigInput {
  @Field(() => ID)
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  modelName?: string;

  @Field({ nullable: true })
  @IsOptional()
  apiBaseUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  apiKeyRef?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
