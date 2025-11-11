import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class UpdateSubscriptionInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  cancelReason?: string;

  @Field({ nullable: true })
  @IsOptional()
  paymentMethodId?: string;
}
