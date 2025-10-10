# AnineePlus API - Documentation

Complete documentation for the AnineePlus API microservices platform.

---

## 📚 Documentation Structure

```
docs/
├── README.md (you are here)
├── tasks/                             # Implementation checklists
│   ├── 01-setup-configuration.md
│   ├── 02-auth-authorization.md
│   ├── 03-architecture-services.md
│   ├── 04-logging-monitoring.md
│   ├── 05-search-indexing.md
│   ├── 06-development-deployment.md
│   └── 07-plugin-system.md
├── auth/                              # Authentication & Authorization
│   └── authentication-authorization.md
├── architecture/                      # System Architecture
│   └── system-architecture.md
└── development/                       # Development Guide
    ├── development-guide.md
    └── change-logs.md
```

---

## 🎯 Quick Navigation

### 📋 [Task Checklists](tasks/)
Detailed implementation tasks organized by topic:
- [Setup & Configuration](tasks/01-setup-configuration.md)
- [Authentication & Authorization](tasks/02-auth-authorization.md)
- [Architecture & Services](tasks/03-architecture-services.md)
- [Logging & Monitoring](tasks/04-logging-monitoring.md)
- [Search & Indexing](tasks/05-search-indexing.md)
- [Development & Deployment](tasks/06-development-deployment.md)
- [Plugin System](tasks/07-plugin-system.md)

### 🔐 [Authentication & Authorization](auth/)
Complete guide for auth implementation:
- Better Auth setup and configuration
- CASL authorization
- Two-level permission system (Global + Organization)
- Permission guards and API reference

### 🏗️ [System Architecture](architecture/)
Architecture and design documentation:
- Microservices overview
- Event-driven architecture with Kafka
- GraphQL Federation
- Service communication patterns

### 🚀 [Development Guide](development/)
Development setup and workflows:
- Environment setup
- Running services
- Available scripts
- Troubleshooting

---

## 🚀 Quick Start

```bash
# 1. Validate environment
bun run validate-dev

# 2. Install dependencies
bun install

# 3. Setup environment
cp example.env .env

# 4. Start services
bun run dev

# 5. Initialize database
cd apps/core
bun prisma migrate dev
bun prisma db seed
```

**Access Points**:
- **Gateway**: http://localhost:3000/graphql
- **Kibana**: http://localhost:5601  
- **Kafka UI**: http://localhost:8080

---

## 📖 Reading Guide

### For New Developers (Start Here)
1. [Development Guide](development/development-guide.md) - Setup environment
2. [System Architecture](architecture/system-architecture.md) - Understand the system
3. [Authentication Guide](auth/authentication-authorization.md) - Learn auth/authz
4. [Task Checklists](tasks/) - Implementation guides

### For AI Agents
1. [Task Checklists](tasks/) - Step-by-step implementation guides
2. [System Architecture](architecture/system-architecture.md) - System overview
3. [Authentication Guide](auth/authentication-authorization.md) - Auth implementation
4. [Development Guide](development/development-guide.md) - Setup and workflows

### For Specific Tasks
- **Setup Project**: [Setup & Configuration Tasks](tasks/01-setup-configuration.md)
- **Implement Auth**: [Authentication & Authorization Tasks](tasks/02-auth-authorization.md)
- **Add Service**: [Architecture & Services Tasks](tasks/03-architecture-services.md)
- **Setup Logging**: [Logging & Monitoring Tasks](tasks/04-logging-monitoring.md)
- **Add Search**: [Search & Indexing Tasks](tasks/05-search-indexing.md)
- **Deploy**: [Development & Deployment Tasks](tasks/06-development-deployment.md)
- **Add Plugin**: [Plugin System Tasks](tasks/07-plugin-system.md)

---

## 🏗️ System Overview

AnineePlus API is a microservices backend built with:
- **NestJS**: Node.js framework
- **GraphQL Federation**: Unified API
- **Apache Kafka**: Event streaming
- **Elasticsearch**: Search and logging
- **PostgreSQL**: Primary database
- **Redis**: Caching

### Architecture

```
Client → Gateway (Port 3000)
    ↓
[Core, Logger, Searcher] Services
    ↓
Kafka → [PostgreSQL, Elasticsearch, Redis]
```

---

## 📝 Key Features

### Authentication & Authorization
- ✅ Better Auth with JWT/Sessions
- ✅ OAuth providers (Google, GitHub)
- ✅ Two-level permission system
- ✅ CASL for authorization
- ✅ Organization multi-tenancy

### Microservices
- ✅ GraphQL Federation
- ✅ Event-driven architecture
- ✅ Service discovery
- ✅ Distributed tracing
- ✅ Circuit breakers

### Observability
- ✅ ELK Stack for logging
- ✅ Request correlation IDs
- ✅ Metrics collection
- ✅ Error tracking
- ✅ Performance monitoring

### Search & Indexing
- ✅ Real-time Elasticsearch indexing
- ✅ Full-text search
- ✅ Fuzzy search
- ✅ Autocomplete
- ✅ Search analytics

---

## 🔗 External Links

### Services
- [Core Service](../apps/core/README.md)
- [Gateway Service](../apps/gateway/README.md)
- [Logger Service](../apps/logger/)
- [Searcher Service](../apps/searcher/)

### Configuration
- [Docker Compose](../docker-compose.yaml)
- [Package.json](../package.json)
- [Scripts](../scripts/)

---

## 🤝 Contributing

When contributing:
1. ✅ Read [Development Guide](development/development-guide.md)
2. ✅ Follow [System Architecture](architecture/system-architecture.md) patterns
3. ✅ Implement [Authentication](auth/authentication-authorization.md) properly
4. ✅ Write tests (>80% coverage)
5. ✅ Update documentation
6. ✅ Run: `bun run lint && bun test`

---

## 🆘 Need Help?

### Common Tasks
- **Can't start services?** → Check [Troubleshooting](development/development-guide.md#troubleshooting)
- **Auth not working?** → See [Authentication Guide](auth/authentication-authorization.md)
- **Need to add feature?** → Follow [Task Checklists](tasks/)
- **Architecture questions?** → Read [System Architecture](architecture/system-architecture.md)

### Support Channels
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: This docs directory

---

## 📅 Project Status

| Component | Status | Documentation |
|-----------|--------|---------------|
| Core Service | ✅ Active | [Core README](../apps/core/README.md) |
| Gateway Service | ✅ Active | [Gateway README](../apps/gateway/README.md) |
| Authentication | ✅ Active | [Auth Guide](auth/authentication-authorization.md) |
| Event System | ✅ Active | [Architecture](architecture/system-architecture.md) |
| ELK Stack | ✅ Active | [Logging Tasks](tasks/04-logging-monitoring.md) |
| Search | ✅ Active | [Search Tasks](tasks/05-search-indexing.md) |
| Plugin System | 🚧 In Progress | [Plugin Tasks](tasks/07-plugin-system.md) |

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-10  
**Maintainer**: DevOps Team

---

**Ready to start? → [Development Guide](development/development-guide.md)**

---

## 📖 Documentation Structure

```
docs/
├── README.md (this file)
├── tasks/                      # Task checklists for implementation
│   ├── 01-setup-configuration.md
│   ├── 02-auth-authorization.md
│   ├── 03-architecture-services.md
│   ├── 04-logging-monitoring.md
│   ├── 05-search-indexing.md
│   ├── 06-development-deployment.md
│   └── 07-plugin-system.md
├── auth/                       # Authentication & Authorization
│   ├── BETTER_AUTH.md
│   ├── AUTH_CONFIG.md
│   ├── AUTHORIZATION_LIBRARY.md
│   ├── DYNAMIC_PERMISSIONS.md
│   ├── DYNAMIC_PERMISSIONS_GUIDE.md
│   ├── DYNAMIC_PERMISSIONS_REFACTOR.md
│   ├── PERMISSION_GUARDS.md
│   ├── ROLE_PERMISSION_SYSTEM.md
│   ├── ACCESS_CONTROL_SUMMARY.md
│   ├── COMPLETE_ACCESS_CONTROL.md
│   ├── UNIFIED_ACCESS_CONTROL.md
│   ├── DYNAMIC_ACCESS_CONTROL.md
│   └── SHARED_GUARDS_EXAMPLE.md
├── architecture/               # System Architecture
│   ├── architecture.md
│   ├── MICROSERVICES_ARCHITECTURE.md
│   ├── EVENT_DRIVEN_ARCHITECTURE.md
│   ├── DYNAMIC_SERVICE_REGISTRY.md
│   └── core.md
└── development/                # Development Guides
    ├── DEVELOPMENT.md
    ├── ENVIRONMENT_VARIABLES.md
    ├── SCRIPTS.md
    ├── ORGANIZATION_SEEDING.md
    └── change-logs.md
```

---

## 📚 Documentation Index

### 🔐 Authentication & Authorization ([`auth/`](auth/))
| File | Description | Priority |
|------|-------------|----------|
| `BETTER_AUTH.md` | Better Auth configuration for authentication | ⭐⭐⭐ |
| `AUTH_CONFIG.md` | Detailed authentication configuration | ⭐⭐⭐ |
| `AUTHORIZATION_LIBRARY.md` | CASL library for authorization | ⭐⭐⭐ |
| `DYNAMIC_PERMISSIONS.md` | Dynamic permission system | ⭐⭐⭐ |
| `DYNAMIC_PERMISSIONS_GUIDE.md` | Guide to using dynamic permissions | ⭐⭐ |
| `DYNAMIC_PERMISSIONS_REFACTOR.md` | Permission system refactoring | ⭐⭐ |
| `PERMISSION_GUARDS.md` | Guards implementation | ⭐⭐⭐ |
| `ROLE_PERMISSION_SYSTEM.md` | Role and permission management | ⭐⭐⭐ |
| `ACCESS_CONTROL_SUMMARY.md` | Access control overview | ⭐⭐ |
| `COMPLETE_ACCESS_CONTROL.md` | Complete access control system | ⭐⭐ |
| `UNIFIED_ACCESS_CONTROL.md` | Unified access control approach | ⭐⭐ |
| `DYNAMIC_ACCESS_CONTROL.md` | Dynamic access control patterns | ⭐⭐ |
| `SHARED_GUARDS_EXAMPLE.md` | Shared guards examples | ⭐ |

### 🏗️ Architecture & Services ([`architecture/`](architecture/))
| File | Description | Priority |
|------|-------------|----------|
| `architecture.md` | System architecture overview | ⭐⭐⭐ |
| `MICROSERVICES_ARCHITECTURE.md` | Detailed microservices architecture | ⭐⭐⭐ |
| `EVENT_DRIVEN_ARCHITECTURE.md` | Event-driven architecture with Kafka & ELK | ⭐⭐⭐ |
| `DYNAMIC_SERVICE_REGISTRY.md` | Service discovery and registration | ⭐⭐ |
| `core.md` | Core service documentation | ⭐⭐⭐ |

### 🚀 Development & Operations ([`development/`](development/))
| File | Description | Priority |
|------|-------------|----------|
| `DEVELOPMENT.md` | Development setup guide | ⭐⭐⭐ |
| `ENVIRONMENT_VARIABLES.md` | Environment variable configuration | ⭐⭐⭐ |
| `SCRIPTS.md` | Automation scripts documentation | ⭐⭐ |
| `ORGANIZATION_SEEDING.md` | Database seeding guide | ⭐⭐ |
| `change-logs.md` | Changelog and version history | ⭐ |

---

## 🎓 Reading Guide for AI/Developers

### 1️⃣ **Starting with a New Project**
```
Reading Order:
1. README.md (this file) - Overview
2. development/DEVELOPMENT.md - Environment setup
3. architecture/architecture.md - Overall architecture
4. architecture/MICROSERVICES_ARCHITECTURE.md - Service details
5. development/ENVIRONMENT_VARIABLES.md - Configuration
```

### 2️⃣ **Implementing Authentication/Authorization**
```
Reading Order:
1. auth/BETTER_AUTH.md - Basic authentication
2. auth/AUTH_CONFIG.md - Detailed configuration
3. auth/AUTHORIZATION_LIBRARY.md - CASL setup
4. auth/DYNAMIC_PERMISSIONS.md - Permission system
5. auth/PERMISSION_GUARDS.md - Guards implementation
6. auth/ROLE_PERMISSION_SYSTEM.md - Role/permission management
7. auth/ACCESS_CONTROL_SUMMARY.md - Final summary
```

### 3️⃣ **Working with Event-Driven Architecture**
```
Reading Order:
1. architecture/EVENT_DRIVEN_ARCHITECTURE.md - Kafka & ELK setup
2. ../apps/searcher/REQUEST_TRACKING.md - Searcher service
3. ../apps/core/REQUEST_TRACKING.md - Core service events
4. ../apps/gateway/REQUEST_TRACKING_SUMMARY.md - Gateway tracing
```

### 4️⃣ **Development & Debugging**
```
Reading Order:
1. development/DEVELOPMENT.md - Development environment
2. development/SCRIPTS.md - Available scripts
3. ../apps/core/DOCKER_DEV.md - Docker development
4. ../apps/gateway/GATEWAY_OPTIMIZATIONS.md - Performance tuning
```

---

## 🔗 Quick Links

### Services Documentation
- [Core Service](../apps/core/README.md)
- [Gateway Service](../apps/gateway/README.md)
- [Logger Service](../apps/logger/)
- [Searcher Service](../apps/searcher/)

### Configuration Files
- [Docker Compose](../docker-compose.yaml)
- [Package.json](../package.json)
- [Environment Variables](development/ENVIRONMENT_VARIABLES.md)

### Scripts
- [Build Script](../scripts/build.sh)
- [Setup Environment](../scripts/setup-env.sh)
- [Event-Driven Setup](../scripts/setup-event-driven.sh)

---

## 📝 Notes for AI Developers

### When Implementing New Features:

1. **Identify the Right Service**: Read `architecture/MICROSERVICES_ARCHITECTURE.md` to determine which service owns the feature
2. **Check Authentication/Authorization**: Review `auth/PERMISSION_*` files to implement proper access control
3. **Event Handling**: If events are needed, consult `architecture/EVENT_DRIVEN_ARCHITECTURE.md`
4. **Testing**: Reference test examples in service directories
5. **Documentation**: Update relevant docs after implementation

### Common Tasks:

- **Add New GraphQL Resolver**: Check `architecture/core.md` and examples in `apps/core/src/`
- **Add New Permission**: Follow `auth/DYNAMIC_PERMISSIONS_GUIDE.md`
- **Setup New Service**: Follow patterns in `architecture/MICROSERVICES_ARCHITECTURE.md`
- **Debug Issues**: Check logs in `apps/*/logs/` and Kibana dashboard
- **Database Changes**: Use Prisma migrations in `apps/core/prisma/`

---

## 🆘 Troubleshooting

### Service Won't Start
1. Check `development/DEVELOPMENT.md` - Validate environment
2. Check logs: `docker-compose logs -f [service-name]`
3. Verify `.env` configuration from `development/ENVIRONMENT_VARIABLES.md`

### Authentication Issues
1. Read `auth/AUTH_CONFIG.md` - Check JWT configuration
2. Verify Better Auth setup in `auth/BETTER_AUTH.md`
3. Check session/token in database

### Permission Denied Errors
1. Review `auth/PERMISSION_GUARDS.md` - Verify guards setup
2. Check `auth/DYNAMIC_PERMISSIONS.md` - Verify user permissions
3. Debug with `auth/ACCESS_CONTROL_SUMMARY.md`

### Kafka/ELK Issues
1. Check `architecture/EVENT_DRIVEN_ARCHITECTURE.md` - Verify setup
2. Check Kafka UI: http://localhost:8080
3. Check Kibana: http://localhost:5601

---

## 📊 Project Status

| Component | Status | Documentation |
|-----------|--------|---------------|
| Core Service | ✅ Active | `architecture/core.md` |
| Gateway Service | ✅ Active | `../apps/gateway/README.md` |
| Authentication | ✅ Active | `auth/BETTER_AUTH.md` |
| Authorization | ✅ Active | `auth/AUTHORIZATION_LIBRARY.md` |
| Event System | ✅ Active | `architecture/EVENT_DRIVEN_ARCHITECTURE.md` |
| ELK Stack | ✅ Active | `architecture/EVENT_DRIVEN_ARCHITECTURE.md` |
| Payment Plugin | 🚧 In Progress | `../plugins/payment/` |

---

## 🤝 Contributing

When contributing new code:

1. ✅ Follow architecture patterns in `architecture/MICROSERVICES_ARCHITECTURE.md`
2. ✅ Implement proper authentication/authorization
3. ✅ Add event publishing if needed
4. ✅ Write tests
5. ✅ Update documentation
6. ✅ Run linting: `bun run lint`
7. ✅ Verify with `bun run validate-dev`

---

## 📅 Last Updated

**Date**: 2025-10-10  
**Version**: 1.0.0  
**Maintainer**: DevOps Team

---

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: `/docs` directory

---

**Happy Coding! 🚀**
