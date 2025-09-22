# ANINEPLUS EDU CMS API

**A comprehensive educational content management system built with NestJS GraphQL microservices architecture**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)](https://bun.sh/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
[![GraphQL](https://img.shields.io/badge/GraphQL-16+-pink.svg)](https://graphql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

## 🏗️ Architecture Overview

This project implements a **microservices architecture** using GraphQL Federation, designed for scalability and modularity in educational content management.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │────│   User Service   │    │ Payment Service │
│  (GraphQL Fed)  │    │     (gRPC)       │    │     (gRPC)      │
│     :3000       │    │     :50051       │    │     :50052      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ PostgreSQL DB   │    │  Redis Cache     │    │ Shared Libraries│
│   :5432         │    │    :6379         │    │ (@bune/common)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 🧩 Core Components

- **API Gateway**: GraphQL Federation gateway handling client requests and service orchestration
- **User Service**: Handles authentication, user management, and authorization
- **Payment Service**: Manages payment processing and subscription logic
- **Shared Libraries**: Common utilities, validation, and authorization logic
- **PostgreSQL**: Primary database for persistent data storage
- **Redis**: Caching layer for improved performance

## 📁 Project Structure

```
anineplus-api/
├── apps/                       # Applications (Git submodules)
│   ├── api-gateway/           # GraphQL Federation Gateway
│   │   ├── src/
│   │   │   ├── main.ts         # Application entry point
│   │   │   ├── app.module.ts   # Main application module
│   │   │   └── common/         # Gateway-specific utilities
│   ├── Dockerfile              # Container configuration
│   └── package.json            # Dependencies and scripts
├── apps/                       # Applications (Git submodules)
│   ├── core-service/           # User management microservice
│   └── payment-service/        # Payment processing microservice
├── libs/                       # Shared libraries
│   ├── common/                 # Common utilities and services
│   │   ├── src/
│   │   │   ├── logger.service.ts
│   │   │   ├── validation.ts
│   │   │   └── constants/
│   │   └── package.json
│   └── casl-authorization/     # Authorization framework
│       ├── src/
│       │   ├── casl.guard.ts
│       │   └── check-permissions.decorator.ts
│       └── package.json
├── scripts/                    # Build and setup scripts
│   ├── setup-env.sh           # Environment setup
│   ├── install.sh             # Dependencies installation
│   ├── build.sh               # Build all services
│   └── lint.sh                # Code linting
├── docs/                       # Documentation
│   ├── core-service.md        # User service API docs
│   └── change-logs.md         # Version history
├── docker-compose.yaml        # Production container orchestration
├── docker-compose-dev.yaml    # Development container orchestration
├── example.env                # Environment variables template
├── .gitmodules                # Git submodules configuration
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** (v20 or higher)
- **Bun** (v1.0 or higher) - [Install Bun](https://bun.sh/docs/installation)
- **Docker** and **Docker Compose**
- **Git** with submodule support

### 📦 Installation

1. **Clone the repository with submodules**:
   ```bash
   git clone https://github.com/anineplus/anineplus-api.git
   cd anineplus-api
   git submodule update --init --recursive
   ```

2. **Set up environment variables**:
   ```bash
   # Copy environment files manually or use the script
   cp example.env .env
   cd apps/api-gateway && cp example.env .env && cd ..
   # Note: Microservice env files will be created when submodules are properly initialized
   
   # Or use the automated script (requires Bun)
   bun run env
   ```

3. **Install dependencies** (choose one method):
   
   **Method A: Using Bun (recommended)**:
   ```bash
   # Install Bun if not already installed
   curl -fsSL https://bun.sh/install | bash
   
   # Install dependencies and link libraries
   bun run bune-i
   ```
   
   **Method B: Using npm/node**:
   ```bash
   cd apps/api-gateway && npm install && cd ..
   # Microservice dependencies will be available once submodules are initialized
   ```

4. **Start the development environment**:
   ```bash
   # Using Docker (recommended for complete environment)
   docker compose -f docker-compose-dev.yaml up -d
   
   # Or build and start everything (requires Bun)
   bun start
   ```

## 🛠️ Development

> **📖 For detailed development setup with hot reload, see [DEVELOPMENT.md](./DEVELOPMENT.md)**

The development environment supports automatic code reloading and includes all services:
- API Gateway (port 3000) - GraphQL endpoint
- User Service (port 50051) - gRPC microservice  
- Payment Service (port 50052) - gRPC microservice
- PostgreSQL (port 5432) - Database
- Redis (port 6379) - Cache

### Quick Development Start

```bash
# Validate your environment
bun run validate-dev

# Start development environment with hot reload
bun run docker:dev:build  # First time only
bun run dev              # Start all services
```

### Available Scripts

| Command | Description | Requirements |
|---------|-------------|--------------|
| `bun run env` | Set up environment files from examples | Bun |
| `bun run libs-i` | Link shared libraries between services | Bun |
| `bun run bune-i` | Install all dependencies and link libraries | Bun |
| `bun run bune-lint` | Run linting across all services | Bun |
| `bun run bune-build` | Build all services | Bun |
| `docker compose build` | Build Docker images | Docker |
| `docker compose up -d` | Start production containers | Docker |
| `docker compose -f docker-compose-dev.yaml up -d` | Start development containers | Docker |
| `docker compose down` | Stop and remove containers | Docker |
| `bun start` | Complete setup and start production | Bun + Docker |

### Development Workflow

1. **Start development containers**:
   ```bash
   docker compose -f docker-compose-dev.yaml up -d
   ```

2. **Monitor logs**:
   ```bash
   docker compose -f docker-compose-dev.yaml logs -f
   ```

3. **Access services**:
   - API Gateway: http://localhost:3000
   - GraphQL Playground: http://localhost:3000/graphql

### Working with Submodules

This project uses Git submodules for applications. To work with them:

```bash
# Initialize and update submodules
git submodule update --init --recursive

# Update submodules to latest commits
git submodule update --remote --recursive

# Work in a specific submodule
cd apps/core-service
git checkout main
# Make changes, commit, and push
git add .
git commit -m "Your changes"
git push origin main

# Update parent repository to reference new submodule commit
cd ../..
git add apps/core-service
git commit -m "Update core-service submodule"
git push
```

## 🔧 Configuration

### Environment Variables

The project uses environment files for configuration. Key variables include:

#### Database Configuration
```env
DB_HOST=user-database
DB_PORT=5432
DB_USERNAME=bune-cms
DB_PASSWORD=bune-cms
DB_DATABASE=user-svc
DB_SCHEMA=public
DB_SYNC=true
```

#### Redis Configuration
```env
REDIS_HOST=cache-service
REDIS_PORT=6379
```

#### JWT Authentication
```env
JWT_ACCESSTOKEN_SECRET=your-access-token-secret
JWT_REFRESHTOKEN_SECRET=your-refresh-token-secret
JWT_ISSUER=application
JWT_AUDIENCE=public
```

#### Service URLs
```env
USERS_SVC_URL=user-service:50051
PAYMENTS_SVC_URL=payment-service:50051
```

### 🔐 Generating JWT Secrets

Generate secure JWT secrets using the provided script:
```bash
bash scripts/generate-jwt-secret.sh
```

## 📋 Services Documentation

### API Gateway

The API Gateway serves as the entry point for all client requests, implementing GraphQL Federation to combine schemas from multiple microservices.

**Features:**
- GraphQL Federation gateway
- Request routing and load balancing
- Authentication middleware
- Rate limiting and caching
- Health checks

**Endpoints:**
- `GET /healthz` - Health check endpoint
- `POST /graphql` - GraphQL endpoint
- `GET /graphql` - GraphQL Playground (development only)

### User Service

Handles all user-related operations including authentication, profile management, and authorization.

**Features:**
- User registration and authentication
- JWT token management
- Role-based access control (RBAC)
- Password reset functionality
- User profile management

**gRPC Port:** 50051

For detailed API documentation, see [Core Service Documentation](docs/core-service.md).

### Payment Service

Manages payment processing, subscription management, and billing operations.

**Features:**
- Payment processing
- Subscription management
- Invoice generation
- Payment history tracking
- Webhook handling

**gRPC Port:** 50052

## 📚 API Usage Examples

### GraphQL API

The API Gateway provides a unified GraphQL endpoint that federates schemas from all microservices.

#### Basic User Operations

```graphql
# User Registration
mutation RegisterUser {
  registerUser(input: {
    username: "johndoe"
    email: "john@example.com"
    password: "securepassword123"
  }) {
    id
    username
    email
    createdAt
  }
}

# User Login
mutation LoginUser {
  loginUser(input: {
    email: "john@example.com"
    password: "securepassword123"
  }) {
    accessToken
    refreshToken
    user {
      id
      username
      email
    }
  }
}

# Get User Profile
query GetUserProfile($id: ID!) {
  user(id: $id) {
    id
    username
    email
    roles
    profile {
      firstName
      lastName
      avatar
    }
  }
}
```

#### Payment Operations

```graphql
# Create Payment
mutation CreatePayment {
  createPayment(input: {
    amount: 2999
    currency: "USD"
    description: "Course subscription"
    userId: "user-id-here"
  }) {
    id
    amount
    status
    paymentUrl
  }
}

# Get Payment History
query GetPaymentHistory($userId: ID!) {
  paymentHistory(userId: $userId) {
    id
    amount
    status
    createdAt
    description
  }
}
```

### REST API Endpoints

#### Health Check
```bash
curl -X GET http://localhost:3000/healthz
```

#### GraphQL Endpoint
```bash
# Query via curl
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "query": "query { user(id: \"1\") { username email } }"
  }'
```

### Authentication

All protected operations require a JWT token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 Testing

### Running Tests

```bash
# Install dependencies first
cd apps/api-gateway && npm install

# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Watch mode for development
npm run test:watch

# For applications (when submodules are initialized)
cd apps/core-service && npm test
cd apps/payment-service && npm test
```

### Test Structure

```
test/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for service interactions
└── e2e/           # End-to-end tests for complete workflows
```

### Testing with Docker

```bash
# Run tests in Docker environment
docker compose -f docker-compose-dev.yaml up -d
docker compose exec api-gateway npm test
```

## 🐳 Docker Deployment

### Production Deployment

1. **Build images**:
   ```bash
   docker compose build
   ```

2. **Start services**:
   ```bash
   docker compose up -d
   ```

3. **Verify deployment**:
   ```bash
   curl http://localhost:3000/healthz
   ```

### Development with Docker

For development with hot reloading:
```bash
docker compose -f docker-compose-dev.yaml up -d
```

### Container Health Checks

All services include health checks:
- **API Gateway**: HTTP health endpoint
- **User Service**: gRPC health probe
- **Databases**: Connection verification

## 📊 Monitoring and Logging

### Logging

The application uses structured logging with different levels:

- **Error**: Critical errors and exceptions
- **Warn**: Warning conditions
- **Info**: General application flow
- **Debug**: Detailed debugging information

### Accessing Logs

```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f api-gateway
docker compose logs -f core-service

# View logs for development environment
docker compose -f docker-compose-dev.yaml logs -f
```

## 🔒 Security Considerations

### Authentication & Authorization

- **JWT Tokens**: Short-lived access tokens with refresh token rotation
- **Role-Based Access Control (RBAC)**: Implemented via CASL authorization library
- **Password Security**: Bcrypt hashing with salt rounds
- **Rate Limiting**: Implemented at API Gateway level

### Environment Security

```bash
# Generate secure JWT secrets
bash scripts/generate-jwt-secret.sh

# Use strong database credentials
DB_PASSWORD=your-strong-password-here

# Enable SSL in production
NODE_ENV=production
```

### Best Practices

1. **Never commit `.env` files** - Use example files instead
2. **Rotate JWT secrets** regularly in production
3. **Use HTTPS** in production environments
4. **Implement proper CORS** policies
5. **Keep dependencies updated** - Run `npm audit` regularly

## ⚡ Performance Optimization

### Caching Strategy

- **Redis Caching**: Implemented for frequently accessed data
- **GraphQL Query Caching**: Automatic caching of repeated queries
- **Database Optimization**: Proper indexing and query optimization

### Monitoring

```bash
# Monitor container resources
docker stats

# Check service health
curl http://localhost:3000/healthz

# Monitor logs for performance issues
docker compose logs -f --tail=100
```

### Scaling Recommendations

1. **Horizontal Scaling**: Run multiple instances behind a load balancer
2. **Database Optimization**: Use read replicas for read-heavy workloads
3. **Service Mesh**: Consider Istio for production deployments
4. **CDN Integration**: For static asset delivery

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### 2. Docker Build Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker compose build --no-cache
```

#### 3. Database Connection Issues
```bash
# Check database container status
docker compose ps

# Reset database
docker compose down -v
docker compose up -d user-database
```

#### 4. Submodule Issues
```bash
# Update submodules
git submodule update --remote --recursive

# Reset submodules
git submodule foreach --recursive git clean -fd
git submodule foreach --recursive git reset --hard
```

### Debug Mode

Run services in debug mode:
```bash
# API Gateway debug mode
cd apps/api-gateway && bun debug

# User Service debug mode
cd apps/core-service && bun debug
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the coding standards and run linting: `bun run bune-lint`
4. Write tests for new functionality
5. Ensure all tests pass: `bun run test`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests for new features
- Document public APIs and complex logic
- Follow conventional commit messages

### Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure CI/CD checks pass
4. Request review from maintainers
5. Address feedback and merge conflicts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **DevHoangKien** - *Initial work* - [devhoangkien](https://github.com/devhoangkien)

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- GraphQL Federation for microservices composition
- The open-source community for inspiration and tools

## 📞 Support

For support and questions:

- **Issues**: [GitHub Issues](https://github.com/anineplus/anineplus-api/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anineplus/anineplus-api/discussions)
- **Email**: devhoangkien@gmail.com

---

**Made with ❤️ for educational technology**
