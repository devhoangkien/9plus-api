import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule } from '@nestjs/config';
import { CaslAuthorizationModule } from '@anineplus/authorization';
import { LoggerModule } from '@anineplus/common';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { YogaFederationDriver, YogaFederationDriverConfig } from '@graphql-yoga/nestjs-federation'
import { PluginManagementModule } from './plugin-management/plugin-management.module';
import {  PrismaModule } from './prisma/prisma.module';
import { KafkaModule } from './kafka/kafka.module';
import { BetterAuthModule } from './auth/better-auth.module';

// Import GraphQL enums to register them

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      enableFile: true,
      enableCloudWatch: false,
      enableElasticsearch: false,
      enableLoki: false,
      enableDatadog: false,
    }),
    CaslAuthorizationModule, 
    PrismaModule,
    GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      // includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production', 
    }),
    
    // Core modules
    AuthModule,
    BetterAuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    RedisModule,
    PluginManagementModule,
    KafkaModule,
  ],
  
})
export class AppModule {}
