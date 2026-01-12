import { Logger } from '@nestjs/common';
import {
    PaymentProviderInterface,
    CreatePaymentIntentDto,
    PaymentIntent,
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
} from './payment-provider.interface';

/**
 * Abstract base class for payment providers
 * Provides common functionality and logging
 */
export abstract class BaseProvider implements PaymentProviderInterface {
    protected readonly logger: Logger;
    abstract readonly name: string;

    constructor() {
        this.logger = new Logger(this.constructor.name);
    }

    abstract isConfigured(): boolean;

    // ========== Payment Operations ==========

    abstract createPaymentIntent(
        data: CreatePaymentIntentDto,
    ): Promise<PaymentIntent>;

    abstract confirmPayment(paymentIntentId: string): Promise<PaymentConfirmation>;

    abstract cancelPayment(paymentIntentId: string): Promise<void>;

    abstract refundPayment(data: RefundDto): Promise<Refund>;

    // ========== Customer Management ==========

    abstract createCustomer(data: CreateCustomerDto): Promise<Customer>;

    abstract updateCustomer(
        providerId: string,
        data: Partial<CreateCustomerDto>,
    ): Promise<Customer>;

    abstract getCustomer(providerId: string): Promise<Customer | null>;

    // ========== Payment Method Management ==========

    abstract attachPaymentMethod(
        customerId: string,
        paymentMethodData: PaymentMethodDto,
    ): Promise<PaymentMethod>;

    abstract detachPaymentMethod(paymentMethodId: string): Promise<void>;

    abstract listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;

    // ========== Subscription (Optional - default throws) ==========

    async createSubscription(
        data: CreateSubscriptionDto,
    ): Promise<ProviderSubscription> {
        throw new Error(
            `Subscription not supported by ${this.name} provider`,
        );
    }

    async cancelSubscription(subscriptionId: string): Promise<void> {
        throw new Error(
            `Subscription not supported by ${this.name} provider`,
        );
    }

    async updateSubscription(
        subscriptionId: string,
        data: Partial<CreateSubscriptionDto>,
    ): Promise<ProviderSubscription> {
        throw new Error(
            `Subscription not supported by ${this.name} provider`,
        );
    }

    // ========== Webhooks ==========

    abstract validateWebhook(
        payload: string | Buffer,
        signature: string,
    ): WebhookEvent;

    abstract getWebhookPath(): string;

    // ========== Utility Methods ==========

    /**
     * Convert amount to smallest currency unit (e.g., cents)
     */
    protected toSmallestUnit(amount: number, currency: string): number {
        // Most currencies use 2 decimal places
        const zeroDecimalCurrencies = [
            'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW',
            'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
        ];

        if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
            return Math.round(amount);
        }

        return Math.round(amount * 100);
    }

    /**
     * Convert from smallest currency unit to standard
     */
    protected fromSmallestUnit(amount: number, currency: string): number {
        const zeroDecimalCurrencies = [
            'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW',
            'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
        ];

        if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
            return amount;
        }

        return amount / 100;
    }

    /**
     * Generate unique reference for transactions
     */
    protected generateReference(prefix: string): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${timestamp}${random}`.toUpperCase();
    }
}
