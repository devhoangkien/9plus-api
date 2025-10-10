# Authentication & Authorization Documentation

This directory contains comprehensive documentation for authentication and authorization systems in the AnineePlus API.

---

## 📚 Documentation

### [Authentication & Authorization Guide](authentication-authorization.md)

**Complete guide covering**:
- **Authentication**: Better Auth setup, JWT, sessions, OAuth
- **Authorization**: CASL implementation, permission system
- **Access Control**: Two-level system (Global + Organization)
- **Implementation**: Step-by-step guide with code examples
- **API Reference**: GraphQL mutations and queries
- **Best Practices**: Security, performance, testing

This consolidated document replaces all previous auth documentation files.

---

## 🔑 Key Concepts

### Authentication
- **JWT Tokens**: Stateless authentication tokens
- **Sessions**: Server-side session management
- **OAuth**: Third-party authentication (Google, GitHub, etc.)
- **2FA**: Two-factor authentication (optional)

### Authorization
- **CASL**: Permission management library
- **Abilities**: What a user can do
- **Subjects**: Resources that can be accessed
- **Actions**: Operations (create, read, update, delete)
- **Conditions**: Contextual permission rules

### Two-Level Permissions
- **Global Level**: System-wide roles and permissions
- **Organization Level**: Organization-scoped permissions
- **Dynamic Permissions**: Runtime permission evaluation

---

## 🔗 Related Documentation

- [Task Checklist: Authentication & Authorization](../tasks/02-auth-authorization.md)
- [System Architecture](../architecture/system-architecture.md)
- [Development Guide](../development/development-guide.md)

---

## 📝 Quick Examples

### Check Permission
```typescript
@UseGuards(PermissionGuard)
@RequirePermissions({ action: 'read', subject: 'User' })
@Query(() => [User])
async users() {
  return this.userService.findAll();
}
```

### Define Ability
```typescript
const ability = defineAbilitiesFor(user);
if (ability.can('update', post)) {
  // Allow update
}
```

---

**Last Updated**: 2025-10-10

