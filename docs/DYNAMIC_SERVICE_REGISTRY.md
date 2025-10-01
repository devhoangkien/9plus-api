# Dynamic Service Registry Implementation

This implementation provides a dynamic plugin/service management system through the core service, allowing services to register themselves and automatically update the gateway's GraphQL schema.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Core Service   │    │ Plugin Services │
│                 │    │                 │    │  (Payment,      │
│ - Dynamic       │◄───┤ - Service       │◄───┤   HRMS, etc.)   │
│   Schema        │    │   Registry      │    │                 │
│ - Auto Reload   │    │ - Webhooks      │    │ - Auto Register │
│ - Health Checks │    │ - Validation    │    │ - GraphQL APIs  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features Implemented

### 1. Service Registry Database (Core Service)
- **Table**: `service_registry` with fields:
  - `name`: Unique service identifier
  - `displayName`: Human-readable name
  - `description`: Service description
  - `url`: GraphQL endpoint URL
  - `version`: Service version
  - `status`: ACTIVE, INACTIVE, MAINTENANCE, ERROR, DEGRADED
  - `healthCheck`: Health check endpoint
  - `metadata`: Additional service metadata (JSON)
  - `dependencies`: List of service dependencies
  - `tags`: Service categorization tags
  - `isRequired`: Whether service is required for app functionality
  - `lastHealthCheck`: Last health check timestamp

### 2. GraphQL API (Core Service)
Available mutations and queries:

```graphql
# Register a new service
mutation RegisterService($input: RegisterServiceInput!) {
  registerService(input: $input) {
    id
    name
    url
    status
  }
}

# Unregister a service
mutation UnregisterService($name: String) {
  unregisterService(name: $name) {
    id
    name
  }
}

# Update service configuration
mutation UpdateService($name: String, $input: UpdateServiceInput!) {
  updateService(name: $name, input: $input) {
    id
    name
    url
    status
  }
}

# Get all active services
query GetActiveServices {
  getActiveServices {
    name
    url
    status
  }
}

# Get gateway subgraphs configuration
query GetGatewaySubgraphs {
  getGatewaySubgraphs {
    name
    url
  }
}

# Health check
query CheckAllServicesHealth {
  checkAllServicesHealth {
    service
    healthy
  }
}
```

### 3. Dynamic Gateway Configuration (API Gateway)
- **Dynamic Loading**: Gateway fetches registered services on startup
- **Fallback**: Falls back to core service only if registry is unavailable
- **Health Monitoring**: Regular health checks of all registered services

### 4. Webhook Notification System
- **Auto-Notification**: Core service notifies gateway when services are registered/updated/removed
- **Gateway Endpoints**:
  - `POST /gateway/reload` - Trigger manual schema reload
  - `GET /gateway/health` - Check gateway and all services health
  - `GET /gateway/services` - List all registered services

## Usage Examples

### 1. Register a New Service (e.g., Payment Service)

```graphql
mutation RegisterPaymentService {
  registerService(input: {
    name: "payment-service"
    displayName: "Payment Service"
    description: "Handles payments and subscriptions"
    url: "http://localhost:3002/graphql"
    version: "1.0.0"
    tags: ["payment", "subscription"]
    dependencies: ["core"]
    isRequired: false
  }) {
    id
    name
    url
    status
  }
}
```

### 2. Check Service Health

```bash
# Check gateway health
curl http://localhost:3000/gateway/health

# Check all services health via GraphQL
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { checkAllServicesHealth { service healthy } }"}'
```

### 3. Manual Gateway Reload

```bash
curl -X POST http://localhost:3000/gateway/reload
```

## Environment Variables

### Core Service
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
API_GATEWAY_URL=http://localhost:3000  # For webhook notifications
```

### API Gateway
```env
CORE_SERVICE_URL=http://localhost:3001/graphql
```

### Plugin Services (Example)
```env
CORE_SERVICE_URL=http://localhost:3001/graphql
PAYMENT_SERVICE_URL=http://localhost:3002/graphql
HRMS_SERVICE_URL=http://localhost:3003/graphql
```

## Automatic Service Registration

Services can register themselves automatically on startup:

```typescript
// Example: Auto-register on service startup
const registerService = async () => {
  const client = new GraphQLClient(process.env.CORE_SERVICE_URL);
  
  await client.request(`
    mutation RegisterSelf {
      registerService(input: {
        name: "payment"
        displayName: "Payment Service"
        url: "${process.env.SERVICE_URL}/graphql"
        version: "1.0.0"
        tags: ["payment"]
        dependencies: ["core"]
      }) {
        id
        name
      }
    }
  `);
};

// Call on application startup
registerService().catch(console.error);
```

## Database Migration

Run the migration to create the service registry table:

```bash
cd apps/core
npx prisma migrate dev --name add-plugin-management
```

## Testing the Implementation

1. **Start Core Service**:
   ```bash
   cd apps/core
   bun run dev
   ```

2. **Start Gateway**:
   ```bash
   cd apps/gateway
   bun run dev
   ```

3. **Register a test service**:
   ```bash
   curl -X POST http://localhost:3001/graphql \
     -H "Content-Type: application/json" \
     -d '{
       "query": "mutation { registerService(input: { name: \"test-service\", url: \"http://localhost:3001/graphql\", version: \"1.0.0\" }) { id name url status } }"
     }'
   ```

4. **Check gateway services**:
   ```bash
   curl http://localhost:3000/gateway/services
   ```

## Benefits

1. **Dynamic Service Management**: Add/remove services without restarting the gateway
2. **Health Monitoring**: Automatic health checks and status tracking
3. **Dependency Management**: Track service dependencies
4. **Version Control**: Track service versions and metadata
5. **Graceful Fallbacks**: Gateway continues working even if some services are down
6. **Auto-Discovery**: Services can register themselves automatically
7. **Real-time Updates**: Webhook notifications ensure immediate schema updates

## Future Enhancements

- Service discovery via Docker/Kubernetes labels
- Load balancing for multiple instances of same service
- Service mesh integration
- Authentication/authorization for service registration
- Service performance metrics and monitoring
- Blue-green deployments support