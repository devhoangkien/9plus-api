import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProviderFactory } from '../providers/provider.factory';
import {
    InvoiceStatus,
    TransactionType,
    TransactionStatus,
    PaymentProvider,
    LineItemType,
    Prisma,
} from '../../prisma/@generated/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateInvoiceDto {
    userId: string;
    subscriptionId?: string;
    description: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        itemType: LineItemType;
        itemId?: string;
        periodStart?: Date;
        periodEnd?: Date;
    }[];
    taxRate?: number; // Percentage
    currency?: string;
    dueDate?: Date;
}

export interface ProcessPaymentDto {
    invoiceId: string;
    paymentMethodId: string;
    provider: PaymentProvider;
}

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly providerFactory: PaymentProviderFactory,
    ) { }

    /**
     * Generate a unique invoice number
     */
    private generateInvoiceNumber(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `INV-${year}${month}-${random}`;
    }

    /**
     * Generate a unique transaction reference
     */
    private generateTransactionReference(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `TXN-${timestamp}${random}`.toUpperCase();
    }

    /**
     * Create an invoice with line items
     */
    async createInvoice(data: CreateInvoiceDto) {
        // Calculate amounts
        let subtotal = 0;
        for (const item of data.lineItems) {
            subtotal += item.quantity * item.unitPrice;
        }

        const taxAmount = data.taxRate ? subtotal * (data.taxRate / 100) : 0;
        const total = subtotal + taxAmount;

        // Default due date is 30 days from now
        const dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        return this.prisma.invoice.create({
            data: {
                invoiceNumber: this.generateInvoiceNumber(),
                userId: data.userId,
                subscriptionId: data.subscriptionId,
                description: data.description,
                subtotal: new Decimal(subtotal),
                taxAmount: new Decimal(taxAmount),
                total: new Decimal(total),
                currency: data.currency || 'USD',
                status: InvoiceStatus.PENDING,
                dueDate,
                lineItems: {
                    create: data.lineItems.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: new Decimal(item.unitPrice),
                        amount: new Decimal(item.quantity * item.unitPrice),
                        itemType: item.itemType,
                        itemId: item.itemId,
                        periodStart: item.periodStart,
                        periodEnd: item.periodEnd,
                    })),
                },
            },
            include: {
                lineItems: true,
            },
        });
    }

    /**
     * Process payment for an invoice
     */
    async processPayment(data: ProcessPaymentDto) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: data.invoiceId },
            include: { lineItems: true },
        });

        if (!invoice) {
            throw new Error(`Invoice ${data.invoiceId} not found`);
        }

        if (invoice.status === InvoiceStatus.PAID) {
            throw new Error('Invoice is already paid');
        }

        const provider = this.providerFactory.getProvider(data.provider);

        // Create payment intent
        const paymentIntent = await provider.createPaymentIntent({
            amount: invoice.total.toNumber(),
            currency: invoice.currency,
            paymentMethodId: data.paymentMethodId,
            description: `Payment for ${invoice.invoiceNumber}`,
            metadata: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
            },
        });

        // Create transaction record
        const transaction = await this.prisma.transaction.create({
            data: {
                reference: this.generateTransactionReference(),
                userId: invoice.userId,
                invoiceId: invoice.id,
                paymentMethodId: data.paymentMethodId,
                type: TransactionType.PAYMENT,
                status: TransactionStatus.PROCESSING,
                amount: invoice.total,
                feeAmount: new Decimal(0),
                netAmount: invoice.total,
                currency: invoice.currency,
                provider: data.provider,
                providerId: paymentIntent.providerId,
                description: `Payment for ${invoice.invoiceNumber}`,
            },
        });

        // For redirect-based flows, return the redirect URL
        if (paymentIntent.redirectUrl) {
            return {
                type: 'redirect',
                redirectUrl: paymentIntent.redirectUrl,
                transactionId: transaction.id,
            };
        }

        // For QR-based flows (Sepay)
        if (paymentIntent.qrCode) {
            return {
                type: 'qr',
                qrCode: paymentIntent.qrCode,
                transactionId: transaction.id,
            };
        }

        // For client-side confirmation (Stripe)
        if (paymentIntent.clientSecret) {
            return {
                type: 'client_secret',
                clientSecret: paymentIntent.clientSecret,
                transactionId: transaction.id,
            };
        }

        // Direct confirmation
        const confirmation = await provider.confirmPayment(paymentIntent.providerId);

        if (confirmation.status === 'succeeded') {
            await this.markInvoicePaid(invoice.id, transaction.id);
        }

        return {
            type: 'completed',
            status: confirmation.status,
            transactionId: transaction.id,
        };
    }

    /**
     * Mark invoice as paid
     */
    async markInvoicePaid(invoiceId: string, transactionId: string) {
        await this.prisma.$transaction([
            this.prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: InvoiceStatus.PAID,
                    paidDate: new Date(),
                },
            }),
            this.prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    status: TransactionStatus.SUCCEEDED,
                    processedAt: new Date(),
                },
            }),
        ]);

        this.logger.log(`Invoice ${invoiceId} marked as paid`);
    }

    /**
     * Handle overdue invoices (dunning)
     */
    async processOverdueInvoices() {
        const overdueInvoices = await this.prisma.invoice.findMany({
            where: {
                status: InvoiceStatus.PENDING,
                dueDate: { lt: new Date() },
            },
        });

        for (const invoice of overdueInvoices) {
            await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    status: InvoiceStatus.OVERDUE,
                    dunningLevel: { increment: 1 },
                    lastDunningAt: new Date(),
                },
            });

            this.logger.warn(`Invoice ${invoice.invoiceNumber} marked as overdue`);
        }

        return overdueInvoices.length;
    }

    /**
     * Get billing summary for a user
     */
    async getUserBillingSummary(userId: string) {
        const [invoices, transactions, subscriptions] = await Promise.all([
            this.prisma.invoice.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { lineItems: true },
            }),
            this.prisma.transaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            this.prisma.subscription.findMany({
                where: { userId },
                include: { plan: true },
            }),
        ]);

        const pendingAmount = invoices
            .filter((i) => i.status === InvoiceStatus.PENDING)
            .reduce((sum, i) => sum + i.total.toNumber(), 0);

        const overdueAmount = invoices
            .filter((i) => i.status === InvoiceStatus.OVERDUE)
            .reduce((sum, i) => sum + i.total.toNumber(), 0);

        return {
            invoices,
            transactions,
            subscriptions,
            summary: {
                pendingAmount,
                overdueAmount,
                activeSubscriptions: subscriptions.filter((s) => s.status === 'ACTIVE').length,
            },
        };
    }
}
