import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import { PaginationMeta } from './base-response.dto';

/**
 * Factory function to create paginated response type
 */
export function PaginatedResponseType<T>(classRef: Type<T>): any {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [classRef], { description: 'Array of data items' })
    data!: T[];

    @Field(() => PaginationMeta, { description: 'Pagination metadata' })
    pagination!: PaginationMeta;

    @Field({ nullable: true, description: 'Response message' })
    message?: string;

    @Field(() => Boolean, { description: 'Success status' })
    success!: boolean;
  }

  return PaginatedType;
}

/**
 * Factory function to create single response type
 */
export function SingleResponseType<T>(classRef: Type<T>): any {
  @ObjectType({ isAbstract: true })
  abstract class SingleType {
    @Field(() => classRef, { description: 'Data item' })
    data!: T;

    @Field({ nullable: true, description: 'Response message' })
    message?: string;

    @Field(() => Boolean, { description: 'Success status' })
    success!: boolean;
  }

  return SingleType;
}

/**
 * Error detail type
 */
@ObjectType()
export class ErrorDetail {
  @Field({ nullable: true, description: 'Field name that caused the error' })
  field?: string;

  @Field({ description: 'Error message' })
  message!: string;

  @Field({ nullable: true, description: 'Error code' })
  code?: string;
}

/**
 * Error response type
 */
@ObjectType()
export class ErrorResponseType {
  @Field(() => Boolean, { description: 'Success status (always false)' })
  success!: boolean;

  @Field({ description: 'Error message' })
  message!: string;

  @Field(() => [ErrorDetail], { nullable: true, description: 'Detailed errors' })
  errors?: ErrorDetail[];

  @Field({ description: 'Timestamp of the error' })
  timestamp!: string;

  @Field({ nullable: true, description: 'Request path' })
  path?: string;

  @Field({ nullable: true, description: 'Request ID for tracing' })
  requestId?: string;
}
