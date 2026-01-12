import { Module } from '@nestjs/common';
import { CheckoutResolver } from './checkout.resolver';
import { CheckoutService } from './checkout.service';
import { BillingModule } from '../billing/billing.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule, BillingModule, SubscriptionModule],
    providers: [CheckoutResolver, CheckoutService],
    exports: [CheckoutService],
})
export class CheckoutModule { }
