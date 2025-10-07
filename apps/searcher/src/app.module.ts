import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { KafkaModule } from './kafka/kafka.module';
import { IndexingModule } from './indexing/indexing.module';

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
})
export class AppModule {}