import { Module } from '@nestjs/common';
import { IndexingService } from './indexing.service';
import { UserIndexingHandler } from './handlers/user-indexing.handler';
import { RoleIndexingHandler } from './handlers/role-indexing.handler';
import { PermissionIndexingHandler } from './handlers/permission-indexing.handler';
import { KafkaModule } from '../kafka/kafka.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [
    KafkaModule,
    ElasticsearchModule,
  ],
  providers: [
    IndexingService,
    UserIndexingHandler,
    RoleIndexingHandler,
    PermissionIndexingHandler,
  ],
  exports: [IndexingService],
})
export class IndexingModule {}