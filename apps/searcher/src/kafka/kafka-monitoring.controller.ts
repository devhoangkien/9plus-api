import { Controller, Get, Post, Param, Logger } from '@nestjs/common';
import { KafkaHealthService } from './kafka-health.service';
import { KafkaOffsetService } from './kafka-offset.service';
import { KafkaSyncService } from './kafka-sync.service';

@Controller('kafka')
export class KafkaMonitoringController {
  private readonly logger = new Logger(KafkaMonitoringController.name);

  constructor(
    private readonly kafkaHealthService: KafkaHealthService,
    private readonly kafkaOffsetService: KafkaOffsetService,
    private readonly kafkaSyncService: KafkaSyncService,
  ) {}

  @Get('health')
  getHealth() {
    return this.kafkaHealthService.getHealthStatus();
  }

  @Get('lag/:groupId')
  async getLag(@Param('groupId') groupId: string) {
    try {
      const offsets = await this.kafkaOffsetService.getConsumerLag(groupId);
      const totalLag = offsets.reduce((sum, o) => sum + o.lag, 0);

      return {
        groupId,
        totalLag,
        offsets,
      };
    } catch (error) {
      this.logger.error('Failed to get lag:', error);
      return {
        error: error.message,
      };
    }
  }

  @Get('lag-report/:groupId')
  async getLagReport(@Param('groupId') groupId: string) {
    await this.kafkaOffsetService.printLagReport(groupId);
    return { message: 'Check logs for detailed report' };
  }

  @Post('reset-counters')
  resetCounters() {
    this.kafkaHealthService.resetCounters();
    return { message: 'Counters reset successfully' };
  }

  @Post('reset-offsets/:groupId/:topic')
  async resetOffsets(
    @Param('groupId') groupId: string,
    @Param('topic') topic: string,
  ) {
    try {
      await this.kafkaOffsetService.resetOffsetsToEarliest(groupId, topic);
      return { 
        message: `Offsets reset successfully for ${groupId}/${topic}`,
        warning: 'This will reprocess all messages from the beginning!',
      };
    } catch (error) {
      this.logger.error('Failed to reset offsets:', error);
      return {
        error: error.message,
      };
    }
  }

  @Get('sync-status')
  async getSyncStatus() {
    return await this.kafkaSyncService.checkSyncStatus();
  }

  @Get('sync-report')
  async getSyncReport() {
    return await this.kafkaSyncService.getSyncReport();
  }

  @Post('resync/:topic')
  async resyncTopic(@Param('topic') topic: string) {
    try {
      return await this.kafkaSyncService.resyncFromBeginning(topic);
    } catch (error) {
      this.logger.error('Failed to resync:', error);
      return {
        error: error.message,
      };
    }
  }
}
