import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor() {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    
    // For GraphQL mutations, extract credentials from args
    if (request.body?.variables) {
      const { email, password } = request.body.variables;
      request.body.email = email;
      request.body.password = password;
    }
    
    return request;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
