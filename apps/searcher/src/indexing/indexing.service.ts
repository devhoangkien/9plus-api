import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';

@Injectable()
export class IndexingService implements OnModuleInit {
  private readonly logger = new Logger(IndexingService.name);

  constructor(
    private elasticsearchService: ElasticsearchService,
    private kafkaConsumerService: KafkaConsumerService,
  ) {}

  async onModuleInit() {
    // Initialize Elasticsearch indices
    await this.initializeIndices();
    
    // Setup Kafka handlers will be done by individual handler classes
    this.logger.log('🚀 Indexing service initialized');
  }

  private async initializeIndices() {
    try {
      // Check if Elasticsearch is ready
      if (!this.elasticsearchService.isReady()) {
        this.logger.warn('⚠️ Elasticsearch not ready. Indices will be created when Elasticsearch becomes available.');
        return;
      }

      // User index
      await this.elasticsearchService.createIndex('users', {
        properties: {
          id: { type: 'keyword' },
          email: { type: 'keyword' },
          username: { type: 'text', analyzer: 'standard' },
          firstName: { type: 'text', analyzer: 'standard' },
          lastName: { type: 'text', analyzer: 'standard' },
          fullName: { type: 'text', analyzer: 'standard' },
          isActive: { type: 'boolean' },
          roles: {
            type: 'nested',
            properties: {
              id: { type: 'keyword' },
              name: { type: 'keyword' },
            },
          },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      });
      console.log('Created users index');

      // Role index
      await this.elasticsearchService.createIndex('roles', {
        properties: {
          id: { type: 'keyword' },
          name: { type: 'keyword' },
          description: { type: 'text', analyzer: 'standard' },
          permissions: {
            type: 'nested',
            properties: {
              id: { type: 'keyword' },
              action: { type: 'keyword' },
              subject: { type: 'keyword' },
            },
          },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      });

      // Permission index
      await this.elasticsearchService.createIndex('permissions', {
        properties: {
          id: { type: 'keyword' },
          action: { type: 'keyword' },
          subject: { type: 'keyword' },
          conditions: { type: 'object' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      });

      this.logger.log('✅ Elasticsearch indices initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize indices:', error);
      // Don't throw - allow service to start
      this.logger.warn('⚠️ Service will continue without Elasticsearch indices');
    }
  }

  async indexUser(userData: any) {
    const transformedData = {
      ...userData,
      fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
    };

    return this.elasticsearchService.indexDocument('users', transformedData, userData.id);
  }

  async updateUser(id: string, userData: any) {
    const transformedData = {
      ...userData,
      fullName: userData.firstName || userData.lastName 
        ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
        : undefined,
    };

    return this.elasticsearchService.updateDocument('users', id, transformedData);
  }

  async deleteUser(id: string) {
    return this.elasticsearchService.deleteDocument('users', id);
  }

  async indexRole(roleData: any) {
    return this.elasticsearchService.indexDocument('roles', roleData, roleData.id);
  }

  async updateRole(id: string, roleData: any) {
    return this.elasticsearchService.updateDocument('roles', id, roleData);
  }

  async deleteRole(id: string) {
    return this.elasticsearchService.deleteDocument('roles', id);
  }

  async indexPermission(permissionData: any) {
    return this.elasticsearchService.indexDocument('permissions', permissionData, permissionData.id);
  }

  async updatePermission(id: string, permissionData: any) {
    return this.elasticsearchService.updateDocument('permissions', id, permissionData);
  }

  async deletePermission(id: string) {
    return this.elasticsearchService.deleteDocument('permissions', id);
  }
}