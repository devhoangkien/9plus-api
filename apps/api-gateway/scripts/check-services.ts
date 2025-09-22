#!/usr/bin/env bun
/**
 * Check health of all   console.log('\n💡 To start services:');
  console.log('   cd apps/core-service && bun run start:dev');
  console.log('   cd apps/payment-service && bun run start:dev');phQL microservices
 */
import { GraphQLClient } from 'graphql-request';

const services = {
  'Core Service': process.env.CORE_SERVICE_URL || 'http://localhost:50051/graphql',
  'Payment Service': process.env.PAYMENT_SERVICE_URL || 'http://localhost:50052/graphql',
};

async function checkServiceHealth(name: string, url: string): Promise<boolean> {
  try {
    const client = new GraphQLClient(url);
    
    // Simple introspection query to check if service is responding
    await client.request('{ __typename }');
    
    console.log(`✅ ${name} is healthy at ${url}`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} is not responding at ${url}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🏥 Checking GraphQL services health...\n');
  
  const results = await Promise.allSettled(
    Object.entries(services).map(([name, url]) => 
      checkServiceHealth(name, url)
    )
  );
  
  const healthyServices = results.filter(
    (result, index) => 
      result.status === 'fulfilled' && result.value === true
  ).length;
  
  const totalServices = Object.keys(services).length;
  
  console.log(`\n📊 Health Check Summary:`);
  console.log(`   Healthy services: ${healthyServices}/${totalServices}`);
  
  if (healthyServices === 0) {
    console.log('\n⚠️  No services are available. Please start the microservices first.');
    console.log('\n💡 To start services:');
    console.log('   cd microservices/user-service && bun run start:dev');
    console.log('   cd microservices/payment-service && bun run start:dev');
    process.exit(1);
  } else if (healthyServices < totalServices) {
    console.log('\n⚠️  Some services are unavailable. Schema generation will continue with available services only.');
  } else {
    console.log('\n🎉 All services are healthy! Ready for schema generation.');
  }
  
  console.log('\n🚀 Next steps:');
  console.log('   npm run codegen        # Generate federated schema');
  console.log('   npm run start:dev      # Start API Gateway');
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Health check failed:', error);
  process.exit(1);
});
