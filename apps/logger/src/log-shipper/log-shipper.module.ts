import { Module } from '@nestjs/common';
import { LogShipperService } from './log-shipper.service';

@Module({
  providers: [LogShipperService],
  exports: [LogShipperService],
})
export class LogShipperModule {}