import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Module({
  providers: [
    {
      provide: 'REDIS_CONNECTION',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1', 
          port: parseInt(process.env.REDIS_PORT || '6379', 10), // Ensure port is a number
          password: process.env.REDIS_PASSWORD || '', // Redis password
          db: parseInt(process.env.REDIS_DB || '0', 10), // Ensure db is a number
          keyPrefix: process.env.REDIS_PREFIX || '', // Redis key prefix
        });
      },
      inject: [],
    },

    RedisService,
  ],
  exports: ['REDIS_CONNECTION', RedisService],
})
export class RedisModule {}
