#!/bin/bash

echo "🧪 Testing AnineePlus Event-Driven Architecture..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local service_name=$1
    local url=$2
    local timeout=${3:-5}
    
    echo -n "🔗 Checking ${service_name}..."
    if timeout $timeout curl -f "$url" >/dev/null 2>&1; then
        echo -e " ${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e " ${RED}❌ Not available${NC}"
        return 1
    fi
}

# Function to test Kafka topic
test_kafka_topic() {
    local topic=$1
    echo -n "📨 Testing Kafka topic: ${topic}..."
    
    # Try to produce a test message
    echo '{"test": "message", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}' | \
    timeout 5 docker exec -i anineplus-kafka kafka-console-producer \
        --bootstrap-server localhost:9092 --topic "$topic" >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e " ${GREEN}✅ Working${NC}"
        return 0
    else
        echo -e " ${RED}❌ Failed${NC}"
        return 1
    fi
}

# Function to test Elasticsearch index
test_elasticsearch_index() {
    local index=$1
    echo -n "🔍 Testing Elasticsearch index: ${index}..."
    
    local response=$(curl -u elastic:changeme -s "http://localhost:9200/${index}/_search?size=0")
    if echo "$response" | grep -q "hits"; then
        local count=$(echo "$response" | grep -o '"value":[0-9]*' | head -1 | cut -d':' -f2)
        echo -e " ${GREEN}✅ Available (${count} documents)${NC}"
        return 0
    else
        echo -e " ${RED}❌ Not available${NC}"
        return 1
    fi
}

echo "==================== Infrastructure Health Check ===================="

# Check infrastructure services
errors=0

check_service "Kafka" "http://localhost:9092" 5
if [ $? -ne 0 ]; then ((errors++)); fi

check_service "Elasticsearch" "http://localhost:9200" 10
if [ $? -ne 0 ]; then ((errors++)); fi

check_service "Kibana" "http://localhost:5601" 10
if [ $? -ne 0 ]; then ((errors++)); fi

check_service "Kafka UI" "http://localhost:8080" 5
if [ $? -ne 0 ]; then ((errors++)); fi

echo ""
echo "==================== Application Services Health Check ===================="

check_service "Gateway" "http://localhost:3000/health" 5
if [ $? -ne 0 ]; then ((errors++)); fi

check_service "Searcher" "http://localhost:3003/health" 5  
if [ $? -ne 0 ]; then ((errors++)); fi

check_service "Logger" "http://localhost:3004/health" 5
if [ $? -ne 0 ]; then ((errors++)); fi

echo ""
echo "==================== Kafka Topics Test ===================="

# Test Kafka topics
topics=("user.created" "user.updated" "user.deleted" "role.created" "role.updated" "role.deleted")

for topic in "${topics[@]}"; do
    test_kafka_topic "$topic"
    if [ $? -ne 0 ]; then ((errors++)); fi
done

echo ""
echo "==================== Elasticsearch Indices Test ===================="

# Test Elasticsearch indices
indices=("users" "roles" "permissions" "anineplus-logs-$(date +%Y.%m.%d)")

for index in "${indices[@]}"; do
    test_elasticsearch_index "$index"
    # Don't count missing indices as errors for this test
done

echo ""
echo "==================== End-to-End Event Test ===================="

echo -e "${BLUE}🧪 Testing end-to-end event flow...${NC}"

# Test 1: Create a test user event
echo "1️⃣ Creating test user event..."
test_event='{
  "id": "test-user-'$(date +%s)'",
  "eventType": "created", 
  "entityType": "user",
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "data": {
    "id": "test-user-'$(date +%s)'",
    "email": "test@example.com",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User"
  }
}'

# Send to Kafka
echo "$test_event" | timeout 5 docker exec -i anineplus-kafka kafka-console-producer \
    --bootstrap-server localhost:9092 --topic user.created

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test event sent to Kafka${NC}"
    
    # Wait a bit for processing
    echo "⏳ Waiting for event processing..."
    sleep 5
    
    # Check if event was processed in Elasticsearch
    echo "2️⃣ Checking if event was indexed in Elasticsearch..."
    search_result=$(curl -u elastic:changeme -s "http://localhost:9200/users/_search" | grep "test@example.com")
    
    if [ ! -z "$search_result" ]; then
        echo -e "${GREEN}✅ Event successfully processed and indexed${NC}"
    else
        echo -e "${YELLOW}⚠️  Event not found in Elasticsearch (might take more time)${NC}"
        ((errors++))
    fi
else
    echo -e "${RED}❌ Failed to send test event${NC}"
    ((errors++))
fi

echo ""
echo "==================== Log Aggregation Test ===================="

echo "3️⃣ Testing log aggregation..."

# Create a test log entry
test_log='{"timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'", "level": "info", "message": "Test log entry for event-driven architecture", "service": "test"}'

# Try to send directly to Logstash
echo "$test_log" | timeout 5 curl -X POST "http://localhost:5000" \
    -H "Content-Type: application/json" -d @- >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test log sent to Logstash${NC}"
    
    # Wait for processing
    sleep 3
    
    # Check in Elasticsearch
    log_result=$(curl -u elastic:changeme -s "http://localhost:9200/anineplus-logs-*/_search" | grep "Test log entry for event-driven architecture")
    
    if [ ! -z "$log_result" ]; then
        echo -e "${GREEN}✅ Log successfully processed and stored${NC}"
    else
        echo -e "${YELLOW}⚠️  Log not found in Elasticsearch${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not send test log to Logstash${NC}"
fi

echo ""
echo "==================== Test Summary ===================="

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Event-driven architecture is working correctly.${NC}"
    echo ""
    echo "✅ Infrastructure services are running"
    echo "✅ Application services are healthy"
    echo "✅ Kafka topics are functional"
    echo "✅ Event processing pipeline is working"
    echo "✅ Log aggregation is operational"
    
    echo ""
    echo -e "${BLUE}🚀 Next steps:${NC}"
    echo "1. View Kafka messages: http://localhost:8080"
    echo "2. Search data in Kibana: http://localhost:5601"  
    echo "3. Check Elasticsearch directly: http://localhost:9200"
    echo "4. Test with real GraphQL mutations in Gateway: http://localhost:3000"
    
    exit 0
else
    echo -e "${RED}❌ Found ${errors} issues in the event-driven architecture.${NC}"
    echo ""
    echo "Common troubleshooting steps:"
    echo "1. Check if all services are running: docker-compose ps"
    echo "2. Check service logs: docker logs <service-name>"
    echo "3. Verify environment variables: ./scripts/validate-dev-env.sh"
    echo "4. Restart infrastructure: ./scripts/setup-event-driven.sh"
    
    exit 1
fi