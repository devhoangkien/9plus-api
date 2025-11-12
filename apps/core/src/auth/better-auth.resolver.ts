import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@anineplus/authorization';
import { BetterAuthService } from './better-auth.service';
import { ErrorCodes } from '@anineplus/common';
import {
  SignUpInput,
  SignInInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  AuthResponse,
  CurrentSessionResponse,
  ListSessionsResponse,
  VerifyAuthResponse,
  BasicResponse,
} from './dto/auth.types';

@Resolver()
export class BetterAuthResolver {
  constructor(private readonly betterAuthService: BetterAuthService) {}

  @Mutation(() => AuthResponse)
  async signUpUser(@Args('input') input: SignUpInput): Promise<AuthResponse> {
    const result = await this.betterAuthService.signUp(
      input.email,
      input.password,
      input.name,
    );
    return {
      success: true,
      user: result.user as any,
      token: result.token ?? undefined,
    };
  }

  @Mutation(() => AuthResponse)
  async signInUser(@Args('input') input: SignInInput): Promise<AuthResponse> {
    const result = await this.betterAuthService.signIn(
      input.email,
      input.password,
    );
    return {
      success: true,
      user: result.user as any,
      token: result.token ?? undefined,
    };
  }

  @Mutation(() => BasicResponse)
  @UseGuards(AuthGuard)
  async signOutUser(@Context() context: any): Promise<BasicResponse> {
    const token = this.extractToken(context.req);
    return this.betterAuthService.signOut(token);
  }

  @Query(() => CurrentSessionResponse)
  @UseGuards(AuthGuard)
  async getCurrentSession(@Context() context: any): Promise<CurrentSessionResponse> {
    const token = this.extractToken(context.req);
    const session = await this.betterAuthService.getSession(token);

    if (!session) {
      throw new UnauthorizedException({ message: 'Invalid session', code: ErrorCodes.AUTHZ_INVALID_SESSION });
    }

    return session as any;
  }

  @Query(() => ListSessionsResponse)
  @UseGuards(AuthGuard)
  async listUserSessions(@Context() context: any): Promise<ListSessionsResponse> {
    const token = this.extractToken(context.req);
    const sessions = await this.betterAuthService.listSessions(token);
    return { sessions: sessions as any };
  }

  @Query(() => VerifyAuthResponse)
  async verifyAuth(@Context() context: any): Promise<VerifyAuthResponse> {
    try {
      const authHeader = context.req?.headers?.authorization;
      if (!authHeader) {
        return { success: false, message: 'No authorization header' };
      }

      const token = this.extractToken(context.req);
      const session = await this.betterAuthService.getSession(token);

      return {
        success: !!session,
        message: session ? 'Authenticated' : 'Invalid session',
        user: session?.user as any,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Mutation(() => BasicResponse)
  async verifyUserEmail(@Args('input') input: VerifyEmailInput): Promise<BasicResponse> {
    return this.betterAuthService.verifyEmail(input.token);
  }

  @Mutation(() => BasicResponse)
  async forgotUserPassword(@Args('input') input: ForgotPasswordInput): Promise<BasicResponse> {
    return this.betterAuthService.forgotPassword(input.email);
  }

  @Mutation(() => BasicResponse)
  async resetUserPassword(@Args('input') input: ResetPasswordInput): Promise<BasicResponse> {
    return this.betterAuthService.resetPassword(input.token, input.newPassword);
  }

  @Mutation(() => BasicResponse)
  @UseGuards(AuthGuard)
  async changeUserPassword(
    @Context() context: any,
    @Args('input') input: ChangePasswordInput,
  ): Promise<BasicResponse> {
    const token = this.extractToken(context.req);
    return this.betterAuthService.changePassword(
      token,
      input.currentPassword,
      input.newPassword,
    );
  }

  @Mutation(() => BasicResponse)
  @UseGuards(AuthGuard)
  async revokeUserSession(@Context() context: any): Promise<BasicResponse> {
    const token = this.extractToken(context.req);
    return this.betterAuthService.revokeSession(token);
  }

  @Mutation(() => BasicResponse)
  @UseGuards(AuthGuard)
  async revokeOtherUserSessions(@Context() context: any): Promise<BasicResponse> {
    const token = this.extractToken(context.req);
    return this.betterAuthService.revokeOtherSessions(token);
  }

  private extractToken(req: any): string {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException({ message: 'No authorization header', code: ErrorCodes.AUTHZ_NO_AUTH_HEADER });
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException({ message: 'Invalid authorization format', code: ErrorCodes.AUTHZ_INVALID_AUTH_FORMAT });
    }

    return token;
  }
}
