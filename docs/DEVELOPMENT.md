# Development Setup

This guide explains how to set up the AnineePlus API for development using Docker Compose.

## Prerequisites

- Docker and Docker Compose
- Bun runtime (for local development)
- Git (for submodule management)

## Quick Start

1. **Validate Environment**:
   ```bash
   bun run validate-dev
   ```
   This will check if all required tools are installed and the configuration is correct.

2. **Initialize Git Submodules** (if not already done):
   ```bash
   git submodule update --init --recursive
   ```

3. **Create Environment File**:
   ```bash
   cp example.env .env
   ```
   Edit `.env` as needed for your development environment.

4. **Start Development Environment**:
   ```bash
   # Build and start all services
   bun run docker:dev:build
   bun run docker:dev:up
   
   # Or use the shorthand
   bun run dev
   ```

## Development Environment Features

### Complete Service Setup

The development environment includes all services from the AnineePlus API:

- **API Gateway** - Port 3000 (HTTP/GraphQL endpoint)
- **User Service** - Port 50051 (gRPC microservice) 
- **Payment Service** - Port 50052 (gRPC microservice)
- **PostgreSQL Database** - Port 5432 (Data persistence)
- **Redis Cache** - Port 6379 (Caching layer)

### Hot Reload & Live Development

All application services are configured with volume mounts for automatic code reloading:

- Source code changes are reflected immediately without container rebuilds
- Node modules are cached in Docker volumes for faster startup
- Development-optimized Dockerfiles use Node.js + Bun for reliability
- Watch mode enabled for all services (`start:dev` scripts)

### Production-Like Architecture

- Service-to-service communication via Docker networks
- Proper dependency management with health checks
- Environment-specific configurations
- Microservices can communicate via their internal hostnames

## Available Services

The development environment includes:

- **API Gateway** - Port 3000 (HTTP/GraphQL)
- **User Service** - Port 50051 (gRPC)
- **Payment Service** - Port 50052 (gRPC)
- **PostgreSQL Database** - Port 5432
- **Redis Cache** - Port 6379

## Development Features

### Hot Reload

All application services are configured with volume mounts for automatic code reloading:

- Source code changes are reflected immediately
- No need to rebuild containers for code changes
- Node modules are cached in Docker volumes for faster startup

### Useful Commands

```bash
# Validate development environment
bun run validate-dev

# Start services in foreground (with logs)
bun run docker:dev:up

# Start services in background
bun run docker:dev

# View logs from all services
bun run docker:dev:logs

# Restart a specific service
docker compose -f docker-compose-dev.yaml restart api-gateway

# Stop all services
bun run docker:dev:down

# Rebuild and restart
bun run docker:dev:build && bun run docker:dev:up
```

### Health Checks

All services include health checks:
- API Gateway: HTTP endpoint `/healthz`
- Microservices: gRPC health probe
- Database: PostgreSQL ready check
- Cache: Redis ping

### Networking

Services communicate through Docker networks:
- `frontend`: External facing services (API Gateway)
- `backend`: Internal service communication

## Important Notes

### Git Submodules
The microservices (user-service and payment-service) are Git submodules. If they appear empty:
```bash
git submodule update --init --recursive
```

### Package Dependencies
The development environment uses simplified package.json files (package.docker.json) to avoid Bun-specific dependency issues in Docker. The volume mounts ensure your local source code changes are still reflected in the containers.

### Local vs Container Development
- **Container**: Uses npm for dependency management (more reliable in Docker)
- **Local**: Can still use Bun for local development outside of Docker
- **Hybrid**: Best of both worlds - reliable containers + fast local tools

### Port Configuration
If any ports conflict with existing services on your machine, you can:
1. Modify the port mappings in `docker-compose-dev.yaml`
2. Create a `docker-compose.override.yaml` file (see example provided)

## Troubleshooting

### Submodules Not Initialized
If microservice directories are empty, initialize the submodules:
```bash
git submodule update --init --recursive
```

### Port Conflicts
If ports are already in use, modify the port mappings in `docker-compose-dev.yaml`.

### Permission Issues
Ensure Docker has permission to access the project directory and mount volumes.

### Container Build Issues
Clean rebuild all containers:
```bash
docker compose -f docker-compose-dev.yaml down
docker system prune -f
bun run docker:dev:build --no-cache
```

## File Structure

```
├── api-gateway/
│   ├── Dockerfile.dev          # Development Dockerfile
│   └── src/                    # Source code (mounted as volume)
├── microservices/
│   ├── user-service/
│   │   ├── Dockerfile.dev      # Development Dockerfile
│   │   └── src/                # Source code (mounted as volume)
│   └── payment-service/
│       ├── Dockerfile.dev      # Development Dockerfile
│       └── src/                # Source code (mounted as volume)
├── docker-compose-dev.yaml     # Development compose file
└── .env                        # Environment variables
```