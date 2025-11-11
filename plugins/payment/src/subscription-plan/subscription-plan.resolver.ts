import { Resolver, Query, Args } from '@nestjs/graphql';
import { SubscriptionPlanService } from './subscription-plan.service';
import { SubscriptionPlan, PlanType } from '../../prisma/@generated';

@Resolver(() => SubscriptionPlan)
export class SubscriptionPlanResolver {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  @Query(() => [SubscriptionPlan])
  async subscriptionPlans() {
    return this.subscriptionPlanService.findAll();
  }

  @Query(() => SubscriptionPlan)
  async subscriptionPlan(@Args('id') id: string) {
    return this.subscriptionPlanService.findOne(id);
  }

  @Query(() => [SubscriptionPlan])
  async subscriptionPlansByType(@Args('type') type: PlanType) {
    return this.subscriptionPlanService.findByType(type);
  }
}
