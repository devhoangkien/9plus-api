import { Module } from '@nestjs/common';
import { SubscriptionPlanService } from './subscription-plan.service';
import { SubscriptionPlanResolver } from './subscription-plan.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SubscriptionPlanService, SubscriptionPlanResolver],
  exports: [SubscriptionPlanService],
})
export class SubscriptionPlanModule {}
