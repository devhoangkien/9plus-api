import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesResolver } from './roles.resolver';
import { RolesDataLoaderService } from './roles.dataloader.service';

@Module({
  providers: [RolesService, RolesResolver, RolesDataLoaderService],
  exports: [RolesService, RolesDataLoaderService],
})
export class RolesModule {}
