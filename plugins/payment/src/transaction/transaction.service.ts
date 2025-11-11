import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, Prisma } from '../../prisma/@generated/client';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string, limit = 20) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        invoice: true,
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        invoice: true,
        paymentMethod: true,
        refunds: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async findByReference(reference: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
      include: {
        invoice: true,
        paymentMethod: true,
        refunds: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with reference ${reference} not found`,
      );
    }

    return transaction;
  }

  async findByStatus(status: TransactionStatus, userId?: string) {
    const where: Prisma.TransactionWhereInput = { status };
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        invoice: true,
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
