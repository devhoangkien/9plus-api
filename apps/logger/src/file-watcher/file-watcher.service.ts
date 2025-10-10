import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogProcessorService, RawLogLine } from '../log-processor/log-processor.service';
import * as chokidar from 'chokidar';
import { Tail } from 'tail';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FileWatcherService.name);
  private watchers: chokidar.FSWatcher[] = [];
  private tails: Map<string, Tail> = new Map();
  private logBuffer: RawLogLine[] = [];
  private bufferFlushInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private logProcessorService: LogProcessorService,
  ) {}

  async onModuleInit() {
    try {
      await this.initializeWatchers();
      this.startBufferFlush();
      this.logger.log('✅ File watcher service initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize file watcher:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    // Stop all watchers
    this.watchers.forEach(watcher => watcher.close());
    
    // Stop all tails
    this.tails.forEach(tail => tail.unwatch());
    this.tails.clear();

    // Clear buffer flush interval
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }

    // Flush remaining logs
    await this.flushBuffer();

    this.logger.log('File watcher service destroyed');
  }

  private async initializeWatchers() {
    const logDirectories = this.getLogDirectories();
    
    for (const directory of logDirectories) {
      await this.watchDirectory(directory);
    }
  }

  private getLogDirectories(): string[] {
    // Default log directories to watch
    const defaultDirs = [
      './apps/core/logs',
      './apps/gateway/logs', 
      './apps/searcher/logs',
      './plugins/*/logs',
      '/var/log/anineplus', // Production log directory
    ];

    // Get additional directories from config
    const configDirs = this.configService.get('LOG_DIRECTORIES', '').split(',')
      .filter(dir => dir.trim());

    return [...defaultDirs, ...configDirs]
      .map(dir => path.resolve(dir))
      .filter(dir => this.directoryExists(dir));
  }

  private directoryExists(directory: string): boolean {
    try {
      return fs.existsSync(directory) && fs.statSync(directory).isDirectory();
    } catch {
      return false;
    }
  }

  private async watchDirectory(directory: string) {
    this.logger.log(`Watching directory: ${directory}`);

    // Watch for new log files
    const watcher = chokidar.watch(`${directory}/**/*.log`, {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: false,
    });

    watcher
      .on('add', (filePath) => {
        this.logger.log(`New log file detected: ${filePath}`);
        this.startTailingFile(filePath);
      })
      .on('change', (filePath) => {
        // File changed - this is handled by tail
      })
      .on('unlink', (filePath) => {
        this.logger.log(`Log file removed: ${filePath}`);
        this.stopTailingFile(filePath);
      })
      .on('error', (error) => {
        this.logger.error(`Watcher error for ${directory}:`, error);
      });

    this.watchers.push(watcher);
  }

  private startTailingFile(filePath: string) {
    // Don't tail if already tailing this file
    if (this.tails.has(filePath)) {
      return;
    }

    try {
      const tail = new Tail(filePath, {
        follow: true,
        logger: console,
        useWatchFile: true,
        fsWatchOptions: {
          interval: 1000,
        },
      });

      tail.on('line', (line) => {
        this.handleLogLine(line, filePath);
      });

      tail.on('error', (error) => {
        this.logger.error(`Tail error for ${filePath}:`, error);
      });

      this.tails.set(filePath, tail);
      this.logger.debug(`Started tailing: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to start tailing ${filePath}:`, error);
    }
  }

  private stopTailingFile(filePath: string) {
    const tail = this.tails.get(filePath);
    if (tail) {
      tail.unwatch();
      this.tails.delete(filePath);
      this.logger.debug(`Stopped tailing: ${filePath}`);
    }
  }

  private handleLogLine(line: string, filePath: string) {
    // Skip empty lines
    if (!line.trim()) {
      return;
    }

    const rawLogLine: RawLogLine = {
      content: line,
      source: filePath,
      timestamp: new Date().toISOString(),
    };

    // Check if log should be processed
    if (this.logProcessorService.shouldProcessLog(rawLogLine)) {
      this.logBuffer.push(rawLogLine);
    }
  }

  private startBufferFlush() {
    const flushIntervalMs = this.configService.get('LOG_BUFFER_FLUSH_INTERVAL', 5000);
    
    this.bufferFlushInterval = setInterval(async () => {
      await this.flushBuffer();
    }, flushIntervalMs);
  }

  private async flushBuffer() {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToProcess = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.logProcessorService.processAndShip(logsToProcess);
      this.logger.debug(`Flushed ${logsToProcess.length} logs from buffer`);
    } catch (error) {
      this.logger.error('Failed to flush log buffer:', error);
      // Re-add logs to buffer for retry (with limit to prevent memory issues)
      if (this.logBuffer.length < 10000) {
        this.logBuffer.unshift(...logsToProcess);
      }
    }
  }

  // Method to manually add log directories
  async addWatchDirectory(directory: string) {
    const resolvedDir = path.resolve(directory);
    if (this.directoryExists(resolvedDir)) {
      await this.watchDirectory(resolvedDir);
      this.logger.log(`Added watch directory: ${resolvedDir}`);
    } else {
      this.logger.warn(`Directory does not exist: ${resolvedDir}`);
    }
  }

  // Method to get current status
  getStatus() {
    return {
      watchedDirectories: this.watchers.length,
      tailedFiles: this.tails.size,
      bufferSize: this.logBuffer.length,
      tailedFilePaths: Array.from(this.tails.keys()),
    };
  }

  // Method to manually tail a specific file
  async tailFile(filePath: string) {
    const resolvedPath = path.resolve(filePath);
    if (fs.existsSync(resolvedPath)) {
      this.startTailingFile(resolvedPath);
      this.logger.log(`Manually started tailing: ${resolvedPath}`);
    } else {
      this.logger.warn(`File does not exist: ${resolvedPath}`);
    }
  }
}