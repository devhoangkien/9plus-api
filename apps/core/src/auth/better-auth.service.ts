import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IAuthService } from '@anineplus/authorization';
import { auth } from './auth.config';
import type { Session, User } from 'better-auth/types';

@Injectable()
export class BetterAuthService implements IAuthService {
  private auth = auth;

  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string, name?: string) {
    try {
      const result = await this.auth.api.signUpEmail({
        body: {
          email,
          password,
          name: name || email.split('@')[0],
        },
      });

      return result;
    } catch (error) {
      throw new UnauthorizedException('Failed to sign up: ' + error.message);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const result = await this.auth.api.signInEmail({
        body: {
          email,
          password,
        },
      });

      return result;
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(sessionToken: string) {
    try {
      await this.auth.api.signOut({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });

      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Failed to sign out');
    }
  }

  /**
   * Get current session from token
   */
  async getSession(sessionToken: string): Promise<{
    session: Session;
    user: User;
  } | null> {
    try {
      const result = await this.auth.api.getSession({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });

      return result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify user's email
   */
  async verifyEmail(token: string) {
    try {
      await this.auth.api.verifyEmail({
        query: {
          token,
        },
      });

      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Invalid verification token');
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(email: string) {
    try {
      await this.auth.api.forgetPassword({
        body: { email },
      });

      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      // Don't reveal if email exists
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    try {
      await this.auth.api.resetPassword({
        body: {
          token,
          newPassword,
        },
      });

      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  /**
   * Change password
   */
  async changePassword(
    sessionToken: string,
    currentPassword: string,
    newPassword: string,
  ) {
    try {
      await this.auth.api.changePassword({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          currentPassword,
          newPassword,
        },
      });

      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Failed to change password');
    }
  }

  /**
   * List all sessions for a user
   */
  async listSessions(sessionToken: string) {
    try {
      const result = await this.auth.api.listSessions({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });

      return result;
    } catch (error) {
      throw new UnauthorizedException('Failed to list sessions');
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionToken: string,) {
    try {
      await this.auth.api.revokeSession({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          token: sessionToken,
        },
      });

      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Failed to revoke session');
    }
  }

  /**
   * Revoke all other sessions (keep current)
   */
  async revokeOtherSessions(sessionToken: string) {
    try {
      await this.auth.api.revokeOtherSessions({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });

      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Failed to revoke sessions');
    }
  }
}
