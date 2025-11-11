import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PaymentMethodService } from './payment-method.service';
import { PaymentMethod } from '../../prisma/@generated';

@Resolver(() => PaymentMethod)
export class PaymentMethodResolver {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Query(() => [PaymentMethod])
  async paymentMethods(@Args('userId') userId: string) {
    return this.paymentMethodService.findByUserId(userId);
  }

  @Query(() => PaymentMethod)
  async paymentMethod(@Args('id') id: string) {
    return this.paymentMethodService.findOne(id);
  }

  @Mutation(() => PaymentMethod)
  async setDefaultPaymentMethod(
    @Args('id') id: string,
    @Args('userId') userId: string,
  ) {
    return this.paymentMethodService.setDefault(id, userId);
  }

  @Mutation(() => Boolean)
  async deletePaymentMethod(@Args('id') id: string): Promise<boolean> {
    return this.paymentMethodService.delete(id);
  }
}
