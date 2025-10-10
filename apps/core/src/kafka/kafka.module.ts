import { Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer.service';
import { RequestContextService } from '@anineplus/common';

@Module({
  providers: [
    KafkaProducerService,
    RequestContextService,
  ],
  exports: [
    KafkaProducerService,
    RequestContextService,
  ],
})
export class KafkaModule {}