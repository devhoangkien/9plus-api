import { Injectable, Logger } from '@nestjs/common';
import { KafkaConsumerService } from './kafka-consumer.service';

export interface HealthStatus {
  kafka: {
    connected: boolean;
    lastCheck: Date;
    messageCount: number;
    errorCount: number;
  };
}

@Injectable()
export class KafkaHealthService {
  private readonly logger = new Logger(KafkaHealthService.name);
  private messageCount = 0;
  private errorCount = 0;
  private isConnected = false;
  private lastCheck = new Date();

  constructor(private kafkaConsumerService: KafkaConsumerService) {}

  incrementMessageCount() {
    this.messageCount++;
  }

  incrementErrorCount() {
    this.errorCount++;
  }

  setConnected(status: boolean) {
    this.isConnected = status;
    this.lastCheck = new Date();
  }

  getHealthStatus(): HealthStatus {
    return {
      kafka: {
        connected: this.isConnected,
        lastCheck: this.lastCheck,
        messageCount: this.messageCount,
        errorCount: this.errorCount,
      },
    };
  }

  resetCounters() {
    this.messageCount = 0;
    this.errorCount = 0;
  }
}
