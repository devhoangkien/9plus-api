# Development Guide

Complete guide for setting up and working with the AnineePlus API development environment.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Running Services](#running-services)
6. [Development Workflow](#development-workflow)
7. [Available Scripts](#available-scripts)
8. [Environment Variables](#environment-variables)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Validate environment
bun run validate-dev

# 2. Install dependencies
bun install

# 3. Setup environment
cp example.env .env
# Edit .env with your configuration

# 4. Start all services
bun run dev

# 5. Initialize database
cd apps/core
bun prisma migrate dev
bun prisma db seed
```

Access:
- **Gateway**: http://localhost:3000/graphql
- **Kibana**: http://localhost:5601
- **Kafka UI**: http://localhost:8080

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| **Bun** | >= 1.0.0 | `curl -fsSL https://bun.sh/install \| bash` |
| **Docker** | >= 20.10.0 | [Install Docker](https://docs.docker.com/get-docker/) |
| **Docker Compose** | >= 2.0.0 | Included with Docker Desktop |
| **Git** | >= 2.30.0 | [Install Git](https://git-scm.com/) |

### Recommended Tools

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - GraphQL
  - Docker
  - Prisma
- **Postman** or **Insomnia** for API testing
- **Docker Desktop** for container management
- **Prisma Studio** for database management

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/devhoangkien/anineplus-api.git
cd anineplus-api
```

### 2. Install Dependencies

```bash
# Install for all services
bun install

# Or install per service
cd apps/core && bun install
cd apps/gateway && bun install
```

### 3. Setup Git Hooks

```bash
bun run prepare
```

This sets up pre-commit hooks for:
- Code linting
- Type checking
- Commit message validation

### 4. Configure Environment

```bash
cp example.env .env
```

**Edit `.env` file:**
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/anineplus

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Better Auth
BETTER_AUTH_SECRET=your-auth-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Ports
GATEWAY_PORT=3000
CORE_PORT=4000
```

---

## Database Setup

### 1. Start PostgreSQL

```bash
docker-compose up -d postgres
```

### 2. Run Migrations

```bash
cd apps/core
bun prisma migrate dev
```

### 3. Generate Prisma Client

```bash
bun prisma generate
```

### 4. Seed Database

```bash
bun prisma db seed
```

This creates:
- Default roles (super-admin, admin, user)
- System permissions
- Test organizations
- Sample users

### 5. Access Prisma Studio

```bash
bun prisma studio
```

Opens at http://localhost:5555

---

## Running Services

### Development Mode

**Start all services:**
```bash
bun run dev
```

**Start specific services:**
```bash
bun run dev:gateway    # Gateway only
bun run dev:core       # Core only
bun run dev:logger     # Logger only
bun run dev:searcher   # Searcher only
```

**Start with Docker:**
```bash
# Build and start
docker-compose -f docker-compose-dev.yaml up --build

# Or use helper script
bun run docker:dev:up
```

### Production Mode

```bash
# Build
bun run build

# Start
NODE_ENV=production bun run start:prod
```

---

## Development Workflow

### Daily Development

```bash
# 1. Start services
bun run dev

# 2. Make changes
# Edit files in apps/*/src/

# 3. Test changes
bun test

# 4. Lint and format
bun run lint:fix
bun run format

# 5. Commit
git add .
git commit -m "feat: add new feature"
```

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Develop feature
# ... make changes ...

# 3. Run tests
bun test
bun run test:e2e

# 4. Check quality
bun run lint
bun run type-check

# 5. Commit and push
git add .
git commit -m "feat: implement my feature"
git push origin feature/my-feature

# 6. Create pull request
```

### Database Changes

```bash
# 1. Modify schema in prisma/schema.prisma
# 2. Create migration
bun prisma migrate dev --name add_new_field

# 3. Generate client
bun prisma generate

# 4. Test migration
bun test
```

---

## Available Scripts

### Development

```bash
bun run dev                # Start all services
bun run dev:watch          # Start with hot reload
bun run docker:dev:up      # Start Docker services
bun run docker:dev:down    # Stop Docker services
bun run docker:dev:build   # Build Docker images
```

### Building

```bash
bun run build              # Build all services
bun run build:core         # Build core service
bun run build:gateway      # Build gateway service
bun run build:logger       # Build logger service
bun run build:searcher     # Build searcher service
```

### Testing

```bash
bun test                   # Run all tests
bun test:watch             # Watch mode
bun test:cov               # With coverage
bun test:e2e               # End-to-end tests
bun test:debug             # Debug mode
```

### Code Quality

```bash
bun run lint               # Lint code
bun run lint:fix           # Fix linting issues
bun run format             # Format code
bun run format:check       # Check formatting
bun run type-check         # TypeScript type checking
```

### Database

```bash
bun run db:migrate         # Run migrations
bun run db:migrate:create  # Create migration
bun run db:seed            # Seed database
bun run db:reset           # Reset database
bun run db:studio          # Open Prisma Studio
bun run db:push            # Push schema without migration
```

### Utilities

```bash
bun run validate-dev       # Validate dev environment
bun run cleanup            # Clean build artifacts
bun run generate-jwt       # Generate JWT secret
bun run setup-env          # Interactive env setup
```

---

## Environment Variables

### Core Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment | `development` | ✅ |
| `PORT` | Service port | `3000` | ✅ |
| `DATABASE_URL` | PostgreSQL connection | - | ✅ |
| `REDIS_URL` | Redis connection | - | ✅ |
| `KAFKA_BROKERS` | Kafka brokers | `localhost:9092` | ✅ |
| `JWT_SECRET` | JWT signing secret | - | ✅ |
| `JWT_EXPIRES_IN` | Token expiration | `7d` | ❌ |

### Service URLs

```bash
# Gateway
GATEWAY_URL=http://localhost:3000

# Core Service
CORE_SERVICE_URL=http://localhost:4000

# Logger Service
LOGGER_SERVICE_URL=http://localhost:5000

# Searcher Service
SEARCHER_SERVICE_URL=http://localhost:6000
```

### External Services

```bash
# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=password

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=anineplus-api
KAFKA_GROUP_ID=anineplus-group

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Authentication

```bash
# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUST_HOST=true

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### Optional Features

```bash
# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1
```

---

## Troubleshooting

### Services Won't Start

**Issue**: Docker containers fail to start

```bash
# Check if ports are in use
lsof -i :3000
lsof -i :5432
lsof -i :9092

# Kill processes using ports
kill -9 $(lsof -t -i :3000)

# Restart Docker
docker-compose down
docker-compose up -d
```

### Database Connection Issues

**Issue**: Cannot connect to PostgreSQL

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Test connection
docker-compose exec postgres psql -U postgres -d anineplus
```

### Migration Failures

**Issue**: Prisma migration fails

```bash
# Reset database (WARNING: deletes all data)
bun run db:reset

# Or manually fix
cd apps/core
bun prisma migrate reset
bun prisma migrate dev
```

### Build Errors

**Issue**: TypeScript errors during build

```bash
# Clean and rebuild
rm -rf node_modules bun.lockb dist
bun install
bun run build

# Check types
bun run type-check

# Generate Prisma client
cd apps/core
bun prisma generate
```

### Kafka Issues

**Issue**: Kafka not receiving messages

```bash
# Check Kafka is running
docker-compose ps kafka

# Check logs
docker-compose logs kafka

# List topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Consume messages
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic user.created \
  --from-beginning
```

### Elasticsearch Issues

**Issue**: Elasticsearch not accessible

```bash
# Check status
curl http://localhost:9200/_cluster/health

# Check logs
docker-compose logs elasticsearch

# Restart
docker-compose restart elasticsearch

# Increase memory (in docker-compose.yaml)
environment:
  - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
```

### Hot Reload Not Working

**Issue**: Changes not reflected

```bash
# Restart in watch mode
bun run dev:watch

# Or manually restart
docker-compose restart gateway core
```

---

## Best Practices

### Code Style
- ✅ Follow ESLint rules
- ✅ Use Prettier for formatting
- ✅ Write meaningful variable names
- ✅ Add JSDoc comments for public APIs
- ✅ Keep functions small (< 50 lines)

### Git Workflow
- ✅ Commit frequently with clear messages
- ✅ Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
- ✅ Keep PRs small and focused
- ✅ Write descriptive PR descriptions
- ✅ Delete branches after merge

### Testing
- ✅ Write tests for new features
- ✅ Maintain >80% code coverage
- ✅ Test edge cases
- ✅ Use descriptive test names
- ✅ Mock external dependencies

### Performance
- ✅ Use database indexes
- ✅ Implement caching where appropriate
- ✅ Paginate large result sets
- ✅ Optimize N+1 queries
- ✅ Profile slow operations

---

## Additional Resources

- [Architecture Documentation](../architecture/system-architecture.md)
- [Authentication Guide](../auth/authentication-authorization.md)
- [Task Checklists](../tasks/)
- [API Documentation](../../apps/gateway/README.md)

---

**Last Updated**: 2025-10-10
