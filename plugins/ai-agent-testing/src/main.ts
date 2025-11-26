import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

const DEFAULT_PORT = 50053;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('🚀 Starting AI Agent Testing Service...');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
  await app.listen(port);

  console.log(
    `✅ AI Agent Testing Service is running on: http://localhost:${port}/graphql`,
  );
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start', error);
});
