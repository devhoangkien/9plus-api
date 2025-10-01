# Event-Driven Architecture with Kafka & ELK Stack

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Core Service  │    │ Gateway Service │    │   Client Apps   │
│   (GraphQL)     │◄───┤   (Federation)  │◄───┤  (Web/Mobile)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         │ Kafka Events
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Kafka       │    │  Kafka Connect  │    │   Kafka UI      │
│   (Message      │◄───┤  (ES Connector) │    │  (Monitoring)   │
│    Broker)      │    └─────────────────┘    └─────────────────┘
└─────────────────┘
         │
         ├─────────────────┬─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Searcher Service│ │ Logger Service  │ │     Logstash    │
│  (Kafka → ES)   │ │ (Log Shipper)   │ │ (Log Processing)│
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
                  ┌─────────────────┐    ┌─────────────────┐
                  │ Elasticsearch   │◄───┤     Kibana      │
                  │   (Storage &    │    │ (Visualization) │
                  │    Search)      │    └─────────────────┘
                  └─────────────────┘
```

## 📋 Mô tả các service

### Core Services
- **Core**: GraphQL API, xử lý business logic, phát events lên Kafka
- **Gateway**: GraphQL Federation gateway, tập hợp schema từ các services
- **Searcher**: Consumer Kafka events, đánh index dữ liệu vào Elasticsearch
- **Logger**: Log shipper, thu thập và chuyển tiếp logs đến ELK stack

### Infrastructure
- **Kafka**: Message broker chính, xử lý events giữa các services
- **Kafka Connect**: Tự động đồng bộ dữ liệu từ Kafka vào Elasticsearch
- **Elasticsearch**: Lưu trữ và tìm kiếm dữ liệu, logs
- **Logstash**: Xử lý và transform logs trước khi lưu vào Elasticsearch
- **Kibana**: Dashboard và visualization cho logs và metrics

## 🚀 Cách chạy hệ thống

### 1. Setup môi trường development

```bash
# Clone repository
git clone <repo-url>
cd anineplus-api

# Tạo file .env từ .env.example
cp .env.example .env

# Chỉnh sửa .env với cấu hình phù hợp
# KAFKA_BROKERS=localhost:9092
# ELASTICSEARCH_URL=http://localhost:9200
# ELASTICSEARCH_USERNAME=elastic
# ELASTICSEARCH_PASSWORD=changeme
```

### 2. Chạy với Docker Compose (Production-like)

```bash
# Setup và chạy toàn bộ hệ thống
chmod +x scripts/setup-event-driven.sh
./scripts/setup-event-driven.sh

# Hoặc manual:
docker network create anineplus-network
docker-compose up -d
```

### 3. Chạy Development Environment

```bash
# Setup infrastructure trước
cd infra/kafka-connect && docker-compose up -d && cd ../..
cd infra/elastic-stack && docker-compose up -d && cd ../..

# Install dependencies cho các service mới
cd apps/searcher && npm install && cd ../..
cd apps/logger && npm install && cd ../..
cd apps/core && npm install kafkajs && cd ../..

# Chạy development mode
chmod +x scripts/start-dev-event-driven.sh
./scripts/start-dev-event-driven.sh
```

## 🔧 URLs và Endpoints

| Service | URL | Mô tả |
|---------|-----|-------|
| Gateway | http://localhost:3000 | GraphQL Federation Endpoint |
| Kafka UI | http://localhost:8080 | Monitor Kafka topics, messages |
| Elasticsearch | http://localhost:9200 | REST API (elastic/changeme) |
| Kibana | http://localhost:5601 | Logs dashboard và analytics |
| Kafka Connect | http://localhost:8083 | Connector management |
| Searcher Health | http://localhost:3003/health | Health check |
| Logger Health | http://localhost:3004/health | Health check |

## 📊 Event Flow

### 1. User Events (Core → Kafka)

```typescript
// Core service tạo user
const user = await userService.create({
  email: "user@example.com",
  password: "password123"
});

// ↓ Tự động phát event
// Topic: user.created
{
  "id": "user-id",
  "eventType": "created",
  "entityType": "user", 
  "data": { /* user data */ },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### 2. Elasticsearch Indexing (Kafka → Searcher → ES)

```typescript
// Searcher service nhận event từ Kafka
// ↓ Tự động index vào Elasticsearch
// Index: users
{
  "id": "user-id",
  "email": "user@example.com",
  "fullName": "John Doe",
  "searchable_text": "user@example.com John Doe",
  "indexed_at": "2025-01-01T00:00:00Z"
}
```

### 3. Log Aggregation (Logger → Logstash → ES)

```typescript
// Logger service theo dõi log files
// ↓ Gửi đến Logstash
// ↓ Logstash xử lý và gửi đến Elasticsearch
// Index: anineplus-logs-2025.01.01
{
  "timestamp": "2025-01-01T00:00:00Z",
  "level": "info", 
  "service": "core",
  "message": "User created successfully",
  "metadata": { /* additional data */ }
}
```

## 🧪 Testing Events

### 1. Tạo user và kiểm tra events

```bash
# Tạo user qua GraphQL
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { register(input: { email: \"test@example.com\", password: \"password123\" }) { id email } }"
  }'

# Kiểm tra Kafka message
# Vào Kafka UI: http://localhost:8080
# Topic: user.created

# Kiểm tra Elasticsearch index
curl -u elastic:changeme "http://localhost:9200/users/_search"

# Kiểm tra Kibana dashboard
# Vào: http://localhost:5601
```

### 2. Kiểm tra logs

```bash
# Tạo logs trong core service
echo '{"timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'", "level": "info", "message": "Test log message", "service": "core"}' >> apps/core/logs/app.log

# Kiểm tra trong Kibana
# Index pattern: anineplus-logs-*
```

## 📝 Kafka Topics

| Topic | Mô tả | Consumer |
|-------|-------|----------|
| user.created | User được tạo | Searcher |
| user.updated | User được cập nhật | Searcher |
| user.deleted | User được xóa | Searcher |
| role.created | Role được tạo | Searcher |
| role.updated | Role được cập nhật | Searcher |
| role.deleted | Role được xóa | Searcher |
| permission.created | Permission được tạo | Searcher |
| permission.updated | Permission được cập nhật | Searcher |
| permission.deleted | Permission được xóa | Searcher |

## 🔍 Elasticsearch Indices

| Index | Mô tả | Mapping |
|-------|-------|---------|
| users | User data để search | id, email, fullName, roles |
| roles | Role data | id, name, permissions |
| permissions | Permission data | id, action, subject |
| anineplus-logs-* | Application logs | timestamp, level, service, message |

## 🐛 Troubleshooting

### 1. Kafka không kết nối được
```bash
# Check Kafka status
docker logs anineplus-kafka

# Check network
docker network inspect anineplus-network

# Restart Kafka
docker restart anineplus-kafka anineplus-zookeeper
```

### 2. Elasticsearch không khởi động
```bash
# Check memory settings
docker logs anineplus-elasticsearch

# Increase memory if needed
# Edit infra/elastic-stack/docker-compose.yml
# ES_JAVA_OPTS: "-Xms4g -Xmx4g"
```

### 3. Events không được index
```bash
# Check searcher service logs
docker logs searcher

# Check Kafka Connect status
curl http://localhost:8083/connectors/elasticsearch-sink-connector/status

# Restart connector
curl -X POST http://localhost:8083/connectors/elasticsearch-sink-connector/restart
```

### 4. Logs không hiển thị trong Kibana
```bash
# Check logger service
docker logs logger

# Check Logstash
docker logs anineplus-logstash

# Check file permissions
ls -la apps/*/logs/
```

## 🔐 Security Notes

### Development
- Elasticsearch: `elastic/changeme`
- Không có SSL/TLS
- Mọi service đều có access

### Production Recommendations
- Đổi password mặc định
- Bật SSL/TLS cho Elasticsearch
- Cấu hình authentication cho Kafka
- Network segmentation
- Resource limits cho containers

## 📈 Monitoring

### Kafka Monitoring
- Kafka UI: http://localhost:8080
- Topic lag, throughput, error rates

### Elasticsearch Monitoring
- Kibana Monitoring: http://localhost:5601/app/monitoring
- Cluster health, indices size, query performance

### Application Monitoring
- Health checks: `/health` endpoints
- Service logs trong Kibana
- Custom dashboards cho business metrics

## 🔄 Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
searcher:
  scale: 3  # Multiple consumers

kafka:
  environment:
    KAFKA_NUM_PARTITIONS: 6  # More partitions
```

### Performance Tuning
```yaml
# Elasticsearch
ES_JAVA_OPTS: "-Xms4g -Xmx4g"

# Kafka
KAFKA_NUM_NETWORK_THREADS: 8
KAFKA_NUM_IO_THREADS: 8

# Logstash
LS_JAVA_OPTS: "-Xmx2g -Xms2g"
```