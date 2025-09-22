import { InputType, Field, ID, Int } from '@nestjs/graphql';

@InputType()
export class CreateSubscriptionInput {
  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  planId: string;

  @Field({ nullable: true })
  status?: string;

  @Field()
  currentPeriodStart: Date;

  @Field()
  currentPeriodEnd: Date;

  @Field({ nullable: true })
  trialStart?: Date;

  @Field({ nullable: true })
  trialEnd?: Date;

  @Field({ defaultValue: false })
  isTrialing?: boolean;

  @Field({ defaultValue: false })
  cancelAtPeriodEnd?: boolean;

  @Field({ nullable: true })
  nextBillingDate?: Date;

  @Field(() => ID, { nullable: true })
  paymentMethodId?: string;

  @Field(() => Int, { defaultValue: 0 })
  studentsUsed?: number;

  @Field(() => Int, { defaultValue: 0 })
  coursesUsed?: number;

  @Field(() => Int, { defaultValue: 0 })
  storageUsed?: number;
}

@InputType()
export class UpdateSubscriptionInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  currentPeriodEnd?: Date;

  @Field({ nullable: true })
  cancelAtPeriodEnd?: boolean;

  @Field({ nullable: true })
  canceledAt?: Date;

  @Field({ nullable: true })
  cancelReason?: string;

  @Field({ nullable: true })
  nextBillingDate?: Date;

  @Field(() => Int, { nullable: true })
  studentsUsed?: number;

  @Field(() => Int, { nullable: true })
  coursesUsed?: number;

  @Field(() => Int, { nullable: true })
  storageUsed?: number;
}
