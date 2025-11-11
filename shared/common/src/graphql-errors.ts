import { GraphQLError } from 'graphql';
import { ValidationError } from 'class-validator';

/**
 * Create a standard GraphQL error with consistent format
 * @param status HTTP status code
 * @param message Error message
 * @param code Error code (e.g., "UNAUTHORIZED", "BAD_REQUEST")
 * @param errors Optional array of detailed errors
 */
export function createGraphQLError(
  status: number,
  message: string,
  code: string,
  errors?: any[],
): GraphQLError {
  const extensions: any = {
    status,
    code,
  };

  // Only include errors array if provided and not empty
  if (errors && errors.length > 0) {
    extensions.errors = errors;
  }

  return new GraphQLError(message, {
    extensions,
  });
}

/**
 * Validation error detail type
 */
export type ErrorType = {
  property: string;
  message: string;
  errorCode: number;
  developerNote?: string;
}

/**
 * Transform class-validator ValidationError to ErrorType format
 * @param validationError ValidationError from class-validator
 * @param parentPath Optional parent property path for nested objects
 */
export function transformValidationError(
  validationError: ValidationError,
  parentPath: string = '',
): ErrorType[] {
  const errors: ErrorType[] = [];
  const propertyPath = parentPath 
    ? `${parentPath}.${validationError.property}` 
    : validationError.property;

  // Handle direct constraints on this property
  if (validationError.constraints) {
    Object.keys(validationError.constraints).forEach((constraintKey) => {
      const message = validationError.constraints![constraintKey];
      
      // Check for custom context with error code
      const context = validationError.contexts?.[constraintKey];
      
      errors.push({
        property: propertyPath,
        message,
        errorCode: context?.errorCode || 400,
        developerNote: context?.developerNote,
      });
    });
  }

  // Handle nested validation errors recursively
  if (validationError.children && validationError.children.length > 0) {
    validationError.children.forEach((child) => {
      errors.push(...transformValidationError(child, propertyPath));
    });
  }

  return errors;
}

/**
 * Create a validation error with detailed field-level errors
 * Supports both ErrorType[] and ValidationError[] from class-validator
 * @param errors Array of validation errors (ErrorType[] or ValidationError[])
 */
export function validateGraphqlError(
  errors: ErrorType[] | ValidationError[]
): GraphQLError {
  let formattedErrors: ErrorType[];

  // Check if errors are ValidationError instances
  if (errors.length > 0 && errors[0] instanceof ValidationError) {
    // Transform ValidationError[] to ErrorType[]
    formattedErrors = (errors as ValidationError[]).flatMap((error) =>
      transformValidationError(error)
    );
  } else {
    // Already in ErrorType[] format
    formattedErrors = errors as ErrorType[];
  }

  return createGraphQLError(
    400,
    'Invalid Validation',
    'INVALID_VALIDATION',
    formattedErrors,
  );
}