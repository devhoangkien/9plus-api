# Architecture Documentation

This directory contains system architecture documentation for AnineePlus API.

---

## 📚 Documentation

### [System Architecture Guide](system-architecture.md)

**Complete architecture documentation covering**:
- **System Overview**: High-level architecture diagram and design principles
- **Microservices**: Gateway, Core, Logger, and Searcher services
- **Event-Driven Architecture**: Kafka setup, event schemas, and patterns
- **Data Management**: Database per service, synchronization, Prisma schemas
- **Service Communication**: GraphQL Federation, HTTP, request tracing
- **Deployment**: Docker Compose and Kubernetes configurations
- **Best Practices**: Service design, performance, security, monitoring

This consolidated document replaces all previous architecture documentation files.

---

## 🏗️ Quick Architecture Overview

```
Client → Gateway → [Core, Logger, Searcher] → Kafka → [PostgreSQL, Elasticsearch, Redis]
```

### Services
- **Gateway** (Port 3000): API Gateway, GraphQL Federation
- **Core** (Port 4000): Business logic, main API
- **Logger**: Log aggregation and forwarding
- **Searcher**: Real-time search indexing

### Infrastructure
- **Kafka**: Event streaming and messaging
- **PostgreSQL**: Primary database
- **Elasticsearch**: Search and logs
- **Redis**: Caching
- **ELK Stack**: Monitoring (Kibana Port 5601)

---

## 🔗 Related Documentation

- [Task Checklist: Architecture & Services](../tasks/03-architecture-services.md)
- [Core Service](../../apps/core/README.md)
- [Gateway Service](../../apps/gateway/README.md)
- [Logger Service](../../apps/logger/)
- [Searcher Service](../../apps/searcher/)

---

## 📝 Quick Reference

### Service Communication
```typescript
// HTTP/GraphQL
const result = await this.httpService.post('http://user-service/graphql', {
  query: '{ users { id name } }'
});

// Event Publishing
await this.kafkaService.emit('user.created', {
  userId: user.id,
  email: user.email,
});

// Event Consumption
@EventPattern('user.created')
async handleUserCreated(data: UserCreatedEvent) {
  // Handle event
}
```

### GraphQL Federation
```typescript
// Extend type from another service
extend type User @key(fields: "id") {
  id: ID! @external
  posts: [Post!]!
}
```

---

**Last Updated**: 2025-10-10
