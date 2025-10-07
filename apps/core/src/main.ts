import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GqlAllExceptionsFilter, GqlValidationPipe } from '@anineplus/common';
import { LoggerService } from '@anineplus/common';

// Workaround for KafkaJS with Bun runtime
// See: https://github.com/tulios/kafkajs/issues/1751
// Override performance.now() to use Date.now() instead
if (typeof performance !== 'undefined') {
  const startTime = Date.now();
  (performance as any).now = function() {
    return Date.now() - startTime;
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const logger = app.get(LoggerService);

  logger.log('🚀 Starting User Service...');

  app.useGlobalFilters(new GqlAllExceptionsFilter());
  app.useGlobalPipes(new GqlValidationPipe());

  const port = process.env.PORT ?? 50051;
  await app.listen(port);

  logger.log(`✅ User Service is running on: http://localhost:${port}/graphql`);
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start', error);
});
