import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanType } from '../../prisma/@generated/client';

@Injectable()
export class SubscriptionPlanService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subscriptionPlan.findMany({
      where: {
        isVisible: true,
        status: 'ACTIVE',
      },
      include: {
        planFeatures: true,
      },
      orderBy: [{ isRecommended: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        planFeatures: true,
      },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return plan;
  }

  async findByType(type: PlanType) {
    return this.prisma.subscriptionPlan.findMany({
      where: {
        type,
        isVisible: true,
        status: 'ACTIVE',
      },
      include: {
        planFeatures: true,
      },
      orderBy: [{ isRecommended: 'desc' }, { sortOrder: 'asc' }],
    });
  }
}
