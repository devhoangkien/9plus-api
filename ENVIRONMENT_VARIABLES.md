# Environment Variables Documentation

## Core Service (.env)

### Database Configuration
```bash
DATABASE_URL=postgres://9plus_cms:9plus_cms@127.0.0.1:5432/9plus_core?schema=public
NODE_ENV=development
```

### Authentication & JWT
```bash
JWT_SECRET=jwtsecret                    # Secret key for JWT tokens
JWT_EXPIRES_IN=24h                      # Access token expiration
JWT_REFRESH_SECRET=jwtrefreshsecret     # Refresh token secret
JWT_REFRESH_EXPIRATION=7d               # Refresh token expiration
BCRYPT_ROUNDS=10                        # Password hashing rounds
```

### Redis Configuration
```bash
REDIS_HOST=localhost                    # Redis server host
REDIS_PASSWORD=                         # Redis password (empty for local)
REDIS_DB=0                             # Redis database number
```

### Kafka Configuration (New)
```bash
KAFKA_BROKERS=localhost:9092           # Comma-separated list of Kafka brokers
KAFKA_CLIENT_ID=core-service           # Unique client identifier
KAFKA_CONSUMER_GROUP_ID=core-consumer-group  # Consumer group ID
```

### Elasticsearch Configuration (New)
```bash
ELASTICSEARCH_URL=http://localhost:9200    # Elasticsearch cluster URL
ELASTICSEARCH_USERNAME=elastic             # Elasticsearch username
ELASTICSEARCH_PASSWORD=changeme            # Elasticsearch password
```

### Logger Service Configuration (New)
```bash
LOG_DIRECTORIES=./apps/core/logs,./apps/gateway/logs  # Comma-separated log directories
LOG_BUFFER_FLUSH_INTERVAL=5000            # Log buffer flush interval (ms)
```

## Gateway Service (.env)

### Server Configuration
```bash
PORT=3000                               # Gateway server port
GATEWAY_HOST=localhost                  # Gateway host
GATEWAY_PROTOCOL=http                   # Protocol (http/https)
```

### Service Discovery
```bash
CORE_SERVICE_URL=http://localhost:50051/graphql      # Core service GraphQL endpoint
PAYMENT_SERVICE_URL=http://localhost:50052/graphql   # Payment service endpoint
SEARCHER_SERVICE_URL=http://localhost:3003           # Searcher service endpoint (New)
LOGGER_SERVICE_URL=http://localhost:3004             # Logger service endpoint (New)
```

### Event-Driven Architecture (New)
```bash
KAFKA_BROKERS=localhost:9092            # Kafka brokers for event monitoring
ELASTICSEARCH_URL=http://localhost:9200 # Elasticsearch for search capabilities
```

## Searcher Service (.env)

### Server Configuration
```bash
PORT=3003                               # Searcher service port
NODE_ENV=development                    # Environment mode
```

### Kafka Configuration
```bash
KAFKA_BROKERS=localhost:9092           # Kafka brokers to consume from
KAFKA_CLIENT_ID=searcher-service       # Client ID for Kafka
KAFKA_CONSUMER_GROUP_ID=searcher-consumer-group  # Consumer group ID
```

### Elasticsearch Configuration
```bash
ELASTICSEARCH_URL=http://localhost:9200    # Elasticsearch for indexing
ELASTICSEARCH_USERNAME=elastic             # Authentication username
ELASTICSEARCH_PASSWORD=changeme            # Authentication password
```

## Logger Service (.env)

### Server Configuration
```bash
PORT=3004                               # Logger service port
NODE_ENV=development                    # Environment mode
```

### File Watcher Configuration
```bash
LOG_DIRECTORIES=../core/logs,../gateway/logs    # Directories to watch for logs
LOG_BUFFER_FLUSH_INTERVAL=5000          # Buffer flush interval (ms)
LOG_BUFFER_MAX_SIZE=1000               # Maximum buffer size before force flush
```

### Elasticsearch Configuration
```bash
ELASTICSEARCH_URL=http://localhost:9200    # Elasticsearch for log storage
ELASTICSEARCH_USERNAME=elastic             # Authentication username
ELASTICSEARCH_PASSWORD=changeme            # Authentication password
```

### Logstash Configuration (Optional)
```bash
LOGSTASH_HOST=localhost                 # Logstash host for direct connection
LOGSTASH_PORT=5000                      # Logstash HTTP input port
```

## Infrastructure Services (.env)

### Kafka Infrastructure
```bash
KAFKA_BROKERS=kafka:29092,localhost:9092    # Internal and external Kafka URLs
KAFKA_AUTO_CREATE_TOPICS=true              # Auto-create topics when needed
```

### ELK Stack
```bash
ELASTICSEARCH_URL=http://elasticsearch:9200,http://localhost:9200  # ES URLs (internal/external)
LOGSTASH_HOST=logstash                      # Logstash service name
LOGSTASH_PORT=5044                          # Logstash Beats input port
LOGSTASH_TCP_PORT=5001                      # Logstash TCP input port
KIBANA_URL=http://kibana:5601,http://localhost:5601  # Kibana URLs
```

### Event-Driven Features
```bash
ENABLE_KAFKA_EVENTS=true                   # Enable Kafka event publishing
ENABLE_ELASTICSEARCH_LOGGING=true          # Enable ES logging integration
```

## Environment Specific Settings

### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
GRAPHQL_PLAYGROUND=true
GRAPHQL_INTROSPECTION=true
ENABLE_METRICS=true
```

### Production
```bash
NODE_ENV=production
LOG_LEVEL=info
GRAPHQL_PLAYGROUND=false
GRAPHQL_INTROSPECTION=false
ENABLE_METRICS=true

# Use strong passwords
ELASTICSEARCH_PASSWORD=<strong-password>
JWT_SECRET=<strong-secret-key>
JWT_REFRESH_SECRET=<strong-refresh-secret>
```

### Docker Compose
```bash
# Use service names for internal communication
KAFKA_BROKERS=kafka:29092
ELASTICSEARCH_URL=http://elasticsearch:9200
LOGSTASH_HOST=logstash
KIBANA_URL=http://kibana:5601

# Use localhost for external access
KAFKA_BROKERS=localhost:9092
ELASTICSEARCH_URL=http://localhost:9200
KIBANA_URL=http://localhost:5601
```

## Security Considerations

### Secrets Management
- Never commit real secrets to version control
- Use different secrets for each environment
- Rotate secrets regularly
- Use environment-specific `.env` files

### Network Security
- Use internal Docker networks for service communication
- Expose only necessary ports to host
- Configure proper authentication for Elasticsearch
- Use SSL/TLS in production

### Access Control
- Configure Kafka ACLs in production
- Set up Elasticsearch security features
- Use least privilege principle for service accounts
- Monitor access logs regularly