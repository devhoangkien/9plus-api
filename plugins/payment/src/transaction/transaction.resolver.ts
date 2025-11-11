import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionStatus } from '../../prisma/@generated';

@Resolver(() => Transaction)
export class TransactionResolver {
  constructor(private readonly transactionService: TransactionService) {}

  @Query(() => [Transaction])
  async transactions(
    @Args('userId') userId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Transaction[]> {
    return this.transactionService.findByUserId(userId, limit);
  }

  @Query(() => Transaction)
  async transaction(@Args('id') id: string): Promise<Transaction> {
    return this.transactionService.findOne(id);
  }

  @Query(() => Transaction)
  async transactionByReference(
    @Args('reference') reference: string,
  ): Promise<Transaction> {
    return this.transactionService.findByReference(reference);
  }

  @Query(() => [Transaction])
  async transactionsByStatus(
    @Args('status') status: TransactionStatus,
    @Args('userId', { nullable: true }) userId?: string,
  ): Promise<Transaction[]> {
    return this.transactionService.findByStatus(status, userId);
  }
}
