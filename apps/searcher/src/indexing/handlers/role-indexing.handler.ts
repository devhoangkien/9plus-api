import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaConsumerService, KafkaMessage } from '../../kafka/kafka-consumer.service';
import { IndexingService } from '../indexing.service';

@Injectable()
export class RoleIndexingHandler implements OnModuleInit {
  private readonly logger = new Logger(RoleIndexingHandler.name);

  constructor(
    private kafkaConsumerService: KafkaConsumerService,
    private indexingService: IndexingService,
  ) {}

  onModuleInit() {
    // Register handlers for role events
    this.kafkaConsumerService.registerHandler('role.created', this.handleRoleCreated.bind(this));
    this.kafkaConsumerService.registerHandler('role.updated', this.handleRoleUpdated.bind(this));
    this.kafkaConsumerService.registerHandler('role.deleted', this.handleRoleDeleted.bind(this));
    
    this.logger.log('Role indexing handlers registered');
  }

  private async handleRoleCreated(message: KafkaMessage) {
    try {
      const roleData = message.value;
      await this.indexingService.indexRole(roleData);
      this.logger.log(`Role indexed: ${roleData.id}`);
    } catch (error) {
      this.logger.error('Failed to handle role.created event:', error);
      throw error;
    }
  }

  private async handleRoleUpdated(message: KafkaMessage) {
    try {
      const roleData = message.value;
      await this.indexingService.updateRole(roleData.id, roleData);
      this.logger.log(`Role updated in index: ${roleData.id}`);
    } catch (error) {
      this.logger.error('Failed to handle role.updated event:', error);
      throw error;
    }
  }

  private async handleRoleDeleted(message: KafkaMessage) {
    try {
      const { id } = message.value;
      await this.indexingService.deleteRole(id);
      this.logger.log(`Role deleted from index: ${id}`);
    } catch (error) {
      this.logger.error('Failed to handle role.deleted event:', error);
      throw error;
    }
  }
}