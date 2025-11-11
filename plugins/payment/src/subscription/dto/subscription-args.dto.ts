import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

@ArgsType()
export class GetSubscriptionsArgs {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field({ nullable: true })
  @IsOptional()
  userId?: string;

  @Field({ nullable: true })
  @IsOptional()
  status?: string;
}

@ArgsType()
export class GetSubscriptionArgs {
  @Field()
  id: string;
}
