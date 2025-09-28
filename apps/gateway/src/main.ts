import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from '@bune/common';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { DynamicGatewayService } from './dynamic-gateway/dynamic-gateway.service';
import { GatewayHealthService } from './services/gateway-health.service';
import { GatewayCacheService } from './services/gateway-cache.service';
import { GraphQLExecutorService } from './services/graphql-executor.service';
import { StartupDisplayService } from './services/startup-display.service';
import { GatewayUrlResolver } from './resolvers/gateway-url-resolver';
import { SofaApiFactory } from './factories/sofa-api.factory';
/**
 * Bootstrap function using injected services for better maintainability
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get services from DI container
  const logger = app.get(LoggerService);
  const dynamicGatewayService = app.get(DynamicGatewayService);
  const healthService = app.get(GatewayHealthService);
  const cacheService = app.get(GatewayCacheService);
  const urlResolver = app.get(GatewayUrlResolver);
  const executorService = app.get(GraphQLExecutorService);
  const sofaFactory = app.get(SofaApiFactory);
  const startupDisplay = app.get(StartupDisplayService);

  logger.log('🚀 Starting application...');
  
  // Load subgraphs dynamically
  const subgraphs = await dynamicGatewayService.loadSubgraphs();
  
  // Display subgraph info
  startupDisplay.displaySubgraphInfo(subgraphs);
  
  // Create Apollo Gateway
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: subgraphs,
    }),
  });

  // Load federated schema
  const { schema } = await gateway.load();
  
  // Create Sofa API using factory
  const sofa = sofaFactory.createSofaApi(schema);

  // Mount Sofa API
  app.use('/api', sofa);
  
  // Add health check endpoint
  app.getHttpAdapter().get('/health', async (req, res) => {
    const health = await healthService.checkHealth();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  });

  // Add cache stats endpoint
  app.getHttpAdapter().get('/cache/stats', (req, res) => {
    const stats = cacheService.getStats();
    res.json(stats);
  });

  // Add cache clear endpoint
  app.getHttpAdapter().post('/cache/clear', (req, res) => {
    cacheService.clear();
    res.json({ message: 'Cache cleared successfully' });
  });
  
  // Start the server
  const port = urlResolver.getPort();
  await app.listen(port);

  // Display startup information
  startupDisplay.displayStartupInfo();
}

bootstrap();
