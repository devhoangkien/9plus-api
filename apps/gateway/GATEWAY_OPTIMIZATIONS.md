# Gateway Optimizations

## Tổng quan các cải tiến

File `main.ts` đã được tối ưu hóa với các tính năng sau:

### 1. 🌐 URL Gateway Động (Dynamic Gateway URL)

- **Trước:** URL hardcode `http://localhost:3000/graphql`
- **Sau:** URL động được cấu hình qua environment variables

```typescript
class GatewayUrlResolver {
  private baseUrl: string;
  private port: number;
  private protocol: string;
  
  getGraphQLUrl(): string {
    return `${this.baseUrl}/graphql`;
  }
}
```

**Environment variables:**
- `GATEWAY_HOST`: Host của gateway (default: localhost)
- `GATEWAY_PROTOCOL`: Protocol (default: http)
- `PORT`: Port của gateway (default: 3000)

### 2. 📦 Caching thông minh (Smart Caching)

- **LRU Cache** cho GraphQL responses
- Chỉ cache các **query operations** (không cache mutations)
- Cấu hình linh hoạt qua environment variables

```typescript
const responseCache = new LRUCache<string, any>({
  max: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
  ttl: parseInt(process.env.CACHE_TTL_MINUTES || '5', 10) * 60 * 1000,
});
```

**Environment variables:**
- `CACHE_MAX_SIZE`: Số lượng entries tối đa (default: 1000)
- `CACHE_TTL_MINUTES`: Thời gian cache tính bằng phút (default: 5)

### 3. ⚡ Hiệu suất và Error Handling

- **Request timeout** có thể cấu hình
- **Enhanced error logging** với timestamp và error source
- **Optimized fetch requests** với proper headers

```typescript
signal: AbortSignal.timeout(parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10))
```

**Environment variables:**
- `REQUEST_TIMEOUT_MS`: Timeout cho requests (default: 30000ms)

### 4. 🏥 Health Monitoring

- **Health check endpoint**: `/health`
- **Cache statistics endpoint**: `/cache/stats`
- **Comprehensive logging** khi khởi động

```bash
GET /health
{
  "status": "healthy",
  "timestamp": "2025-09-28T...",
  "services": {
    "gateway": true,
    "cache": true
  }
}

GET /cache/stats
{
  "size": 10,
  "maxSize": 1000,
  "ttl": 300000,
  "calculatedSize": 1024
}
```

## 📝 Cấu hình Environment Variables

Tạo file `.env` từ `.env.example`:

```bash
# Gateway Configuration
PORT=3000
GATEWAY_HOST=localhost
GATEWAY_PROTOCOL=http

# Performance Configuration
CACHE_MAX_SIZE=1000
CACHE_TTL_MINUTES=5
REQUEST_TIMEOUT_MS=30000

# Core Service Configuration
CORE_SERVICE_URL=http://localhost:50051/graphql
JWT_SECRET=your-jwt-secret-here
```

## 🚀 Lợi ích của các cải tiến

### 1. **Flexibility (Tính linh hoạt)**
- Dễ dàng thay đổi cấu hình cho các môi trường khác nhau (dev, staging, production)
- Không cần build lại khi thay đổi URL hoặc cấu hình

### 2. **Performance (Hiệu suất)**
- Cache giảm số lượng requests đến GraphQL gateway
- Timeout ngăn chặn requests bị treo
- Smart caching chỉ cache queries, không cache mutations

### 3. **Monitoring (Giám sát)**
- Health check để kiểm tra trạng thái service
- Cache statistics để monitor hiệu suất
- Enhanced logging cho debugging

### 4. **Reliability (Độ tin cậy)**
- Error handling tốt hơn với proper HTTP status codes
- Request timeout để tránh memory leaks
- Graceful error responses với structured error messages

## 🔧 Sử dụng

### Development
```bash
# Copy environment config
cp .env.example .env

# Start gateway
bun dev
```

### Production
```bash
# Set environment variables
export PORT=8080
export GATEWAY_HOST=gateway.example.com
export GATEWAY_PROTOCOL=https
export CACHE_MAX_SIZE=5000
export CACHE_TTL_MINUTES=10

# Start gateway
bun start
```

## 📊 Monitoring Endpoints

- **GraphQL**: `http://localhost:3000/graphql`
- **REST API**: `http://localhost:3000/api`
- **Swagger UI**: `http://localhost:3000/api/swagger`
- **Health Check**: `http://localhost:3000/health`
- **Cache Stats**: `http://localhost:3000/cache/stats`