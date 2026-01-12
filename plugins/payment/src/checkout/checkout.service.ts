import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProviderFactory } from '../providers/provider.factory';
import { BillingService } from '../billing/billing.service';
import { SubscriptionService } from '../subscription/subscription.service';
import {
    CheckoutInput,
    CheckoutSession,
    CheckoutType,
    ProcessPaymentInput,
    PaymentResult,
    PaymentResultType,
    RefundResult,
} from './checkout.types';
import {
    LineItemType,
    PaymentProvider,
    TransactionType,
    TransactionStatus,
} from '../../prisma/@generated/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CheckoutService {
    private readonly logger = new Logger(CheckoutService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly providerFactory: PaymentProviderFactory,
        private readonly billingService: BillingService,
        private readonly subscriptionService: SubscriptionService,
    ) { }

    /**
     * Create a checkout session
     */
    async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
        const sessionId = this.generateSessionId();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        if (input.type === CheckoutType.SUBSCRIPTION && input.planId) {
            return this.createSubscriptionCheckout(sessionId, input, expiresAt);
        }

        if (input.type === CheckoutType.ONE_TIME && input.productId) {
            return this.createOneTimeCheckout(sessionId, input, expiresAt);
        }

        throw new Error('Invalid checkout configuration');
    }

    private async createSubscriptionCheckout(
        sessionId: string,
        input: CheckoutInput,
        expiresAt: Date,
    ): Promise<CheckoutSession> {
        // Get the plan
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id: input.planId },
        });

        if (!plan) {
            throw new Error(`Plan ${input.planId} not found`);
        }

        // Create invoice for first payment
        const invoice = await this.billingService.createInvoice({
            userId: input.userId,
            description: `Subscription: ${plan.name}`,
            lineItems: [
                {
                    description: `${plan.name} - ${plan.billingCycle}`,
                    quantity: 1,
                    unitPrice: plan.price.toNumber(),
                    itemType: LineItemType.SUBSCRIPTION,
                    itemId: plan.id,
                },
            ],
            currency: plan.currency,
            dueDate: new Date(),
        });

        // Get provider
        const provider = this.providerFactory.getProvider(input.provider);

        // Create payment intent
        const paymentIntent = await provider.createPaymentIntent({
            amount: plan.price.toNumber(),
            currency: plan.currency,
            paymentMethodId: input.paymentMethodId,
            description: `Subscription: ${plan.name}`,
            metadata: {
                type: 'subscription',
                planId: plan.id,
                invoiceId: invoice.id,
                userId: input.userId,
            },
        });

        return {
            id: sessionId,
            type: 'subscription',
            redirectUrl: paymentIntent.redirectUrl,
            clientSecret: paymentIntent.clientSecret,
            qrCode: paymentIntent.qrCode,
            invoiceId: invoice.id,
            expiresAt,
        };
    }

    private async createOneTimeCheckout(
        sessionId: string,
        input: CheckoutInput,
        expiresAt: Date,
    ): Promise<CheckoutSession> {
        // For one-time payments, would lookup product/price
        throw new Error('One-time checkout not yet implemented');
    }

    /**
     * Process payment for an invoice
     */
    async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: input.invoiceId },
            include: { lineItems: true },
        });

        if (!invoice) {
            throw new Error(`Invoice ${input.invoiceId} not found`);
        }

        const providerEnum = this.mapProviderString(input.provider || 'STRIPE');

        const result = await this.billingService.processPayment({
            invoiceId: input.invoiceId,
            paymentMethodId: input.paymentMethodId,
            provider: providerEnum,
        });

        return {
            type: result.type as PaymentResultType,
            redirectUrl: result.redirectUrl,
            clientSecret: result.clientSecret,
            qrCode: result.qrCode,
            transactionId: result.transactionId,
            status: result.status,
        };
    }

    /**
     * Refund a transaction
     */
    async refundPayment(
        transactionId: string,
        amount?: number,
        reason?: string,
    ): Promise<RefundResult> {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) {
            throw new Error(`Transaction ${transactionId} not found`);
        }

        if (transaction.status !== TransactionStatus.SUCCEEDED) {
            throw new Error('Can only refund successful transactions');
        }

        const provider = this.providerFactory.getProvider(transaction.provider);

        const refund = await provider.refundPayment({
            transactionId: transaction.providerId!,
            amount: amount,
            reason: reason,
        });

        // Create refund record
        const refundRecord = await this.prisma.refund.create({
            data: {
                refundNumber: this.generateRefundNumber(),
                transactionId: transaction.id,
                amount: new Decimal(refund.amount),
                currency: refund.currency,
                reason: reason as any || 'REQUESTED_BY_CUSTOMER',
                status: refund.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
                description: reason,
                providerId: refund.providerId,
                createdBy: 'system',
            },
        });

        // Update transaction if fully refunded
        if (!amount || amount >= transaction.amount.toNumber()) {
            await this.prisma.transaction.update({
                where: { id: transactionId },
                data: { type: TransactionType.REFUND },
            });
        }

        return {
            id: refundRecord.id,
            amount: refund.amount,
            currency: refund.currency,
            status: refund.status,
            reason: reason,
        };
    }

    /**
     * Get available payment providers
     */
    getAvailableProviders(): string[] {
        return this.providerFactory.getAvailableProviders();
    }

    // Helper methods
    private generateSessionId(): string {
        return `cs_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
    }

    private generateRefundNumber(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `REF-${year}${month}-${random}`;
    }

    private mapProviderString(provider: string): PaymentProvider {
        const map: Record<string, PaymentProvider> = {
            STRIPE: PaymentProvider.STRIPE,
            PAYPAL: PaymentProvider.PAYPAL,
            SEPAY: PaymentProvider.SEPAY,
        };
        return map[provider.toUpperCase()] || PaymentProvider.STRIPE;
    }
}
