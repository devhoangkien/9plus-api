import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Field, InputType, Int, ArgsType } from '@nestjs/graphql';

/**
 * Pagination input DTO
 */
@InputType()
@ArgsType()
export class PaginationInput {
  @Field(() => Int, { 
    nullable: true, 
    defaultValue: 1,
    description: 'Page number (starts from 1)' 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @Field(() => Int, { 
    nullable: true, 
    defaultValue: 10,
    description: 'Number of items per page' 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * Sorting input DTO
 */
@InputType()
export class SortInput {
  @Field({ description: 'Field to sort by' })
  field!: string;

  @Field(() => String, { 
    nullable: true, 
    defaultValue: 'ASC',
    description: 'Sort direction (ASC or DESC)' 
  })
  @IsOptional()
  direction?: 'ASC' | 'DESC' = 'ASC';
}

/**
 * Filter input DTO
 */
@InputType()
export class FilterInput {
  @Field({ description: 'Field to filter' })
  field!: string;

  @Field({ description: 'Filter operator (eq, ne, gt, gte, lt, lte, like, in)' })
  operator!: string;

  @Field({ description: 'Filter value' })
  value!: string;
}

/**
 * Complete query input with pagination, sorting, and filtering
 */
@InputType()
@ArgsType()
export class QueryInput extends PaginationInput {
  @Field(() => [SortInput], { 
    nullable: true,
    description: 'Sorting criteria' 
  })
  @IsOptional()
  sort?: SortInput[];

  @Field(() => [FilterInput], { 
    nullable: true,
    description: 'Filtering criteria' 
  })
  @IsOptional()
  filters?: FilterInput[];

  @Field({ 
    nullable: true,
    description: 'Search query string' 
  })
  @IsOptional()
  search?: string;
}
