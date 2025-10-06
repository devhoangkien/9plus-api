# Better Auth Integration với GraphQL Federation

Tài liệu mô tả cách tích hợp [Better Auth](https://github.com/better-auth/better-auth) vào Core service với GraphQL Federation.

## Kiến trúc

```
┌─────────────────┐         ┌──────────────────┐
│     Gateway     │────────>│      Core        │
│  (Federation)   │ GraphQL │  (Subgraph)      │
│   Port 3000     │         │   Port 3001      │
└─────────────────┘         └──────────────────┘
                                     │
                                     ├─> Better Auth
                                     ├─> GraphQL Resolver
                                     └─> PostgreSQL
```

### Luồng hoạt động

- **Core Service**: Triển khai Better Auth với GraphQL subgraph (Federation v2)
- **Gateway Service**: Tự động composite các query/mutation từ Core thông qua Federation
- **Client**: Gọi GraphQL queries/mutations qua Gateway, Gateway tự động route đến Core

**Gateway KHÔNG CẦN viết lại auth logic** - chỉ cần config subgraph!

## Core Service Setup

### 1. Dependencies

```bash
cd apps/core
bun add better-auth @better-auth/prisma
```

### 2. Better Auth Config

**File**: `apps/core/src/auth/auth.config.ts`

```typescript
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
      },
    },
  },
});
```

### 3. GraphQL Schema (Federation v2)

**File**: `apps/core/src/auth/auth.graphql`

**Key Points**:
- Dùng `extend type Query` và `extend type Mutation` (bắt buộc cho Federation)
- Dùng `@shareable` cho types có thể được share với subgraph khác
- Input types không cần extend

```graphql
type User @shareable {
  id: ID!
  email: String!
  name: String
  emailVerified: Boolean
  image: String
  role: String
  createdAt: String!
  updatedAt: String!
}

type Session @shareable {
  id: ID!
  userId: ID!
  expiresAt: String!
  token: String!
  ipAddress: String
  userAgent: String
  createdAt: String!
}

type AuthResponse {
  user: User!
  session: Session!
  token: String!
  success: Boolean!
}

input SignUpInput {
  email: String!
  password: String!
  name: String
}

input SignInInput {
  email: String!
  password: String!
}

extend type Query {
  getCurrentSession: SessionResponse
  listUserSessions: SessionsResponse
  verifyAuth: SuccessResponse!
}

extend type Mutation {
  signUpUser(input: SignUpInput!): AuthResponse!
  signInUser(input: SignInInput!): AuthResponse!
  signOutUser: SuccessResponse!
  verifyUserEmail(input: VerifyEmailInput!): SuccessResponse!
  # ... other mutations
}
```

### 4. GraphQL Resolver

**File**: `apps/core/src/auth/better-auth.resolver.ts`

```typescript
@Resolver('Auth')
export class BetterAuthResolver {
  constructor(private readonly betterAuthService: BetterAuthService) {}

  @Mutation('signUpUser')
  async signUpUser(@Args('input') input: any) {
    return this.betterAuthService.signUp(
      input.email,
      input.password,
      input.name,
    );
  }

  @Query('getCurrentSession')
  @UseGuards(AuthGuard)
  async getCurrentSession(@Context() context: any) {
    const token = this.extractToken(context.req);
    return this.betterAuthService.getSession(token);
  }

  private extractToken(req: any): string {
    const authorization = req.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException('No authorization header');
    }
    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }
    return token;
  }
}
```

### 5. App Module Config

**File**: `apps/core/src/app.module.ts`

```typescript
@Module({
  imports: [
    GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      autoSchemaFile: {
        federation: 2, // ← Important: Federation v2
      },
    }),
    BetterAuthModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Gateway Service Setup

### Gateway chỉ cần config, KHÔNG CẦN viết code!

**File**: `apps/gateway/src/app.module.ts`

```typescript
@Module({
  imports: [
    DynamicGatewayModule, // ← Tự động load subgraphs
    GraphQLModule.forRootAsync<YogaGatewayDriverConfig>({
      driver: YogaGatewayDriver,
      useFactory: async (dynamicGatewayService: DynamicGatewayService) => {
        // Load tất cả subgraphs (bao gồm Core)
        const subgraphs = await dynamicGatewayService.loadSubgraphs();
        
        return {
          gateway: {
            supergraphSdl: new IntrospectAndCompose({
              subgraphs: subgraphs,
            }),
          },
        };
      },
    }),
  ],
})
export class AppModule {}
```

**File**: `apps/gateway/src/dynamic-gateway/dynamic-gateway.service.ts`

```typescript
async loadSubgraphs() {
  return [
    {
      name: 'core',
      url: 'http://localhost:3001/graphql', // ← Core subgraph
    },
    // Các subgraph khác sẽ tự động được load
  ];
}
```

**Xong!** Gateway tự động nhận được tất cả auth queries/mutations từ Core!

## Client Usage

### Tất cả requests đều gửi qua Gateway

**GraphQL Playground**: `http://localhost:3000/graphql`

### 1. Sign Up

```graphql
mutation SignUp {
  signUpUser(input: {
    email: "user@example.com"
    password: "SecurePass123!"
    name: "John Doe"
  }) {
    user {
      id
      email
      name
    }
    token
    success
  }
}
```

### 2. Sign In

```graphql
mutation SignIn {
  signInUser(input: {
    email: "user@example.com"
    password: "SecurePass123!"
  }) {
    user {
      id
      email
    }
    token
  }
}
```

### 3. Get Current Session (Authenticated)

```graphql
query GetSession {
  getCurrentSession {
    user {
      id
      email
      name
      role
    }
    session {
      id
      expiresAt
    }
  }
}
```

**Headers**:
```
Authorization: Bearer <token-from-signin>
```

### 4. List All Sessions

```graphql
query ListSessions {
  listUserSessions {
    sessions {
      id
      expiresAt
      ipAddress
      userAgent
    }
  }
}
```

### 5. Sign Out

```graphql
mutation SignOut {
  signOutUser {
    success
    message
  }
}
```

### 6. Change Password

```graphql
mutation ChangePassword {
  changeUserPassword(input: {
    currentPassword: "OldPass123!"
    newPassword: "NewPass123!"
  }) {
    success
    message
  }
}
```

## Environment Variables

### Core Service

```env
DATABASE_URL=postgresql://user:password@postgres:5432/anineplus
PORT=3001
NODE_ENV=development
```

### Gateway Service

```env
CORE_HOST=core
CORE_PORT=3001
PORT=3000
NODE_ENV=development
```

## Why This Architecture?

### ✅ Ưu điểm

1. **No Code Duplication**: Auth logic chỉ ở Core, Gateway tự động nhận
2. **Type Safety**: Schema tự động composite, không cần manual sync
3. **Single Source of Truth**: Chỉ maintain auth ở một nơi
4. **Automatic Updates**: Core thay đổi schema → Gateway tự động update
5. **Scalable**: Dễ thêm providers (OAuth, SAML, etc.)
6. **Developer Experience**: Client chỉ cần biết Gateway endpoint

### ❌ So sánh với REST Proxy

**❌ REST Proxy approach** (cách cũ):
```typescript
// Gateway phải viết code proxy cho TỪNG endpoint
@Post('signup')
async signUp(@Body() body) {
  return fetch(`${CORE_URL}/auth/signup`, { ... });
}

@Post('signin')
async signIn(@Body() body) {
  return fetch(`${CORE_URL}/auth/signin`, { ... });
}
// ... 10+ endpoints nữa
```

**✅ GraphQL Federation** (cách mới):
```typescript
// Gateway chỉ cần config - KHÔNG CẦN CODE!
const subgraphs = [
  { name: 'core', url: 'http://core:3001/graphql' }
];
// Done! Tất cả queries/mutations tự động available
```

## REST API Alternative

Nếu cần REST API, Core cũng expose controllers:

```bash
POST   /auth/sign-up
POST   /auth/sign-in
POST   /auth/sign-out
GET    /auth/session
GET    /auth/sessions
POST   /auth/verify-email
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/change-password
POST   /auth/revoke-session
POST   /auth/revoke-other-sessions
```

Nhưng **khuyến nghị dùng GraphQL** qua Gateway!

## Testing

### GraphQL (qua Gateway)

```bash
# Sign Up
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { signUpUser(input: {email: \"test@example.com\", password: \"pass123\"}) { token } }"
  }'

# Sign In
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { signInUser(input: {email: \"test@example.com\", password: \"pass123\"}) { token } }"
  }'

# Get Session
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "query { getCurrentSession { user { email } } }"
  }'
```

## Database Migrations

Better Auth cần các tables:

```bash
cd apps/core
bun prisma migrate dev
```

Tables được tạo:
- `user` - User accounts
- `session` - Active sessions  
- `account` - OAuth accounts (optional)
- `verification` - Email verification tokens

## Troubleshooting

### Gateway không thấy auth queries

**Giải pháp**:
1. Check Core có `federation: 2` config ✅
2. Check schema dùng `extend type Query/Mutation` ✅
3. Restart cả Core và Gateway
4. Kiểm tra Gateway logs xem có load Core subgraph không

### "Cannot query field X on type Query"

**Nguyên nhân**: Schema chưa được composite đúng

**Giải pháp**:
- Core: Phải dùng `extend type Query` không phải `type Query`
- Restart Gateway để re-introspect schema

### Session không tồn tại

**Giải pháp**:
- Đảm bảo header: `Authorization: Bearer <token>`
- Token phải từ signIn/signUp response
- Check token chưa expire

## Security Checklist

- [ ] Dùng HTTPS trong production
- [ ] Enable email verification trong production
- [ ] Configure session expiry (default 7 days)
- [ ] Add rate limiting ở Gateway
- [ ] Configure CORS cho frontend domain
- [ ] Không commit secrets vào git
- [ ] Hash passwords với bcrypt (Better Auth tự động)
- [ ] Validate input ở Core service
- [ ] Log auth events cho audit trail

## Summary

**Core Service**:
- ✅ Implement Better Auth
- ✅ Expose GraphQL subgraph với Federation v2
- ✅ Schema dùng `extend type Query/Mutation`

**Gateway Service**:
- ✅ Config DynamicGatewayModule
- ✅ Load Core subgraph URL
- ❌ **KHÔNG** viết auth code
- ❌ **KHÔNG** duplicate schema
- ❌ **KHÔNG** proxy logic

**Client**:
- ✅ Chỉ gọi Gateway endpoint
- ✅ Tất cả auth operations tự động available
- ✅ Type-safe với GraphQL code generation

**Architecture này = Simple + Maintainable + Scalable!** 🚀
