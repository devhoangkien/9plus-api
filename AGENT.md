# 9Plus API (NestJS Microservices)

9Plus API is a microservices-based backend built with NestJS, featuring GraphQL Federation, event-driven architecture with Kafka, and comprehensive authentication. The system consists of multiple services orchestrated through an API Gateway.

## Build & Commands

### Development
- Install dependencies: `bun install`
- Start all services: `bun run start:dev` (from root)
- Start specific service: `cd apps/<service> && bun run start:dev`
- Type check: `tsc --noEmit`
- Lint and fix: `bun run lint`

### Build & Production
- Build all: `bun run build`
- Build specific service: `cd apps/<service> && bun run build`
- Start production: `bun run start:prod`

### Testing
- Unit tests: `bun run test`
- E2E tests: `bun run test:e2e`
- Test coverage: `bun run test:cov`

### Database
- Generate Prisma client: `cd apps/core && bunx prisma generate`
- Run migrations: `cd apps/core && bunx prisma migrate dev`
- Prisma Studio: `cd apps/core && bunx prisma studio`
- Reset database: `cd apps/core && bunx prisma migrate reset`

### Development Environment
- **Gateway**: http://localhost:3000/graphql
- **Core Service**: http://localhost:50051/graphql
- **Payment Service**: http://localhost:50052/graphql
- **AI Testing Plugin**: http://localhost:50053/graphql
- **Logger Service**: http://localhost:3004
- **Searcher Service**: http://localhost:3003
- **Kafka**: localhost:9092
- **Elasticsearch**: http://localhost:9200
- **PostgreSQL**: localhost:5432

## Project Structure

```
apps/
├── gateway/          # API Gateway (GraphQL Federation)
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── dynamic-gateway/  # Dynamic service discovery
│   │   ├── services/         # Gateway services
│   │   ├── middleware/       # Request middleware
│   │   └── plugins/          # GraphQL plugins
│   └── .env
├── core/             # Core Service (Users, Auth, Roles, Permissions)
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   ├── users/           # User management
│   │   ├── roles/           # Role management
│   │   ├── permissions/     # Permission management
│   │   ├── organization/    # Organization management
│   │   └── prisma/          # Prisma ORM
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── .env
├── logger/           # Logger Service (Centralized logging)
├── searcher/         # Searcher Service (Elasticsearch integration)

plugins/
└── ai-agent-testing/ # AI Testing Plugin (Standalone service)
    ├── src/
    │   ├── domain/          # Domain layer
    │   ├── application/     # Application layer
    │   └── infrastructure/  # Infrastructure layer
    └── prisma/

libs/
├── common/           # Shared utilities and decorators
├── authorization/    # Authorization guards and decorators
└── kafka/            # Kafka integration

packages/
└── prisma/           # Shared Prisma types
```

## Code Style

### TypeScript
- Use TypeScript strict mode
- Prefer `interface` over `type` for DTOs and entities
- Use PascalCase for classes, camelCase for functions/variables
- Use descriptive names (avoid abbreviations)
- NEVER use `any` - use `unknown` or proper typing
- NEVER use `@ts-ignore` or `@ts-expect-error`

### NestJS Conventions
- Use dependency injection via constructor
- Use decorators for metadata (`@Injectable`, `@Controller`, `@Resolver`)
- Module structure: controllers/resolvers → services → repositories
- Use DTOs for input validation
- Use entities for database models
- Prefix interfaces with `I` (e.g., `IUserService`)

### File Naming
- Modules: `*.module.ts`
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Resolvers: `*.resolver.ts`
- DTOs: `*.dto.ts` or `*.input.ts`
- Entities: `*.entity.ts`
- Guards: `*.guard.ts`
- Decorators: `*.decorator.ts`

### GraphQL Conventions
- Use `@ObjectType()` for return types
- Use `@InputType()` for input types
- Use `@Field()` for all fields
- Use `@Resolver()` for GraphQL resolvers
- Mutations for write operations
- Queries for read operations
- Use proper error handling with GraphQL errors

## Architecture

### Backend Stack
- **Framework**: NestJS
- **API**: GraphQL (Apollo Federation)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Message Queue**: Kafka
- **Search**: Elasticsearch
- **Auth**: JWT with Passport
- **Package Manager**: Bun
- **Runtime**: Node.js

### Microservices Architecture
```
┌─────────────┐
│   Gateway   │ ← GraphQL Federation (Port 3000)
└──────┬──────┘
       │
       ├─────► Core Service (Port 50051)
       │       ├── Authentication
       │       ├── User Management
       │       ├── Roles & Permissions
       │       └── Organization
       │
       ├─────► Payment Service (Port 50052)
       │
       └─────► AI Testing Plugin (Port 50053)
                ├── Projects
                ├── Test Cases
                ├── Test Runs
                └── Model Configs

Event Bus (Kafka)
       ↕
All Services (Event-driven communication)
```

### Authentication Flow
1. Client sends credentials to Gateway
2. Gateway forwards to Core Service
3. Core Service validates and generates JWT
4. JWT contains userId, roles, permissions
5. Gateway validates JWT on subsequent requests
6. Gateway injects userId, permissions into context
7. Services receive authenticated context

### GraphQL Federation
- Gateway stitches schemas from all services
- Each service defines its own schema
- Services can extend types from other services
- Gateway handles query planning and execution
- Automatic schema introspection

## Configuration

### Environment Variables

#### Gateway (.env)
```bash
PORT=3000
GATEWAY_HOST=localhost
GATEWAY_PROTOCOL=http
JWT_SECRET=your-jwt-secret

# Microservice URLs
CORE_SERVICE_URL=http://localhost:50051/graphql
PAYMENT_SERVICE_URL=http://localhost:50052/graphql

# Performance
CACHE_MAX_SIZE=1000
CACHE_TTL_MINUTES=5
REQUEST_TIMEOUT_MS=30000

# Event-Driven
KAFKA_BROKERS=localhost:9092
ELASTICSEARCH_URL=http://localhost:9200
```

#### Core Service (.env)
```bash
PORT=50051
DATABASE_URL=postgresql://user:password@localhost:5432/9plus
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092
```

### Prisma Configuration
Database schema in `apps/core/prisma/schema.prisma`:
- User model with authentication
- Role and Permission models
- Organization model
- Audit fields (createdAt, updatedAt)

## Security

### Authentication
- JWT-based authentication
- Access tokens (short-lived)
- Refresh tokens (long-lived)
- Password hashing with bcrypt
- Two-factor authentication support

### Authorization
- Role-Based Access Control (RBAC)
- Permission-based authorization
- Custom guards (`@AuthGuard`, `@PermissionGuard`)
- Context-based authorization

### Best Practices
- Never commit `.env` files
- Use environment variables for secrets
- Validate all inputs with class-validator
- Sanitize user inputs
- Use parameterized queries (Prisma handles this)
- Rate limiting on API Gateway
- CORS configuration
- Helmet for security headers

## Database

### Prisma ORM
- Type-safe database client
- Automatic migrations
- Schema-first approach
- Relation management
- Transaction support

### Common Operations
```typescript
// Find one
const user = await this.prisma.user.findUnique({ where: { id } })

// Find many with relations
const users = await this.prisma.user.findMany({
  include: { roles: true }
})

// Create
const user = await this.prisma.user.create({
  data: { email, password }
})

// Update
const user = await this.prisma.user.update({
  where: { id },
  data: { email }
})

// Transaction
await this.prisma.$transaction([
  this.prisma.user.create({ data: userData }),
  this.prisma.role.create({ data: roleData })
])
```

## Development Workflow

### Before Committing
1. Run `bun run lint` to fix linting issues
2. Run `bun run test` to ensure tests pass
3. Run `tsc --noEmit` to check types
4. Update Prisma schema if database changes
5. Run migrations: `bunx prisma migrate dev`
6. Test GraphQL endpoints in Playground

### Adding New Service
1. Create new app in `apps/` directory
2. Set up NestJS module structure
3. Configure GraphQL schema
4. Add service URL to Gateway `.env`
5. Update Gateway dynamic discovery
6. Test federation in Gateway

### Adding New Module
1. Generate module: `nest g module <name>`
2. Generate service: `nest g service <name>`
3. Generate resolver: `nest g resolver <name>`
4. Define GraphQL schema
5. Implement business logic
6. Add to parent module imports
7. Write tests

### Database Changes
1. Update `prisma/schema.prisma`
2. Run `bunx prisma migrate dev --name <description>`
3. Run `bunx prisma generate`
4. Update DTOs and entities
5. Update services and repositories
6. Test changes

## Common Tasks

### Create New GraphQL Resolver
```typescript
// user.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import { AuthGuard } from '@anineplus/authorization'

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User)
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.userService.create(input)
  }
}
```

### Create New Service
```typescript
// user.service.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({ data })
  }
}
```

### Add Custom Decorator
```typescript
// current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context)
    return ctx.getContext().req.user
  }
)
```

## Troubleshooting

### Prisma Issues
- Run `bunx prisma generate` after schema changes
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Reset database: `bunx prisma migrate reset`

### GraphQL Federation Issues
- Verify all services are running
- Check service URLs in Gateway .env
- Inspect Gateway logs for federation errors
- Test individual services first

### Authentication Issues
- Verify JWT_SECRET matches across services
- Check token expiration
- Inspect Authorization header format
- Verify user exists in database

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [GraphQL Documentation](https://graphql.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Apollo Federation](https://www.apollographql.com/docs/federation)
- [Kafka Documentation](https://kafka.apache.org/documentation)
