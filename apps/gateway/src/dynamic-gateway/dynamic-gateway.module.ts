import { Module } from '@nestjs/common';
import { DynamicGatewayService } from './dynamic-gateway.service';
import { GatewayController } from './gateway.controller';

@Module({
  controllers: [GatewayController],
  providers: [DynamicGatewayService],
  exports: [DynamicGatewayService],
})
export class DynamicGatewayModule {}