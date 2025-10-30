import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';
import { KafkaModule } from '../kafka/kafka.module';
import { UsersDataLoaderService } from './users.dataloader.service';

@Module({
  imports: [
    RedisModule,
    ConfigModule,
    KafkaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION') },
      }),
    }),
  ],
  providers: [UsersService, UsersResolver, UsersDataLoaderService],
  exports: [UsersService, UsersDataLoaderService],
})
export class UsersModule {}
