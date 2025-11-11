import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GqlAllExceptionsFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GqlAllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext();
    const response = context?.res;
    let status = 500;
    let message = 'Internal Server Error';
    let extensions: any = {};

    if (exception instanceof GraphQLError) {
      message = exception.message;
      status = (exception.extensions?.status as number) || 500;
      
      // Preserve all extensions from the original GraphQLError
      extensions = {
        ...exception.extensions,
      };
      
      // Add stacktrace in development mode only
      if (process.env.NODE_ENV !== 'production') {
        extensions.stacktrace = exception.stack?.split('\n') || [];
      }
    } else if (exception instanceof Error) {
      status = ('status' in exception ? (exception as any)['status'] : 500) as number;
      message = exception.message;
      
      // Add stacktrace in development mode only
      if (process.env.NODE_ENV !== 'production') {
        extensions.stacktrace = exception.stack?.split('\n') || [];
      }
    } else {
      this.logger.error('Unexpected error', exception);
    }
    
    if (response) {
      response.status(status).json({
        errors: [
          {
            message,
            extensions,
          },
        ],
        data: null,
      });
    }
  }
}