# Development Documentation

This directory contains guides for development setup and workflows.

---

## 📚 Documentation

### [Development Guide](development-guide.md) 

**Complete development guide covering**:
- **Quick Start**: Get up and running in minutes
- **Prerequisites**: Required software and tools
- **Environment Setup**: Installation and configuration
- **Database Setup**: Migrations, seeding, Prisma Studio
- **Running Services**: Development and production modes
- **Development Workflow**: Daily tasks and feature development
- **Available Scripts**: Complete script reference
- **Environment Variables**: Configuration reference
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: Code style, git workflow, testing

This guide also includes content previously in `change-logs.md`.

---

## 🚀 Quick Reference

### Start Development
```bash
bun run validate-dev  # Validate environment
bun install           # Install dependencies
cp example.env .env   # Setup environment
bun run dev          # Start all services
```

### Common Commands
```bash
bun test             # Run tests
bun run lint         # Lint code
bun run format       # Format code
bun run db:migrate   # Run migrations
bun run db:seed      # Seed database
```

### Access Points
- **Gateway**: http://localhost:3000/graphql
- **Kibana**: http://localhost:5601
- **Kafka UI**: http://localhost:8080
- **Prisma Studio**: http://localhost:5555

---

## 🔗 Related Documentation

- [Task Checklist: Setup & Configuration](../tasks/01-setup-configuration.md)
- [Task Checklist: Development & Deployment](../tasks/06-development-deployment.md)
- [Architecture Overview](../architecture/architecture.md)

---

## 📝 Development Workflow

### Feature Development
1. Create feature branch: `git checkout -b feature/my-feature`
2. Implement changes
3. Write tests
4. Run quality checks: `bun run lint && bun test`
5. Commit with meaningful message
6. Push and create PR
7. Address review comments
8. Merge when approved

### Bug Fix
1. Create bugfix branch: `git checkout -b bugfix/issue-123`
2. Reproduce bug
3. Write failing test
4. Fix bug
5. Verify test passes
6. Follow feature workflow steps 4-8

---

## 🎓 Best Practices

### Code Quality
- ✅ Follow ESLint rules
- ✅ Use Prettier for formatting
- ✅ Write meaningful commit messages
- ✅ Add JSDoc comments for public APIs
- ✅ Keep functions small and focused

### Testing
- ✅ Write tests for new features
- ✅ Maintain >80% code coverage
- ✅ Test edge cases
- ✅ Use descriptive test names
- ✅ Mock external dependencies

### Git
- ✅ Commit frequently with clear messages
- ✅ Keep PRs focused and small
- ✅ Rebase before pushing
- ✅ Resolve conflicts locally
- ✅ Delete branches after merge

---

**Last Updated**: 2025-10-10
