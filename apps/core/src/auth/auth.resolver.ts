import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService, } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginResponse } from 'src/users/dtos';
import { LoginUserInput, RegisterUserInput } from 'src/users/inputs';
import { User } from 'prisma/@generated';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

  @Mutation(() => LoginResponse)
  async register(
    @Args('input') input: RegisterUserInput,
    @Context('req') req: any,
  ): Promise<LoginResponse> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.authService.register(input, ipAddress);
  }

  @Mutation(() => LoginResponse, { nullable: true })
  async login(
    @Args('input') input: LoginUserInput,
    @Context('req') req: any,
  ): Promise<LoginResponse> {
    console.log('Login attempt with input:', input);
    try {
      const { email, password } = input;
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers['user-agent'];

      return await this.authService.login(email, password, ipAddress, userAgent);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }


  @Mutation(() => LoginResponse)
  async verifyTwoFactor(
    @Args('userId') userId: string,
    @Args('token') token: string,
    @Context('req') req: any,
  ): Promise<LoginResponse> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.verifyTwoFactor(userId, token, ipAddress, userAgent);
  }

  @Mutation(() => LoginResponse)
  async refreshToken(@Args('refreshToken') refreshToken: string): Promise<LoginResponse> {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async logout(
    @CurrentUser() user: User,
    @Args('sessionToken', { nullable: true }) sessionToken?: string,
  ): Promise<boolean> {
    await this.authService.logout(user.id, sessionToken);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async changePassword(
    @CurrentUser() user: User,
    @Args('currentPassword') currentPassword: string,
    @Args('newPassword') newPassword: string,
  ): Promise<boolean> {
    await this.authService.changePassword(user.id, currentPassword, newPassword);
    return true;
  }

  @Mutation(() => Boolean)
  async requestPasswordReset(@Args('email') email: string): Promise<boolean> {
    await this.authService.requestPasswordReset(email);
    return true;
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Args('token') token: string,
    @Args('newPassword') newPassword: string,
  ): Promise<boolean> {
    await this.authService.resetPassword(token, newPassword);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String) // Returning QR code URL as string for simplicity
  async setupTwoFactor(@CurrentUser() user: User): Promise<string> {
    const result = await this.authService.setupTwoFactor(user.id);
    return result.qrCodeUrl;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async enableTwoFactor(
    @CurrentUser() user: User,
    @Args('token') token: string,
  ): Promise<boolean> {
    return this.authService.enableTwoFactor(user.id, token);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async disableTwoFactor(
    @CurrentUser() user: User,
    @Args('password') password: string,
  ): Promise<boolean> {
    return this.authService.disableTwoFactor(user.id, password);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => Boolean)
  async validateToken(): Promise<boolean> {
    return true;
  }
}
