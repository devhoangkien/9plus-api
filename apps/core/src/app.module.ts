import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule } from '@nestjs/config';
import { CaslAuthorizationModule } from '@bune/casl-authorization';
import { LoggerModule } from '@bune/common';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { YogaFederationDriver, YogaFederationDriverConfig } from '@graphql-yoga/nestjs-federation'
import { PluginManagementModule } from './plugin-management/plugin-management.module';
import {  PrismaModule } from './prisma/prisma.module';

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
        path: './schema.gql',
      },
      // includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production', 
    }),
    
    // Core modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    RedisModule,
    PluginManagementModule,
  ],
  
})
export class AppModule {}
