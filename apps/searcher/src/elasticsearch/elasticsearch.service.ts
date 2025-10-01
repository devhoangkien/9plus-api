import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private client: Client;
  private readonly logger = new Logger(ElasticsearchService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = new Client({
        node: this.configService.get('ELASTICSEARCH_URL', 'http://localhost:9200'),
        auth: {
          username: this.configService.get('ELASTICSEARCH_USERNAME', 'elastic'),
          password: this.configService.get('ELASTICSEARCH_PASSWORD', 'changeme'),
        },
      });

      // Test connection
      await this.client.ping();
      this.logger.log('✅ Connected to Elasticsearch');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Elasticsearch:', error.message);
      throw error;
    }
  }

  getClient(): Client {
    return this.client;
  }

  async indexDocument(index: string, document: any, id?: string) {
    try {
      const result = await this.client.index({
        index,
        body: document,
        id,
      });
      this.logger.debug(`Document indexed: ${result.body._id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to index document:`, error);
      throw error;
    }
  }

  async updateDocument(index: string, id: string, document: any) {
    try {
      const result = await this.client.update({
        index,
        id,
        body: {
          doc: document,
        },
      });
      this.logger.debug(`Document updated: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update document:`, error);
      throw error;
    }
  }

  async deleteDocument(index: string, id: string) {
    try {
      const result = await this.client.delete({
        index,
        id,
      });
      this.logger.debug(`Document deleted: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete document:`, error);
      throw error;
    }
  }

  async createIndex(index: string, mappings?: any) {
    try {
      const exists = await this.client.indices.exists({ index });
      if (!exists.body) {
        await this.client.indices.create({
          index,
          body: {
            mappings,
          },
        });
        this.logger.log(`Index created: ${index}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create index:`, error);
      throw error;
    }
  }

  async search(index: string, query: any) {
    try {
      const result = await this.client.search({
        index,
        body: query,
      });
      return result.body;
    } catch (error) {
      this.logger.error(`Search failed:`, error);
      throw error;
    }
  }
}