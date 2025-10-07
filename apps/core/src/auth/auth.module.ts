import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { TwoFactorService } from './two-factor.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../redis/redis.module';
import { RequestContextService } from '@anineplus/common';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
    }),
    UsersModule,
    RedisModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    TwoFactorService,
    PasswordService,
    TokenService,
    RequestContextService,
  ],
  controllers: [],
  exports: [
    AuthService,
    TwoFactorService,
    PasswordService,
    TokenService,
    RequestContextService,
  ],
})
export class AuthModule {}
