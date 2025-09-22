# AnineEdu - Microservices Architecture

## 🏗️ System Overview

AnineEdu là một nền tảng giáo dục toàn diện được xây dựng trên kiến trúc microservices với NestJS, GraphQL Federation, và PostgreSQL.

## 🚀 Services Architecture

### 1. **API Gateway** 📡
- **Mục đích**: Điểm truy cập duy nhất, xử lý authentication, routing
- **Công nghệ**: NestJS + Apollo Federation Gateway
- **Tính năng**:
  - JWT Authentication với cache LRU
  - GraphQL Federation cho tất cả services
  - Rate limiting và security headers
  - Permission-based access control

### 2. **User Service** 👥
- **Mục đích**: Quản lý người dùng, authentication, phân quyền
- **Schema**: Users, Teachers, Students, Parents, Roles, Permissions
- **Modules**:
  - `AuthModule`: JWT, 2FA, OAuth strategies
  - `UsersModule`: User management
  - `TeachersModule`: Teacher profiles
  - `StudentsModule`: Student profiles  
  - `ParentsModule`: Parent/Guardian profiles
  - `RolesModule`: Role management
  - `PermissionsModule`: Permission system
  - `SessionsModule`: Session tracking
  - `AuditModule`: Activity logging
  - `GradesModule`: Academic grades
  - `AttendanceModule`: Attendance tracking

### 3. **Content Service** 📚
- **Mục đích**: Quản lý nội dung học tập, khóa học, bài học
- **Schema**: LearningPaths, Courses, Lessons, Resources, Skills
- **Modules**:
  - `LearningPathsModule`: Learning journey management
  - `CoursesModule`: Course management
  - `LessonsModule`: Lesson content
  - `ResourcesModule`: Learning resources
  - `SkillsModule`: Skill tracking
  - `CategoriesModule`: Content categorization
  - `TagsModule`: Content tagging
  - `ProgressModule`: Learning progress
  - `EnrollmentsModule`: Course enrollments

### 4. **Exam Service** 📝
- **Mục đích**: Quản lý câu hỏi, đề thi, bài kiểm tra
- **Schema**: Questions, Exams, PracticeSets, QuestionBanks, Subjects
- **Modules**:
  - `QuestionsModule`: Question bank management
  - `ExamsModule`: Exam creation and management
  - `PracticeSetsModule`: Practice test generation
  - `QuestionBanksModule`: Question organization
  - `SubjectsModule`: Subject management
  - `TopicsModule`: Topic organization
  - `DifficultyLevelsModule`: Difficulty management

### 5. **Submission Service** ✅
- **Mục đích**: Xử lý bài nộp, chấm điểm tự động, feedback
- **Schema**: Submissions, Answers, AIScoring, Rubrics, Feedback
- **Modules**:
  - `SubmissionsModule`: Submission tracking
  - `AnswersModule`: Answer processing
  - `ScoringModule`: AI-powered scoring
  - `RubricsModule`: Rubric management
  - `FeedbackModule`: Feedback system
  - `AnalyticsModule`: Performance analytics

### 6. **Notification Service** 🔔
- **Mục đích**: Gửi thông báo đa kênh, báo cáo
- **Schema**: Notifications, Templates, Campaigns, Reports, Analytics
- **Modules**:
  - `NotificationsModule`: Notification management
  - `TemplatesModule`: Message templates
  - `CampaignsModule`: Bulk messaging
  - `ReportsModule`: Report generation
  - `AnalyticsModule`: Notification analytics
  - `DeliveryModule`: Multi-channel delivery (Email, SMS, Push)
  - `PreferencesModule`: User preferences

### 7. **Payment Service** 💳
- **Mục đích**: Xử lý thanh toán, subscription, billing
- **Schema**: Subscriptions, Invoices, Transactions, PaymentMethods
- **Modules**:
  - `SubscriptionsModule`: Subscription management
  - `PaymentMethodsModule`: Payment processing
  - `InvoicesModule`: Billing and invoicing
  - `TransactionsModule`: Transaction tracking
  - `RefundsModule`: Refund processing
  - `DiscountsModule`: Promotional codes
  - `TaxModule`: Tax calculation
  - `AnalyticsModule`: Financial reporting

### 8. **Media Service** 📁
- **Mục đích**: Quản lý tệp tin, upload, xử lý media
- **Schema**: Files, Uploads, Processing, Storage, Sharing
- **Modules**:
  - `FilesModule`: File management
  - `UploadModule`: Chunked file upload
  - `ProcessingModule`: Image/video processing
  - `StorageModule`: Multi-cloud storage (AWS S3, Google Cloud, Azure)
  - `SharingModule`: File sharing and permissions
  - `AnalyticsModule`: Usage analytics

## 🛠️ Technical Stack

### Core Technologies
- **Framework**: NestJS 10.x
- **API**: GraphQL with Apollo Federation
- **Database**: PostgreSQL with Prisma ORM 5.7.1
- **Authentication**: JWT + Passport.js + 2FA
- **Authorization**: CASL (Permissions)
- **Queue**: Bull + Redis
- **File Processing**: Sharp, FFmpeg
- **Payments**: Stripe, PayPal, multiple providers
- **Notifications**: Nodemailer, Twilio, FCM

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Winston logging + Health checks
- **Caching**: Redis + LRU Cache
- **Rate Limiting**: @nestjs/throttler
- **Task Scheduling**: @nestjs/schedule
- **Background Jobs**: Bull queues

## 📊 Database Schema Features

### Common Patterns
- **Audit Fields**: createdAt, updatedAt, deletedAt
- **Soft Deletes**: Logical deletion for data integrity
- **Comprehensive Indexing**: Performance optimization
- **Foreign Key Relations**: Proper referential integrity
- **Enum Types**: Type safety and validation
- **JSON Fields**: Flexible metadata storage

### Business Logic
- **Role-Based Access Control**: Granular permissions
- **Multi-tenant Support**: Organization isolation  
- **Academic Workflows**: Complete educational lifecycle
- **Payment Processing**: Subscription and billing
- **File Management**: Secure upload and processing
- **Notification System**: Multi-channel delivery

## 🚦 API Gateway Features

### Authentication & Authorization
```typescript
// JWT token validation with role-based permissions
const handleAuth = async ({ req }) => {
  const token = getToken(req.headers.authorization);
  const decoded = decodeToken(token);
  const roles = await getUserRoles(decoded.roles);
  return {
    userId: decoded.userId,
    permissions: extractUniquePermissions(roles),
    authorization: req.headers.authorization
  };
};
```

### Service Federation
```typescript
supergraphSdl: new IntrospectAndCompose({
  subgraphs: [
    { name: 'core-service', url: process.env.CORE_SERVICE_URL },
    { name: 'content-service', url: process.env.CONTENT_SERVICE_URL },
    { name: 'exam-service', url: process.env.EXAM_SERVICE_URL },
    { name: 'submission-service', url: process.env.SUBMISSION_SERVICE_URL },
    { name: 'notification-service', url: process.env.NOTIFICATION_SERVICE_URL },
    { name: 'payment-service', url: process.env.PAYMENT_SERVICE_URL },
    { name: 'media-service', url: process.env.MEDIA_SERVICE_URL },
  ],
})
```

## 🔄 Inter-Service Communication

### GraphQL Federation
- **@key directives**: Entity resolution across services
- **@external fields**: Reference external entities
- **@requires**: Field-level dependencies
- **@provides**: Optimized data fetching

### Message Queues
- **Bull Queues**: Background job processing
- **Redis**: Message broker and caching
- **Event-driven**: Async communication patterns

## 📦 Deployment Architecture

### Development
```bash
# Start all services
docker-compose -f docker-compose-dev.yaml up

# Individual service development
cd microservices/core-service && npm run start:dev
```

### Production
```bash
# Build and deploy
docker-compose up -d

# Health checks
curl http://localhost:3000/health
```

## 🔐 Security Features

### Authentication
- **JWT tokens** with refresh mechanism
- **2FA support** with TOTP
- **OAuth integration** (Google, Facebook, Microsoft)
- **Session management** with Redis
- **Password policies** and encryption

### Authorization
- **CASL integration** for fine-grained permissions
- **Role-based access control** (RBAC)
- **Resource-level permissions**
- **API rate limiting**
- **Request validation**

### Data Protection
- **Input sanitization** with class-validator
- **SQL injection protection** via Prisma
- **File upload validation** and virus scanning
- **CORS configuration**
- **Security headers**

## 📈 Monitoring & Analytics

### Logging
- **Winston logger** with multiple transports
- **Request/response logging**
- **Error tracking** and alerting
- **Performance monitoring**

### Health Checks
- **Database connectivity**
- **External service health**
- **Redis connectivity**
- **Disk space monitoring**

### Analytics
- **User activity tracking**
- **Performance metrics**
- **Business intelligence**
- **Real-time dashboards**

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose

### Installation
```bash
# Clone repository
git clone <repository-url>
cd anineplus-api

# Install dependencies
npm run install:all

# Setup environment
npm run setup:env

# Generate Prisma clients
npm run prisma:generate:all

# Run migrations
npm run prisma:migrate:all

# Start development
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/anineplus"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Services URLs
CORE_SERVICE_URL="http://localhost:3001/graphql"
CONTENT_SERVICE_URL="http://localhost:3002/graphql"
EXAM_SERVICE_URL="http://localhost:3003/graphql"
SUBMISSION_SERVICE_URL="http://localhost:3004/graphql"
NOTIFICATION_SERVICE_URL="http://localhost:3005/graphql"
PAYMENT_SERVICE_URL="http://localhost:3006/graphql"
MEDIA_SERVICE_URL="http://localhost:3007/graphql"

# External Services
STRIPE_SECRET_KEY="sk_test_..."
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
```

## 📚 API Documentation

### GraphQL Playground
- **Development**: http://localhost:3000/graphql
- **API Gateway**: Unified GraphQL endpoint
- **Individual Services**: Each service has its own playground

### Example Queries
```graphql
# User authentication
mutation login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
    refreshToken
    user {
      id
      email
      roles {
        name
        permissions {
          resource
          action
        }
      }
    }
  }
}

# Course enrollment
mutation enrollInCourse($courseId: String!) {
  enrollInCourse(courseId: $courseId) {
    id
    status
    enrolledAt
    course {
      title
      description
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**AnineEdu Team** - Building the future of education technology 🎓
