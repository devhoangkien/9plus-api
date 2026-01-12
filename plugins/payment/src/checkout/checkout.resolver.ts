import { Resolver, Mutation, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import {
    CheckoutSession,
    CheckoutInput,
    PaymentResult,
    ProcessPaymentInput,
    RefundResult,
} from './checkout.types';

@Resolver()
export class CheckoutResolver {
    constructor(private readonly checkoutService: CheckoutService) { }

    @Mutation(() => CheckoutSession, {
        description: 'Create a checkout session for subscription or one-time payment',
    })
    async createCheckoutSession(
        @Args('input') input: CheckoutInput,
    ): Promise<CheckoutSession> {
        return this.checkoutService.createCheckoutSession(input);
    }

    @Mutation(() => PaymentResult, {
        description: 'Process payment for an invoice',
    })
    async processPayment(
        @Args('input') input: ProcessPaymentInput,
    ): Promise<PaymentResult> {
        return this.checkoutService.processPayment(input);
    }

    @Mutation(() => RefundResult, {
        description: 'Refund a transaction (full or partial)',
    })
    async refundPayment(
        @Args('transactionId', { type: () => ID }) transactionId: string,
        @Args('amount', { type: () => Number, nullable: true }) amount?: number,
        @Args('reason', { nullable: true }) reason?: string,
    ): Promise<RefundResult> {
        return this.checkoutService.refundPayment(transactionId, amount, reason);
    }

    @Query(() => [String], {
        description: 'Get available payment providers',
    })
    async availablePaymentProviders(): Promise<string[]> {
        return this.checkoutService.getAvailableProviders();
    }
}
