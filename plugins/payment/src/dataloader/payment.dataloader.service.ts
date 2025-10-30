import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import {
  Subscription,
  SubscriptionPlan,
  PaymentMethod,
  Invoice,
  Transaction,
} from '../../prisma/@generated/client';

/**
 * PaymentDataLoaderService
 *
 * Provides DataLoader instances for batching payment-related queries.
 */
@Injectable()
export class PaymentDataLoaderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Batch load subscriptions by IDs
   */
  private async batchLoadSubscriptionsByIds(
    ids: readonly string[],
  ): Promise<(Subscription | null)[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        id: { in: [...ids] },
      },
      include: {
        plan: true,
        paymentMethod: true,
      },
    });

    const subscriptionMap = new Map(
      subscriptions.map((subscription) => [subscription.id, subscription]),
    );
    return ids.map((id) => subscriptionMap.get(id) || null);
  }

  /**
   * Batch load subscriptions by user IDs
   */
  private async batchLoadSubscriptionsByUserIds(
    userIds: readonly string[],
  ): Promise<Subscription[][]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId: { in: [...userIds] },
      },
      include: {
        plan: true,
        paymentMethod: true,
      },
    });

    const subscriptionMap = new Map<string, Subscription[]>();
    subscriptions.forEach((subscription) => {
      if (!subscriptionMap.has(subscription.userId)) {
        subscriptionMap.set(subscription.userId, []);
      }
      subscriptionMap.get(subscription.userId)!.push(subscription);
    });

    return userIds.map((userId) => subscriptionMap.get(userId) || []);
  }

  /**
   * Batch load subscription plans by IDs
   */
  private async batchLoadSubscriptionPlansByIds(
    ids: readonly string[],
  ): Promise<(SubscriptionPlan | null)[]> {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: {
        id: { in: [...ids] },
      },
      include: {
        planFeatures: true,
      },
    });

    const planMap = new Map(plans.map((plan) => [plan.id, plan]));
    return ids.map((id) => planMap.get(id) || null);
  }

  /**
   * Batch load payment methods by IDs
   */
  private async batchLoadPaymentMethodsByIds(
    ids: readonly string[],
  ): Promise<(PaymentMethod | null)[]> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        id: { in: [...ids] },
      },
    });

    const paymentMethodMap = new Map(
      paymentMethods.map((method) => [method.id, method]),
    );
    return ids.map((id) => paymentMethodMap.get(id) || null);
  }

  /**
   * Batch load payment methods by user IDs
   */
  private async batchLoadPaymentMethodsByUserIds(
    userIds: readonly string[],
  ): Promise<PaymentMethod[][]> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        userId: { in: [...userIds] },
      },
    });

    const paymentMethodMap = new Map<string, PaymentMethod[]>();
    paymentMethods.forEach((method) => {
      if (!paymentMethodMap.has(method.userId)) {
        paymentMethodMap.set(method.userId, []);
      }
      paymentMethodMap.get(method.userId)!.push(method);
    });

    return userIds.map((userId) => paymentMethodMap.get(userId) || []);
  }

  /**
   * Batch load invoices by IDs
   */
  private async batchLoadInvoicesByIds(
    ids: readonly string[],
  ): Promise<(Invoice | null)[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        id: { in: [...ids] },
      },
      include: {
        subscription: true,
        paymentMethod: true,
        lineItems: true,
      },
    });

    const invoiceMap = new Map(
      invoices.map((invoice) => [invoice.id, invoice]),
    );
    return ids.map((id) => invoiceMap.get(id) || null);
  }

  /**
   * Batch load invoices by user IDs
   */
  private async batchLoadInvoicesByUserIds(
    userIds: readonly string[],
  ): Promise<Invoice[][]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        userId: { in: [...userIds] },
      },
      include: {
        subscription: true,
        paymentMethod: true,
        lineItems: true,
      },
    });

    const invoiceMap = new Map<string, Invoice[]>();
    invoices.forEach((invoice) => {
      if (!invoiceMap.has(invoice.userId)) {
        invoiceMap.set(invoice.userId, []);
      }
      invoiceMap.get(invoice.userId)!.push(invoice);
    });

    return userIds.map((userId) => invoiceMap.get(userId) || []);
  }

  /**
   * Batch load transactions by IDs
   */
  private async batchLoadTransactionsByIds(
    ids: readonly string[],
  ): Promise<(Transaction | null)[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        id: { in: [...ids] },
      },
      include: {
        invoice: true,
        paymentMethod: true,
      },
    });

    const transactionMap = new Map(
      transactions.map((transaction) => [transaction.id, transaction]),
    );
    return ids.map((id) => transactionMap.get(id) || null);
  }

  /**
   * Batch load transactions by user IDs
   */
  private async batchLoadTransactionsByUserIds(
    userIds: readonly string[],
  ): Promise<Transaction[][]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId: { in: [...userIds] },
      },
      include: {
        invoice: true,
        paymentMethod: true,
      },
    });

    const transactionMap = new Map<string, Transaction[]>();
    transactions.forEach((transaction) => {
      if (!transactionMap.has(transaction.userId)) {
        transactionMap.set(transaction.userId, []);
      }
      transactionMap.get(transaction.userId)!.push(transaction);
    });

    return userIds.map((userId) => transactionMap.get(userId) || []);
  }

  /**
   * Create a DataLoader for loading subscriptions by ID
   */
  createSubscriptionByIdLoader(): DataLoader<string, Subscription | null> {
    return new DataLoader<string, Subscription | null>(
      (ids) => this.batchLoadSubscriptionsByIds(ids),
      { cache: true },
    );
  }

  /**
   * Create a DataLoader for loading subscriptions by user ID
   */
  createSubscriptionsByUserIdLoader(): DataLoader<string, Subscription[]> {
    return new DataLoader<string, Subscription[]>(
      (userIds) => this.batchLoadSubscriptionsByUserIds(userIds),
      { cache: true },
    );
  }

  /**
   * Create a DataLoader for loading subscription plans by ID
   */
  createSubscriptionPlanByIdLoader(): DataLoader<
    string,
    SubscriptionPlan | null
  > {
    return new DataLoader<string, SubscriptionPlan | null>(
      (ids) => this.batchLoadSubscriptionPlansByIds(ids),
      { cache: true },
    );
  }

  /**
   * Create a DataLoader for loading payment methods by ID
   */
  createPaymentMethodByIdLoader(): DataLoader<string, PaymentMethod | null> {
    return new DataLoader<string, PaymentMethod | null>(
      (ids) => this.batchLoadPaymentMethodsByIds(ids),
      { cache: true },
    );
  }

  /**
   * Create a DataLoader for loading payment methods by user ID
   */
  createPaymentMethodsByUserIdLoader(): DataLoader<string, PaymentMethod[]> {
    return new DataLoader<string, PaymentMethod[]>(
      (userIds) => this.batchLoadPaymentMethodsByUserIds(userIds),
      { cache: true },
    );
  }

  /**
   * Create a DataLoader for loading invoices by ID
   */
  createInvoiceByIdLoader(): DataLoader<string, Invoice | null> {
    return new DataLoader<string, Invoice | null>(
      (ids) => this.batchLoadInvoicesByIds(ids),
      { cache: true },
    );
  }

  /**
   * Create a DataLoader for loading invoices by user ID
   */
  createInvoicesByUserIdLoader(): DataLoader<string, Invoice[]> {
    return new DataLoader<string, Invoice[]>(
      (userIds) => this.batchLoadInvoicesByUserIds(userIds),
      { cache: true },
    );
  }

  /**
   * Create a DataLoader for loading transactions by ID
   */
  createTransactionByIdLoader(): DataLoader<string, Transaction | null> {
    return new DataLoader<string, Transaction | null>(
      (ids) => this.batchLoadTransactionsByIds(ids),
      { cache: true },
    );
  }

  /**
   * Create a DataLoader for loading transactions by user ID
   */
  createTransactionsByUserIdLoader(): DataLoader<string, Transaction[]> {
    return new DataLoader<string, Transaction[]>(
      (userIds) => this.batchLoadTransactionsByUserIds(userIds),
      { cache: true },
    );
  }
}
