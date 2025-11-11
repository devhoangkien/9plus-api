import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionResolver } from './subscription.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { DataLoaderModule } from '../dataloader/dataloader.module';

@Module({
  imports: [PrismaModule, DataLoaderModule],
  providers: [SubscriptionService, SubscriptionResolver],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
