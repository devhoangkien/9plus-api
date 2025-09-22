import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WebhookNotification {
  event: 'service_registered' | 'service_unregistered' | 'service_updated';
  service: {
    name: string;
    url: string;
    status: string;
  };
  timestamp: Date;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly gatewayWebhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Get gateway webhook URL from environment or construct it
    this.gatewayWebhookUrl = 
      this.configService.get<string>('GATEWAY_WEBHOOK_URL') || 
      `${this.configService.get<string>('API_GATEWAY_URL') || 'http://localhost:3000'}/gateway/reload`;
  }

  async notifyGateway(notification: WebhookNotification): Promise<boolean> {
    try {
      this.logger.log(`Notifying gateway about ${notification.event} for service: ${notification.service.name}`);
      
      const response = await fetch(this.gatewayWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (response.ok) {
        this.logger.log(`Successfully notified gateway about ${notification.event}`);
        return true;
      } else {
        this.logger.warn(`Failed to notify gateway: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error notifying gateway:`, error.message);
      return false;
    }
  }

  async notifyServiceRegistered(service: any): Promise<boolean> {
    return this.notifyGateway({
      event: 'service_registered',
      service: {
        name: service.name,
        url: service.url,
        status: service.status,
      },
      timestamp: new Date(),
    });
  }

  async notifyServiceUnregistered(service: any): Promise<boolean> {
    return this.notifyGateway({
      event: 'service_unregistered',
      service: {
        name: service.name,
        url: service.url,
        status: service.status,
      },
      timestamp: new Date(),
    });
  }

  async notifyServiceUpdated(service: any): Promise<boolean> {
    return this.notifyGateway({
      event: 'service_updated',
      service: {
        name: service.name,
        url: service.url,
        status: service.status,
      },
      timestamp: new Date(),
    });
  }
}