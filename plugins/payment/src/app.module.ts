import { Module } from '@nestjs/common';
import { LoggerModule } from '@anineplus/common';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaFederationDriver, YogaFederationDriverConfig } from '@graphql-yoga/nestjs-federation'
@Module({
  imports: [
    LoggerModule.forRoot({
      enableFile: true,
      enableCloudWatch: false,
      enableElasticsearch: false,
      enableLoki: false,
      enableDatadog: false,
    }),
     GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      autoSchemaFile: {
        federation: 2,
        path: './schema.gql',
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
