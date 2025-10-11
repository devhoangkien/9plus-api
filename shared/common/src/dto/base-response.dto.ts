import { Field, ObjectType, Int } from '@nestjs/graphql';

/**
 * Pagination metadata
 */
@ObjectType()
export class PaginationMeta {
  @Field(() => Int, { description: 'Current page number' })
  currentPage!: number;

  @Field(() => Int, { description: 'Items per page' })
  perPage!: number;

  @Field(() => Int, { description: 'Total number of items' })
  totalItems!: number;

  @Field(() => Int, { description: 'Total number of pages' })
  totalPages!: number;

  @Field(() => Boolean, { description: 'Has next page' })
  hasNextPage!: boolean;

  @Field(() => Boolean, { description: 'Has previous page' })
  hasPreviousPage!: boolean;
}

/**
 * Base paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  message?: string;
  success: boolean;
}

/**
 * Base single item response
 */
export interface SingleResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Base error response
 */
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
  timestamp: string;
  path?: string;
  requestId?: string;
}

/**
 * Create paginated response helper
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  totalItems: number,
  message?: string,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    success: true,
    data,
    pagination: {
      currentPage: page,
      perPage: limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    message,
  };
}

/**
 * Create single response helper
 */
export function createSingleResponse<T>(
  data: T,
  message?: string,
): SingleResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Create error response helper
 */
export function createErrorResponse(
  message: string,
  errors?: Array<{ field?: string; message: string; code?: string }>,
  path?: string,
  requestId?: string,
): ErrorResponse {
  return {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
    path,
    requestId,
  };
}
