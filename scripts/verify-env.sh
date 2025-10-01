#!/bin/bash

# Verify AnineePlus API Environment
echo "🔍 Verifying AnineePlus API Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
TOTAL_CHECKS=0

# Function to check status
check_status() {
    local service=$1
    local command=$2
    local expected=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "  Checking $service... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        if [ "$expected" != "" ]; then
            echo -e "    ${YELLOW}Expected: $expected${NC}"
        fi
    fi
}

# Function to check service health
check_service_health() {
    local service=$1
    local url=$2
    local port=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "  Checking $service (port $port)... "
    
    # Check if port is listening
    if nc -z localhost $port 2>/dev/null; then
        # If URL provided, check HTTP health
        if [ "$url" != "" ]; then
            if curl -s "$url" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ HEALTHY${NC}"
                CHECKS_PASSED=$((CHECKS_PASSED + 1))
            else
                echo -e "${YELLOW}⚠️  PORT OPEN, HTTP UNHEALTHY${NC}"
            fi
        else
            echo -e "${GREEN}✅ PORT OPEN${NC}"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        fi
    else
        echo -e "${RED}❌ NOT RUNNING${NC}"
    fi
}

# Check system requirements
echo -e "${BLUE}📋 System Requirements:${NC}"
check_status "Node.js" "node --version | grep -E '^v(18|20)'" "Node.js v18+ or v20+"
check_status "Bun" "bun --version" "Bun installed"
check_status "Docker" "docker --version" "Docker installed"
check_status "Docker Compose" "docker-compose --version" "Docker Compose installed"

echo ""

# Check project structure
echo -e "${BLUE}📁 Project Structure:${NC}"
check_status "Core service" "[ -d apps/core ]"
check_status "Gateway service" "[ -d apps/gateway ]"
check_status "Searcher service" "[ -d apps/searcher ]"
check_status "Logger service" "[ -d apps/logger ]"
check_status "Payment plugin" "[ -d plugins/payment ]"
check_status "Common library" "[ -d libs/common ]"
check_status "CASL library" "[ -d libs/casl-authorization ]"
check_status "Kafka infrastructure" "[ -d infra/kafka-connect ]"
check_status "ELK infrastructure" "[ -d infra/elastic-stack ]"

echo ""

# Check configuration files
echo -e "${BLUE}⚙️  Configuration Files:${NC}"
check_status "Root package.json" "[ -f package.json ]"
check_status "Docker Compose" "[ -f docker-compose.yaml ]"
check_status "Core Prisma schema" "[ -f apps/core/prisma/schema.prisma ]"
check_status "Payment Prisma schema" "[ -f plugins/payment/prisma/schema.prisma ]"
check_status "Core .env.example" "[ -f apps/core/.env.example ]"
check_status "Gateway .env.example" "[ -f apps/gateway/.env.example ]"
check_status "Searcher .env.example" "[ -f apps/searcher/.env.example ]"
check_status "Logger .env.example" "[ -f apps/logger/.env.example ]"

echo ""

# Check environment files
echo -e "${BLUE}🌍 Environment Files:${NC}"
check_status "Core .env" "[ -f apps/core/.env ]"
check_status "Gateway .env" "[ -f apps/gateway/.env ]"
check_status "Searcher .env" "[ -f apps/searcher/.env ]"
check_status "Logger .env" "[ -f apps/logger/.env ]"
check_status "Payment .env" "[ -f plugins/payment/.env ]"

echo ""

# Check dependencies
echo -e "${BLUE}📦 Dependencies:${NC}"
check_status "Root dependencies" "[ -d node_modules ]"
check_status "Core dependencies" "[ -d apps/core/node_modules ]"
check_status "Gateway dependencies" "[ -d apps/gateway/node_modules ]"
check_status "Searcher dependencies" "[ -d apps/searcher/node_modules ]"
check_status "Logger dependencies" "[ -d apps/logger/node_modules ]"

echo ""

# Check Docker services
echo -e "${BLUE}🐳 Docker Services:${NC}"
echo "  Checking if services are running..."

# Infrastructure services
check_service_health "Zookeeper" "" "2181"
check_service_health "Kafka" "" "9092"
check_service_health "Elasticsearch" "http://localhost:9200" "9200"
check_service_health "Kibana" "http://localhost:5601" "5601"

# Application services
check_service_health "Core API" "http://localhost:3000/health" "3000"
check_service_health "Gateway" "http://localhost:3001/health" "3001"
check_service_health "Searcher" "" "3002"
check_service_health "Logger" "" "3003"
check_service_health "Payment Plugin" "http://localhost:3100/health" "3100"

echo ""

# Check Kafka topics
echo -e "${BLUE}📨 Kafka Topics:${NC}"
if nc -z localhost 9092 2>/dev/null; then
    echo "  Listing Kafka topics..."
    if timeout 5 docker exec -it $(docker ps -q --filter "name=kafka") kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null | grep -q "user-events\|role-events\|permission-events"; then
        echo -e "    ${GREEN}✅ Event topics exist${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "    ${YELLOW}⚠️  Event topics not found (may need to create)${NC}"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
else
    echo -e "    ${RED}❌ Kafka not running - cannot check topics${NC}"
fi

echo ""

# Check Elasticsearch indices
echo -e "${BLUE}🔍 Elasticsearch Indices:${NC}"
if curl -s http://localhost:9200 > /dev/null 2>&1; then
    echo "  Checking Elasticsearch indices..."
    if curl -s "http://localhost:9200/_cat/indices" | grep -q "users\|roles\|permissions"; then
        echo -e "    ${GREEN}✅ Event indices exist${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "    ${YELLOW}⚠️  Event indices not found (will be created on first events)${NC}"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
else
    echo -e "    ${RED}❌ Elasticsearch not running - cannot check indices${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}📊 Summary:${NC}"
echo "  Checks passed: $CHECKS_PASSED/$TOTAL_CHECKS"

PASS_PERCENTAGE=$((CHECKS_PASSED * 100 / TOTAL_CHECKS))

if [ $PASS_PERCENTAGE -eq 100 ]; then
    echo -e "  ${GREEN}🎉 All checks passed! Environment is fully ready.${NC}"
elif [ $PASS_PERCENTAGE -ge 80 ]; then
    echo -e "  ${GREEN}✅ Environment is mostly ready ($PASS_PERCENTAGE% checks passed).${NC}"
elif [ $PASS_PERCENTAGE -ge 60 ]; then
    echo -e "  ${YELLOW}⚠️  Environment needs some attention ($PASS_PERCENTAGE% checks passed).${NC}"
else
    echo -e "  ${RED}❌ Environment has significant issues ($PASS_PERCENTAGE% checks passed).${NC}"
fi

echo ""

# Recommendations
if [ $PASS_PERCENTAGE -lt 100 ]; then
    echo -e "${BLUE}💡 Recommendations:${NC}"
    
    if [ ! -d node_modules ]; then
        echo "  • Run: ./scripts/install.sh"
    fi
    
    if [ ! -f apps/core/.env ]; then
        echo "  • Run: ./scripts/setup-env.sh"
    fi
    
    if ! nc -z localhost 9092 2>/dev/null; then
        echo "  • Start infrastructure: ./scripts/setup-event-driven.sh"
    fi
    
    if ! nc -z localhost 3000 2>/dev/null; then
        echo "  • Start services: ./scripts/start-dev-event-driven.sh"
    fi
    
    echo "  • For full setup: ./scripts/test-event-driven.sh"
fi

echo ""
exit $((100 - PASS_PERCENTAGE))