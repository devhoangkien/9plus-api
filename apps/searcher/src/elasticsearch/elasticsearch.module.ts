import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';

@Global()
@Module({
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}