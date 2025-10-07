import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { KafkaModule } from './kafka/kafka.module';
import { IndexingModule } from './indexing/indexing.module';
import { RequestContextService, createRequestIdMiddleware } from '@anineplus/common';

// Create Searcher-specific middleware
const SearcherRequestIdMiddleware = createRequestIdMiddleware('searcher');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ElasticsearchModule,
    KafkaModule,
    IndexingModule,
  ],
  providers: [
    RequestContextService,
    SearcherRequestIdMiddleware,
  ],
  exports: [RequestContextService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SearcherRequestIdMiddleware).forRoutes('*');
  }
}