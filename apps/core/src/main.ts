import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GqlAllExceptionsFilter, GqlValidationPipe } from '@anineplus/common';
import { LoggerService } from '@anineplus/common';

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