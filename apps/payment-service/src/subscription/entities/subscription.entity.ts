import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Subscription {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  planId: string;

  @Field()
  status: string; // Will use enum from Prisma generated types

  @Field()
  currentPeriodStart: Date;

  @Field()
  currentPeriodEnd: Date;

  @Field({ nullable: true })
  trialStart?: Date;

  @Field({ nullable: true })
  trialEnd?: Date;

  @Field()
  isTrialing: boolean;

  @Field()
  cancelAtPeriodEnd: boolean;

  @Field({ nullable: true })
  canceledAt?: Date;

  @Field({ nullable: true })
  cancelReason?: string;

  @Field(() => Int)
  studentsUsed: number;

  @Field(() => Int)
  coursesUsed: number;

  @Field(() => Int)
  storageUsed: number;

  @Field({ nullable: true })
  nextBillingDate?: Date;

  @Field({ nullable: true })
  lastBillingDate?: Date;

  @Field({ nullable: true })
  paymentMethodId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class SubscriptionsResponse {
  @Field(() => [Subscription])
  subscriptions: Subscription[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class SubscriptionStatusCount {
  @Field()
  status: string;

  @Field(() => Int)
  count: number;
}
