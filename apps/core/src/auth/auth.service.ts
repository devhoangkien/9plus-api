import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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



@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private passwordService: PasswordService,
    private twoFactorService: TwoFactorService,
  ) {}

  async register(registerInput: RegisterUserInput, ipAddress?: string): Promise<LoginResponse> {
    const { email, password, firstName, lastName, username } = registerInput;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Create user
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      username: username || email.split('@')[0],
      status: UserStatusEnum.PENDING_VERIFICATION,
      loginMethod: LoginMethod.LOCAL,
    });

    // Log registration
    await this.auditService.logAction(
      'REGISTER',
      'USER',
      user.id,
      user.id,
      undefined,
      undefined,
      { ipAddress }
    );

    // Generate tokens
    return this.generateTokens(user, ipAddress);
  }

  async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    try {
      // Find user
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        await this.logFailedLogin(email, 'USER_NOT_FOUND', ipAddress, userAgent);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check account status
      if (user.status === UserStatusEnum.LOCKED) {
        await this.logFailedLogin(email, 'ACCOUNT_LOCKED', ipAddress, userAgent);
        throw new UnauthorizedException('Account is locked');
      }

      if (user.status === UserStatusEnum.SUSPENDED) {
        await this.logFailedLogin(email, 'ACCOUNT_SUSPENDED', ipAddress, userAgent);
        throw new UnauthorizedException('Account is suspended');
      }

      // Check lockout
      if (user.lockoutExpires && user.lockoutExpires > new Date()) {
        await this.logFailedLogin(email, 'ACCOUNT_LOCKED_OUT', ipAddress, userAgent);
        throw new UnauthorizedException('Account is temporarily locked due to failed attempts');
      }

      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await this.handleFailedLogin(user, ipAddress, userAgent);
        throw new UnauthorizedException('Invalid credentials');
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
      throw new BadRequestException('Login failed');
    }
  }

  async verifyTwoFactor(email: string, token: string, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidToken = await this.twoFactorService.verifyToken(user.id, token);
    if (!isValidToken) {
      await this.logFailedLogin(email, 'INVALID_2FA_TOKEN', ipAddress, userAgent);
      throw new UnauthorizedException('Invalid 2FA token');
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

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if session exists
      const session = await this.sessionsService.findByRefreshToken(refreshToken);
      if (!session || !session.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const payload = { 
        userId: user.id, 
        email: user.email,
        roles: user.roles.map(role => role.key),
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, sessionToken?: string): Promise<void> {
    if (sessionToken) {
      await this.sessionsService.deactivateSession(sessionToken);
    } else {
      await this.sessionsService.deactivateAllUserSessions(userId);
    }

    await this.auditService.logAction(
      'LOGOUT',
      'USER',
      userId,
      userId,
      undefined,
      undefined,
      undefined
    );
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await this.passwordService.hashPassword(newPassword);
    
    // Update password directly using Prisma
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    await this.auditService.logAction(
      'CHANGE_PASSWORD',
      'USER',
      userId,
      userId,
      undefined,
      undefined,
      undefined
    );
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = await this.passwordService.generateResetToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    await this.usersService.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // TODO: Send email with reset token
    
    await this.auditService.logAction(
      'REQUEST_PASSWORD_RESET',
      'USER',
      user.id,
      user.id,
      undefined,
      undefined,
      undefined
    );
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
      throw new BadRequestException('Invalid or expired reset token');
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

    await this.auditService.logAction(
      'RESET_PASSWORD',
      'USER',
      user.id,
      user.id,
      undefined,
      undefined,
      undefined
    );
  }

  async setupTwoFactor(userId: string): Promise<{ qrCodeUrl: string; secret: string; backupCodes: string[] }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
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

    await this.auditService.logAction(
      'SETUP_TWO_FACTOR',
      'USER',
      userId,
      userId,
      undefined,
      undefined,
      undefined
    );

    return {
      qrCodeUrl,
      secret,
      backupCodes,
    };
  }

  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication setup not initiated. Call setupTwoFactor first.');
    }

    // Verify the token with the temporary secret
    const isValidToken = this.twoFactorService.verifyTokenWithSecret(token, user.twoFactorSecret);
    if (!isValidToken) {
      throw new BadRequestException('Invalid verification token');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        // Keep the secret for future verifications
      },
    });

    await this.auditService.logAction(
      'ENABLE_TWO_FACTOR',
      'USER',
      userId,
      userId,
      undefined,
      { twoFactorEnabled: true },
      undefined
    );

    return true;
  }

  async disableTwoFactor(userId: string, password: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify password for security
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    await this.auditService.logAction(
      'DISABLE_TWO_FACTOR',
      'USER',
      userId,
      userId,
      { twoFactorEnabled: true },
      { twoFactorEnabled: false },
      undefined
    );

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
    await this.prisma.loginLog.create({
      data: {
        userId: user.id,
        email: user.email,
        ipAddress,
        userAgent,
        loginMethod: LoginMethod.LOCAL,
        status: 'SUCCESS', // LoginStatus.SUCCESS,
      },
    });
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
    await this.prisma.loginLog.create({
      data: {
        email,
        ipAddress,
        userAgent,
        loginMethod: LoginMethod.LOCAL,
        status: 'FAILED', // LoginStatus.FAILED,
        failureReason: reason,
      },
    });
  }
}
