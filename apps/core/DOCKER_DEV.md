# Development Docker Setup

## dockerfile.dev

A development-focused Docker configuration using the latest Bun runtime with Prisma support.

### Features

- **Base Image**: `oven/bun:latest` for optimal Bun runtime support
- **Prisma Integration**: Automatic `bunx prisma generate` execution
- **OpenSSL Support**: Pre-installed SSL certificates for secure database connections
- **Development Environment**: Configured for hot reloading with `bun run dev`
- **Error Resilience**: Graceful handling of optional dependencies and network issues

### Usage

Build the development image:
```bash
docker build -f dockerfile.dev -t user-service-dev .
```

Run the development container:
```bash
docker run -p 3000:3000 --env-file .env user-service-dev
```

### Environment Variables

- `PORT`: Application port (default: 3000)
- `NODE_ENV`: Set to 'development' by default
- `DATABASE_URL`: Required for Prisma database connection

### Compatibility

This dockerfile is designed to work in conjunction with PR @anineplus/anineplus-api/pull/2 and supports the full user-service development workflow.