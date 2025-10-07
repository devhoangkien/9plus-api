import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Admin } from 'kafkajs';

export interface OffsetInfo {
  topic: string;
  partition: number;
  offset: string;
  high: string;
  low: string;
  lag: number;
}

@Injectable()
export class KafkaOffsetService {
  private kafka: Kafka;
  private admin: Admin;
  private readonly logger = new Logger(KafkaOffsetService.name);

  constructor(private configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'searcher-offset-manager',
      brokers: this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
    });
    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    try {
      await this.admin.connect();
      this.logger.log('✅ Kafka admin connected for offset management');
    } catch (error) {
      this.logger.error('❌ Failed to connect Kafka admin:', error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.admin.disconnect();
      this.logger.log('✅ Kafka admin disconnected');
    } catch (error) {
      this.logger.error('❌ Error disconnecting Kafka admin:', error);
    }
  }

  /**
   * Lấy thông tin lag của consumer group
   */
  async getConsumerLag(groupId: string): Promise<OffsetInfo[]> {
    try {
      const offsets = await this.admin.fetchOffsets({ groupId });
      const offsetInfo: OffsetInfo[] = [];

      for (const topic of offsets) {
        for (const partition of topic.partitions) {
          const topicOffsets = await this.admin.fetchTopicOffsets(topic.topic);
          const topicPartition = topicOffsets.find(p => p.partition === partition.partition);

          if (topicPartition) {
            const currentOffset = BigInt(partition.offset);
            const highWaterMark = BigInt(topicPartition.high);
            const lag = Number(highWaterMark - currentOffset);

            offsetInfo.push({
              topic: topic.topic,
              partition: partition.partition,
              offset: partition.offset,
              high: topicPartition.high,
              low: topicPartition.low,
              lag,
            });
          }
        }
      }

      return offsetInfo;
    } catch (error) {
      this.logger.error('❌ Failed to get consumer lag:', error);
      throw error;
    }
  }

  /**
   * Reset offset về đầu (earliest) - CHỈ DÙNG KHI CẦN ĐỒNG BỘ LẠI TOÀN BỘ
   */
  async resetOffsetsToEarliest(groupId: string, topic: string) {
    try {
      this.logger.warn(`⚠️ Resetting offsets to earliest for group ${groupId}, topic ${topic}`);
      
      await this.admin.resetOffsets({
        groupId,
        topic,
        earliest: true,
      });

      this.logger.log(`✅ Offsets reset to earliest successfully`);
    } catch (error) {
      this.logger.error('❌ Failed to reset offsets:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra xem consumer group có lag không
   */
  async hasLag(groupId: string): Promise<boolean> {
    try {
      const offsets = await this.getConsumerLag(groupId);
      return offsets.some(offset => offset.lag > 0);
    } catch (error) {
      this.logger.error('❌ Failed to check lag:', error);
      return false;
    }
  }

  /**
   * Lấy tổng số message bị lag
   */
  async getTotalLag(groupId: string): Promise<number> {
    try {
      const offsets = await this.getConsumerLag(groupId);
      return offsets.reduce((total, offset) => total + offset.lag, 0);
    } catch (error) {
      this.logger.error('❌ Failed to get total lag:', error);
      return 0;
    }
  }

  /**
   * In ra báo cáo lag
   */
  async printLagReport(groupId: string) {
    try {
      const offsets = await this.getConsumerLag(groupId);
      
      this.logger.log(`\n📊 Consumer Lag Report for ${groupId}:`);
      this.logger.log('─'.repeat(80));
      
      for (const offset of offsets) {
        const status = offset.lag > 100 ? '🔴' : offset.lag > 10 ? '🟡' : '🟢';
        this.logger.log(
          `${status} ${offset.topic} [${offset.partition}] - ` +
          `Offset: ${offset.offset}, High: ${offset.high}, Lag: ${offset.lag}`
        );
      }
      
      const totalLag = offsets.reduce((sum, o) => sum + o.lag, 0);
      this.logger.log('─'.repeat(80));
      this.logger.log(`📈 Total Lag: ${totalLag} messages`);
      this.logger.log('');
    } catch (error) {
      this.logger.error('❌ Failed to print lag report:', error);
    }
  }
}
