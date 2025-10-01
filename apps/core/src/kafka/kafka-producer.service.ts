import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

export interface EventPayload {
  id: string;
  eventType: 'created' | 'updated' | 'deleted';
  entityType: 'user' | 'role' | 'permission';
  timestamp: string;
  data: any;
  metadata?: {
    userId?: string;
    correlationId?: string;
    source?: string;
    [key: string]: any;
  };
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.kafka = new Kafka({
        clientId: 'core-service',
        brokers: this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
        retry: {
          retries: 5,
        },
      });

      this.producer = this.kafka.producer({
        retry: {
          retries: 3,
        },
      });

      await this.producer.connect();
      this.logger.log('✅ Kafka producer connected');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Kafka producer:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.producer) {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    }
  }

  async publishEvent(payload: EventPayload): Promise<void> {
    try {
      const topic = `${payload.entityType}.${payload.eventType}`;
      
      const message = {
        key: payload.id,
        value: JSON.stringify({
          ...payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        }),
        headers: {
          eventType: payload.eventType,
          entityType: payload.entityType,
          correlationId: payload.metadata?.correlationId || payload.id,
          source: payload.metadata?.source || 'core-service',
        },
      };

      await this.producer.send({
        topic,
        messages: [message],
      });

      this.logger.debug(`Event published to topic ${topic}: ${payload.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish event:`, error);
      throw error;
    }
  }

  async publishUserEvent(eventType: 'created' | 'updated' | 'deleted', userData: any, metadata?: any): Promise<void> {
    const payload: EventPayload = {
      id: userData.id,
      eventType,
      entityType: 'user',
      timestamp: new Date().toISOString(),
      data: userData,
      metadata,
    };

    await this.publishEvent(payload);
  }

  async publishRoleEvent(eventType: 'created' | 'updated' | 'deleted', roleData: any, metadata?: any): Promise<void> {
    const payload: EventPayload = {
      id: roleData.id,
      eventType,
      entityType: 'role',
      timestamp: new Date().toISOString(),
      data: roleData,
      metadata,
    };

    await this.publishEvent(payload);
  }

  async publishPermissionEvent(eventType: 'created' | 'updated' | 'deleted', permissionData: any, metadata?: any): Promise<void> {
    const payload: EventPayload = {
      id: permissionData.id,
      eventType,
      entityType: 'permission',
      timestamp: new Date().toISOString(),
      data: permissionData,
      metadata,
    };

    await this.publishEvent(payload);
  }

  // Method to publish batch events
  async publishBatchEvents(payloads: EventPayload[]): Promise<void> {
    try {
      const messagesByTopic = new Map<string, any[]>();

      // Group messages by topic
      for (const payload of payloads) {
        const topic = `${payload.entityType}.${payload.eventType}`;
        
        if (!messagesByTopic.has(topic)) {
          messagesByTopic.set(topic, []);
        }

        const message = {
          key: payload.id,
          value: JSON.stringify({
            ...payload,
            timestamp: payload.timestamp || new Date().toISOString(),
          }),
          headers: {
            eventType: payload.eventType,
            entityType: payload.entityType,
            correlationId: payload.metadata?.correlationId || payload.id,
            source: payload.metadata?.source || 'core-service',
          },
        };

        messagesByTopic.get(topic)!.push(message);
      }

      // Send messages for each topic
      const sendPromises = Array.from(messagesByTopic.entries()).map(([topic, messages]) =>
        this.producer.send({
          topic,
          messages,
        })
      );

      await Promise.all(sendPromises);
      this.logger.debug(`Batch events published: ${payloads.length} events`);
    } catch (error) {
      this.logger.error('Failed to publish batch events:', error);
      throw error;
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      // Try to get metadata to check connection
      await this.kafka.admin().fetchTopicMetadata();
      return true;
    } catch (error) {
      this.logger.warn('Kafka health check failed:', error.message);
      return false;
    }
  }

  // Method to create topics if they don't exist
  async ensureTopicsExist(): Promise<void> {
    const admin = this.kafka.admin();
    
    try {
      await admin.connect();
      
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

      const existingTopics = await admin.listTopics();
      const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic));

      if (topicsToCreate.length > 0) {
        await admin.createTopics({
          topics: topicsToCreate.map(topic => ({
            topic,
            numPartitions: 3,
            replicationFactor: 1,
          })),
        });
        this.logger.log(`Created topics: ${topicsToCreate.join(', ')}`);
      }
    } catch (error) {
      this.logger.error('Failed to ensure topics exist:', error);
      throw error;
    } finally {
      await admin.disconnect();
    }
  }
}