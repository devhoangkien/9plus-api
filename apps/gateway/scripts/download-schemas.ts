#!/usr/bin/env bun
/**
 * Download individual schemas from microservices
 */
import { GraphQLClient } from 'graphql-request';
import { getIntrospectionQuery, buildClientSchema, printSchema } from 'graphql';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const services = {
  'core': process.env.CORE_SERVICE_URL || 'http://localhost:50051/graphql',
  'payment-service': process.env.PAYMENT_SERVICE_URL || 'http://localhost:50052/graphql',
};

async function downloadSchema(serviceName: string, url: string): Promise<boolean> {
  try {
    console.log(`📥 Downloading schema from ${serviceName}...`);
    
    const client = new GraphQLClient(url);
    const introspectionQuery = getIntrospectionQuery();
    
    // Get introspection result
    const introspectionResult = await client.request(introspectionQuery);
    
    // Build schema from introspection
    const schema = buildClientSchema(introspectionResult as any);
    const schemaString = printSchema(schema);
    
    // Ensure output directory exists
    const outputDir = resolve('src/generated');
    mkdirSync(outputDir, { recursive: true });
    
    // Write schema file
    const outputPath = resolve(outputDir, `${serviceName}.graphql`);
    writeFileSync(outputPath, schemaString);
    
    console.log(`✅ Downloaded ${serviceName} schema to ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to download schema from ${serviceName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('📡 Downloading schemas from microservices...\n');
  
  const results = await Promise.allSettled(
    Object.entries(services).map(([name, url]) => 
      downloadSchema(name, url)
    )
  );
  
  const successful = results.filter(
    (result, index) => 
      result.status === 'fulfilled' && result.value === true
  ).length;
  
  const total = Object.keys(services).length;
  
  console.log(`\n📊 Download Summary:`);
  console.log(`   Successful downloads: ${successful}/${total}`);
  
  if (successful === 0) {
    console.log('\n⚠️  No schemas could be downloaded. Please ensure services are running.');
    process.exit(1);
  } else if (successful < total) {
    console.log('\n⚠️  Some schemas could not be downloaded. Check service availability.');
  } else {
    console.log('\n🎉 All schemas downloaded successfully!');
  }
  
  console.log('\n🚀 Next step: npm run codegen');
}

main().catch((error) => {
  console.error('❌ Schema download failed:', error);
  process.exit(1);
});
