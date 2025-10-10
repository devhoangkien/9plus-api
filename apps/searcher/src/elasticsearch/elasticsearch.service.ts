import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private client: Client;
  private readonly logger = new Logger(ElasticsearchService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const esUrl = this.configService.get('ELASTICSEARCH_URL', 'http://localhost:9200');
    const esUsername = this.configService.get('ELASTICSEARCH_USERNAME');
    const esPassword = this.configService.get('ELASTICSEARCH_PASSWORD');

    // Only add auth if username and password are provided
    const clientConfig: any = {
      node: esUrl,
    };

    if (esUsername && esPassword) {
      clientConfig.auth = {
        username: esUsername,
        password: esPassword,
      };
      this.logger.log('Elasticsearch: Using authentication');
    } else {
      this.logger.log('Elasticsearch: No authentication (security disabled)');
    }

    this.client = new Client(clientConfig);

    // Try to connect once, don't block startup
    this.tryConnect();
  }

  private async tryConnect() {
    try {
      const response = await this.client.info();
      console.log('✅ Connected to Elasticsearch:', response);
      await this.client.ping();
      this.isConnected = true;
      this.logger.log('✅ Connected to Elasticsearch');
    } catch (error) {
      this.isConnected = false;
      const errorMsg = error?.message || String(error);
      this.logger.error(`⚠️ Elasticsearch connection failed: ${errorMsg}`);
      this.logger.error('⚠️ Service will continue but indexing will not work.');
      this.logger.error('💡 To enable indexing: docker-compose up -d elasticsearch');
    }
  }

  getClient(): Client {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async indexDocument(index: string, document: any, id?: string) {
    if (!this.isConnected) {
      this.logger.warn('⚠️ Elasticsearch not connected. Skipping index operation.');
      return null;
    }
    
    try {
      const result = await this.client.index({
        index,
        body: document,
        id,
      });
      this.logger.debug(`Document indexed: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to index document:`, error);
      throw error;
    }
  }

  async updateDocument(index: string, id: string, document: any) {
    if (!this.isConnected) {
      this.logger.warn('⚠️ Elasticsearch not connected. Skipping update operation.');
      return null;
    }
    
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
    if (!this.isConnected) {
      this.logger.warn('⚠️ Elasticsearch not connected. Skipping delete operation.');
      return null;
    }
    
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
    if (!this.isConnected) {
      this.logger.warn(`⚠️ Elasticsearch not connected. Skipping index creation for ${index}.`);
      return;
    }
    
    try {
      const exists = await this.client.indices.exists({ index });
      if (!exists) {
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
      return result;
    } catch (error) {
      this.logger.error(`Search failed:`, error);
      throw error;
    }
  }

  async countDocuments(index: string): Promise<number> {
    try {
      const result = await this.client.count({ index });
      return result.count;
    } catch (error) {
      // Index might not exist yet
      this.logger.warn(`Failed to count documents in ${index}:`, error.message);
      return 0;
    }
  }

  async bulkIndex(index: string, documents: any[]) {
    try {
      const body = documents.flatMap(doc => [
        { index: { _index: index, _id: doc.id } },
        doc,
      ]);

      const result = await this.client.bulk({ body, refresh: true });
      
      if (result.errors) {
        const erroredDocuments = [];
        result.items.forEach((action, i) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              status: action[operation].status,
              error: action[operation].error,
              document: documents[i],
            });
          }
        });
        this.logger.error(`Bulk indexing had errors:`, erroredDocuments);
      }

      this.logger.log(`Bulk indexed ${documents.length} documents to ${index}`);
      return result;
    } catch (error) {
      this.logger.error(`Bulk index failed:`, error);
      throw error;
    }
  }
}