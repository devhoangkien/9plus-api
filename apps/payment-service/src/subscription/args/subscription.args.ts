import { ArgsType, Field, ID, Int } from '@nestjs/graphql';

@ArgsType()
export class GetSubscriptionArgs {
  @Field(() => ID)
  id: string;
}

@ArgsType()
export class GetUserSubscriptionsArgs {
  @Field(() => ID)
  userId: string;

  @Field({ nullable: true })
  status?: string;
}

@ArgsType()
export class GetSubscriptionsArgs {
  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  planId?: string;

  @Field({ nullable: true })
  status?: string;

  @Field(() => Int, { defaultValue: 0 })
  skip?: number;

  @Field(() => Int, { defaultValue: 10 })
  take?: number;
}
