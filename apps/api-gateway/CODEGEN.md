# API Gateway - GraphQL Code Generation

Hệ thống generate schema và types cho GraphQL Federation Gateway.

## Overview

API Gateway sử dụng GraphQL Federation để kết hợp schemas từ nhiều microservices thành một unified API. Code generation được sử dụng để:

1. **Download schemas** từ các microservices
2. **Generate TypeScript types** cho type safety  
3. **Create federated schema** cho runtime
4. **Generate utilities** cho service management

## Quick Start

### 1. Kiểm tra services health
```bash
npm run services:health
```

### 2. Generate schema và types
```bash
npm run codegen
```

### 3. Start API Gateway
```bash
npm run start:dev
```

## Available Scripts

### Core Scripts
- `npm run codegen` - Generate all schemas and types
- `npm run codegen:watch` - Watch mode for development
- `npm run codegen:check` - Validate configuration

### Helper Scripts  
- `npm run services:health` - Check microservices health
- `npm run schema:download` - Download individual schemas
- `npm run schema:stitch` - Combine schemas manually

## Generated Files

### `/src/generated/`
- `federated-schema.graphql` - Combined schema from all services
- `graphql-types.ts` - TypeScript types và resolvers
- `introspection.json` - Runtime introspection data
- `gateway-utils.ts` - Utility functions
- `user-service.graphql` - User service schema
- `payment-service.graphql` - Payment service schema

## Configuration

### Environment Variables
```env
# Service URLs
CORE_SERVICE_URL=http://localhost:50051/graphql
PAYMENT_SERVICE_URL=http://localhost:50052/graphql

# Code generation
GENERATE_SCHEMA=true
SCHEMA_OUTPUT_PATH=./src/generated/federated-schema.graphql
```

### codegen.yml
Configuration file chứa:
- Schema sources (service URLs)
- Output targets và plugins
- TypeScript generation options
- Federation settings

## Service Management

### Adding New Service
1. Thêm URL vào `codegen.yml`:
```yaml
schema:
  - "${NEW_SERVICE_URL:http://localhost:50055/graphql}"
```

2. Thêm generation target:
```yaml
./src/generated/new-service.graphql:
  schema: "${NEW_SERVICE_URL:http://localhost:50055/graphql}"
  plugins:
    - schema-ast
```

3. Update scripts và utilities

### Service Health Monitoring
```bash
# Check tất cả services
npm run services:health

# Output:
# ✅ User Service is healthy at http://localhost:50051/graphql
# ❌ Payment Service is not responding at http://localhost:50052/graphql
```

## Development Workflow

### 1. Service-First Development
```bash
# Terminal 1: Start user service
cd microservices/user-service
bun run start:dev

# Terminal 2: Start payment service  
cd microservices/payment-service
bun run start:dev

# Terminal 3: Generate schemas và start gateway
cd api-gateway
npm run services:health
npm run codegen
npm run start:dev
```

### 2. Schema Updates
Khi microservice schema thay đổi:
```bash
npm run codegen
# hoặc sử dụng watch mode
npm run codegen:watch
```

### 3. Type Safety
Generated types được sử dụng trong resolvers:
```typescript
import { Resolvers } from '../generated/graphql-types';

const resolvers: Resolvers = {
  Query: {
    // TypeScript sẽ validate return types
  }
};
```

## Federation Features

### Schema Stitching
- Automatic combination của multiple schemas
- Directive preservation (@key, @external, etc.)
- Type conflict resolution

### Service Discovery
- Health checking trước khi generation
- Graceful handling của unavailable services
- Runtime service availability monitoring

### Type Generation
- Full TypeScript support
- Resolver type safety
- Input/Output type validation
- Custom scalar mapping

## Troubleshooting

### Common Issues

**❌ "No schemas found"**
```bash
# Check services are running
npm run services:health
# Download schemas manually
npm run schema:download
```

**❌ "TypeScript errors after codegen"**
```bash
# Clean và regenerate
rm -rf src/generated
npm run codegen
```

**❌ "Service not responding"**
- Verify service URLs trong .env
- Check service logs
- Ensure GraphQL endpoint is exposed

### Debug Mode
```bash
# Enable verbose logging
DEBUG=codegen:* npm run codegen
```

## Advanced Configuration

### Custom Scalars
```yaml
config:
  scalars:
    DateTime: Date
    JSON: any
    Decimal: number
```

### Federation Mapping
```yaml
config:
  federation: true
  mappers:
    User: 'prisma/@generated/client#User'
    Subscription: 'prisma/@generated/client#Subscription'
```

### Context Types
```yaml
config:
  contextType: '../common/types#GraphQLContext'
```
