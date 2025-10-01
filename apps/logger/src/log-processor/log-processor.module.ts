import { Module } from '@nestjs/common';
import { LogProcessorService } from './log-processor.service';

@Module({
  providers: [LogProcessorService],
  exports: [LogProcessorService],
})
export class LogProcessorModule {}