import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaConsumerService, KafkaMessage } from '../../kafka/kafka-consumer.service';
import { IndexingService } from '../indexing.service';

@Injectable()
export class UserIndexingHandler implements OnModuleInit {
  private readonly logger = new Logger(UserIndexingHandler.name);

  constructor(
    private kafkaConsumerService: KafkaConsumerService,
    private indexingService: IndexingService,
  ) {}

  onModuleInit() {
    // Register handlers for user events
    this.kafkaConsumerService.registerHandler('user.created', this.handleUserCreated.bind(this));
    this.kafkaConsumerService.registerHandler('user.updated', this.handleUserUpdated.bind(this));
    this.kafkaConsumerService.registerHandler('user.deleted', this.handleUserDeleted.bind(this));
    
    this.logger.log('User indexing handlers registered');
  }

  private async handleUserCreated(message: KafkaMessage) {
    const requestId = message.value?.requestId || 'unknown';
    try {
      const userData = message.value;
      await this.indexingService.indexUser(userData);
      this.logger.log(`[${requestId}] ✅ User indexed: ${userData.id}`);
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Failed to handle user.created event:`, error);
      throw error;
    }
  }

  private async handleUserUpdated(message: KafkaMessage) {
    const requestId = message.value?.requestId || 'unknown';
    try {
      const userData = message.value;
      await this.indexingService.updateUser(userData.id, userData);
      this.logger.log(`[${requestId}] ✅ User updated in index: ${userData.id}`);
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Failed to handle user.updated event:`, error);
      throw error;
    }
  }

  private async handleUserDeleted(message: KafkaMessage) {
    const requestId = message.value?.requestId || 'unknown';
    try {
      const { id } = message.value;
      await this.indexingService.deleteUser(id);
      this.logger.log(`[${requestId}] ✅ User deleted from index: ${id}`);
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Failed to handle user.deleted event:`, error);
      throw error;
    }
  }
}