import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule } from '@nestjs/config';
import { CaslAuthorizationModule, AuthGuard, PermissionGuard, AuthPermissionGuard } from '@anineplus/authorization';
import { LoggerModule, RequestContextService, createRequestIdMiddleware } from '@anineplus/common';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { YogaFederationDriver, YogaFederationDriverConfig } from '@graphql-yoga/nestjs-federation'
import { PluginManagementModule } from './plugin-management/plugin-management.module';
import {  PrismaModule } from './prisma/prisma.module';
import { KafkaModule } from './kafka/kafka.module';
import { BetterAuthModule } from './auth/better-auth.module';
import { OrganizationModule } from './organization/organization.module';

// Create Core-specific middleware
const CoreRequestIdMiddleware = createRequestIdMiddleware('core');

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
    BetterAuthModule, // Provides AUTH_SERVICE globally
    OrganizationModule, // Handles organization, members, teams
    PermissionsModule, // Provides PERMISSION_SERVICE globally
    UsersModule,
    RolesModule,
    RedisModule,
    PluginManagementModule,
    KafkaModule,
  ],
  providers: [
    RequestContextService,
    CoreRequestIdMiddleware,
  ],
  exports: [RequestContextService],
  // Don't register guards as providers here
  // Use @UseGuards() decorator in resolvers instead
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CoreRequestIdMiddleware).forRoutes('*');
  }
}
