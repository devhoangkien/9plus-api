import { Injectable, Logger } from '@nestjs/common';
import { KafkaOffsetService } from './kafka-offset.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { ConfigService } from '@nestjs/config';

export interface SyncStatus {
  topic: string;
  kafkaMessages: number;
  elasticsearchDocs: number;
  missingDocs: number;
  synced: boolean;
}

@Injectable()
export class KafkaSyncService {
  private readonly logger = new Logger(KafkaSyncService.name);
  private readonly CONSUMER_GROUP = 'searcher-consumer-group';

  constructor(
    private readonly kafkaOffsetService: KafkaOffsetService,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Kiểm tra xem có dữ liệu bị thiếu không
   */
  async checkSyncStatus(): Promise<SyncStatus[]> {
    const topics = ['user.created', 'role.created', 'permission.created'];
    const statuses: SyncStatus[] = [];

    for (const topic of topics) {
      try {
        // Lấy số lượng message trong Kafka
        const offsets = await this.kafkaOffsetService.getConsumerLag(this.CONSUMER_GROUP);
        const topicOffset = offsets.find(o => o.topic === topic);
        const kafkaMessages = topicOffset ? parseInt(topicOffset.high, 10) : 0;

        // Lấy số lượng document trong Elasticsearch
        const indexName = this.getIndexNameFromTopic(topic);
        const esCount = await this.elasticsearchService.countDocuments(indexName);

        const missingDocs = Math.max(0, kafkaMessages - esCount);

        statuses.push({
          topic,
          kafkaMessages,
          elasticsearchDocs: esCount,
          missingDocs,
          synced: missingDocs === 0,
        });

        if (missingDocs > 0) {
          this.logger.warn(
            `⚠️ ${topic}: Missing ${missingDocs} documents ` +
            `(Kafka: ${kafkaMessages}, ES: ${esCount})`
          );
        } else {
          this.logger.log(
            `✅ ${topic}: Synced (Kafka: ${kafkaMessages}, ES: ${esCount})`
          );
        }
      } catch (error) {
        this.logger.error(`❌ Failed to check sync status for ${topic}:`, error);
      }
    }

    return statuses;
  }

  /**
   * Kích hoạt đồng bộ lại từ đầu (CHỈ DÙNG KHI CẦN)
   */
  async resyncFromBeginning(topic: string) {
    this.logger.warn(`🔄 Starting full resync for ${topic}...`);
    
    try {
      // Xóa index hiện tại (tùy chọn)
      const indexName = this.getIndexNameFromTopic(topic);
      this.logger.warn(`⚠️ This will reindex all data for ${indexName}`);

      // Reset offset về đầu
      await this.kafkaOffsetService.resetOffsetsToEarliest(this.CONSUMER_GROUP, topic);

      this.logger.log(`✅ Offset reset completed for ${topic}. Service will reprocess all messages.`);
      
      return {
        success: true,
        message: `Resync initiated for ${topic}. Check logs for progress.`,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to resync ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Lấy báo cáo đồng bộ đầy đủ
   */
  async getSyncReport() {
    this.logger.log('\n📊 Kafka-Elasticsearch Sync Report');
    this.logger.log('═'.repeat(80));
    
    const statuses = await this.checkSyncStatus();
    const lag = await this.kafkaOffsetService.getTotalLag(this.CONSUMER_GROUP);
    
    this.logger.log(`\n🔄 Current Lag: ${lag} messages pending processing\n`);
    
    const totalMissing = statuses.reduce((sum, s) => sum + s.missingDocs, 0);
    
    if (totalMissing > 0) {
      this.logger.warn(`⚠️ Total Missing Documents: ${totalMissing}`);
      this.logger.warn('💡 Consider running resync if the missing data is critical');
    } else {
      this.logger.log('✅ All data is in sync!');
    }
    
    this.logger.log('═'.repeat(80) + '\n');
    
    return {
      statuses,
      totalLag: lag,
      totalMissing,
      inSync: totalMissing === 0 && lag === 0,
    };
  }

  private getIndexNameFromTopic(topic: string): string {
    if (topic.includes('user')) return 'users';
    if (topic.includes('role')) return 'roles';
    if (topic.includes('permission')) return 'permissions';
    return 'unknown';
  }
}
