import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('🚀 Starting Payment Service...');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const port = process.env.PORT ?? 50052;
  await app.listen(port);

  console.log(
    `✅ Payment Service is running on: http://localhost:${port}/graphql`,
  );
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start', error);
});
