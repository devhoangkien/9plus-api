import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka-consumer.service';

@Module({
  providers: [KafkaConsumerService],
  exports: [KafkaConsumerService],
})
export class KafkaModule {}