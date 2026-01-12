import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BaseProvider } from '../base.provider';
import {
    CreatePaymentIntentDto,
    PaymentIntent,
    PaymentIntentStatus,
    PaymentConfirmation,
    CreateCustomerDto,
    Customer,
    PaymentMethodDto,
    PaymentMethod,
    RefundDto,
    Refund,
    CreateSubscriptionDto,
    ProviderSubscription,
    WebhookEvent,
} from '../payment-provider.interface';

@Injectable()
export class StripeProvider extends BaseProvider {
    readonly name = 'stripe';
    private stripe: Stripe | null = null;
    private webhookSecret: string | null = null;

    constructor(private readonly configService: ConfigService) {
        super();
        this.initializeStripe();
    }

    private initializeStripe() {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || null;

        if (secretKey) {
            this.stripe = new Stripe(secretKey, {
                apiVersion: '2024-12-18.acacia',
                typescript: true,
            });
            this.logger.log('Stripe provider initialized');
        } else {
            this.logger.warn('Stripe secret key not configured');
        }
    }

    isConfigured(): boolean {
        return this.stripe !== null;
    }

    private getStripe(): Stripe {
        if (!this.stripe) {
            throw new Error('Stripe is not configured');
        }
        return this.stripe;
    }

    // ========== Payment Operations ==========

    async createPaymentIntent(data: CreatePaymentIntentDto): Promise<PaymentIntent> {
        const stripe = this.getStripe();

        const params: Stripe.PaymentIntentCreateParams = {
            amount: this.toSmallestUnit(data.amount, data.currency),
            currency: data.currency.toLowerCase(),
            metadata: data.metadata || {},
        };

        if (data.customerId) {
            params.customer = data.customerId;
        }
        if (data.paymentMethodId) {
            params.payment_method = data.paymentMethodId;
        }
        if (data.description) {
            params.description = data.description;
        }

        const intent = await stripe.paymentIntents.create(params);

        return {
            id: this.generateReference('PI'),
            providerId: intent.id,
            amount: data.amount,
            currency: data.currency,
            status: this.mapStripeStatus(intent.status),
            clientSecret: intent.client_secret || undefined,
            metadata: data.metadata,
        };
    }

    async confirmPayment(paymentIntentId: string): Promise<PaymentConfirmation> {
        const stripe = this.getStripe();
        const intent = await stripe.paymentIntents.confirm(paymentIntentId);

        return {
            id: intent.id,
            status: this.mapStripeStatus(intent.status),
            transactionId: intent.latest_charge as string | undefined,
            paidAt: intent.status === 'succeeded' ? new Date() : undefined,
        };
    }

    async cancelPayment(paymentIntentId: string): Promise<void> {
        const stripe = this.getStripe();
        await stripe.paymentIntents.cancel(paymentIntentId);
    }

    async refundPayment(data: RefundDto): Promise<Refund> {
        const stripe = this.getStripe();

        const params: Stripe.RefundCreateParams = {
            payment_intent: data.transactionId,
        };

        if (data.amount) {
            // Get payment intent to get currency
            const intent = await stripe.paymentIntents.retrieve(data.transactionId);
            params.amount = this.toSmallestUnit(data.amount, intent.currency);
        }
        if (data.reason) {
            params.reason = 'requested_by_customer';
        }

        const refund = await stripe.refunds.create(params);

        return {
            id: this.generateReference('RF'),
            providerId: refund.id,
            amount: this.fromSmallestUnit(refund.amount, refund.currency),
            currency: refund.currency.toUpperCase(),
            status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
            reason: data.reason,
        };
    }

    // ========== Customer Management ==========

    async createCustomer(data: CreateCustomerDto): Promise<Customer> {
        const stripe = this.getStripe();

        const customer = await stripe.customers.create({
            email: data.email,
            name: data.name,
            phone: data.phone,
            metadata: data.metadata || {},
        });

        return {
            id: this.generateReference('CU'),
            providerId: customer.id,
            email: customer.email || data.email,
            name: customer.name || data.name,
        };
    }

    async updateCustomer(
        providerId: string,
        data: Partial<CreateCustomerDto>,
    ): Promise<Customer> {
        const stripe = this.getStripe();

        const customer = await stripe.customers.update(providerId, {
            email: data.email,
            name: data.name,
            phone: data.phone,
            metadata: data.metadata,
        });

        return {
            id: providerId,
            providerId: customer.id,
            email: customer.email || '',
            name: customer.name || undefined,
        };
    }

    async getCustomer(providerId: string): Promise<Customer | null> {
        const stripe = this.getStripe();

        try {
            const customer = await stripe.customers.retrieve(providerId);
            if (customer.deleted) {
                return null;
            }
            return {
                id: providerId,
                providerId: customer.id,
                email: customer.email || '',
                name: customer.name || undefined,
            };
        } catch {
            return null;
        }
    }

    // ========== Payment Method Management ==========

    async attachPaymentMethod(
        customerId: string,
        paymentMethodData: PaymentMethodDto,
    ): Promise<PaymentMethod> {
        const stripe = this.getStripe();

        if (!paymentMethodData.token) {
            throw new Error('Payment method token is required');
        }

        const pm = await stripe.paymentMethods.attach(paymentMethodData.token, {
            customer: customerId,
        });

        return {
            id: this.generateReference('PM'),
            providerId: pm.id,
            type: pm.type,
            last4: pm.card?.last4,
            brand: pm.card?.brand,
            expiryMonth: pm.card?.exp_month,
            expiryYear: pm.card?.exp_year,
        };
    }

    async detachPaymentMethod(paymentMethodId: string): Promise<void> {
        const stripe = this.getStripe();
        await stripe.paymentMethods.detach(paymentMethodId);
    }

    async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
        const stripe = this.getStripe();

        const methods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card',
        });

        return methods.data.map((pm) => ({
            id: pm.id,
            providerId: pm.id,
            type: pm.type,
            last4: pm.card?.last4,
            brand: pm.card?.brand,
            expiryMonth: pm.card?.exp_month,
            expiryYear: pm.card?.exp_year,
        }));
    }

    // ========== Subscription ==========

    async createSubscription(
        data: CreateSubscriptionDto,
    ): Promise<ProviderSubscription> {
        const stripe = this.getStripe();

        const params: Stripe.SubscriptionCreateParams = {
            customer: data.customerId,
            items: [{ price: data.priceId }],
            metadata: data.metadata || {},
        };

        if (data.paymentMethodId) {
            params.default_payment_method = data.paymentMethodId;
        }
        if (data.trialDays) {
            params.trial_period_days = data.trialDays;
        }

        const sub = await stripe.subscriptions.create(params);

        return {
            id: this.generateReference('SU'),
            providerId: sub.id,
            customerId: sub.customer as string,
            status: this.mapStripeSubStatus(sub.status),
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
    }

    async cancelSubscription(subscriptionId: string): Promise<void> {
        const stripe = this.getStripe();
        await stripe.subscriptions.cancel(subscriptionId);
    }

    async updateSubscription(
        subscriptionId: string,
        data: Partial<CreateSubscriptionDto>,
    ): Promise<ProviderSubscription> {
        const stripe = this.getStripe();

        const params: Stripe.SubscriptionUpdateParams = {};
        if (data.paymentMethodId) {
            params.default_payment_method = data.paymentMethodId;
        }
        if (data.metadata) {
            params.metadata = data.metadata;
        }

        const sub = await stripe.subscriptions.update(subscriptionId, params);

        return {
            id: subscriptionId,
            providerId: sub.id,
            customerId: sub.customer as string,
            status: this.mapStripeSubStatus(sub.status),
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
    }

    // ========== Webhooks ==========

    validateWebhook(payload: string | Buffer, signature: string): WebhookEvent {
        if (!this.webhookSecret) {
            throw new Error('Stripe webhook secret not configured');
        }

        const stripe = this.getStripe();
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            this.webhookSecret,
        );

        return {
            id: event.id,
            type: event.type,
            provider: this.name,
            data: event.data.object as Record<string, unknown>,
            createdAt: new Date(event.created * 1000),
        };
    }

    getWebhookPath(): string {
        return '/webhooks/stripe';
    }

    // ========== Helper Methods ==========

    private mapStripeStatus(status: Stripe.PaymentIntent.Status): PaymentIntentStatus {
        const statusMap: Record<string, PaymentIntentStatus> = {
            requires_payment_method: PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
            requires_confirmation: PaymentIntentStatus.REQUIRES_CONFIRMATION,
            requires_action: PaymentIntentStatus.REQUIRES_ACTION,
            processing: PaymentIntentStatus.PROCESSING,
            succeeded: PaymentIntentStatus.SUCCEEDED,
            canceled: PaymentIntentStatus.CANCELED,
        };
        return statusMap[status] || PaymentIntentStatus.FAILED;
    }

    private mapStripeSubStatus(
        status: Stripe.Subscription.Status,
    ): 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' {
        const statusMap: Record<string, 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'> = {
            active: 'active',
            trialing: 'trialing',
            past_due: 'past_due',
            canceled: 'canceled',
            unpaid: 'unpaid',
            incomplete: 'unpaid',
            incomplete_expired: 'canceled',
            paused: 'past_due',
        };
        return statusMap[status] || 'unpaid';
    }
}
