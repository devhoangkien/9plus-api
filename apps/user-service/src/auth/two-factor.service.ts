import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  constructor(private readonly configService: ConfigService) {}

  generateSecret(userEmail: string) {
    const secret = speakeasy.generateSecret({
      name: `${this.configService.get('APP_NAME')} (${userEmail})`,
      issuer: this.configService.get('APP_NAME', 'AnineEdu'),
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  async generateQRCodeDataURL(otpauthUrl: string): Promise<string> {
    return qrcode.toDataURL(otpauthUrl);
  }

  verifyTokenWithSecret(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow some time drift
    });
  }

  // Method for verifying token with userId - fetch secret from database
  async verifyToken(userId: string, token: string): Promise<boolean> {
    // TODO: Implement fetching 2FA secret from database for user
    // const user = await this.prisma.user.findUnique({
    //   where: { id: userId },
    //   select: { twoFactorSecret: true }
    // });
    // 
    // if (!user?.twoFactorSecret) {
    //   return false;
    // }
    //
    // return this.verifyTokenWithSecret(token, user.twoFactorSecret);
    
    // For now, return false as placeholder
    return false;
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  verifyBackupCode(inputCode: string, backupCodes: string[]): boolean {
    return backupCodes.includes(inputCode.toUpperCase());
  }
}
