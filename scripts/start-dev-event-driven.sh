#!/bin/bash

# Development startup script for event-driven architecture

echo "🚀 Starting Development Environment with Event-Driven Architecture"

# Function to check if service is running
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ Checking $service_name..."
    while [ $attempt -le $max_attempts ]; do
        if curl -f "$url" >/dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: $service_name not ready, waiting..."
        sleep 5
        ((attempt++))
    done
    echo "❌ $service_name failed to start within expected time"
    return 1
}

# Start infrastructure services
echo "📡 Starting infrastructure services..."
docker network create anineplus-network 2>/dev/null || echo "Network already exists"

# Start Kafka
echo "📨 Starting Kafka..."
cd infra/kafka-connect && docker-compose up -d && cd ../..

# Start ELK Stack  
echo "🔍 Starting ELK Stack..."
cd infra/elastic-stack && docker-compose up -d && cd ../..

# Check infrastructure health
check_service "Kafka" "http://localhost:9092"
check_service "Elasticsearch" "http://localhost:9200"
check_service "Kibana" "http://localhost:5601"

# Start application services in development mode
echo "🚀 Starting application services in development mode..."

# Start Core service
echo "Starting Core service..."
cd apps/core
npm run start:dev &
CORE_PID=$!
cd ../..

# Start Gateway service
echo "Starting Gateway service..."
cd apps/gateway
npm run start:dev &
GATEWAY_PID=$!
cd ../..

# Start Searcher service
echo "Starting Searcher service..."
cd apps/searcher
npm run start:dev &
SEARCHER_PID=$!
cd ../..

# Start Logger service
echo "Starting Logger service..."
cd apps/logger
npm run start:dev &
LOGGER_PID=$!
cd ../..

echo "⏳ Waiting for services to initialize..."
sleep 15

# Check application services health
check_service "Gateway" "http://localhost:3000/health" || true
check_service "Searcher" "http://localhost:3003/health" || true
check_service "Logger" "http://localhost:3004/health" || true

echo """
🎉 Development Environment Ready!

Service Status:
- Core: PID $CORE_PID (GraphQL Federation)
- Gateway: PID $GATEWAY_PID → http://localhost:3000
- Searcher: PID $SEARCHER_PID → http://localhost:3003
- Logger: PID $LOGGER_PID → http://localhost:3004

Infrastructure:
- Kafka UI: http://localhost:8080
- Elasticsearch: http://localhost:9200
- Kibana: http://localhost:5601
- Kafka Connect: http://localhost:8083

To stop services:
kill $CORE_PID $GATEWAY_PID $SEARCHER_PID $LOGGER_PID
docker-compose -f infra/kafka-connect/docker-compose.yml down
docker-compose -f infra/elastic-stack/docker-compose.yml down

Logs:
- tail -f apps/core/logs/*.log
- tail -f apps/gateway/logs/*.log  
- tail -f apps/searcher/logs/*.log
- tail -f apps/logger/logs/*.log
"""

# Keep script running
wait