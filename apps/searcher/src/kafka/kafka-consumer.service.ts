import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

export interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: any;
  headers?: any;
}

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private readonly logger = new Logger(KafkaConsumerService.name);
  private messageHandlers = new Map<string, (message: KafkaMessage) => Promise<void>>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.kafka = new Kafka({
        clientId: 'searcher-service',
        brokers: this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
      });

      this.consumer = this.kafka.consumer({ 
        groupId: 'searcher-consumer-group',
        retry: {
          retries: 5,
        }
      });

      await this.consumer.connect();
      this.logger.log('✅ Connected to Kafka');

      // Subscribe to topics
      await this.subscribeToTopics();
      
      // Start consuming
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.log('🚀 Kafka consumer started');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Kafka consumer:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected');
    }
  }

  private async subscribeToTopics() {
    const topics = [
      'user.created',
      'user.updated',
      'user.deleted',
      'role.created',
      'role.updated',
      'role.deleted',
      'permission.created',
      'permission.updated',
      'permission.deleted',
    ];

    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      this.logger.log(`Subscribed to topic: ${topic}`);
    }
  }

  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;
    
    try {
      const kafkaMessage: KafkaMessage = {
        topic,
        partition,
        offset: message.offset,
        key: message.key ? message.key.toString() : null,
        value: message.value ? JSON.parse(message.value.toString()) : null,
        headers: message.headers,
      };

      this.logger.debug(`Received message from topic ${topic}:`, kafkaMessage.value);

      // Find and execute handler
      const handler = this.messageHandlers.get(topic);
      if (handler) {
        await handler(kafkaMessage);
      } else {
        this.logger.warn(`No handler found for topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process message from topic ${topic}:`, error);
      // In production, you might want to send to a dead letter queue
    }
  }

  registerHandler(topic: string, handler: (message: KafkaMessage) => Promise<void>) {
    this.messageHandlers.set(topic, handler);
    this.logger.log(`Handler registered for topic: ${topic}`);
  }

  // Method to manually produce messages for testing
  async produceMessage(topic: string, message: any, key?: string) {
    const producer = this.kafka.producer();
    await producer.connect();
    
    try {
      await producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(message),
          },
        ],
      });
      this.logger.debug(`Message sent to topic ${topic}`);
    } finally {
      await producer.disconnect();
    }
  }
}