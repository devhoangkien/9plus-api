# Setup & Configuration Tasks

## Overview
This checklist covers all tasks related to initial project setup, environment configuration, and infrastructure preparation.

---

## ✅ Task Checklist

### 1. Environment Setup
**Goal**: Development environment fully operational

- [ ] Install Docker and Docker Compose
- [ ] Install Bun runtime (`curl -fsSL https://bun.sh/install | bash`)
- [ ] Install Git and configure credentials
- [ ] Clone repository and initialize submodules
- [ ] Verify all tools are installed correctly

**Reference Documentation**:
- [`development/DEVELOPMENT.md`](../development/DEVELOPMENT.md)
- [`development/ENVIRONMENT_VARIABLES.md`](../development/ENVIRONMENT_VARIABLES.md)

**Actions**:
```bash
# Validate development environment
bun run validate-dev

# Initialize git submodules
git submodule update --init --recursive
```

**Success Criteria**:
- ✅ All required tools installed and accessible
- ✅ Repository cloned with all submodules
- ✅ Validation script passes without errors

---

### 2. Environment Variables Configuration
**Goal**: All services properly configured with environment variables

- [ ] Copy example environment file: `cp example.env .env`
- [ ] Configure database connection strings
- [ ] Set JWT secrets and encryption keys
- [ ] Configure Kafka broker URLs
- [ ] Set Elasticsearch connection details
- [ ] Configure Redis connection
- [ ] Set up OAuth provider credentials (if needed)
- [ ] Configure AWS/S3 credentials (if needed)

**Reference Documentation**:
- [`development/ENVIRONMENT_VARIABLES.md`](../development/ENVIRONMENT_VARIABLES.md)

**Actions**:
```bash
# Generate JWT secret
bun run scripts/generate-jwt-secret.sh

# Setup environment
bun run setup-env
```

**Success Criteria**:
- ✅ `.env` file created with all required variables
- ✅ No missing or invalid environment variables
- ✅ Secrets properly generated and secured

---

### 3. Docker Services Setup
**Goal**: All Docker services running and healthy

- [ ] Build Docker images for all services
- [ ] Start infrastructure services (PostgreSQL, Redis, Kafka, Elasticsearch)
- [ ] Verify infrastructure health checks
- [ ] Start application services (Gateway, Core, Logger, Searcher)
- [ ] Verify inter-service communication

**Reference Documentation**:
- [`development/DEVELOPMENT.md`](../development/DEVELOPMENT.md)

**Actions**:
```bash
# Build and start all services
bun run docker:dev:build
bun run docker:dev:up

# Or use shorthand
bun run dev

# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

**Success Criteria**:
- ✅ All containers running with status "Up"
- ✅ Health checks passing for all services
- ✅ No critical errors in logs
- ✅ Services accessible on configured ports

---

### 4. Database Setup
**Goal**: Database schema initialized with sample data

- [ ] Verify PostgreSQL connection
- [ ] Run Prisma migrations
- [ ] Generate Prisma client
- [ ] Seed initial data (organizations, roles, permissions)
- [ ] Verify database tables created
- [ ] Test database queries

**Reference Documentation**:
- [`development/ORGANIZATION_SEEDING.md`](../development/ORGANIZATION_SEEDING.md)

**Actions**:
```bash
# Run migrations
cd apps/core
bun prisma migrate dev

# Generate Prisma client
bun prisma generate

# Seed database
bun prisma db seed

# Test connection
bun run scripts/test-postgres.sh
```

**Success Criteria**:
- ✅ All migrations applied successfully
- ✅ Prisma client generated
- ✅ Sample data seeded
- ✅ Database accessible from services

---

### 5. Kafka & Event System Setup
**Goal**: Event-driven architecture operational

- [ ] Verify Kafka broker is running
- [ ] Create required Kafka topics
- [ ] Configure Kafka Connect
- [ ] Test producer/consumer connectivity
- [ ] Verify event flow to Elasticsearch

**Reference Documentation**:
- [`architecture/EVENT_DRIVEN_ARCHITECTURE.md`](../architecture/EVENT_DRIVEN_ARCHITECTURE.md)

**Actions**:
```bash
# Setup event-driven architecture
bun run setup-event-driven

# Test event system
bun run test-event-driven

# Access Kafka UI
open http://localhost:8080
```

**Success Criteria**:
- ✅ Kafka broker accessible
- ✅ Topics created successfully
- ✅ Events published and consumed
- ✅ Kafka UI showing topics and messages

---

### 6. ELK Stack Setup
**Goal**: Logging and monitoring infrastructure ready

- [ ] Verify Elasticsearch is running
- [ ] Verify Logstash is running
- [ ] Verify Kibana is accessible
- [ ] Configure log pipelines
- [ ] Create index patterns in Kibana
- [ ] Set up dashboards for monitoring

**Reference Documentation**:
- [`architecture/EVENT_DRIVEN_ARCHITECTURE.md`](../architecture/EVENT_DRIVEN_ARCHITECTURE.md)

**Actions**:
```bash
# Access Kibana
open http://localhost:5601

# Check Elasticsearch status
curl http://localhost:9200/_cluster/health

# View Elasticsearch indices
curl http://localhost:9200/_cat/indices?v
```

**Success Criteria**:
- ✅ Elasticsearch cluster healthy
- ✅ Logstash processing logs
- ✅ Kibana accessible and configured
- ✅ Logs visible in Kibana

---

### 7. GraphQL Gateway Setup
**Goal**: API Gateway operational with federation

- [ ] Verify Gateway service is running
- [ ] Test GraphQL playground access
- [ ] Verify schema federation
- [ ] Test introspection queries
- [ ] Verify subgraph connections

**Reference Documentation**:
- [`../apps/gateway/README.md`](../../apps/gateway/README.md)

**Actions**:
```bash
# Access GraphQL Playground
open http://localhost:3000/graphql

# Test introspection query
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'
```

**Success Criteria**:
- ✅ Gateway running on port 3000
- ✅ GraphQL playground accessible
- ✅ Schema loaded and introspectable
- ✅ Subgraphs connected

---

## 🔍 Validation Commands

After completing all tasks, run these validation commands:

```bash
# Validate entire development environment
bun run validate-dev

# Check all services are running
docker-compose ps

# Check logs for errors
docker-compose logs --tail=100

# Test database connection
bun run test-postgres

# Test event-driven system
bun run test-event-driven

# Access all endpoints
curl http://localhost:3000/health      # Gateway
curl http://localhost:9200/_cluster/health  # Elasticsearch
curl http://localhost:5601/status      # Kibana
```

---

## 🆘 Common Issues

### Docker services won't start
- **Solution**: Check if ports are already in use
- **Command**: `lsof -i :PORT` or `netstat -tuln | grep PORT`

### Database migration fails
- **Solution**: Ensure PostgreSQL is running and accessible
- **Command**: `docker-compose logs postgres`

### Kafka connection issues
- **Solution**: Verify Kafka broker is running and ports are exposed
- **Command**: `docker-compose logs kafka`

### ELK stack not accessible
- **Solution**: Increase Docker memory allocation (recommended: 4GB+)
- **Command**: Check Docker Desktop settings

---

## 📚 Next Steps

Once all setup tasks are complete, proceed to:
- [Authentication & Authorization Tasks](02-auth-authorization.md)
- [Architecture & Services Tasks](03-architecture-services.md)
