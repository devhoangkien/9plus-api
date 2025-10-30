import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class CreateSubscriptionInput {
  @Field()
  @IsNotEmpty()
  userId: string;

  @Field()
  @IsNotEmpty()
  planId: string;

  @Field({ nullable: true })
  @IsOptional()
  paymentMethodId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isTrialing?: boolean;
}
