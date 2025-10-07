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

// Create Gateway-specific middleware
const GatewayRequestIdMiddleware = createRequestIdMiddleware('gateway');

// Initialize cache with LRU (Least Recently Used)
const cache = new LRUCache<string, any>({
  max: 100, // Maximum number of items in cache
  ttl: 1000 * 60 * 1, // Cache lifetime (1 minute)
});

// GraphQL call with cache
async function cachedRequest(query: string, variables: any) {
  const cacheKey = JSON.stringify({ query, variables });

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // If not in cache, make request
  const data = await client.request(query, variables);

  cache.set(cacheKey, data);

  return data;
}

const getToken = (authToken: string): string => {
  const match = authToken.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw createGraphQLError(
      HttpStatus.UNAUTHORIZED,
      UNAUTHORIZED_MESSAGE,
      UNAUTHORIZED,
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
        );
      }
      const decoded = decodeToken(token);
      // Call UserService to get user roles
      const variables = { keys: decoded.roles };

      const data = await cachedRequest(query, variables);
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
      );
    }
  } catch (err) {
    throw createGraphQLError(
      HttpStatus.UNAUTHORIZED,
      UNAUTHORIZED_MESSAGE,
      UNAUTHORIZED,
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
      inject: [ConfigService, DynamicGatewayService],
      useFactory: async (
        configService: ConfigService,
        dynamicGatewayService: DynamicGatewayService,
      ) => {
        // Load subgraphs dynamically
        const subgraphs = await dynamicGatewayService.loadSubgraphs();
        
        return {
          // server: {
          //   context: handleAuth,
          // },
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
    RequestContextService,
    GatewayRequestIdMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GatewayRequestIdMiddleware).forRoutes('*');
  }
}