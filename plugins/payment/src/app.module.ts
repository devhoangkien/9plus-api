import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {
  YogaFederationDriver,
  YogaFederationDriverConfig,
} from '@graphql-yoga/nestjs-federation';
import { PrismaModule } from './prisma/prisma.module';
import { DataLoaderModule } from './dataloader/dataloader.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { SubscriptionPlanModule } from './subscription-plan/subscription-plan.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { InvoiceModule } from './invoice/invoice.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      autoSchemaFile: {
        federation: 2,
        path: './schema.gql',
      },
    }),
    PrismaModule,
    DataLoaderModule,
    SubscriptionModule,
    SubscriptionPlanModule,
    PaymentMethodModule,
    InvoiceModule,
    TransactionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
