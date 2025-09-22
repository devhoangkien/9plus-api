import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from '@bune/common';
import chalk from 'chalk';
import figlet from 'figlet';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createSchema } from 'graphql-yoga';
import { useSofa } from 'sofa-api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggerService);
  
  logger.log('🚀 Starting application...');
  
  // Setup Sofa REST API from generated federated schema
  const schemaPath = join(__dirname, 'generated', 'schema.graphql');
  const typeDefs = readFileSync(schemaPath, 'utf-8');
  
  // Build schema from the generated SDL
  const federatedSchema = createSchema({
    typeDefs,
  });
  
  // Create Sofa API directly
  const sofa = useSofa({
    schema: federatedSchema,
    basePath: '/api',
    swaggerUI: {
      endpoint: '/swagger',
    },
    openAPI: {
      info: {
        title: 'NinePlus CMS REST API',
        version: '1.0.0',
        description: 'API documentation for NinePlus CMS - Generated from GraphQL Federation Schema',
      },
    },

  });

  // Mount the Sofa REST API
  app.use('/api', sofa);
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const ninePlusCmsArt = figlet.textSync('NinePlus CMS', {
    font: 'Slant',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  console.log(chalk.blueBright(ninePlusCmsArt));
  console.log(chalk.greenBright('by devhoangkien')); 
  logger.log(`✅ Application is running on: ${chalk.redBright(`http://localhost:${port}`)}`);
  logger.log(`🔗 GraphQL endpoint: ${chalk.yellowBright(`http://localhost:${port}/graphql`)}`);
  logger.log(`🔗 REST API endpoint: ${chalk.cyanBright(`http://localhost:${port}/api`)}`);
  logger.log(`📖 Swagger UI: ${chalk.greenBright(`http://localhost:${port}/api/swagger`)}`);
}
bootstrap();
