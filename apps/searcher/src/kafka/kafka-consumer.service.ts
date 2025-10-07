import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload, Producer, Partitioners } from 'kafkajs';

export interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: any;
  headers?: any;
  timestamp?: string;
}

export interface FailedMessage {
  originalTopic: string;
  message: KafkaMessage;
  error: string;
  attemptCount: number;
  firstAttemptAt: Date;
  lastAttemptAt: Date;
}

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private readonly logger = new Logger(KafkaConsumerService.name);
  private messageHandlers = new Map<string, (message: KafkaMessage) => Promise<void>>();
  private readonly MAX_RETRIES = 3;
  private readonly DLQ_TOPIC = 'searcher.dlq';
  private isShuttingDown = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.kafka = new Kafka({
        clientId: 'searcher-service',
        brokers: this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
        retry: {
          initialRetryTime: 300,
          retries: 8,
          maxRetryTime: 30000,
          multiplier: 2,
        },
        connectionTimeout: 30000,
        requestTimeout: 30000,
      });

      this.consumer = this.kafka.consumer({ 
        groupId: 'searcher-consumer-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxWaitTimeInMs: 5000,
        retry: {
          retries: 5,
          initialRetryTime: 300,
          maxRetryTime: 30000,
        },
      });

      // Khởi tạo producer cho DLQ
      this.producer = this.kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner,
        retry: {
          retries: 5,
          initialRetryTime: 300,
        },
      });

      await this.consumer.connect();
      await this.producer.connect();
      this.logger.log('✅ Connected to Kafka (Consumer & Producer)');

      // Subscribe to topics
      await this.subscribeToTopics();
      
      // Start consuming
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          if (this.isShuttingDown) {
            this.logger.warn('⚠️ Skipping message processing - service is shutting down');
            return;
          }
          await this.handleMessage(payload);
        },
        // Xử lý từng message một để đảm bảo order và retry logic
        partitionsConsumedConcurrently: 1,
      });

      this.logger.log('🚀 Kafka consumer started with reliable message processing');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Kafka consumer:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    this.logger.warn('🛑 Starting graceful shutdown...');

    try {
      // Đợi một chút để message hiện tại được xử lý xong
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Disconnect consumer và producer (offsets will be auto-committed)
      if (this.consumer) {
        await this.consumer.disconnect();
        this.logger.log('✅ Kafka consumer disconnected');
      }

      if (this.producer) {
        await this.producer.disconnect();
        this.logger.log('✅ Kafka producer disconnected');
      }
    } catch (error) {
      this.logger.error('❌ Error during graceful shutdown:', error);
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
      // fromBeginning: false nghĩa là chỉ đọc message mới từ khi consumer connect
      // Nhưng nhờ consumer group, offset sẽ được lưu lại
      // Khi service restart, nó sẽ tiếp tục từ offset cuối cùng đã commit
      await this.consumer.subscribe({ topic, fromBeginning: false });
      this.logger.log(`📥 Subscribed to topic: ${topic}`);
    }
  }

  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;
    const attemptCount = this.getRetryAttempt(message);
    
    try {
      const kafkaMessage: KafkaMessage = {
        topic,
        partition,
        offset: message.offset,
        key: message.key ? message.key.toString() : null,
        value: message.value ? JSON.parse(message.value.toString()) : null,
        headers: message.headers,
        timestamp: message.timestamp,
      };

      this.logger.debug(`📨 Processing message from ${topic} (offset: ${message.offset}, attempt: ${attemptCount + 1})`);

      // Find and execute handler
      const handler = this.messageHandlers.get(topic);
      if (handler) {
        await handler(kafkaMessage);
        
        // Commit offset chỉ khi xử lý thành công
        await this.consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (BigInt(message.offset) + BigInt(1)).toString(),
          },
        ]);
        
        this.logger.debug(`✅ Message processed and committed (offset: ${message.offset})`);
      } else {
        this.logger.warn(`⚠️ No handler found for topic: ${topic}`);
        // Vẫn commit để không block queue
        await this.consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (BigInt(message.offset) + BigInt(1)).toString(),
          },
        ]);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to process message from topic ${topic} (offset: ${message.offset}):`, error);
      
      // Retry logic
      if (attemptCount < this.MAX_RETRIES) {
        this.logger.warn(`🔄 Retrying message (attempt ${attemptCount + 1}/${this.MAX_RETRIES})...`);
        
        // Thêm delay trước khi retry (exponential backoff)
        const delayMs = Math.min(1000 * Math.pow(2, attemptCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Không commit offset, để consumer tự động retry message này
        // Nhưng để tránh infinite loop, ta sẽ track retry count trong headers
        throw error; // Re-throw để Kafka biết message chưa được xử lý
      } else {
        // Đã vượt quá số lần retry, gửi vào DLQ
        await this.sendToDeadLetterQueue(topic, message, error, attemptCount);
        
        // Commit offset để tiếp tục xử lý message tiếp theo
        await this.consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (BigInt(message.offset) + BigInt(1)).toString(),
          },
        ]);
      }
    }
  }

  private getRetryAttempt(message: any): number {
    const retryHeader = message.headers?.['x-retry-count'];
    if (retryHeader) {
      return parseInt(retryHeader.toString(), 10);
    }
    return 0;
  }

  private async sendToDeadLetterQueue(
    originalTopic: string,
    message: any,
    error: any,
    attemptCount: number,
  ) {
    try {
      const failedMessage: FailedMessage = {
        originalTopic,
        message: {
          topic: originalTopic,
          partition: message.partition,
          offset: message.offset,
          key: message.key ? message.key.toString() : null,
          value: message.value ? JSON.parse(message.value.toString()) : null,
          headers: message.headers,
          timestamp: message.timestamp,
        },
        error: error.message || String(error),
        attemptCount,
        firstAttemptAt: new Date(),
        lastAttemptAt: new Date(),
      };

      await this.producer.send({
        topic: this.DLQ_TOPIC,
        messages: [
          {
            key: message.key,
            value: JSON.stringify(failedMessage),
            headers: {
              'x-original-topic': originalTopic,
              'x-error': error.message || String(error),
              'x-retry-count': attemptCount.toString(),
            },
          },
        ],
      });

      this.logger.error(`💀 Message sent to DLQ (topic: ${originalTopic}, offset: ${message.offset})`);
    } catch (dlqError) {
      this.logger.error(`❌ Failed to send message to DLQ:`, dlqError);
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