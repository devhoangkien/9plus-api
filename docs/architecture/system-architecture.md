# System Architecture

Complete architecture documentation for AnineePlus API microservices system.

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Microservices](#microservices)
4. [Event-Driven Architecture](#event-driven-architecture)
5. [Data Management](#data-management)
6. [Service Communication](#service-communication)

---

## Overview

AnineePlus API is a microservices-based backend platform built with:
- **NestJS**: Framework for building efficient, scalable Node.js applications
- **GraphQL Federation**: Unified API across microservices
- **Apache Kafka**: Event streaming platform
- **Elasticsearch**: Search and analytics engine
- **PostgreSQL**: Primary relational database
- **Redis**: Caching and session storage

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│         (Web Application, Mobile App, Admin Dashboard)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Gateway Service                         │
│        (API Gateway, GraphQL Federation, Auth)              │
│                    Port: 3000 (HTTP/GraphQL)                │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Core      │    │   Logger     │    │  Searcher    │
│   Service    │    │   Service    │    │   Service    │
│  Port: 4000  │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Message Queue Layer                       │
│        Apache Kafka (Event Streaming & Messaging)           │
│                    Port: 9092 (Broker)                      │
│                    Port: 8080 (UI)                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PostgreSQL   │    │Elasticsearch │    │    Redis     │
│ Port: 5432   │    │ Port: 9200   │    │ Port: 6379   │
│ (Primary DB) │    │ (Search/Logs)│    │ (Cache)      │
└──────────────┘    └──────────────┘    └──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ELK Stack (Monitoring)                    │
│              Logstash, Kibana (Port: 5601)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## System Architecture

### Design Principles

1. **Microservices**: Independently deployable services
2. **Event-Driven**: Asynchronous communication via events
3. **Domain-Driven Design**: Services organized by business domain
4. **CQRS**: Command Query Responsibility Segregation
5. **API Gateway Pattern**: Single entry point for clients
6. **Service Discovery**: Dynamic service registration

### Key Patterns

- **GraphQL Federation**: Schema stitching across services
- **Event Sourcing**: Events as source of truth
- **Saga Pattern**: Distributed transactions
- **Circuit Breaker**: Prevent cascading failures
- **API Gateway**: Routing, auth, rate limiting

---

## Microservices

### 1. Gateway Service

**Purpose**: API Gateway and GraphQL Federation hub

**Technology**: 
- NestJS + Apollo Gateway
- JWT Authentication
- Rate Limiting

**Responsibilities**:
- Route requests to appropriate services
- Authenticate and authorize requests
- Federate GraphQL schemas
- Apply rate limiting and security headers
- Request/response transformation

**Configuration**:
```typescript
// gateway.config.ts
const gateway = new ApolloGateway({
  supergraphSdl: loadSupergraphSdl(),
  serviceList: [
    { name: 'core', url: 'http://core:4000/graphql' },
    // Add more services
  ],
});
```

**Key Features**:
- JWT validation with caching (LRU cache)
- GraphQL schema federation
- Request correlation IDs for tracing
- Rate limiting (per user/IP)
- Security headers (CORS, CSP, etc.)

---

### 2. Core Service

**Purpose**: Main business logic and data management

**Technology**:
- NestJS + GraphQL
- Prisma ORM
- PostgreSQL

**Responsibilities**:
- User management and authentication
- Business entity CRUD operations
- Event publishing to Kafka
- Database transactions
- Business rule enforcement

**Modules**:
- **AuthModule**: Authentication and authorization
- **UserModule**: User management
- **OrganizationModule**: Multi-tenancy
- **ContentModule**: Content management (anime, episodes, etc.)
- **SubscriptionModule**: Subscription management

**Event Publishing**:
```typescript
// Publish events to Kafka
await this.kafkaService.emit('user.created', {
  userId: user.id,
  email: user.email,
  createdAt: new Date(),
});
```

---

### 3. Logger Service

**Purpose**: Centralized logging and log forwarding

**Technology**:
- NestJS
- Winston
- ELK Stack integration

**Responsibilities**:
- Collect logs from all services
- Process and transform logs
- Forward to Elasticsearch via Logstash
- Log buffering and batching
- Error tracking and alerting

**Log Format**:
```typescript
{
  level: 'info',
  timestamp: '2025-10-10T12:00:00Z',
  service: 'core',
  traceId: 'uuid-trace-id',
  message: 'User created',
  context: {
    userId: '123',
    email: 'user@example.com'
  }
}
```

---

### 4. Searcher Service

**Purpose**: Real-time search indexing

**Technology**:
- NestJS
- Elasticsearch Client
- Kafka Consumer

**Responsibilities**:
- Consume events from Kafka
- Transform data for Elasticsearch
- Index documents in real-time
- Handle bulk indexing
- Sync verification

**Event Consumption**:
```typescript
@EventPattern('entity.created')
async handleEntityCreated(data: EntityCreatedEvent) {
  await this.elasticsearchService.index({
    index: data.entityType.toLowerCase(),
    id: data.entityId,
    document: this.transformToDocument(data),
  });
}
```

---

## Event-Driven Architecture

### Kafka Setup

**Topics**:
- `user.created`, `user.updated`, `user.deleted`
- `anime.created`, `anime.updated`, `anime.deleted`
- `episode.created`, `episode.updated`
- `comment.created`, `comment.moderated`
- `subscription.created`, `subscription.cancelled`

**Event Flow**:
```
Core Service → Kafka Topic → [Searcher, Logger, Analytics, ...]
                  ↓
            Elasticsearch
```

### Event Schema

**Standard Event Format**:
```typescript
interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: Date;
  source: string;
  version: string;
  correlationId?: string;
  causationId?: string;
  data: any;
}

// Example
{
  eventId: "evt_123",
  eventType: "user.created",
  timestamp: "2025-10-10T12:00:00Z",
  source: "core-service",
  version: "1.0",
  correlationId: "req_456",
  data: {
    userId: "user_789",
    email: "user@example.com"
  }
}
```

### Kafka Configuration

```yaml
# docker-compose.yaml
kafka:
  image: confluentinc/cp-kafka:latest
  environment:
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
  ports:
    - "9092:9092"
```

### Event Handling Patterns

**1. At-Least-Once Delivery**:
- Events may be delivered multiple times
- Consumers must be idempotent

**2. Event Ordering**:
- Events for same entity use same partition key
- Ensures ordering within partition

**3. Dead Letter Queue**:
- Failed events sent to DLQ topic
- Manual review and retry

---

## Data Management

### Database per Service

Each service owns its data:
- **Core Service**: PostgreSQL (users, organizations, content)
- **Searcher Service**: Elasticsearch (search indices)
- **Logger Service**: Elasticsearch (logs)

### Data Synchronization

**Via Events**:
```
Core Service (PostgreSQL) → Kafka Event → Searcher (Elasticsearch)
```

**Eventual Consistency**:
- Accept short delays in data propagation
- Implement sync verification
- Handle conflicts gracefully

### Prisma Schema Example

```prisma
// Core Service
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  role          String   @default("user")
  organizations Organization[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([email])
}

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  members     User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([slug])
}
```

---

## Service Communication

### GraphQL Federation

**Subgraph Schema (Core)**:
```graphql
type User @key(fields: "id") {
  id: ID!
  email: String!
  name: String!
}

type Query {
  me: User
  user(id: ID!): User
}
```

**Gateway Composition**:
```graphql
# Composed schema at gateway
type User {
  id: ID!
  email: String!
  name: String!
  posts: [Post!]! # From another service
}
```

### HTTP Communication

```typescript
// Service-to-service HTTP call
const response = await this.httpService.post(
  'http://user-service:3000/api/users',
  { name: 'John' },
  {
    headers: {
      'X-Correlation-ID': correlationId,
      'Authorization': `Bearer ${token}`,
    },
  }
);
```

### Request Tracing

**Correlation ID**:
- Generated at gateway
- Propagated through all services
- Logged with every operation
- Used for distributed tracing

```typescript
// Middleware to extract/generate correlation ID
app.use((req, res, next) => {
  req.correlationId = 
    req.headers['x-correlation-id'] || 
    generateCorrelationId();
  next();
});
```

---

## Deployment

### Docker Compose (Development)

```yaml
version: '3.8'

services:
  gateway:
    build: ./apps/gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - CORE_SERVICE_URL=http://core:4000
  
  core:
    build: ./apps/core
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/anineplus
      - KAFKA_BROKERS=kafka:9092
  
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=anineplus
      - POSTGRES_PASSWORD=password
  
  kafka:
    image: confluentinc/cp-kafka:latest
    ports:
      - "9092:9092"
  
  elasticsearch:
    image: elasticsearch:8.11.0
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
  
  kibana:
    image: kibana:8.11.0
    ports:
      - "5601:5601"
```

### Kubernetes (Production)

```yaml
# gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
      - name: gateway
        image: anineplus/gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: CORE_SERVICE_URL
          value: "http://core-service:4000"
```

---

## Best Practices

### Service Design
- ✅ Keep services small and focused
- ✅ Design for failure (circuit breakers, retries)
- ✅ Use async communication where possible
- ✅ Implement health checks
- ✅ Version your APIs

### Performance
- ✅ Cache frequently accessed data (Redis)
- ✅ Use connection pooling
- ✅ Implement pagination
- ✅ Optimize database queries
- ✅ Use CDN for static assets

### Security
- ✅ Authenticate at gateway
- ✅ Use service-to-service authentication
- ✅ Encrypt sensitive data
- ✅ Implement rate limiting
- ✅ Regular security audits

### Monitoring
- ✅ Centralized logging (ELK)
- ✅ Distributed tracing (correlation IDs)
- ✅ Metrics collection (Prometheus)
- ✅ Alerting (critical errors, performance)
- ✅ Health check endpoints

---

## References

- [Task Checklist: Architecture & Services](../tasks/03-architecture-services.md)
- [Core Service README](../../apps/core/README.md)
- [Gateway Service README](../../apps/gateway/README.md)

---

**Last Updated**: 2025-10-10
