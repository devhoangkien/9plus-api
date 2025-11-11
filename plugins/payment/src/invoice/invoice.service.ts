import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, Prisma } from '../../prisma/@generated/client';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string, limit = 10) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: {
        subscription: true,
        paymentMethod: true,
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        subscription: true,
        paymentMethod: true,
        lineItems: true,
        transactions: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async findByInvoiceNumber(invoiceNumber: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        subscription: true,
        paymentMethod: true,
        lineItems: true,
        transactions: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(
        `Invoice with number ${invoiceNumber} not found`,
      );
    }

    return invoice;
  }

  async findOverdue(userId?: string) {
    const where: Prisma.InvoiceWhereInput = {
      status: InvoiceStatus.OVERDUE,
    };

    if (userId) {
      where.userId = userId;
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        subscription: true,
        paymentMethod: true,
        lineItems: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
