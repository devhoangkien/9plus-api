# Logging & Monitoring Tasks

## Overview
This checklist covers setting up comprehensive logging, monitoring, and observability using ELK Stack and distributed tracing.

---

## ✅ Task Checklist

### 1. ELK Stack Setup
**Goal**: Centralized logging with Elasticsearch, Logstash, and Kibana

- [ ] Verify Elasticsearch cluster is running
- [ ] Configure Elasticsearch indices and mappings
- [ ] Set up Logstash pipelines
- [ ] Configure log parsing and transformation
- [ ] Set up Kibana dashboards
- [ ] Create index patterns in Kibana
- [ ] Configure log retention policies
- [ ] Set up index lifecycle management (ILM)

**Reference Documentation**:
- [`architecture/EVENT_DRIVEN_ARCHITECTURE.md`](../architecture/EVENT_DRIVEN_ARCHITECTURE.md)

**Actions**:
```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health?pretty

# Create index template
curl -X PUT http://localhost:9200/_index_template/logs \
  -H 'Content-Type: application/json' \
  -d '{
    "index_patterns": ["logs-*"],
    "template": {
      "settings": {
        "number_of_shards": 2,
        "number_of_replicas": 1
      }
    }
  }'

# Access Kibana
open http://localhost:5601
```

**Success Criteria**:
- ✅ Elasticsearch cluster healthy (green status)
- ✅ Indices created with proper mappings
- ✅ Logstash processing logs successfully
- ✅ Kibana accessible and configured
- ✅ Index patterns created
- ✅ Retention policies active
- ✅ ILM policies applied

---

### 2. Logger Service Implementation
**Goal**: Centralized logging service operational

- [ ] Implement log aggregation from all services
- [ ] Set up structured logging format
- [ ] Configure log levels (debug, info, warn, error)
- [ ] Implement log forwarding to ELK
- [ ] Add request/response logging
- [ ] Set up error tracking
- [ ] Implement log buffering and batching
- [ ] Add log filtering and sampling

**Reference Documentation**:
- [`../apps/logger/`](../../apps/logger/)

**Actions**:
```typescript
// Structured logging
this.logger.log({
  level: 'info',
  timestamp: new Date().toISOString(),
  service: 'core',
  traceId: context.traceId,
  message: 'User created',
  data: {
    userId: user.id,
    email: user.email,
  },
});

// Error logging
this.logger.error({
  level: 'error',
  timestamp: new Date().toISOString(),
  service: 'core',
  traceId: context.traceId,
  message: error.message,
  stack: error.stack,
  context: additionalContext,
});
```

**Success Criteria**:
- ✅ Logger service running
- ✅ All services sending logs
- ✅ Structured format consistent
- ✅ Logs appearing in Elasticsearch
- ✅ Log levels working correctly
- ✅ Errors tracked with stack traces
- ✅ Performance acceptable (<10ms overhead)

---

### 3. Request Tracking & Distributed Tracing
**Goal**: Track requests across all services

- [ ] Implement correlation ID generation
- [ ] Add correlation ID to all logs
- [ ] Implement trace context propagation
- [ ] Add span creation for operations
- [ ] Set up trace visualization
- [ ] Implement performance metrics
- [ ] Add request timing information
- [ ] Create tracing dashboards

**Reference Documentation**:
- [`../apps/core/REQUEST_TRACKING.md`](../../apps/core/REQUEST_TRACKING.md)
- [`../apps/gateway/REQUEST_TRACKING_SUMMARY.md`](../../apps/gateway/REQUEST_TRACKING_SUMMARY.md)
- [`../apps/gateway/DISTRIBUTED_TRACING.md`](../../apps/gateway/DISTRIBUTED_TRACING.md)

**Actions**:
```typescript
// Generate correlation ID at gateway
const correlationId = uuidv4();
request.headers['x-correlation-id'] = correlationId;

// Add to logger context
this.logger.setContext({ correlationId });

// Log with trace info
this.logger.log('Processing request', {
  correlationId,
  method: request.method,
  path: request.path,
  startTime: Date.now(),
});

// Propagate to downstream services
await this.httpService.post(url, data, {
  headers: {
    'x-correlation-id': correlationId,
    'x-parent-span-id': currentSpanId,
  },
});
```

**Success Criteria**:
- ✅ Correlation IDs generated at entry point
- ✅ IDs propagated through all services
- ✅ All logs include correlation ID
- ✅ Can trace request through entire system
- ✅ Spans captured for key operations
- ✅ Performance metrics collected
- ✅ Tracing dashboard functional

---

### 4. Application Metrics & Monitoring
**Goal**: Comprehensive application monitoring

- [ ] Set up Prometheus metrics collection
- [ ] Expose metrics endpoints from services
- [ ] Configure Grafana dashboards
- [ ] Add custom application metrics
- [ ] Set up health check endpoints
- [ ] Implement readiness and liveness probes
- [ ] Monitor service dependencies
- [ ] Set up performance benchmarks

**Metrics to Track**:
```typescript
// Request metrics
- http_requests_total (counter)
- http_request_duration_seconds (histogram)
- http_requests_in_progress (gauge)

// Business metrics
- users_created_total (counter)
- active_sessions (gauge)
- database_query_duration (histogram)

// System metrics
- nodejs_heap_size_used_bytes (gauge)
- nodejs_event_loop_lag_seconds (gauge)
- kafka_consumer_lag (gauge)
```

**Actions**:
```typescript
// Expose metrics
import { Counter, Histogram } from 'prom-client';

const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
});

// Use in middleware
requestCounter.inc({ method, path, status });
requestDuration.observe({ method, path }, duration);
```

**Success Criteria**:
- ✅ Metrics endpoints exposed
- ✅ Prometheus scraping metrics
- ✅ Grafana dashboards created
- ✅ Custom metrics tracked
- ✅ Health checks responding
- ✅ Dependencies monitored
- ✅ Alerts configured

---

### 5. Error Tracking & Alerting
**Goal**: Proactive error detection and alerting

- [ ] Set up error aggregation
- [ ] Configure error grouping and deduplication
- [ ] Implement error severity classification
- [ ] Set up alert rules
- [ ] Configure notification channels (email, Slack, etc.)
- [ ] Create error dashboards
- [ ] Implement error rate monitoring
- [ ] Set up anomaly detection

**Actions**:
```typescript
// Error tracking
class ErrorTracker {
  track(error: Error, context: any) {
    this.logger.error({
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      severity: this.classifySeverity(error),
      context,
      timestamp: new Date(),
    });
    
    // Send to monitoring service
    this.monitoringService.trackError(error, context);
  }
  
  classifySeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    // Classification logic
  }
}
```

**Kibana Alert Example**:
```json
{
  "name": "High Error Rate",
  "schedule": "1m",
  "condition": {
    "query": "level:error",
    "threshold": 10,
    "timeWindow": "5m"
  },
  "actions": [{
    "type": "slack",
    "message": "Error rate exceeded threshold"
  }]
}
```

**Success Criteria**:
- ✅ Errors aggregated and grouped
- ✅ Severity classification working
- ✅ Alert rules configured
- ✅ Notifications being sent
- ✅ Error dashboards created
- ✅ Error rate monitored
- ✅ Anomalies detected

---

### 6. Performance Monitoring
**Goal**: Track and optimize application performance

- [ ] Set up APM (Application Performance Monitoring)
- [ ] Track database query performance
- [ ] Monitor API endpoint response times
- [ ] Track event processing latency
- [ ] Monitor memory and CPU usage
- [ ] Identify performance bottlenecks
- [ ] Set up performance budgets
- [ ] Create performance dashboards

**Actions**:
```typescript
// Track database queries
@Trace('database-query')
async findUser(id: string) {
  const start = Date.now();
  try {
    const user = await this.prisma.user.findUnique({ where: { id } });
    this.metrics.recordQueryTime('findUser', Date.now() - start);
    return user;
  } catch (error) {
    this.metrics.recordQueryError('findUser');
    throw error;
  }
}

// Track API performance
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    this.metrics.recordApiLatency(req.path, duration);
    
    if (duration > 1000) {
      this.logger.warn('Slow request', { path: req.path, duration });
    }
  });
  next();
});
```

**Success Criteria**:
- ✅ APM collecting data
- ✅ Query performance tracked
- ✅ API latency monitored
- ✅ Event latency measured
- ✅ Resource usage tracked
- ✅ Bottlenecks identified
- ✅ Performance budgets enforced
- ✅ Dashboards created

---

### 7. Log Analysis & Insights
**Goal**: Extract insights from logs

- [ ] Create Kibana visualizations
- [ ] Set up log aggregation queries
- [ ] Build operational dashboards
- [ ] Create user behavior analytics
- [ ] Set up log-based alerts
- [ ] Implement log sampling for high-volume
- [ ] Create saved searches for common queries
- [ ] Set up ML jobs for anomaly detection (optional)

**Kibana Dashboards**:
```
1. System Overview Dashboard
   - Request rate
   - Error rate
   - Response times
   - Active users

2. Error Analysis Dashboard
   - Error types
   - Error trends
   - Top errors
   - Error rate by service

3. Performance Dashboard
   - Slow queries
   - API latency
   - Event processing time
   - Resource utilization

4. Business Metrics Dashboard
   - User signups
   - Active sessions
   - Feature usage
   - Conversion funnel
```

**Success Criteria**:
- ✅ Visualizations created
- ✅ Dashboards built
- ✅ Analytics functional
- ✅ Alerts configured
- ✅ Sampling implemented for high volume
- ✅ Common queries saved
- ✅ Insights being extracted

---

## 🔍 Validation Commands

Test logging and monitoring setup:

```bash
# Check Elasticsearch indices
curl http://localhost:9200/_cat/indices?v

# Query logs
curl -X GET "http://localhost:9200/logs-*/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match": {"level": "error"}}}'

# Check Logstash pipeline
curl http://localhost:9600/_node/stats/pipelines?pretty

# Access Kibana
open http://localhost:5601

# Check metrics endpoint
curl http://localhost:3000/metrics

# Test correlation ID tracking
# Make a request and search logs for the correlation ID
CORRELATION_ID=$(uuidv4)
curl -H "X-Correlation-ID: $CORRELATION_ID" http://localhost:3000/api/users
# Then search in Kibana for that correlation ID
```

---

## 🆘 Common Issues

### Logs not appearing in Elasticsearch
- **Solution**: Check Logstash pipeline configuration and connectivity
- **Command**: `docker-compose logs logstash`

### Kibana can't connect to Elasticsearch
- **Solution**: Verify Elasticsearch is healthy and accessible
- **Command**: `curl http://localhost:9200/_cluster/health`

### High memory usage in Elasticsearch
- **Solution**: Adjust JVM heap size or implement index lifecycle management
- **Config**: Set `ES_JAVA_OPTS="-Xms2g -Xmx2g"` in docker-compose

### Correlation IDs not propagating
- **Solution**: Ensure all HTTP clients include the correlation ID header
- **Check**: Middleware and interceptor configuration

---

## 📚 Next Steps

Once logging and monitoring are operational, proceed to:
- [Search & Indexing Tasks](05-search-indexing.md)
- [Development & Deployment Tasks](06-development-deployment.md)
