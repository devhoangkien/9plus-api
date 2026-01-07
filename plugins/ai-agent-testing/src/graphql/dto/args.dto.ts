import { ArgsType, Field, ID, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, Max, IsNotEmpty, IsString } from 'class-validator';
import { TestType, TestRunStatus, TestRunTriggerSource } from '../../domain/entities';

// ==================== Pagination Args ====================

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ==================== Project Args ====================

@ArgsType()
export class GetProjectArgs {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  id!: string;
}

@ArgsType()
export class GetProjectsArgs extends PaginationArgs { }

// ==================== Test Case Args ====================

@ArgsType()
export class GetTestCaseArgs {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  id!: string;
}

@ArgsType()
export class GetTestCasesArgs extends PaginationArgs {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  projectId!: string;

  @Field(() => TestType, { nullable: true })
  @IsOptional()
  type?: TestType;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;
}

// ==================== Test Run Args ====================

@ArgsType()
export class GetTestRunArgs {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  id!: string;
}

@ArgsType()
export class GetTestRunsArgs extends PaginationArgs {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  projectId!: string;

  @Field(() => TestRunStatus, { nullable: true })
  @IsOptional()
  status?: TestRunStatus;

  @Field(() => TestRunTriggerSource, { nullable: true })
  @IsOptional()
  triggerSource?: TestRunTriggerSource;
}

// ==================== Model Config Args ====================

@ArgsType()
export class GetModelConfigArgs {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  id!: string;
}

@ArgsType()
export class GetModelConfigsArgs extends PaginationArgs {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  projectId?: string;
}
