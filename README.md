<div align="center">

# 9Plus API

**A scalable microservices-based CMS backend built with NestJS, GraphQL Federation, and event-driven architecture**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-E0234E.svg)](https://nestjs.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[Features](#-key-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

9Plus API is a modular, production-ready CMS backend built with microservices architecture. It features GraphQL Federation, event-driven messaging with Kafka, full-text search with Elasticsearch, and a dynamic plugin system.

### ✨ Key Features

- 🏗️ **Microservices Architecture** - GraphQL Federation for service composition
- 🔌 **Plugin System** - Extensible architecture with dynamic plugin loading
- 🔐 **Authentication & Authorization** - JWT-based auth with CASL for RBAC
- 🔍 **Full-Text Search** - Elasticsearch integration for fast search
- 📊 **Event-Driven** - Apache Kafka for asynchronous messaging
- 📝 **Observability** - Structured logging and monitoring
- 🐳 **Container-Ready** - Docker and Docker Compose support

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ or **Bun** 1.0+
- **Docker** and **Docker Compose**
- **Git** with submodule support

### 📦 Quick Setup

```bash
git clone --recursive https://github.com/devhoangkien/9plus-api.git
cd 9plus-api
bun run env:setup
bun run install:all
docker compose up -d
```

**📖 For detailed setup instructions, see [Development Guide](./docs/development/)**

---

## 📚 Documentation

- **[Development Guide](./docs/development/)** - Setup, configuration, and workflow
- **[Architecture](./docs/architecture/)** - System design and microservices
- **[Authentication & Authorization](./docs/auth/)** - Security implementation
- **[Task Checklists](./docs/tasks/)** - Implementation guides

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run linting: `bun run app:lint`
5. Commit with conventional commits: `git commit -m 'feat: add new feature'`
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with these amazing open-source technologies:
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [GraphQL](https://graphql.org/) - Query language for APIs
- [Apache Kafka](https://kafka.apache.org/) - Event streaming platform
- [Elasticsearch](https://www.elastic.co/) - Search and analytics engine
- [PostgreSQL](https://www.postgresql.org/) - Relational database
- [Redis](https://redis.io/) - In-memory data store
- [Docker](https://www.docker.com/) - Container platform

---

<div align="center">

**⭐ If you find this project helpful, please consider giving it a star!**

Made with ❤️ by [DevHoangKien](https://github.com/devhoangkien)

[⬆ Back to Top](#9plus-api)

</div>
