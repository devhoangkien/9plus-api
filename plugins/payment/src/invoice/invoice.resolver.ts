import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { InvoiceService } from './invoice.service';
import { Invoice } from '../../prisma/@generated';

@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Query(() => [Invoice])
  async invoices(
    @Args('userId') userId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Invoice[]> {
    return this.invoiceService.findByUserId(userId, limit);
  }

  @Query(() => Invoice)
  async invoice(@Args('id') id: string): Promise<Invoice> {
    return this.invoiceService.findOne(id);
  }

  @Query(() => Invoice)
  async invoiceByNumber(
    @Args('invoiceNumber') invoiceNumber: string,
  ): Promise<Invoice> {
    return this.invoiceService.findByInvoiceNumber(invoiceNumber);
  }

  @Query(() => [Invoice])
  async overdueInvoices(
    @Args('userId', { nullable: true }) userId?: string,
  ): Promise<Invoice[]> {
    return this.invoiceService.findOverdue(userId);
  }
}
