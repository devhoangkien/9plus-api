# Authentication & Authorization Tasks

## Overview
This checklist covers all tasks related to implementing authentication, authorization, permissions, and access control using Better Auth and CASL.

---

## ✅ Task Checklist

### 1. Authentication System Setup
**Goal**: User authentication working with JWT/Session

- [ ] Install and configure Better Auth
- [ ] Set up JWT strategy with proper secrets
- [ ] Configure session management
- [ ] Implement OAuth providers (Google, GitHub, etc.)
- [ ] Set up password hashing and validation
- [ ] Configure token expiration and refresh
- [ ] Implement 2FA (if required)

**Reference Documentation**:
- [`auth/BETTER_AUTH.md`](../auth/BETTER_AUTH.md)
- [`auth/AUTH_CONFIG.md`](../auth/AUTH_CONFIG.md)

**Actions**:
```typescript
// Install Better Auth
bun add better-auth

// Configure in auth module
// See examples in apps/core/src/auth/
```

**Success Criteria**:
- ✅ Users can register and login
- ✅ JWT tokens generated and validated
- ✅ Session management working
- ✅ OAuth providers integrated (if enabled)
- ✅ Password reset flow functional

---

### 2. CASL Authorization Setup
**Goal**: Permission-based access control operational

- [ ] Install CASL library
- [ ] Define ability factory
- [ ] Create permission definitions
- [ ] Implement CASL guards
- [ ] Integrate with GraphQL resolvers
- [ ] Set up permission checking utilities

**Reference Documentation**:
- [`auth/AUTHORIZATION_LIBRARY.md`](../auth/AUTHORIZATION_LIBRARY.md)
- [`libs/casl-authorization/`](../../libs/casl-authorization/)

**Actions**:
```typescript
// Install CASL
bun add @casl/ability @casl/prisma

// Define abilities
// See libs/casl-authorization/src/
```

**Success Criteria**:
- ✅ CASL ability factory created
- ✅ Permissions defined for all resources
- ✅ Guards implemented and tested
- ✅ Integration with resolvers working

---

### 3. Dynamic Permissions System
**Goal**: Flexible permission management by roles and resources

- [ ] Design permission schema (actions, subjects, conditions)
- [ ] Implement dynamic permission loader
- [ ] Create permission templates for common roles
- [ ] Implement resource-based permissions
- [ ] Set up field-level permissions
- [ ] Create permission inheritance system

**Reference Documentation**:
- [`auth/DYNAMIC_PERMISSIONS.md`](../auth/DYNAMIC_PERMISSIONS.md)
- [`auth/DYNAMIC_PERMISSIONS_GUIDE.md`](../auth/DYNAMIC_PERMISSIONS_GUIDE.md)
- [`auth/DYNAMIC_PERMISSIONS_REFACTOR.md`](../auth/DYNAMIC_PERMISSIONS_REFACTOR.md)

**Actions**:
```typescript
// Define permission structure
{
  action: 'read' | 'create' | 'update' | 'delete',
  subject: 'User' | 'Post' | 'Course' | ...,
  conditions?: { /* field conditions */ },
  fields?: ['field1', 'field2'], // field-level access
}

// Load permissions dynamically
// See examples in apps/core/src/permissions/
```

**Success Criteria**:
- ✅ Permission schema defined
- ✅ Dynamic loading implemented
- ✅ Role-based permissions working
- ✅ Resource-based access control functional
- ✅ Field-level permissions enforced

---

### 4. Permission Guards Implementation
**Goal**: All endpoints protected with permission checks

- [ ] Create base permission guard
- [ ] Implement GraphQL field guards
- [ ] Create REST endpoint guards
- [ ] Implement controller guards
- [ ] Add decorators for permission checking
- [ ] Set up bypass for public endpoints

**Reference Documentation**:
- [`auth/PERMISSION_GUARDS.md`](../auth/PERMISSION_GUARDS.md)
- [`auth/SHARED_GUARDS_EXAMPLE.md`](../auth/SHARED_GUARDS_EXAMPLE.md)

**Actions**:
```typescript
// Create guard
@Injectable()
export class PermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check permissions
  }
}

// Apply to resolvers
@UseGuards(PermissionGuard)
@RequirePermissions({ action: 'read', subject: 'User' })
@Query(() => User)
async getUser() { }
```

**Success Criteria**:
- ✅ Guards created and registered
- ✅ Applied to all protected endpoints
- ✅ Proper error messages on denial
- ✅ Public endpoints accessible without auth
- ✅ Tests passing for all scenarios

---

### 5. Role & Permission Management
**Goal**: Admin can manage roles and permissions

- [ ] Create Role CRUD operations
- [ ] Create Permission CRUD operations
- [ ] Implement role-permission assignment
- [ ] Create user-role assignment
- [ ] Build admin UI for role management (or GraphQL API)
- [ ] Implement permission inheritance
- [ ] Add role hierarchy support

**Reference Documentation**:
- [`auth/ROLE_PERMISSION_SYSTEM.md`](../auth/ROLE_PERMISSION_SYSTEM.md)

**Actions**:
```graphql
# Create role
mutation CreateRole {
  createRole(input: {
    name: "editor"
    description: "Content editor role"
    permissions: ["read:posts", "create:posts", "update:posts"]
  }) {
    id
    name
  }
}

# Assign role to user
mutation AssignRole {
  assignRoleToUser(userId: "123", roleId: "456") {
    success
  }
}
```

**Success Criteria**:
- ✅ CRUD operations for roles implemented
- ✅ CRUD operations for permissions implemented
- ✅ Role-permission assignment working
- ✅ User-role assignment working
- ✅ Permission checks reflect changes immediately
- ✅ Role hierarchy respected

---

### 6. Access Control Summary & Testing
**Goal**: Comprehensive understanding and testing of access control

- [ ] Review entire access control flow
- [ ] Document permission matrix (roles × resources × actions)
- [ ] Write unit tests for permission checks
- [ ] Write integration tests for guards
- [ ] Test edge cases (no role, multiple roles, etc.)
- [ ] Performance test permission loading

**Reference Documentation**:
- [`auth/ACCESS_CONTROL_SUMMARY.md`](../auth/ACCESS_CONTROL_SUMMARY.md)
- [`auth/COMPLETE_ACCESS_CONTROL.md`](../auth/COMPLETE_ACCESS_CONTROL.md)
- [`auth/UNIFIED_ACCESS_CONTROL.md`](../auth/UNIFIED_ACCESS_CONTROL.md)
- [`auth/DYNAMIC_ACCESS_CONTROL.md`](../auth/DYNAMIC_ACCESS_CONTROL.md)

**Actions**:
```typescript
// Unit test example
describe('PermissionGuard', () => {
  it('should allow access with correct permission', async () => {
    // Test implementation
  });
  
  it('should deny access without permission', async () => {
    // Test implementation
  });
});

// Integration test example
describe('User Query (Integration)', () => {
  it('should return users for admin role', async () => {
    // Test with admin JWT
  });
});
```

**Success Criteria**:
- ✅ All access control flows documented
- ✅ Permission matrix created
- ✅ Unit tests passing (>80% coverage)
- ✅ Integration tests passing
- ✅ Edge cases handled
- ✅ Performance acceptable (<100ms for permission check)

---

### 7. Security Hardening
**Goal**: Authentication and authorization secure and production-ready

- [ ] Implement rate limiting on auth endpoints
- [ ] Add brute force protection
- [ ] Enable CORS with proper configuration
- [ ] Add request signing/verification
- [ ] Implement audit logging for auth events
- [ ] Set up security headers
- [ ] Configure session timeout and renewal
- [ ] Implement password policies

**Actions**:
```typescript
// Rate limiting
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per minute
@Post('login')
async login() { }

// Audit logging
this.auditService.log({
  action: 'LOGIN',
  userId: user.id,
  ip: request.ip,
  timestamp: new Date(),
});
```

**Success Criteria**:
- ✅ Rate limiting active on auth endpoints
- ✅ Brute force protection working
- ✅ CORS properly configured
- ✅ Security headers set
- ✅ Audit logging for all auth events
- ✅ Password policies enforced
- ✅ Security scan passing

---

## 🔍 Validation Commands

Test your authentication and authorization implementation:

```bash
# Test authentication
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test protected endpoint
curl -X GET http://localhost:3000/graphql \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ me { id email } }"}'

# Test permission denial
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer LIMITED_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { deleteUser(id: \"123\") { success } }"}'
```

---

## 🆘 Common Issues

### JWT token not validated
- **Solution**: Check JWT secret in `.env` matches between services
- **Check**: `JWT_SECRET` in environment variables

### Permission checks failing
- **Solution**: Verify user has correct roles/permissions in database
- **Command**: Check `user_roles` and `role_permissions` tables

### Guards not applied
- **Solution**: Ensure guard is registered in module providers
- **Check**: Module imports and APP_GUARD provider

### CASL ability not updated
- **Solution**: Clear ability cache or restart service
- **Check**: Ability factory caching configuration

---

## 📚 Next Steps

Once authentication and authorization are complete, proceed to:
- [Architecture & Services Tasks](03-architecture-services.md)
- [Development & Deployment Tasks](06-development-deployment.md)
