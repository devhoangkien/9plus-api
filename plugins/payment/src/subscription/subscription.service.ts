import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionInput } from './inputs/create-subscription.input';
import { UpdateSubscriptionInput } from './inputs/update-subscription.input';
import { GetSubscriptionsArgs } from './dto/subscription-args.dto';
import {
  Subscription,
  SubscriptionStatus,
  Prisma,
} from '../../prisma/@generated/client';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: input.planId },
    });

    if (!plan) {
      throw new NotFoundException(
        `Subscription plan with ID ${input.planId} not found`,
      );
    }

    const now = new Date();
    const periodEnd = new Date(now);

    // ONE_TIME plans get a long period (10 years) as they don't auto-renew
    const ONE_TIME_PERIOD_YEARS = 10;
    const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

    switch (plan.billingCycle) {
      case 'MONTHLY':
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
      case 'QUARTERLY':
        periodEnd.setMonth(periodEnd.getMonth() + 3);
        break;
      case 'YEARLY':
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
      case 'ONE_TIME':
        periodEnd.setFullYear(periodEnd.getFullYear() + ONE_TIME_PERIOD_YEARS);
        break;
    }

    return this.prisma.subscription.create({
      data: {
        userId: input.userId,
        planId: input.planId,
        status: input.isTrialing
          ? SubscriptionStatus.TRIALING
          : SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        isTrialing: input.isTrialing || false,
        trialStart: input.isTrialing ? now : null,
        trialEnd: input.isTrialing
          ? new Date(now.getTime() + plan.trialDays * MILLISECONDS_PER_DAY)
          : null,
        nextBillingDate: periodEnd,
        paymentMethodId: input.paymentMethodId,
      },
      include: {
        plan: true,
        paymentMethod: true,
      },
    });
  }

  async findAll(args: GetSubscriptionsArgs) {
    const { page = 1, limit = 10, userId, status } = args;
    const skip = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = {};
    if (userId) where.userId = userId;
    if (status) where.status = status as SubscriptionStatus;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          plan: true,
          paymentMethod: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions,
      total,
      hasMore: skip + subscriptions.length < total,
    };
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        paymentMethod: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        usageRecords: {
          orderBy: { recordDate: 'desc' },
          take: 30,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async findByUserId(userId: string): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(input: UpdateSubscriptionInput): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: input.id },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${input.id} not found`);
    }

    const updateData: Prisma.SubscriptionUpdateInput = {};

    if (input.status) {
      updateData.status = input.status as SubscriptionStatus;
    }
    if (input.cancelAtPeriodEnd !== undefined) {
      updateData.cancelAtPeriodEnd = input.cancelAtPeriodEnd;
      if (input.cancelAtPeriodEnd) {
        updateData.canceledAt = new Date();
        updateData.cancelReason =
          input.cancelReason || 'User requested cancellation';
      }
    }
    if (input.paymentMethodId) {
      updateData.paymentMethod = {
        connect: { id: input.paymentMethodId },
      };
    }

    return this.prisma.subscription.update({
      where: { id: input.id },
      data: updateData,
      include: {
        plan: true,
        paymentMethod: true,
      },
    });
  }

  async cancel(id: string, reason?: string): Promise<Subscription> {
    return this.update({
      id,
      cancelAtPeriodEnd: true,
      cancelReason: reason,
    });
  }

  async reactivate(id: string): Promise<Subscription> {
    const subscription = await this.findOne(id);

    // Allow reactivation if canceled or marked for cancellation
    if (
      subscription.status !== SubscriptionStatus.CANCELED &&
      !subscription.cancelAtPeriodEnd
    ) {
      throw new BadRequestException(
        'Only canceled or canceling subscriptions can be reactivated',
      );
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        cancelReason: null,
      },
      include: {
        plan: true,
        paymentMethod: true,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.subscription.delete({
      where: { id },
    });
    return true;
  }
}
