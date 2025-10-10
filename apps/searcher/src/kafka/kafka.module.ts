import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka-consumer.service';
import { KafkaHealthService } from './kafka-health.service';
import { KafkaOffsetService } from './kafka-offset.service';
import { KafkaMonitoringController } from './kafka-monitoring.controller';
import { KafkaSyncService } from './kafka-sync.service';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [ElasticsearchModule],
  controllers: [KafkaMonitoringController],
  providers: [
    KafkaConsumerService,
    KafkaHealthService,
    KafkaOffsetService,
    KafkaSyncService,
  ],
  exports: [
    KafkaConsumerService,
    KafkaHealthService,
    KafkaOffsetService,
    KafkaSyncService,
  ],
})
export class KafkaModule {}