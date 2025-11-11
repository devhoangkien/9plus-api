import { ValidationPipe  } from '@nestjs/common';
import { validateGraphqlError } from './graphql-errors';

export class GqlValidationPipe extends ValidationPipe {
  constructor() {
    super({
      exceptionFactory: (errors: any) => {
        console.log('Validation errors:', errors);
        
        // Pass ValidationError[] directly to validateGraphqlError
        // It will automatically transform them to ErrorType[] format
        return validateGraphqlError(errors);
      },
      stopAtFirstError: false, // Collect all validation errors
    });
  }
}