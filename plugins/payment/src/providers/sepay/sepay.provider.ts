import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
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
    WebhookEvent,
} from '../payment-provider.interface';

/**
 * Sepay Provider
 * Vietnam payment gateway supporting VietQR and bank transfers
 * API Documentation: https://my.sepay.vn/docs
 */
@Injectable()
export class SepayProvider extends BaseProvider {
    readonly name = 'sepay';
    private merchantId: string | null = null;
    private secretKey: string | null = null;
    private baseUrl: string;

    constructor(private readonly configService: ConfigService) {
        super();
        this.initializeSepay();
    }

    private initializeSepay() {
        this.merchantId = this.configService.get<string>('SEPAY_MERCHANT_ID') || null;
        this.secretKey = this.configService.get<string>('SEPAY_SECRET_KEY') || null;
        this.baseUrl = this.configService.get<string>('SEPAY_API_URL') || 'https://my.sepay.vn';

        if (this.merchantId && this.secretKey) {
            this.logger.log('Sepay provider initialized');
        } else {
            this.logger.warn('Sepay credentials not configured');
        }
    }

    isConfigured(): boolean {
        return this.merchantId !== null && this.secretKey !== null;
    }

    private getAuthHeader(): string {
        const auth = Buffer.from(`${this.merchantId}:${this.secretKey}`).toString('base64');
        return `Basic ${auth}`;
    }

    private async request<T>(
        method: string,
        path: string,
        body?: object,
    ): Promise<T> {
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.getAuthHeader(),
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${path}`, options);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Sepay API error: ${error}`);
        }

        return response.json();
    }

    // ========== Payment Operations ==========

    async createPaymentIntent(data: CreatePaymentIntentDto): Promise<PaymentIntent> {
        // Sepay uses VietQR for payments
        // Generate a unique order reference
        const orderRef = this.generateReference('SP');

        // Create payment request
        const result = await this.request<any>('POST', '/api/v1/payments/create', {
            order_id: orderRef,
            amount: data.amount,
            currency: data.currency || 'VND',
            description: data.description || 'Payment',
            return_url: `${this.configService.get('APP_URL')}/payment/callback`,
            cancel_url: `${this.configService.get('APP_URL')}/payment/cancel`,
            webhook_url: `${this.configService.get('API_URL')}/webhooks/sepay`,
            metadata: data.metadata,
        });

        return {
            id: orderRef,
            providerId: result.transaction_id || orderRef,
            amount: data.amount,
            currency: data.currency || 'VND',
            status: PaymentIntentStatus.REQUIRES_ACTION,
            redirectUrl: result.payment_url,
            qrCode: result.qr_code_url, // VietQR code URL
            metadata: data.metadata,
        };
    }

    async confirmPayment(transactionId: string): Promise<PaymentConfirmation> {
        // Query transaction status
        const result = await this.request<any>('GET', `/api/v1/transactions/${transactionId}`);

        return {
            id: result.transaction_id,
            status: this.mapSepayStatus(result.status),
            transactionId: result.bank_reference,
            paidAt: result.paid_at ? new Date(result.paid_at) : undefined,
            errorMessage: result.error_message,
        };
    }

    async cancelPayment(transactionId: string): Promise<void> {
        await this.request('POST', `/api/v1/transactions/${transactionId}/cancel`);
    }

    async refundPayment(data: RefundDto): Promise<Refund> {
        const result = await this.request<any>('POST', '/api/v1/refunds/create', {
            transaction_id: data.transactionId,
            amount: data.amount,
            reason: data.reason,
        });

        return {
            id: this.generateReference('RF'),
            providerId: result.refund_id,
            amount: result.amount,
            currency: 'VND',
            status: result.status === 'completed' ? 'succeeded' : 'pending',
            reason: data.reason,
        };
    }

    // ========== Customer Management ==========
    // Sepay doesn't have customer management API

    async createCustomer(data: CreateCustomerDto): Promise<Customer> {
        return {
            id: this.generateReference('CU'),
            providerId: `sepay_${data.email}`,
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
        return null;
    }

    // ========== Payment Method Management ==========
    // Sepay works with bank transfers, no stored payment methods

    async attachPaymentMethod(
        customerId: string,
        paymentMethodData: PaymentMethodDto,
    ): Promise<PaymentMethod> {
        return {
            id: this.generateReference('PM'),
            providerId: 'bank_transfer',
            type: 'bank_transfer',
        };
    }

    async detachPaymentMethod(paymentMethodId: string): Promise<void> {
        // No-op
    }

    async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
        // Sepay supports bank transfer only
        return [
            {
                id: 'sepay_bank',
                providerId: 'bank_transfer',
                type: 'bank_transfer',
            },
        ];
    }

    // ========== VietQR Specific ==========

    /**
     * Generate VietQR code for payment
     */
    async generateVietQR(params: {
        bankCode: string;
        accountNumber: string;
        amount: number;
        description: string;
    }): Promise<string> {
        const result = await this.request<any>('POST', '/api/v1/qr/generate', {
            bank_code: params.bankCode,
            account_number: params.accountNumber,
            amount: params.amount,
            description: params.description,
        });

        return result.qr_code_url;
    }

    /**
     * Query bank transactions
     */
    async getTransactions(params: {
        bankAccountId?: string;
        fromDate?: Date;
        toDate?: Date;
        limit?: number;
    }): Promise<any[]> {
        const query = new URLSearchParams();
        if (params.bankAccountId) query.set('bank_account_id', params.bankAccountId);
        if (params.fromDate) query.set('from_date', params.fromDate.toISOString());
        if (params.toDate) query.set('to_date', params.toDate.toISOString());
        if (params.limit) query.set('limit', params.limit.toString());

        const result = await this.request<any>('GET', `/api/v1/transactions?${query}`);
        return result.transactions || [];
    }

    // ========== Webhooks ==========

    validateWebhook(payload: string | Buffer, signature: string): WebhookEvent {
        const payloadStr = typeof payload === 'string' ? payload : payload.toString();

        // Verify signature using HMAC
        const expectedSignature = createHmac('sha256', this.secretKey || '')
            .update(payloadStr)
            .digest('hex');

        if (signature !== expectedSignature) {
            throw new Error('Invalid Sepay webhook signature');
        }

        const data = JSON.parse(payloadStr);

        return {
            id: data.id || this.generateReference('WH'),
            type: data.event_type || 'payment.completed',
            provider: this.name,
            data: {
                transactionId: data.transaction_id,
                amount: data.amount,
                status: data.status,
                bankReference: data.bank_reference,
                paidAt: data.paid_at,
            },
            createdAt: new Date(data.created_at || Date.now()),
        };
    }

    getWebhookPath(): string {
        return '/webhooks/sepay';
    }

    // ========== Helper Methods ==========

    private mapSepayStatus(status: string): PaymentIntentStatus {
        const statusMap: Record<string, PaymentIntentStatus> = {
            pending: PaymentIntentStatus.REQUIRES_ACTION,
            processing: PaymentIntentStatus.PROCESSING,
            completed: PaymentIntentStatus.SUCCEEDED,
            success: PaymentIntentStatus.SUCCEEDED,
            failed: PaymentIntentStatus.FAILED,
            cancelled: PaymentIntentStatus.CANCELED,
            expired: PaymentIntentStatus.CANCELED,
        };
        return statusMap[status?.toLowerCase()] || PaymentIntentStatus.REQUIRES_ACTION;
    }
}
