import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import {
  YogaFederationDriver,
  YogaFederationDriverConfig,
} from '@graphql-yoga/nestjs-federation';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { DataLoaderModule } from './dataloader/dataloader.module';

// Payment provider infrastructure
import { ProvidersModule } from './providers/providers.module';

// Billing and checkout
import { BillingModule } from './billing/billing.module';
import { CheckoutModule } from './checkout/checkout.module';

// Feature modules
import { PaymentSagaModule } from './saga/saga.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { SubscriptionPlanModule } from './subscription-plan/subscription-plan.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { InvoiceModule } from './invoice/invoice.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // GraphQL Federation
    GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      autoSchemaFile: {
        federation: 2,
        path: './schema.gql',
      },
    }),

    // Core infrastructure
    PrismaModule,
    DataLoaderModule,
    ProvidersModule, // Payment providers (Stripe, PayPal, Sepay)

    // Billing and checkout
    BillingModule,
    CheckoutModule,

    // Feature modules
    PaymentSagaModule,
    SubscriptionModule,
    SubscriptionPlanModule,
    PaymentMethodModule,
    InvoiceModule,
    TransactionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
