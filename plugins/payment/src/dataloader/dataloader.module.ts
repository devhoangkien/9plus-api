import { Module } from '@nestjs/common';
import { PaymentDataLoaderService } from './payment.dataloader.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PaymentDataLoaderService],
  exports: [PaymentDataLoaderService],
})
export class DataLoaderModule {}
