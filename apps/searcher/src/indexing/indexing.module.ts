import { Module } from '@nestjs/common';
import { IndexingService } from './indexing.service';
import { UserIndexingHandler } from './handlers/user-indexing.handler';
import { RoleIndexingHandler } from './handlers/role-indexing.handler';
import { PermissionIndexingHandler } from './handlers/permission-indexing.handler';

@Module({
  providers: [
    IndexingService,
    UserIndexingHandler,
    RoleIndexingHandler,
    PermissionIndexingHandler,
  ],
  exports: [IndexingService],
})
export class IndexingModule {}