import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionInput } from './inputs/create-subscription.input';
import { UpdateSubscriptionInput } from './inputs/update-subscription.input';
import {
  GetSubscriptionsArgs,
  GetSubscriptionArgs,
} from './dto/subscription-args.dto';
import { Subscription } from '../../prisma/@generated';

@Resolver(() => Subscription)
export class SubscriptionResolver {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Mutation(() => Subscription)
  async createSubscription(
    @Args('input') input: CreateSubscriptionInput,
  ): Promise<Subscription> {
    return this.subscriptionService.create(input);
  }

  @Query(() => [Subscription])
  async subscriptions(@Args() args: GetSubscriptionsArgs) {
    const result = await this.subscriptionService.findAll(args);
    return result.subscriptions;
  }

  @Query(() => Subscription)
  async subscription(@Args() args: GetSubscriptionArgs): Promise<Subscription> {
    return this.subscriptionService.findOne(args.id);
  }

  @Query(() => [Subscription])
  async userSubscriptions(
    @Args('userId') userId: string,
  ): Promise<Subscription[]> {
    return this.subscriptionService.findByUserId(userId);
  }

  @Mutation(() => Subscription)
  async updateSubscription(
    @Args('input') input: UpdateSubscriptionInput,
  ): Promise<Subscription> {
    return this.subscriptionService.update(input);
  }

  @Mutation(() => Subscription)
  async cancelSubscription(
    @Args('id') id: string,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<Subscription> {
    return this.subscriptionService.cancel(id, reason);
  }

  @Mutation(() => Subscription)
  async reactivateSubscription(@Args('id') id: string): Promise<Subscription> {
    return this.subscriptionService.reactivate(id);
  }

  @Mutation(() => Boolean)
  async deleteSubscription(@Args('id') id: string): Promise<boolean> {
    return this.subscriptionService.delete(id);
  }
}
