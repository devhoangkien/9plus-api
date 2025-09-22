import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { GraphQLClient } from 'graphql-request';
import introspectionResult from './introspection.json';

// Build federated schema from introspection
export const federatedSchema = buildClientSchema(introspectionResult as IntrospectionQuery);

// Service configuration
export const serviceConfig = {
  coreService: {
    name: 'core',
    url: process.env.CORE_SERVICE_URL || 'http://localhost:50051/graphql',
  },
  paymentService: {
    name: 'payment-service', 
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:50052/graphql',
  },
};

// Create GraphQL clients for each service
export const createServiceClients = () => {
  const clients: Record<string, GraphQLClient> = {};
  
  Object.entries(serviceConfig).forEach(([key, config]) => {
    try {
      clients[key] = new GraphQLClient(config.url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`✅ Created client for ${config.name} at ${config.url}`);
    } catch (error) {
      console.warn(`⚠️  Failed to create client for ${config.name}:`, error.message);
    }
  });
  
  return clients;
};

// Health check for services
export const checkServiceHealth = async (url: string): Promise<boolean> => {
  try {
    const client = new GraphQLClient(url);
    await client.request('{ __typename }');
    return true;
  } catch (error) {
    console.error(`Health check failed for undefined:`, error.message);
    return false;
  }
};

// Get available services
export const getAvailableServices = async () => {
  const results = await Promise.allSettled(
    Object.values(serviceConfig).map(async (config) => {
      const isHealthy = await checkServiceHealth(config.url);
      return {
        name: config.name,
        url: config.url,
        isHealthy,
      };
    })
  );
  
  return results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value)
    .filter(service => service.isHealthy);
};
