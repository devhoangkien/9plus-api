import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('LoggerService');

  const port = configService.get('PORT') || 3004;
  
  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'logger', timestamp: new Date().toISOString() });
  });

  await app.listen(port);
  logger.log(`🚀 Logger service running on port ${port}`);
}

bootstrap();