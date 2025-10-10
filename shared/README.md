# Shared Libraries

Thư mục này chứa các thư viện dùng chung cho tất cả microservices trong monorepo.

## 📁 Structure

```
shared/
├── common/                    # Common utilities, logger, exceptions
│   ├── src/
│   │   ├── logger.service.ts     # Logging service
│   │   ├── all-exceptions.ts     # Exception handlers
│   │   ├── validation.ts         # Validation utilities
│   │   └── ...
│   └── package.json
│
└── authorization/             # Authentication & Authorization
    ├── src/
    │   ├── guards/               # Auth guards
    │   ├── decorators/           # Auth decorators
    │   ├── interfaces/           # Service interfaces
    │   └── ...
    └── package.json
```

## 🚀 Usage

### Import in Your Service

```typescript
// Import common utilities
import { LoggerService, AllExceptionsFilter } from '@anineplus/common';

// Import auth guards and decorators
import { AuthGuard, RequirePermissions, Public } from '@anineplus/authorization';
```



## 🔧 How It Works

### TypeScript Paths (No Build Required!)

Shared libraries sử dụng TypeScript `paths` để resolve imports **trực tiếp từ source code**.

**Lợi ích:**
- ✅ Không cần build shared libraries trước
- ✅ Không cần `bun link` commands
- ✅ Hot reload hoạt động ngay lập tức
- ✅ IDE hỗ trợ tốt (Go to Definition, Auto-complete)
- ✅ Đơn giản hơn nhiều!

### Development Workflow

```bash
# 1. Chỉ cần install dependencies ở service của bạn
cd apps/your-service
bun install

# 2. Start development - shared code được load trực tiếp
bun run dev

# 3. Thay đổi code trong shared/ tự động reload
# Không cần build hoặc link gì cả!
```

### Docker Builds

Dockerfiles đơn giản hơn nhiều:

```dockerfile
# Copy shared folder
COPY shared /app/shared

# Copy your service
COPY apps/your-service .

# Install dependencies (TypeScript paths handles shared imports)
RUN bun install

# Done! No build/link needed
```

## 📦 Available Libraries

### @anineplus/common

Common utilities và services cho tất cả microservices:
- **Logger**: `LoggerService` - Centralized logging
- **Exceptions**: `AllExceptionsFilter` - Global exception handling
- **Validation**: Validation utilities
- **GraphQL Errors**: Custom GraphQL error types
- **Constants**: Shared constants

**Documentation:** See `docs/DEVELOPMENT.md`

### @anineplus/authorization

Authentication và Authorization cho tất cả microservices:
- **Guards**: `AuthGuard`, `PermissionGuard`, `AuthPermissionGuard`
- **Decorators**: `@Public()`, `@RequireAuth()`, `@RequirePermissions()`, `@OrganizationContext()`
- **Interfaces**: `IAuthService`, `IPermissionService`
- **CASL**: Role-based access control với CASL

**Documentation:** See `docs/AUTHORIZATION_LIBRARY.md` and `docs/SHARED_GUARDS_EXAMPLE.md`

## 🛠️ Adding New Shared Code

### 1. Add to Existing Library

```typescript
// shared/authorization/src/decorators/my-decorator.ts
export function MyDecorator() {
  // Implementation
}

// Use in any service
import { MyDecorator } from '@anineplus/authorization';
```

### 2. Create New Library

```bash
# Create new library folder
mkdir -p shared/my-library/src

# Create package.json
cd shared/my-library
bun init

# Add to all service tsconfig.json files:
"@anineplus/my-library": ["../../shared/my-library/src"]
```

## 🧪 Testing Shared Code

### Unit Tests in Library

```bash
cd shared/authorization
bun test
```

### Integration Tests in Service

Shared code được test thông qua service tests:

```typescript
// apps/core/test/auth.e2e-spec.ts
import { AuthGuard } from '@anineplus/authorization';

describe('Auth with Shared Guards', () => {
  it('should protect endpoints', async () => {
    // Test guard behavior
  });
});
```

## 📝 Best Practices

### ✅ DO:
- Keep shared code generic and reusable
- Use interfaces for service contracts
- Document public APIs
- Write tests for shared utilities
- Use TypeScript for type safety

### ❌ DON'T:
- Don't add service-specific logic to shared code
- Don't create circular dependencies
- Don't forget to update tsconfig.json when adding new libraries
- Don't build shared libraries unless necessary (for production)

## 🔍 Troubleshooting

### Cannot find module '@anineplus/common' or '@anineplus/authorization'

**Solution:** Check `tsconfig.json` has correct paths:
```json
"paths": {
  "@anineplus/common": ["../../shared/common/src"],
  "@anineplus/authorization": ["../../shared/authorization/src"]
}
```

### Changes in shared code not reflected

**Solution:** 
1. Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. Restart your dev server: `bun run dev`
3. Check you're importing from correct package:
   - Use `@anineplus/common` for utilities
   - Use `@anineplus/authorization` for guards/decorators

### IDE autocomplete not working

**Solution:**
1. Check `baseUrl` is set in `tsconfig.json`: `"baseUrl": "."`
2. Reload VS Code window: `Ctrl+Shift+P` → "Reload Window"

## 🎯 Migration Notes

### From libs/ to shared/
- Directory renamed from `libs/` to `shared/`
- All paths updated in tsconfig files
- No code changes needed in services

### From @anineplus/common to @anineplus/authorization
- Guards moved from `common` to `authorization`
- Decorators moved from `common` to `authorization`
- Interfaces moved from `common` to `authorization`
- Update imports: `@anineplus/common` → `@anineplus/authorization` for auth features

**See:** `RENAME_LIBS_TO_SHARED.md` and `docs/AUTHORIZATION_LIBRARY.md` for migration details.

## 📚 Further Reading

- [Authorization Library](../docs/AUTHORIZATION_LIBRARY.md)
- [Shared Guards Documentation](../docs/SHARED_GUARDS_EXAMPLE.md)
- [TypeScript Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
- [Monorepo Best Practices](../docs/MICROSERVICES_ARCHITECTURE.md)
