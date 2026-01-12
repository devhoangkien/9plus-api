import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntrospectAndCompose } from '@apollo/gateway';
import { DynamicGatewayService, SubgraphConfig } from './dynamic-gateway.service';

@Injectable()
export class GatewayConfigFactory {
  private readonly logger = new Logger(GatewayConfigFactory.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dynamicGatewayService: DynamicGatewayService,
  ) { }

  async createGatewayConfig() {
    try {
      // Get dynamic subgraphs from core service
      const subgraphs = await this.dynamicGatewayService.loadSubgraphs();

      this.logger.log('Creating gateway config with subgraphs:',
        subgraphs.map(s => `${s.name} (${s.url})`).join(', ')
      );

      return new IntrospectAndCompose({
        subgraphs: subgraphs,
      });
    } catch (error) {
      this.logger.error('Failed to create dynamic gateway config:', error.message);

      // Fallback to static configuration
      this.logger.warn('Falling back to static core configuration');
      return new IntrospectAndCompose({
        subgraphs: [
          {
            name: 'core',
            url: this.configService.get<string>('CORE_SERVICE_URL') || 'http://localhost:3001/graphql'
          },
          {
            name: 'payment',
            url: this.configService.get<string>('PAYMENT_SERVICE_URL') || 'http://localhost:50054/graphql'
          },
        ],
      });
    }
  }
}