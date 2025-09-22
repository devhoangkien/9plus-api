# Authentication Configuration Guide

## Environment Setup

This service requires several environment variables to be configured for proper authentication functionality.

### Required Environment Files

1. **Production**: Copy `example.env` to `.env` and configure for production
2. **Development**: Copy `.env.example` to `.env.local` and configure for development
3. **Testing**: Use `.env.test` for test environment

### Key Configuration Sections

#### 1. JWT Configuration
```env
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-secure-refresh-secret
JWT_REFRESH_EXPIRATION=7d
```

#### 2. Database
```env
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

#### 3. Redis (for sessions)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional-password
```

#### 4. Google OAuth (Optional)
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

#### 5. Email Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### 6. Security Settings
```env
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000
```

## Features Implemented

### Authentication Methods
- ✅ Local authentication (email/password)
- ✅ JWT tokens with refresh capability
- ✅ Two-factor authentication (TOTP)
- ⏸️ Google OAuth (disabled until credentials configured)

### Security Features
- ✅ Password hashing with bcrypt
- ✅ Account lockout after failed attempts
- ✅ Session management with Redis
- ✅ Audit logging for security events
- ✅ Input validation and sanitization

### Password Management
- ✅ Password strength validation
- ✅ Password reset via email
- ✅ Password change functionality
- ✅ Password history (prevent reuse)

### Two-Factor Authentication
- ✅ TOTP setup with QR codes
- ✅ Backup codes generation
- ✅ Recovery options

## API Endpoints

### GraphQL Mutations
```graphql
# Authentication
login(email: String!, password: String!): LoginResponse
register(input: RegisterInput!): LoginResponse
refreshToken(refreshToken: String!): LoginResponse
logout(sessionToken: String): Boolean

# Password Management
changePassword(currentPassword: String!, newPassword: String!): Boolean
requestPasswordReset(email: String!): Boolean
resetPassword(token: String!, newPassword: String!): Boolean

# Two-Factor Authentication
setupTwoFactor: String # Returns QR code URL
enableTwoFactor(token: String!): Boolean
disableTwoFactor(password: String!): Boolean
verifyTwoFactor(userId: String!, token: String!): LoginResponse
```

### GraphQL Queries
```graphql
me: User # Get current user info
validateToken: Boolean # Check if token is valid
```

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Setup database**:
   ```bash
   npm run prisma:generate
   npm run db:migrate
   npm run seed
   ```

4. **Start development server**:
   ```bash
   npm run start:dev
   ```

## Security Considerations

### Production Checklist
- [ ] Use strong, unique JWT secrets (min 32 characters)
- [ ] Enable HTTPS in production
- [ ] Set secure session cookies
- [ ] Configure proper CORS origins
- [ ] Set up proper rate limiting
- [ ] Enable audit logging
- [ ] Configure email service for notifications
- [ ] Set up Redis with authentication
- [ ] Use environment-specific database credentials

### Security Headers
The application should be deployed behind a reverse proxy (nginx) with security headers:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy

## Troubleshooting

### Common Issues

1. **JWT Secret Missing**
   - Error: `JWT_SECRET is required`
   - Solution: Set JWT_SECRET in environment file

2. **Database Connection Failed**
   - Error: `Can't connect to database`
   - Solution: Check DATABASE_URL format and credentials

3. **Redis Connection Failed**
   - Error: `Redis connection failed`
   - Solution: Ensure Redis is running and connection details are correct

4. **Google OAuth Error**
   - Error: `OAuth2Strategy requires a clientID option`
   - Solution: Either configure Google OAuth credentials or disable GoogleStrategy in auth.module.ts

### Debug Mode
Set `LOG_LEVEL=debug` in environment to see detailed authentication logs.
