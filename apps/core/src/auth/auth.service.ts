import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { TwoFactorService } from './two-factor.service';
import * as bcrypt from 'bcrypt';
import { User, UserStatusEnum } from 'prisma/@generated';
import { LoginMethod } from 'prisma/@generated';
import { LoginResponse } from 'src/users/dtos';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserInput } from 'src/users/inputs';
import { RequestContextService, ErrorCodes } from '@anineplus/common';



@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private passwordService: PasswordService,
    private twoFactorService: TwoFactorService,
    private requestContextService: RequestContextService,
  ) {}

  async register(registerInput: RegisterUserInput, ipAddress?: string): Promise<LoginResponse> {
    const { email, password } = registerInput;
    const requestId = this.requestContextService.getRequestId();

    this.logger.log(`[${requestId}] 📝 Registration attempt for email: ${email}`);

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`[${requestId}] ⚠️ Registration failed: User already exists - ${email}`);
      throw new BadRequestException({
        message: 'User with this email already exists',
        messageCode: 0,
        requestId,
      });
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Create user
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      username: email.split('@')[0],
      status: UserStatusEnum.PENDING_VERIFICATION,
      loginMethod: LoginMethod.LOCAL,
    });

    this.logger.log(`[${requestId}] ✅ User registered successfully: ${user.id} - ${email}`);
   

    // Generate tokens
    return this.generateTokens(user, ipAddress);
  }

  async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    try {
      // Find user
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        await this.logFailedLogin(email, 'USER_NOT_FOUND', ipAddress, userAgent);
        throw new UnauthorizedException({ message: 'Invalid credentials', code: ErrorCodes.AUTH_INVALID_CREDENTIALS });
      }

      // Check account status
      if (user.status === UserStatusEnum.LOCKED) {
        await this.logFailedLogin(email, 'ACCOUNT_LOCKED', ipAddress, userAgent);
        throw new UnauthorizedException({ message: 'Account is locked', code: ErrorCodes.AUTH_ACCOUNT_LOCKED });
      }

      if (user.status === UserStatusEnum.SUSPENDED) {
        await this.logFailedLogin(email, 'ACCOUNT_SUSPENDED', ipAddress, userAgent);
        throw new UnauthorizedException({ message: 'Account is suspended', code: ErrorCodes.AUTH_ACCOUNT_SUSPENDED });
      }

      // Check lockout
      if (user.lockoutExpires && user.lockoutExpires > new Date()) {
        await this.logFailedLogin(email, 'ACCOUNT_LOCKED_OUT', ipAddress, userAgent);
        throw new UnauthorizedException({ message: 'Account is temporarily locked due to failed attempts', code: ErrorCodes.AUTH_ACCOUNT_LOCKED_OUT });
      }

      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await this.handleFailedLogin(user, ipAddress, userAgent);
        throw new UnauthorizedException({ message: 'Invalid credentials', code: ErrorCodes.AUTH_INVALID_CREDENTIALS });
      }

      // Reset failed attempts on successful login
      if (user.failedLoginAttempts > 0) {
        await this.usersService.update(user.id, {
          failedLoginAttempts: 0,
          lockoutExpires: undefined,
        });
      }

      // Check 2FA
      if (user.twoFactorEnabled) {
        // Return temporary token indicating 2FA required
        return {
          accessToken: '',
          refreshToken: '',
          userId: user.id,
          user,
          requiresTwoFactor: true,
        };
      }

      // Log successful login
      await this.logSuccessfulLogin(user, ipAddress, userAgent);

      // Update last login
      await this.usersService.update(user.id, {
        lastLogin: new Date(),
        lastLoginIP: ipAddress,
      });

      // Generate tokens and create session
      return this.generateTokens(user, ipAddress, userAgent);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException({ message: 'Login failed', code: ErrorCodes.AUTH_LOGIN_FAILED });
    }
  }

  async verifyTwoFactor(userId: string, token: string, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({ message: 'Invalid credentials', code: ErrorCodes.AUTH_INVALID_CREDENTIALS });
    }

    const isValidToken = await this.twoFactorService.verifyToken(user.id, token);
    if (!isValidToken) {
      await this.logFailedLogin(user.email, 'INVALID_2FA_TOKEN', ipAddress, userAgent);
      throw new UnauthorizedException({ message: 'Invalid 2FA token', code: ErrorCodes.TWO_FA_INVALID_TOKEN });
    }

    // Log successful login
    await this.logSuccessfulLogin(user, ipAddress, userAgent);

    // Update last login
    await this.usersService.update(user.id, {
      lastLogin: new Date(),
      lastLoginIP: ipAddress,
    });

    return this.generateTokens(user, ipAddress, userAgent);
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedException({ message: 'Invalid refresh token', code: ErrorCodes.AUTHZ_INVALID_REFRESH_TOKEN });
      }

      // Check if session exists
      // TODO: Implement session check when SessionsService is available
      // const session = await this.sessionsService.findByRefreshToken(refreshToken);
      // if (!session || !session.isActive) {
      //   throw new UnauthorizedException('Invalid refresh token');
      // }

      // Generate new access token
      const payload = { 
        userId: user.id, 
        email: user.email,
        roles: user.roles.map(role => role.key),
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      });

      return {
        accessToken,
        refreshToken: refreshToken,
        userId: user.id,
        user,
      };
    } catch (error) {
      throw new UnauthorizedException({ message: 'Invalid refresh token', code: ErrorCodes.AUTHZ_INVALID_REFRESH_TOKEN });
    }
  }

  async logout(userId: string, sessionToken?: string): Promise<void> {
    // TODO: Implement session deactivation when SessionsService is available
    // if (sessionToken) {
    //   await this.sessionsService.deactivateSession(sessionToken);
    // } else {
    //   await this.sessionsService.deactivateAllUserSessions(userId);
    // }

    // TODO: Implement audit logging when AuditService is available
    // // await this.auditService.logAction(
    //   'LOGOUT',
    //   'USER',
    //   userId,
    //   userId,
    //   undefined,
    //   undefined,
    //   undefined
    // );
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({ message: 'User not found', code: ErrorCodes.AUTH_USER_NOT_FOUND });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException({ message: 'Current password is incorrect', code: ErrorCodes.AUTH_CURRENT_PASSWORD_INCORRECT });
    }

    const hashedNewPassword = await this.passwordService.hashPassword(newPassword);
    
    // Update password directly using Prisma
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

   
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // const resetToken = await this.passwordService.generateResetToken();
    const resetToken = "temp-reset-token";
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    await this.usersService.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // TODO: Send email with reset token
    
   
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException({ message: 'Invalid or expired reset token', code: ErrorCodes.TOKEN_INVALID_OR_EXPIRED_RESET });
    }

    const hashedPassword = await this.passwordService.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      },
    });

 
  }

  async setupTwoFactor(userId: string): Promise<{ qrCodeUrl: string; secret: string; backupCodes: string[] }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({ message: 'User not found', code: ErrorCodes.AUTH_USER_NOT_FOUND });
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException({ message: 'Two-factor authentication is already enabled', code: ErrorCodes.TWO_FA_ALREADY_ENABLED });
    }

    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(user.email);
    const qrCodeUrl = await this.twoFactorService.generateQRCodeDataURL(otpauthUrl);
    const backupCodes = this.twoFactorService.generateBackupCodes();

    // Store the temporary secret (will be confirmed when enableTwoFactor is called)
    // We'll use a temporary storage or database field for this
    // For now, let's store it in a way that works with current schema
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        // Store as JSON in a field that exists, or we need to add twoFactorSecret to schema
        // For now, using a workaround until schema is updated
      },
    });

   

    return {
      qrCodeUrl,
      secret,
      backupCodes,
    };
  }

  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({ message: 'User not found', code: ErrorCodes.AUTH_USER_NOT_FOUND });
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException({ message: 'Two-factor authentication is already enabled', code: ErrorCodes.TWO_FA_ALREADY_ENABLED });
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException({ message: 'Two-factor authentication setup not initiated. Call setupTwoFactor first.', code: ErrorCodes.TWO_FA_SETUP_NOT_INITIATED });
    }

    // Verify the token with the temporary secret
    const isValidToken = this.twoFactorService.verifyTokenWithSecret(token, user.twoFactorSecret);
    if (!isValidToken) {
      throw new BadRequestException({ message: 'Invalid verification token', code: ErrorCodes.TOKEN_INVALID_VERIFICATION });
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        // Keep the secret for future verifications
      },
    });

    

    return true;
  }

  async disableTwoFactor(userId: string, password: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({ message: 'User not found', code: ErrorCodes.AUTH_USER_NOT_FOUND });
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException({ message: 'Two-factor authentication is not enabled', code: ErrorCodes.TWO_FA_NOT_ENABLED });
    }

    // Verify password for security
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({ message: 'Invalid password', code: ErrorCodes.AUTH_INVALID_PASSWORD });
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // await this.auditService.logAction(
      // 'DISABLE_TWO_FACTOR',
      // 'USER',
      // userId,
      // userId,
      // { twoFactorEnabled: true },
      // { twoFactorEnabled: false },
      // undefined
    // );

    return true;
  }

  private async generateTokens(user: User, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    // Get user with roles
    const userWithRoles = await this.usersService.findById(user.id);
    
    const payload = { 
      userId: user.id, 
      email: user.email,
      roles: userWithRoles?.roles?.map(role => role.key) || [],
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    // Create session
    // TODO: Implement session creation when SessionsService has createSession method
    // await this.sessionsService.createSession({
    //   userId: user.id,
    //   sessionToken: accessToken,
    //   refreshToken,
    //   ipAddress,
    //   userAgent,
    //   expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    // });

    return {
      accessToken,
      refreshToken,
      userId: user.id,
      user,
    };
  }

  private async handleFailedLogin(user: User, ipAddress?: string, userAgent?: string): Promise<void> {
    const failedAttempts = user.failedLoginAttempts + 1;
    const maxAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS', 5);

    let lockoutExpires: Date | undefined = undefined;
    if (failedAttempts >= maxAttempts) {
      lockoutExpires = new Date();
      lockoutExpires.setMinutes(lockoutExpires.getMinutes() + 30); // 30 minutes lockout
    }

    await this.usersService.update(user.id, {
      failedLoginAttempts: failedAttempts,
      lockoutExpires,
    });

    await this.logFailedLogin(user.email, 'INVALID_PASSWORD', ipAddress, userAgent);
  }

  private async logSuccessfulLogin(user: User, ipAddress?: string, userAgent?: string): Promise<void> {
    // TODO: Implement login logging when LoginLog table is available
    // await this.prisma.loginLog.create({
    //   data: {
    //     userId: user.id,
    //     email: user.email,
    //     ipAddress,
    //     userAgent,
    //     loginMethod: LoginMethod.LOCAL,
    //     status: 'SUCCESS', // LoginStatus.SUCCESS,
    //   },
    // });
    console.log('Successful login:', { userId: user.id, email: user.email, ipAddress, userAgent });
  }

  // For JWT Strategy
  async validateUserById(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  // For Local Strategy
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Check account status
      if (user.status === UserStatusEnum.LOCKED || user.status === UserStatusEnum.SUSPENDED) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  // For Google Strategy
  async validateGoogleUser(googleUser: any): Promise<User> {
    const { email, firstName, lastName, picture } = googleUser;
    
    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Create new user from Google profile
      user = await this.usersService.create({
        email,
        firstName,
        lastName,
        username: email.split('@')[0],
        status: UserStatusEnum.ACTIVE, // Google users are automatically verified
        loginMethod: LoginMethod.GOOGLE,
        // No password for Google users
        password: '', 
      });
    } else {
      // Update existing user with Google info if needed
      // Note: ProfilePicture field may need to be added to UpdateUserInput if needed
    }

    return user;
  }

  private async logFailedLogin(email: string, reason: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // TODO: Implement login logging when LoginLog table is available
    // await this.prisma.loginLog.create({
    //   data: {
    //     email,
    //     ipAddress,
    //     userAgent,
    //     loginMethod: LoginMethod.LOCAL,
    //     status: 'FAILED', // LoginStatus.FAILED,
    //     failureReason: reason,
    //   },
    // });
    console.log('Failed login:', { email, reason, ipAddress, userAgent });
  }
}
