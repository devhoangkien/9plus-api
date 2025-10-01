import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogShipperModule } from './log-shipper/log-shipper.module';
import { LogProcessorModule } from './log-processor/log-processor.module';
import { FileWatcherModule } from './file-watcher/file-watcher.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    LogShipperModule,
    LogProcessorModule,
    FileWatcherModule,
  ],
})
export class AppModule {}