import { Controller, Post, Get, Logger } from '@nestjs/common';
import { DynamicGatewayService } from './dynamic-gateway.service';

@Controller('gateway')
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(private readonly dynamicGatewayService: DynamicGatewayService) {}

  @Post('reload')
  async reloadSchema() {
    this.logger.log('Received schema reload request');
    
    try {
      const subgraphs = await this.dynamicGatewayService.reloadSubgraphs();
      
      this.logger.log('Schema reloaded successfully with subgraphs:', 
        subgraphs.map(s => s.name).join(', ')
      );
      
      return {
        success: true,
        message: 'Schema reloaded successfully',
        subgraphs: subgraphs.length,
        services: subgraphs.map(s => s.name),
      };
    } catch (error) {
      this.logger.error('Failed to reload schema:', error.message);
      
      return {
        success: false,
        message: 'Failed to reload schema',
        error: error.message,
      };
    }
  }

  @Get('health')
  async healthCheck() {
    try {
      const healthResults = await this.dynamicGatewayService.healthCheckSubgraphs();
      const subgraphs = this.dynamicGatewayService.getSubgraphs();
      
      return {
        success: true,
        gateway: 'healthy',
        subgraphs: subgraphs.length,
        services: healthResults,
      };
    } catch (error) {
      this.logger.error('Health check failed:', error.message);
      
      return {
        success: false,
        gateway: 'unhealthy',
        error: error.message,
      };
    }
  }

  @Get('services')
  async getServices() {
    try {
      const subgraphs = this.dynamicGatewayService.getSubgraphs();
      
      return {
        success: true,
        subgraphs: subgraphs.length,
        services: subgraphs,
      };
    } catch (error) {
      this.logger.error('Failed to get services:', error.message);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }
}