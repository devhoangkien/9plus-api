import { Module } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { PaymentMethodResolver } from './payment-method.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PaymentMethodService, PaymentMethodResolver],
  exports: [PaymentMethodService],
})
export class PaymentMethodModule {}
