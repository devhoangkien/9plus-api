#!/bin/bash

# Setup script for event-driven architecture with Kafka and ELK stack

echo "🚀 Setting up Event-Driven Architecture with Kafka & ELK Stack"

# Create network if not exists
echo "📡 Creating Docker network..."
docker network create anineplus-network 2>/dev/null || echo "Network already exists"

echo "🐳 Starting infrastructure services..."

# Start Kafka and Zookeeper
echo "📨 Starting Kafka infrastructure..."
cd infra/kafka-connect
docker-compose up -d
cd ../..

# Wait for Kafka to be ready
echo "⏳ Waiting for Kafka to be ready..."
until docker exec anineplus-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 >/dev/null 2>&1; do
  echo "Kafka is unavailable - sleeping"
  sleep 5
done
echo "✅ Kafka is ready!"

# Start ELK Stack
echo "🔍 Starting ELK Stack..."
cd infra/elastic-stack
docker-compose up -d
cd ../..

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch to be ready..."
until curl -u elastic:changeme -f http://localhost:9200/_cluster/health >/dev/null 2>&1; do
  echo "Elasticsearch is unavailable - sleeping"
  sleep 10
done
echo "✅ Elasticsearch is ready!"

# Install dependencies for new services
echo "📦 Installing dependencies for searcher service..."
cd apps/searcher && npm install && cd ../..

echo "📦 Installing dependencies for logger service..."
cd apps/logger && npm install && cd ../..

echo "📦 Installing kafkajs in core service..."
cd apps/core && npm install kafkajs && cd ../..

echo "🏗️ Building services..."
docker-compose build searcher logger

echo "🚀 Starting all services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Setup Kafka Connect Elasticsearch Sink
echo "🔗 Setting up Kafka Connect Elasticsearch Sink..."
cd infra/kafka-connect
chmod +x setup-connector.sh
./setup-connector.sh
cd ../..

echo """
🎉 Setup Complete!

Services available at:
- Kafka UI: http://localhost:8080
- Elasticsearch: http://localhost:9200 (elastic/changeme)
- Kibana: http://localhost:5601
- Kafka Connect: http://localhost:8083
- Gateway: http://localhost:3000
- Searcher: http://localhost:3003 (internal)
- Logger: http://localhost:3004 (internal)

Event Flow:
1. Core service → Kafka topics (user.*, role.*, permission.*)
2. Searcher service ← Kafka → Elasticsearch (for search indexing)
3. Logger service → Elasticsearch (for log aggregation)
4. Kibana ← Elasticsearch (for visualization)

Test the system:
1. Create/Update/Delete users in Core service
2. Check Kafka UI to see events
3. Check Kibana to see indexed data and logs
4. Check searcher service health: curl http://localhost:3003/health
"""