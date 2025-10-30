import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentMethodService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    return paymentMethod;
  }

  async setDefault(id: string, userId: string) {
    // First, unset all other default payment methods for this user
    await this.prisma.paymentMethod.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Then set the specified payment method as default
    return this.prisma.paymentMethod.update({
      where: { id },
      data: {
        isDefault: true,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.paymentMethod.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
    return true;
  }
}
