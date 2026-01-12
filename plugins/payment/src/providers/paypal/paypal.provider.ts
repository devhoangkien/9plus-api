import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

interface PayPalAccessToken {
    access_token: string;
    expires_in: number;
    expiresAt: number;
}

@Injectable()
export class PayPalProvider extends BaseProvider {
    readonly name = 'paypal';
    private clientId: string | null = null;
    private clientSecret: string | null = null;
    private baseUrl: string;
    private accessToken: PayPalAccessToken | null = null;

    constructor(private readonly configService: ConfigService) {
        super();
        this.initializePayPal();
    }

    private initializePayPal() {
        this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || null;
        this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || null;
        const mode = this.configService.get<string>('PAYPAL_MODE') || 'sandbox';

        this.baseUrl =
            mode === 'live'
                ? 'https://api-m.paypal.com'
                : 'https://api-m.sandbox.paypal.com';

        if (this.clientId && this.clientSecret) {
            this.logger.log(`PayPal provider initialized (${mode} mode)`);
        } else {
            this.logger.warn('PayPal credentials not configured');
        }
    }

    isConfigured(): boolean {
        return this.clientId !== null && this.clientSecret !== null;
    }

    private async getAccessToken(): Promise<string> {
        // Check if we have a valid token
        if (this.accessToken && Date.now() < this.accessToken.expiresAt) {
            return this.accessToken.access_token;
        }

        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${auth}`,
            },
            body: 'grant_type=client_credentials',
        });

        if (!response.ok) {
            throw new Error(`PayPal authentication failed: ${response.statusText}`);
        }

        const data = await response.json();
        this.accessToken = {
            access_token: data.access_token,
            expires_in: data.expires_in,
            expiresAt: Date.now() + (data.expires_in - 60) * 1000, // Refresh 1 min early
        };

        return this.accessToken.access_token;
    }

    private async request<T>(
        method: string,
        path: string,
        body?: object,
    ): Promise<T> {
        const token = await this.getAccessToken();

        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${path}`, options);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`PayPal API error: ${error}`);
        }

        // Some endpoints return no content
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    // ========== Payment Operations ==========

    async createPaymentIntent(data: CreatePaymentIntentDto): Promise<PaymentIntent> {
        const order = await this.request<any>('POST', '/v2/checkout/orders', {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: data.currency.toUpperCase(),
                        value: data.amount.toFixed(2),
                    },
                    description: data.description,
                },
            ],
            application_context: {
                return_url: `${this.configService.get('APP_URL')}/payment/success`,
                cancel_url: `${this.configService.get('APP_URL')}/payment/cancel`,
            },
        });

        const approveLink = order.links?.find((l: any) => l.rel === 'approve');

        return {
            id: this.generateReference('PI'),
            providerId: order.id,
            amount: data.amount,
            currency: data.currency,
            status: this.mapPayPalStatus(order.status),
            redirectUrl: approveLink?.href,
            metadata: data.metadata,
        };
    }

    async confirmPayment(orderId: string): Promise<PaymentConfirmation> {
        const result = await this.request<any>('POST', `/v2/checkout/orders/${orderId}/capture`);

        return {
            id: result.id,
            status: this.mapPayPalStatus(result.status),
            transactionId: result.purchase_units?.[0]?.payments?.captures?.[0]?.id,
            paidAt: result.status === 'COMPLETED' ? new Date() : undefined,
        };
    }

    async cancelPayment(orderId: string): Promise<void> {
        // PayPal orders auto-expire, no explicit cancel needed
        this.logger.debug(`PayPal order ${orderId} will auto-expire`);
    }

    async refundPayment(data: RefundDto): Promise<Refund> {
        const body: any = {};
        if (data.amount) {
            body.amount = {
                value: data.amount.toFixed(2),
                currency_code: 'USD', // Would need to track currency
            };
        }
        if (data.reason) {
            body.note_to_payer = data.reason;
        }

        const result = await this.request<any>(
            'POST',
            `/v2/payments/captures/${data.transactionId}/refund`,
            body,
        );

        return {
            id: this.generateReference('RF'),
            providerId: result.id,
            amount: parseFloat(result.amount?.value || '0'),
            currency: result.amount?.currency_code || 'USD',
            status: result.status === 'COMPLETED' ? 'succeeded' : 'pending',
            reason: data.reason,
        };
    }

    // ========== Customer Management ==========
    // PayPal doesn't have explicit customer API like Stripe

    async createCustomer(data: CreateCustomerDto): Promise<Customer> {
        // Store customer locally, no PayPal API call needed
        return {
            id: this.generateReference('CU'),
            providerId: `paypal_${data.email}`,
            email: data.email,
            name: data.name,
        };
    }

    async updateCustomer(
        providerId: string,
        data: Partial<CreateCustomerDto>,
    ): Promise<Customer> {
        return {
            id: providerId,
            providerId,
            email: data.email || '',
            name: data.name,
        };
    }

    async getCustomer(providerId: string): Promise<Customer | null> {
        // Would need local database lookup
        return null;
    }

    // ========== Payment Method Management ==========
    // PayPal handles payment methods through checkout flow

    async attachPaymentMethod(
        customerId: string,
        paymentMethodData: PaymentMethodDto,
    ): Promise<PaymentMethod> {
        // PayPal Vault could be used here
        return {
            id: this.generateReference('PM'),
            providerId: `paypal_wallet`,
            type: 'wallet',
        };
    }

    async detachPaymentMethod(paymentMethodId: string): Promise<void> {
        // No-op for PayPal
    }

    async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
        return [];
    }

    // ========== Subscription ==========

    async createSubscription(
        data: CreateSubscriptionDto,
    ): Promise<ProviderSubscription> {
        const subscription = await this.request<any>('POST', '/v1/billing/subscriptions', {
            plan_id: data.priceId,
            application_context: {
                return_url: `${this.configService.get('APP_URL')}/subscription/success`,
                cancel_url: `${this.configService.get('APP_URL')}/subscription/cancel`,
            },
        });

        const now = new Date();
        return {
            id: this.generateReference('SU'),
            providerId: subscription.id,
            customerId: data.customerId,
            status: subscription.status === 'ACTIVE' ? 'active' : 'trialing',
            currentPeriodStart: now,
            currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
        };
    }

    async cancelSubscription(subscriptionId: string): Promise<void> {
        await this.request('POST', `/v1/billing/subscriptions/${subscriptionId}/cancel`, {
            reason: 'User requested cancellation',
        });
    }

    // ========== Webhooks ==========

    validateWebhook(payload: string | Buffer, signature: string): WebhookEvent {
        // PayPal webhook validation would use their verification API
        // For now, parse the webhook data
        const data = typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString());

        return {
            id: data.id,
            type: data.event_type,
            provider: this.name,
            data: data.resource || {},
            createdAt: new Date(data.create_time),
        };
    }

    getWebhookPath(): string {
        return '/webhooks/paypal';
    }

    // ========== Helper Methods ==========

    private mapPayPalStatus(status: string): PaymentIntentStatus {
        const statusMap: Record<string, PaymentIntentStatus> = {
            CREATED: PaymentIntentStatus.REQUIRES_ACTION,
            SAVED: PaymentIntentStatus.REQUIRES_CONFIRMATION,
            APPROVED: PaymentIntentStatus.REQUIRES_CONFIRMATION,
            VOIDED: PaymentIntentStatus.CANCELED,
            COMPLETED: PaymentIntentStatus.SUCCEEDED,
            PAYER_ACTION_REQUIRED: PaymentIntentStatus.REQUIRES_ACTION,
        };
        return statusMap[status] || PaymentIntentStatus.FAILED;
    }
}
