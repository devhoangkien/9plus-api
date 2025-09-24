import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh' | 'reset' | 'verify';
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  generateAccessToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      sub: userId,
      email,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION', '15m'),
    });
  }

  generateRefreshToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      sub: userId,
      email,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION', '7d'),
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });
  }

  generateResetToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      sub: userId,
      email,
      type: 'reset',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_RESET_TOKEN_EXPIRATION', '1h'),
      secret: this.configService.get('JWT_RESET_SECRET'),
    });
  }

  generateVerificationToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      sub: userId,
      email,
      type: 'verify',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_VERIFICATION_TOKEN_EXPIRATION', '24h'),
      secret: this.configService.get('JWT_VERIFICATION_SECRET'),
    });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verify(token);
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });
  }

  async verifyResetToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_RESET_SECRET'),
    });
  }

  async verifyVerificationToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_VERIFICATION_SECRET'),
    });
  }

  async invalidateUserTokens(userId: string): Promise<void> {
    // Update user's token version to invalidate all existing tokens
    await this.prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });
  }

  async generateTokenPair(userId: string, email: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = this.generateRefreshToken(userId, email);

    return {
      accessToken,
      refreshToken,
    };
  }
}
