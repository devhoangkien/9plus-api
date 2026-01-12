/**
 * Payment Provider Interface
 * Base interface that all payment providers must implement
 */

// ========== DTOs ==========

export interface CreatePaymentIntentDto {
    amount: number;
    currency: string;
    customerId?: string;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
    description?: string;
}

export interface PaymentIntent {
    id: string;
    providerId: string;
    amount: number;
    currency: string;
    status: PaymentIntentStatus;
    clientSecret?: string; // For client-side confirmation (Stripe)
    redirectUrl?: string; // For redirect-based flows (PayPal, Sepay)
    qrCode?: string; // For QR-based payments (Sepay VietQR)
    metadata?: Record<string, string>;
}

export enum PaymentIntentStatus {
    REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
    REQUIRES_CONFIRMATION = 'requires_confirmation',
    REQUIRES_ACTION = 'requires_action',
    PROCESSING = 'processing',
    SUCCEEDED = 'succeeded',
    CANCELED = 'canceled',
    FAILED = 'failed',
}

export interface PaymentConfirmation {
    id: string;
    status: PaymentIntentStatus;
    transactionId?: string;
    paidAt?: Date;
    errorMessage?: string;
}

export interface CreateCustomerDto {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
}

export interface Customer {
    id: string;
    providerId: string;
    email: string;
    name?: string;
}

export interface PaymentMethodDto {
    type: 'card' | 'bank_transfer' | 'wallet';
    token?: string; // Tokenized payment method from provider
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
}

export interface PaymentMethod {
    id: string;
    providerId: string;
    type: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
}

export interface RefundDto {
    transactionId: string;
    amount?: number; // Partial refund if specified
    reason?: string;
}

export interface Refund {
    id: string;
    providerId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed';
    reason?: string;
}

export interface CreateSubscriptionDto {
    customerId: string;
    priceId: string; // Provider's price/plan ID
    paymentMethodId?: string;
    trialDays?: number;
    metadata?: Record<string, string>;
}

export interface ProviderSubscription {
    id: string;
    providerId: string;
    customerId: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
}

export interface WebhookEvent {
    id: string;
    type: string;
    provider: string;
    data: Record<string, unknown>;
    createdAt: Date;
}

// ========== Interface ==========

export interface PaymentProviderInterface {
    /**
     * Provider name (e.g., 'stripe', 'paypal', 'sepay')
     */
    readonly name: string;

    /**
     * Check if provider is properly configured
     */
    isConfigured(): boolean;

    // ========== Payment Operations ==========

    /**
     * Create a payment intent for processing
     */
    createPaymentIntent(data: CreatePaymentIntentDto): Promise<PaymentIntent>;

    /**
     * Confirm a payment intent
     */
    confirmPayment(paymentIntentId: string): Promise<PaymentConfirmation>;

    /**
     * Cancel a payment intent
     */
    cancelPayment(paymentIntentId: string): Promise<void>;

    /**
     * Refund a completed payment
     */
    refundPayment(data: RefundDto): Promise<Refund>;

    // ========== Customer Management ==========

    /**
     * Create a customer in the provider's system
     */
    createCustomer(data: CreateCustomerDto): Promise<Customer>;

    /**
     * Update customer information
     */
    updateCustomer(
        providerId: string,
        data: Partial<CreateCustomerDto>,
    ): Promise<Customer>;

    /**
     * Get customer by provider ID
     */
    getCustomer(providerId: string): Promise<Customer | null>;

    // ========== Payment Method Management ==========

    /**
     * Attach a payment method to a customer
     */
    attachPaymentMethod(
        customerId: string,
        paymentMethodData: PaymentMethodDto,
    ): Promise<PaymentMethod>;

    /**
     * Detach a payment method
     */
    detachPaymentMethod(paymentMethodId: string): Promise<void>;

    /**
     * List customer's payment methods
     */
    listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;

    // ========== Subscription (Optional) ==========

    /**
     * Create a subscription (if supported)
     */
    createSubscription?(
        data: CreateSubscriptionDto,
    ): Promise<ProviderSubscription>;

    /**
     * Cancel a subscription (if supported)
     */
    cancelSubscription?(subscriptionId: string): Promise<void>;

    /**
     * Update subscription (if supported)
     */
    updateSubscription?(
        subscriptionId: string,
        data: Partial<CreateSubscriptionDto>,
    ): Promise<ProviderSubscription>;

    // ========== Webhooks ==========

    /**
     * Validate webhook signature and parse event
     */
    validateWebhook(payload: string | Buffer, signature: string): WebhookEvent;

    /**
     * Get webhook endpoint path for this provider
     */
    getWebhookPath(): string;
}
