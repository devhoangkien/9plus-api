import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  metadata?: any;
  [key: string]: any;
}

@Injectable()
export class LogShipperService implements OnModuleInit {
  private elasticsearchClient: Client;
  private logger: winston.Logger;
  private readonly nestLogger = new Logger(LogShipperService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      await this.initializeElasticsearchClient();
      await this.initializeWinstonLogger();
      this.nestLogger.log('✅ Log shipper initialized');
    } catch (error) {
      this.nestLogger.error('❌ Failed to initialize log shipper:', error);
      throw error;
    }
  }

  private async initializeElasticsearchClient() {
    this.elasticsearchClient = new Client({
      node: this.configService.get('ELASTICSEARCH_URL', 'http://localhost:9200'),
      auth: {
        username: this.configService.get('ELASTICSEARCH_USERNAME', 'elastic'),
        password: this.configService.get('ELASTICSEARCH_PASSWORD', 'changeme'),
      },
    });

    // Test connection
    await this.elasticsearchClient.ping();
    this.nestLogger.log('Connected to Elasticsearch for log shipping');
  }

  private async initializeWinstonLogger() {
    const elasticsearchTransport = new ElasticsearchTransport({
      client: this.elasticsearchClient,
      level: 'info',
      index: 'logs',
      indexPrefix: 'anineplus-logs',
      indexSuffixPattern: 'YYYY.MM.DD',
      transformer: (logData) => {
        return {
          timestamp: logData.timestamp,
          level: logData.level,
          message: logData.message,
          service: logData.meta?.service || 'unknown',
          ...logData.meta,
        };
      },
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        elasticsearchTransport,
      ],
    });
  }

  async shipLog(logEntry: LogEntry) {
    try {
      this.logger.log(logEntry.level, logEntry.message, {
        service: logEntry.service,
        timestamp: logEntry.timestamp,
        ...logEntry.metadata,
      });
    } catch (error) {
      this.nestLogger.error('Failed to ship log:', error);
    }
  }

  async shipLogs(logEntries: LogEntry[]) {
    for (const logEntry of logEntries) {
      await this.shipLog(logEntry);
    }
  }

  async shipLogBatch(logEntries: LogEntry[]) {
    try {
      const body = logEntries.flatMap((logEntry) => [
        { 
          index: { 
            _index: `anineplus-logs-${new Date().toISOString().slice(0, 10)}`,
          } 
        },
        {
          timestamp: logEntry.timestamp,
          level: logEntry.level,
          message: logEntry.message,
          service: logEntry.service,
          ...logEntry.metadata,
        },
      ]);

      await this.elasticsearchClient.bulk({ body });
      this.nestLogger.debug(`Shipped batch of ${logEntries.length} logs`);
    } catch (error) {
      this.nestLogger.error('Failed to ship log batch:', error);
    }
  }

  // Method to ship structured logs directly to Elasticsearch
  async shipStructuredLog(index: string, document: any) {
    try {
      await this.elasticsearchClient.index({
        index,
        body: {
          timestamp: new Date().toISOString(),
          ...document,
        },
      });
    } catch (error) {
      this.nestLogger.error('Failed to ship structured log:', error);
    }
  }

  // Method to create log indices with proper mappings
  async createLogIndex(indexName: string, mappings?: any) {
    try {
      const exists = await this.elasticsearchClient.indices.exists({ 
        index: indexName 
      });
      
      if (!exists.body) {
        await this.elasticsearchClient.indices.create({
          index: indexName,
          body: {
            mappings: mappings || {
              properties: {
                timestamp: { type: 'date' },
                level: { type: 'keyword' },
                message: { type: 'text', analyzer: 'standard' },
                service: { type: 'keyword' },
                host: { type: 'keyword' },
                path: { type: 'keyword' },
                method: { type: 'keyword' },
                statusCode: { type: 'integer' },
                responseTime: { type: 'integer' },
                userAgent: { type: 'text' },
                ip: { type: 'ip' },
              },
            },
          },
        });
        this.nestLogger.log(`Created log index: ${indexName}`);
      }
    } catch (error) {
      this.nestLogger.error(`Failed to create log index ${indexName}:`, error);
    }
  }
}