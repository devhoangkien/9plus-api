import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaConsumerService, KafkaMessage } from '../../kafka/kafka-consumer.service';
import { IndexingService } from '../indexing.service';

@Injectable()
export class PermissionIndexingHandler implements OnModuleInit {
  private readonly logger = new Logger(PermissionIndexingHandler.name);

  constructor(
    private kafkaConsumerService: KafkaConsumerService,
    private indexingService: IndexingService,
  ) {}

  onModuleInit() {
    // Register handlers for permission events
    this.kafkaConsumerService.registerHandler('permission.created', this.handlePermissionCreated.bind(this));
    this.kafkaConsumerService.registerHandler('permission.updated', this.handlePermissionUpdated.bind(this));
    this.kafkaConsumerService.registerHandler('permission.deleted', this.handlePermissionDeleted.bind(this));
    
    this.logger.log('Permission indexing handlers registered');
  }

  private async handlePermissionCreated(message: KafkaMessage) {
    try {
      const permissionData = message.value;
      await this.indexingService.indexPermission(permissionData);
      this.logger.log(`Permission indexed: ${permissionData.id}`);
    } catch (error) {
      this.logger.error('Failed to handle permission.created event:', error);
      throw error;
    }
  }

  private async handlePermissionUpdated(message: KafkaMessage) {
    try {
      const permissionData = message.value;
      await this.indexingService.updatePermission(permissionData.id, permissionData);
      this.logger.log(`Permission updated in index: ${permissionData.id}`);
    } catch (error) {
      this.logger.error('Failed to handle permission.updated event:', error);
      throw error;
    }
  }

  private async handlePermissionDeleted(message: KafkaMessage) {
    try {
      const { id } = message.value;
      await this.indexingService.deletePermission(id);
      this.logger.log(`Permission deleted from index: ${id}`);
    } catch (error) {
      this.logger.error('Failed to handle permission.deleted event:', error);
      throw error;
    }
  }
}