import { Module, BadRequestException, HttpStatus, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { verify, decode } from 'jsonwebtoken';
import { UNAUTHORIZED, UNAUTHORIZED_MESSAGE } from './app.constants';
import { LoggerModule, createGraphQLError, RequestContextService, createRequestIdMiddleware } from '@anineplus/common';
import {
  YogaGatewayDriver,
  YogaGatewayDriverConfig,
} from '@graphql-yoga/nestjs-federation';
import { GraphQLClient } from 'graphql-request';
import { extractUniquePermissions } from './common';
import { LRUCache } from 'lru-cache';
import { DynamicGatewayModule } from './dynamic-gateway/dynamic-gateway.module';
import { DynamicGatewayService } from './dynamic-gateway/dynamic-gateway.service';
import { GatewayConfigFactory } from './dynamic-gateway/gateway-config.factory';
import { GatewayHealthService } from './services/gateway-health.service';
import { GatewayCacheService } from './services/gateway-cache.service';
import { GraphQLExecutorService } from './services/graphql-executor.service';
import { StartupDisplayService } from './services/startup-display.service';
import { GatewayUrlResolver } from './resolvers/gateway-url-resolver';
import { SofaApiFactory } from './factories/sofa-api.factory';
import { useRequestIdPlugin } from './plugins/request-id.plugin';
import { useErrorFormatPlugin } from './plugins/error-format.plugin';

// Create Gateway-specific middleware
const GatewayRequestIdMiddleware = createRequestIdMiddleware('gateway');

// ===== CACHE DISABLED =====
// Initialize cache with LRU (Least Recently Used)
// const cache = new LRUCache<string, any>({
//   max: 100, // Maximum number of items in cache
//   ttl: 1000 * 60 * 1, // Cache lifetime (1 minute)
// });

// GraphQL call WITHOUT cache
async function directRequest(query: string, variables: any) {
  // Direct request without caching
  const data = await client.request(query, variables);
  return data;
}

// // GraphQL call with cache (DISABLED)
// async function cachedRequest(query: string, variables: any) {
//   const cacheKey = JSON.stringify({ query, variables });

//   if (cache.has(cacheKey)) {
//     return cache.get(cacheKey);
//   }

//   // If not in cache, make request
//   const data = await client.request(query, variables);

//   cache.set(cacheKey, data);

//   return data;
// }
// ===== END CACHE DISABLED =====

const getToken = (authToken: string): string => {
  const match = authToken.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw createGraphQLError(
      HttpStatus.UNAUTHORIZED,
      UNAUTHORIZED_MESSAGE,
      UNAUTHORIZED,
      undefined, // No validation errors
    );
  }
  return match[1];
};

const decodeToken = (tokenString: string) => {
  if (!process.env.JWT_SECRET) {
    throw new BadRequestException(
      'Secret key not found in environment variables',
    );
  }
  const decoded = verify(tokenString, process.env.JWT_SECRET);
  if (!decoded) {
    throw createGraphQLError(
      HttpStatus.UNAUTHORIZED,
      UNAUTHORIZED_MESSAGE,
      UNAUTHORIZED,
      undefined, // No validation errors
    );
  }
  return decoded;
};

// Apollo Client for querying user service
const client = new GraphQLClient(process.env.CORE_SERVICE_URL || '');
const query = `
  query getRolesByKeys($keys: String!) {
    getRolesByKeys(keys: $keys) {
      id
      key
      name
      permissions {
        action
        id
        key
        name
        resource
        status
      }
    }
  }
`;

const handleAuth = async ({ req }) => {
  try {
    if (req.headers.authorization) {
      const token = getToken(req.headers.authorization);
      if (!token || token == 'undefined') {
        throw createGraphQLError(
          HttpStatus.UNAUTHORIZED,
          UNAUTHORIZED_MESSAGE,
          UNAUTHORIZED,
          undefined, // No validation errors
        );
      }
      const decoded = decodeToken(token);
      // Call UserService to get user roles
      const variables = { keys: decoded.roles };

      const data = await directRequest(query, variables); // Cache disabled
      const uniquePermissions = extractUniquePermissions(data);
      return {
        userId: decoded.userId,
        permissions: JSON.stringify(uniquePermissions),
        authorization: `${req.headers.authorization}`,
      };
    } else {
      throw createGraphQLError(
        HttpStatus.UNAUTHORIZED,
        UNAUTHORIZED_MESSAGE,
        UNAUTHORIZED,
        undefined, // No validation errors
      );
    }
  } catch (err) {
    throw createGraphQLError(
      HttpStatus.UNAUTHORIZED,
      UNAUTHORIZED_MESSAGE,
      UNAUTHORIZED,
      undefined, // No validation errors
    );
  }
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DynamicGatewayModule,
    GraphQLModule.forRootAsync<YogaGatewayDriverConfig>({
      driver: YogaGatewayDriver,
      imports: [DynamicGatewayModule],
      inject: [ConfigService, DynamicGatewayService, RequestContextService],
      useFactory: async (
        configService: ConfigService,
        dynamicGatewayService: DynamicGatewayService,
        contextService: RequestContextService,
      ) => {
        // Load subgraphs dynamically
        const subgraphs = await dynamicGatewayService.loadSubgraphs();
        
        return {
          plugins: [
            useRequestIdPlugin(contextService),
          ],
          graphqlEndpoint: '/graphql',
          maskedErrors: false, // Disable error masking to see full errors
          formatError: (error: any) => {
            // Extract validation errors from subgraph response
            if (
              error.extensions?.response?.body?.errors &&
              Array.isArray(error.extensions.response.body.errors)
            ) {
              const subgraphErrors = error.extensions.response.body.errors;
              
              if (subgraphErrors.length > 0) {
                const firstError = subgraphErrors[0];
                
                // Return formatted error with validation details
                return {
                  message: firstError.message || error.message,
                  path: error.path,
                  locations: error.locations,
                  extensions: {
                    ...firstError.extensions,
                    subgraph: {
                      url: error.extensions.response.url,
                      status: error.extensions.response.status,
                    },
                  },
                };
              }
            }
            
            // Return error as-is if not a wrapped subgraph error
            return error;
          },
          gateway: {
            buildService: ({ name, url }) => {
              return new RemoteGraphQLDataSource({
                url,
                willSendRequest({ request, context }: any) {
                  request.http.headers.set('userId', context.userId);
                  // for now pass authorization also
                  request.http.headers.set('authorization', context.authorization);
                  request.http.headers.set('permissions', context.permissions);
                },
              });
            },
            supergraphSdl: new IntrospectAndCompose({
              subgraphs: subgraphs,
            }),
          },
        };
      },
    }),
    LoggerModule.forRoot({
      enableFile: true,
      enableCloudWatch: false,
      enableElasticsearch: false,
      enableLoki: false,
      enableDatadog: false,
    }),
  ],
  providers: [
    GatewayHealthService,
    GatewayCacheService,
    GatewayUrlResolver,
    GraphQLExecutorService,
    SofaApiFactory,
    StartupDisplayService,
    GatewayRequestIdMiddleware,
    // RequestContextService is provided by LoggerModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GatewayRequestIdMiddleware)
      .forRoutes('*');
  }
}