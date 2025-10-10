import { Injectable, Logger } from '@nestjs/common';
import { LogShipperService, LogEntry } from '../log-shipper/log-shipper.service';

export interface RawLogLine {
  timestamp?: string;
  content: string;
  source: string; // file path or service name
  [key: string]: any;
}

@Injectable()
export class LogProcessorService {
  private readonly logger = new Logger(LogProcessorService.name);

  constructor(private logShipperService: LogShipperService) {}

  async processRawLogLine(rawLog: RawLogLine): Promise<LogEntry | null> {
    try {
      // Try to parse structured logs (JSON format)
      const structuredLog = this.tryParseStructuredLog(rawLog.content);
      if (structuredLog) {
        return {
          timestamp: structuredLog.timestamp || rawLog.timestamp || new Date().toISOString(),
          level: structuredLog.level || 'info',
          message: structuredLog.message || rawLog.content,
          service: this.extractServiceName(rawLog.source),
          metadata: {
            source: rawLog.source,
            raw: rawLog.content,
            ...structuredLog,
          },
        };
      }

      // Parse unstructured logs
      const parsedLog = this.parseUnstructuredLog(rawLog.content);
      return {
        timestamp: parsedLog.timestamp || rawLog.timestamp || new Date().toISOString(),
        level: parsedLog.level || 'info',
        message: parsedLog.message || rawLog.content,
        service: this.extractServiceName(rawLog.source),
        metadata: {
          source: rawLog.source,
          raw: rawLog.content,
          ...parsedLog.metadata,
        },
      };
    } catch (error) {
      this.logger.error('Failed to process log line:', error);
      
      // Return a basic log entry for unparseable logs
      return {
        timestamp: rawLog.timestamp || new Date().toISOString(),
        level: 'error',
        message: 'Failed to parse log line',
        service: this.extractServiceName(rawLog.source),
        metadata: {
          source: rawLog.source,
          raw: rawLog.content,
          parseError: error.message,
        },
      };
    }
  }

  private tryParseStructuredLog(content: string): any | null {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private parseUnstructuredLog(content: string): {
    timestamp?: string;
    level?: string;
    message: string;
    metadata?: any;
  } {
    // Common log patterns
    const patterns = [
      // Nginx access log
      /^(?<ip>\d+\.\d+\.\d+\.\d+) - - \[(?<timestamp>[^\]]+)\] "(?<method>\w+) (?<path>[^"]*)" (?<status>\d+) (?<bytes>\d+)/,
      
      // Application log with level
      /^(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\s+(?<level>\w+)\s+(?<message>.*)/,
      
      // Simple timestamped log
      /^\[(?<timestamp>[^\]]+)\]\s+(?<level>\w+)?\s*(?<message>.*)/,
      
      // Docker log format
      /^(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(?<message>.*)/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match.groups) {
        const { timestamp, level, message, ...metadata } = match.groups;
        return {
          timestamp,
          level: level?.toLowerCase(),
          message: message || content,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        };
      }
    }

    // If no pattern matches, return the content as message
    return {
      message: content,
    };
  }

  private extractServiceName(source: string): string {
    // Extract service name from file path or source
    // Examples:
    // /var/log/core/app.log -> core
    // /app/logs/gateway.log -> gateway
    // core-service -> core-service
    
    if (source.includes('/')) {
      const parts = source.split('/');
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i] && parts[i] !== 'logs' && parts[i] !== 'log') {
          const serviceName = parts[i].replace(/\\.log$/, '');
          if (serviceName !== 'app' && serviceName !== 'application') {
            return serviceName;
          }
        }
      }
    }

    // Fallback: use the source as-is or 'unknown'
    return source.replace(/\\.log$/, '') || 'unknown';
  }

  async processBatch(rawLogs: RawLogLine[]): Promise<LogEntry[]> {
    const processedLogs: LogEntry[] = [];
    
    for (const rawLog of rawLogs) {
      const processedLog = await this.processRawLogLine(rawLog);
      if (processedLog) {
        processedLogs.push(processedLog);
      }
    }

    return processedLogs;
  }

  async processAndShip(rawLogs: RawLogLine[]): Promise<void> {
    try {
      const processedLogs = await this.processBatch(rawLogs);
      if (processedLogs.length > 0) {
        await this.logShipperService.shipLogBatch(processedLogs);
        this.logger.debug(`Processed and shipped ${processedLogs.length} logs`);
      }
    } catch (error) {
      this.logger.error('Failed to process and ship logs:', error);
    }
  }

  // Method to enrich logs with additional metadata
  enrichLog(logEntry: LogEntry, enrichmentData: any): LogEntry {
    return {
      ...logEntry,
      metadata: {
        ...logEntry.metadata,
        ...enrichmentData,
      },
    };
  }

  // Method to filter logs based on criteria
  shouldProcessLog(rawLog: RawLogLine): boolean {
    // Skip empty logs
    if (!rawLog.content || rawLog.content.trim() === '') {
      return false;
    }

    // Skip debug logs in production
    if (process.env.NODE_ENV === 'production' && 
        rawLog.content.toLowerCase().includes('debug')) {
      return false;
    }

    // Add more filtering criteria as needed
    return true;
  }
}