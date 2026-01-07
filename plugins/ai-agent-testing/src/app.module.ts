import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {
  YogaFederationDriver,
  YogaFederationDriverConfig,
} from '@graphql-yoga/nestjs-federation';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { AiTestingSagaModule } from './saga/saga.module';

// Application services
import {
  ProjectService,
  TestCaseService,
  TestRunService,
  ModelConfigService,
  AiAgentService,
} from './application/services';

// Infrastructure
import { InMemoryEventBus } from './infrastructure/events';
import { EVENT_BUS } from './application/bus';
import {
  LlmClient,
  AnthropicProvider,
  OpenAiProvider,
  GeminiProvider,
} from './infrastructure/ai';
import { WebRunner, ApiRunner } from './infrastructure/runner';

// GraphQL resolvers
import {
  ProjectResolver,
  TestCaseResolver,
  TestRunResolver,
  ModelConfigResolver,
  AiAgentResolver,
} from './graphql/resolvers';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
    }),
    PrismaModule,
    AiTestingSagaModule,
  ],
  providers: [
    // Event Bus
    {
      provide: EVENT_BUS,
      useClass: InMemoryEventBus,
    },
    InMemoryEventBus,

    // Application Services
    ProjectService,
    TestCaseService,
    TestRunService,
    ModelConfigService,

    // AI Infrastructure
    AnthropicProvider,
    OpenAiProvider,
    GeminiProvider,
    {
      provide: LlmClient,
      useFactory: (
        modelConfigService: ModelConfigService,
        anthropicProvider: AnthropicProvider,
        openAiProvider: OpenAiProvider,
        geminiProvider: GeminiProvider,
      ) => {
        return new LlmClient(
          modelConfigService,
          anthropicProvider,
          openAiProvider,
          geminiProvider,
        );
      },
      inject: [ModelConfigService, AnthropicProvider, OpenAiProvider, GeminiProvider],
    },
    AiAgentService,

    // Test Runners
    WebRunner,
    ApiRunner,

    // GraphQL Resolvers
    ProjectResolver,
    TestCaseResolver,
    TestRunResolver,
    ModelConfigResolver,
    AiAgentResolver,
  ],
})
export class AppModule { }
