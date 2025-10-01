# AnineePlus API - Scripts Documentation

## 📋 Available Scripts

### 🚀 Quick Start

```bash
# Complete setup and start (recommended for first time)
bun run dev:full

# Test the complete system
bun run test:full

# Verify environment health
bun run verify
```

### 🔧 Setup Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Environment Setup** | `bun run env:setup` | Setup all .env files from .env.example |
| **Dependencies** | `bun run install:all` | Install dependencies for all services |
| **Link Libraries** | `bun run i:libs` | Link shared libraries between services |
| **Event-Driven Setup** | `bun run event-driven:setup` | Setup Kafka + ELK infrastructure |
| **Make Executable** | `bun run make-executable` | Make all scripts executable |

### 🏗️ Build & Development

| Script | Command | Description |
|--------|---------|-------------|
| **Validate Environment** | `bun run validate` | Check if development environment is ready |
| **Build All** | `bun run app:build` | Build all services and plugins |
| **Lint All** | `bun run app:lint` | Run linting and code quality checks |
| **Verify System** | `bun run verify` | Health check for running services |

### 🚀 Run Services (Individual)

| Service | Command | Description |
|---------|---------|-------------|
| **Core API** | `bun run core` | Start Core service in development mode |
| **Gateway** | `bun run gateway` | Start API Gateway service |
| **Searcher** | `bun run searcher` | Start Searcher service (Kafka → Elasticsearch) |
| **Logger** | `bun run logger` | Start Logger service (Log aggregation) |
| **Payment** | `bun run payment` | Start Payment plugin |

### 🎯 Event-Driven Architecture

| Script | Command | Description |
|--------|---------|-------------|
| **Setup Infrastructure** | `bun run event-driven:setup` | Setup Kafka, Elasticsearch, Kibana |
| **Start Development** | `bun run event-driven:start` | Start all services in event-driven mode |
| **Test System** | `bun run event-driven:test` | Test complete event-driven architecture |
| **Development Mode** | `bun run event-driven:dev` | Alias for event-driven:start |

### 🏗️ Infrastructure Management

| Script | Command | Description |
|--------|---------|-------------|
| **Kafka + Zookeeper** | `bun run infra:kafka` | Start Kafka infrastructure |
| **ELK Stack** | `bun run infra:elk` | Start Elasticsearch, Logstash, Kibana |
| **All Infrastructure** | `bun run infra:up` | Start all infrastructure services |
| **Stop Infrastructure** | `bun run infra:down` | Stop all infrastructure services |
| **Infrastructure Logs** | `bun run infra:logs` | View infrastructure logs |
| **Infrastructure Status** | `bun run infra:status` | Check infrastructure service status |

### 🐳 Docker Commands

| Script | Command | Description |
|--------|---------|-------------|
| **Build Images** | `bun run docker:build` | Build all Docker images |
| **Start Production** | `bun run docker:start` | Start services in production mode |
| **Development Mode** | `bun run docker:dev` | Start services in development mode |
| **Build Dev Images** | `bun run docker:dev:build` | Build development Docker images |
| **Dev Logs** | `bun run docker:dev:logs` | View development container logs |
| **Stop Development** | `bun run docker:dev:down` | Stop development containers |
| **Restart Development** | `bun run docker:dev:restart` | Restart development containers |

### 🧹 Maintenance

| Script | Command | Description |
|--------|---------|-------------|
| **Cleanup** | `bun run cleanup` | Interactive cleanup of environment |
| **Validate** | `bun run validate` | Validate development environment |
| **Verify** | `bun run verify` | Comprehensive system health check |

## 🎯 Common Workflows

### First Time Setup

```bash
# 1. Make scripts executable
bun run make-executable

# 2. Setup environment
bun run env:setup

# 3. Install dependencies
bun run install:all

# 4. Setup event-driven architecture
bun run event-driven:setup

# 5. Start development
bun run event-driven:start
```

### Daily Development

```bash
# Start development environment
bun run event-driven:dev

# In another terminal - verify everything is running
bun run verify

# Run tests
bun run test:full
```

### Troubleshooting

```bash
# Check environment
bun run validate

# Clean and restart
bun run cleanup
bun run dev:full

# Check specific service logs
bun run docker:dev:logs
```

### Production Deployment

```bash
# Build everything
bun run app:build

# Start production services
bun run docker:build
bun run docker:start
```

## 📊 Service Ports

| Service | Port | Health Check |
|---------|------|--------------|
| Core API | 3000 | http://localhost:3000/health |
| Gateway | 3001 | http://localhost:3001/health |
| Searcher | 3002 | TCP check |
| Logger | 3003 | TCP check |
| Payment Plugin | 3100 | http://localhost:3100/health |
| Kafka | 9092 | TCP check |
| Zookeeper | 2181 | TCP check |
| Elasticsearch | 9200 | http://localhost:9200 |
| Kibana | 5601 | http://localhost:5601 |
| Logstash | 5044 | TCP check |

## 🔍 Monitoring & Debugging

### View Logs

```bash
# All services
bun run docker:dev:logs

# Infrastructure only
bun run infra:logs

# Specific service
docker logs <container-name> -f
```

### Health Checks

```bash
# Complete system verification
bun run verify

# Quick validation
bun run validate

# Infrastructure status
bun run infra:status
```

### Access UIs

- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200
- **Core API GraphQL**: http://localhost:3000/graphql
- **Gateway GraphQL**: http://localhost:3001/graphql

## 🚨 Common Issues

### Port Conflicts
If ports are already in use, check with:
```bash
bun run verify
```

### Docker Issues
```bash
# Restart Docker
bun run docker:dev:restart

# Clean rebuild
bun run cleanup
bun run docker:dev:build
```

### Dependencies Issues
```bash
# Reinstall all
bun run cleanup
bun run install:all
```

### Permission Issues (Linux/Mac)
```bash
bun run make-executable
```