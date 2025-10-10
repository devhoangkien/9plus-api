# Development & Deployment Tasks

## Overview
This checklist covers development workflow, testing strategies, CI/CD pipeline, and deployment procedures.

---

## ✅ Task Checklist

### 1. Development Environment Setup
**Goal**: Streamlined development workflow

- [ ] Set up IDE/editor with extensions (ESLint, Prettier, etc.)
- [ ] Configure Git hooks (pre-commit, pre-push)
- [ ] Set up debugging configuration
- [ ] Configure hot reload for development
- [ ] Set up API testing tools (Postman, Insomnia)
- [ ] Configure GraphQL playground
- [ ] Set up database GUI tools
- [ ] Install and configure Bun scripts

**Reference Documentation**:
- [`development/DEVELOPMENT.md`](../development/DEVELOPMENT.md)
- [`development/SCRIPTS.md`](../development/SCRIPTS.md)

**Actions**:
```bash
# Install development dependencies
bun install

# Set up Git hooks
bun run prepare

# Start development mode
bun run dev

# Watch mode for hot reload
bun run dev:watch
```

**VS Code Extensions**:
- ESLint
- Prettier
- GraphQL
- Docker
- Prisma
- GitLens

**Success Criteria**:
- ✅ IDE configured with all extensions
- ✅ Git hooks running on commits
- ✅ Debugging working in IDE
- ✅ Hot reload functional
- ✅ API tools configured
- ✅ GraphQL playground accessible
- ✅ Database tools connected
- ✅ All scripts working

---

### 2. Code Quality & Linting
**Goal**: Maintain consistent code quality

- [ ] Configure ESLint rules
- [ ] Set up Prettier for formatting
- [ ] Configure TypeScript strict mode
- [ ] Add commit message linting
- [ ] Set up code complexity checks
- [ ] Configure import sorting
- [ ] Add spell checking
- [ ] Set up pre-commit hooks

**Reference Documentation**:
- [`development/SCRIPTS.md`](../development/SCRIPTS.md)

**Actions**:
```bash
# Lint all code
bun run lint

# Fix auto-fixable issues
bun run lint:fix

# Format code
bun run format

# Type check
bun run type-check

# Check all at once
bun run check-all
```

**Configuration Files**:
- `eslint.config.mjs` - ESLint rules
- `.prettierrc` - Prettier configuration
- `tsconfig.json` - TypeScript configuration

**Success Criteria**:
- ✅ ESLint configured and running
- ✅ Prettier formatting code
- ✅ TypeScript strict mode enabled
- ✅ Commit messages validated
- ✅ Import order consistent
- ✅ Spell check active
- ✅ Pre-commit hooks preventing bad commits
- ✅ No linting errors in codebase

---

### 3. Testing Strategy Implementation
**Goal**: Comprehensive test coverage

- [ ] Set up unit testing framework (Jest/Vitest)
- [ ] Write unit tests for services
- [ ] Write unit tests for resolvers
- [ ] Set up integration testing
- [ ] Write API integration tests
- [ ] Set up E2E testing framework
- [ ] Write critical path E2E tests
- [ ] Configure test coverage reporting

**Test Types**:
```typescript
// Unit Test Example
describe('UserService', () => {
  it('should create a user', async () => {
    const user = await userService.create({
      email: 'test@example.com',
      name: 'Test User',
    });
    expect(user.email).toBe('test@example.com');
  });
});

// Integration Test Example
describe('User API (Integration)', () => {
  it('should create user via GraphQL', async () => {
    const result = await request(app)
      .post('/graphql')
      .send({
        query: `mutation {
          createUser(input: {
            email: "test@example.com"
            name: "Test User"
          }) {
            id
            email
          }
        }`
      });
    
    expect(result.body.data.createUser.email).toBe('test@example.com');
  });
});

// E2E Test Example
describe('User Registration Flow (E2E)', () => {
  it('should complete registration and login', async () => {
    // Register
    await page.goto('/register');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
```

**Actions**:
```bash
# Run all tests
bun test

# Run with coverage
bun test:cov

# Run specific test file
bun test user.service.spec.ts

# Run E2E tests
bun test:e2e

# Watch mode
bun test:watch
```

**Success Criteria**:
- ✅ Test framework set up
- ✅ Unit tests written (>80% coverage)
- ✅ Integration tests working
- ✅ E2E tests for critical paths
- ✅ Coverage reports generated
- ✅ CI running tests automatically
- ✅ Test data seeding working
- ✅ All tests passing

---

### 4. Scripts Automation
**Goal**: Automate common development tasks

- [ ] Create build scripts
- [ ] Add database migration scripts
- [ ] Create data seeding scripts
- [ ] Add cleanup scripts
- [ ] Create deployment scripts
- [ ] Add health check scripts
- [ ] Create backup scripts
- [ ] Add monitoring scripts

**Reference Documentation**:
- [`development/SCRIPTS.md`](../development/SCRIPTS.md)
- [`scripts/`](../../scripts/)

**Available Scripts**:
```bash
# Build
bun run build              # Build all services
bun run build:core         # Build core service
bun run build:gateway      # Build gateway service

# Development
bun run dev                # Start development environment
bun run dev:core           # Start only core service
bun run docker:dev:up      # Start Docker services

# Database
bun run db:migrate         # Run migrations
bun run db:seed            # Seed database
bun run db:reset           # Reset database
bun run db:studio          # Open Prisma Studio

# Testing
bun run test               # Run tests
bun run test:e2e           # Run E2E tests
bun run test:cov           # Run with coverage

# Utilities
bun run lint               # Lint code
bun run format             # Format code
bun run validate-dev       # Validate dev environment
bun run cleanup            # Clean up artifacts
```

**Custom Script Example**:
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Deploying AnineePlus API..."

# Build
bun run build

# Run tests
bun run test

# Build Docker images
docker-compose -f docker-compose.prod.yaml build

# Push images
docker-compose -f docker-compose.prod.yaml push

# Deploy
kubectl apply -f k8s/

echo "✅ Deployment complete!"
```

**Success Criteria**:
- ✅ All scripts documented
- ✅ Scripts executable
- ✅ Build scripts working
- ✅ Database scripts functional
- ✅ Deployment automated
- ✅ Health checks automated
- ✅ Backup scripts tested
- ✅ Scripts integrated in CI/CD

---

### 5. Docker Development
**Goal**: Containerized development environment

- [ ] Create Dockerfiles for each service
- [ ] Set up docker-compose for development
- [ ] Configure multi-stage builds
- [ ] Optimize image sizes
- [ ] Set up volume mounts for hot reload
- [ ] Configure networking between services
- [ ] Add health checks to containers
- [ ] Set up Docker secrets management

**Reference Documentation**:
- [`apps/core/DOCKER_DEV.md`](../../apps/core/DOCKER_DEV.md)

**Dockerfile Example**:
```dockerfile
# Development stage
FROM oven/bun:1 AS development

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

COPY . .

CMD ["bun", "run", "dev"]

# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --production

COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production

CMD ["bun", "run", "start:prod"]
```

**Actions**:
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart service
docker-compose restart core

# Execute command in container
docker-compose exec core bun run prisma migrate dev

# Stop services
docker-compose down
```

**Success Criteria**:
- ✅ Dockerfiles optimized
- ✅ Docker-compose working
- ✅ Multi-stage builds efficient
- ✅ Image sizes minimized
- ✅ Hot reload working
- ✅ Service networking configured
- ✅ Health checks passing
- ✅ Secrets managed securely

---

### 6. CI/CD Pipeline
**Goal**: Automated testing and deployment

- [ ] Set up GitHub Actions / GitLab CI
- [ ] Configure build pipeline
- [ ] Add automated testing
- [ ] Set up code coverage reporting
- [ ] Configure security scanning
- [ ] Add Docker image building
- [ ] Set up automated deployment
- [ ] Configure rollback procedures

**GitHub Actions Example**:
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Lint
        run: bun run lint
      
      - name: Type check
        run: bun run type-check
      
      - name: Run tests
        run: bun run test:cov
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
  
  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Push to registry
        if: github.ref == 'refs/heads/main'
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker-compose push
  
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to production
        run: |
          # Add deployment commands
          echo "Deploying to production..."
```

**Success Criteria**:
- ✅ CI pipeline configured
- ✅ Tests run automatically
- ✅ Coverage reported
- ✅ Security scans passing
- ✅ Images built and pushed
- ✅ Deployment automated
- ✅ Rollback tested
- ✅ Pipeline fast (<10 minutes)

---

### 7. Production Deployment
**Goal**: Production-ready deployment

- [ ] Set up production environment
- [ ] Configure production database
- [ ] Set up load balancer
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and alerting
- [ ] Configure backup and disaster recovery
- [ ] Set up log aggregation
- [ ] Implement blue-green deployment
- [ ] Configure auto-scaling
- [ ] Set up CDN (if needed)

**Deployment Checklist**:
```markdown
Pre-Deployment:
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Database migrations prepared
- [ ] Backup taken
- [ ] Rollback plan ready
- [ ] Team notified

Deployment:
- [ ] Deploy database migrations
- [ ] Deploy new version
- [ ] Verify health checks
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check performance metrics

Post-Deployment:
- [ ] Verify all services healthy
- [ ] Check logs for errors
- [ ] Verify integrations working
- [ ] Monitor for 24 hours
- [ ] Document any issues
- [ ] Update runbook if needed
```

**Production Environment Variables**:
```bash
# Core settings
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/dbname
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://prod-redis:6379

# Kafka
KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092

# Security
JWT_SECRET=<strong-secret-key>
ENCRYPTION_KEY=<encryption-key>

# Monitoring
SENTRY_DSN=<sentry-dsn>
NEW_RELIC_LICENSE_KEY=<key>

# Feature flags
ENABLE_FEATURE_X=true
```

**Success Criteria**:
- ✅ Production environment configured
- ✅ Database replicated and backed up
- ✅ Load balancer distributing traffic
- ✅ SSL/TLS configured
- ✅ Monitoring active
- ✅ Backups automated
- ✅ Logs centralized
- ✅ Blue-green deployment working
- ✅ Auto-scaling configured
- ✅ CDN serving static assets

---

## 🔍 Validation Commands

Validate development and deployment setup:

```bash
# Validate development environment
bun run validate-dev

# Run all checks
bun run lint && bun run type-check && bun run test

# Build all services
bun run build

# Test Docker setup
docker-compose up -d
docker-compose ps
docker-compose logs

# Test production build
NODE_ENV=production bun run build
NODE_ENV=production bun run start:prod

# Health check
curl http://localhost:3000/health

# Smoke test
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'
```

---

## 🆘 Common Issues

### Build fails
- **Solution**: Check dependencies and TypeScript errors
- **Command**: `bun install && bun run type-check`

### Tests failing in CI
- **Solution**: Ensure test environment matches CI environment
- **Check**: Database connections, environment variables

### Docker containers not starting
- **Solution**: Check logs and port conflicts
- **Command**: `docker-compose logs` and `lsof -i :PORT`

### Deployment fails
- **Solution**: Check deployment logs and rollback if needed
- **Command**: Review CI/CD pipeline logs

---

## 📚 Next Steps

Once development and deployment are set up, proceed to:
- [Plugin System Tasks](07-plugin-system.md)
- Review all tasks and ensure completion
