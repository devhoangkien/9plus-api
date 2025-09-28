import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GatewayUrlResolver {
  private baseUrl: string;
  private port: number;
  private protocol: string;

  constructor(private readonly configService: ConfigService) {
    this.port = this.configService.get<number>('PORT') || 3000;
    this.protocol = this.configService.get<string>('GATEWAY_PROTOCOL') || 'http';
    this.updateBaseUrl();
  }

  private updateBaseUrl() {
    const host = this.configService.get<string>('GATEWAY_HOST') || 'localhost';
    this.baseUrl = `${this.protocol}://${host}:${this.port}`;
  }

  getGraphQLUrl(): string {
    return `${this.baseUrl}/graphql`;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getPort(): number {
    return this.port;
  }

  getProtocol(): string {
    return this.protocol;
  }

  getHost(): string {
    return this.configService.get<string>('GATEWAY_HOST') || 'localhost';
  }
}