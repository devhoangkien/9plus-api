#!/bin/bash

echo "⚙️ Setting up AnineePlus API Environment Files..."
echo ""

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to copy environment file
copy_env_file() {
    local dir=$1
    local service_name=$2
    
    if [ -d "$dir" ]; then
        cd "$dir"
        if [ -f ".env.example" ]; then
            if [ -f ".env" ]; then
                echo -e "${YELLOW}⚠️  .env already exists in ${service_name}, skipping...${NC}"
            else
                cp .env.example .env
                echo -e "${GREEN}✅ Created .env for ${service_name}${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  No .env.example found in ${service_name}${NC}"
        fi
        cd - > /dev/null
    else
        echo -e "${YELLOW}⚠️  Directory not found: ${dir}${NC}"
    fi
}

# Copy root environment file
echo -e "${YELLOW}📄 Setting up root environment...${NC}"
if [ -f ".env.example" ]; then
    if [ -f ".env" ]; then
        echo -e "${YELLOW}⚠️  Root .env already exists, skipping...${NC}"
    else
        cp .env.example .env
        echo -e "${GREEN}✅ Created root .env${NC}"
    fi
else
    echo -e "${RED}❌ Root .env.example not found${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🏢 Setting up service environments...${NC}"

# Copy environment files for all services
copy_env_file "apps/core" "Core Service"
copy_env_file "apps/gateway" "Gateway Service" 
copy_env_file "apps/searcher" "Searcher Service"
copy_env_file "apps/logger" "Logger Service"

echo ""
echo -e "${YELLOW}🔌 Setting up plugin environments...${NC}"
copy_env_file "plugins/payment" "Payment Plugin"

echo ""
echo -e "${GREEN}🎉 Environment setup completed!${NC}"
echo ""
echo "Created environment files:"
echo "  📄 ./.env (root configuration)"
echo "  📄 ./apps/core/.env"
echo "  📄 ./apps/gateway/.env"
echo "  📄 ./apps/searcher/.env"  
echo "  📄 ./apps/logger/.env"
echo "  📄 ./plugins/payment/.env"
echo ""
echo "⚠️  Important: Please update the .env files with your actual configuration:"
echo ""
echo "🔑 Required updates:"
echo "  - Database credentials (DATABASE_URL)"
echo "  - JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET)" 
echo "  - Redis connection (REDIS_HOST, REDIS_PASSWORD)"
echo "  - Kafka brokers (KAFKA_BROKERS)"
echo "  - Elasticsearch credentials (ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD)"
echo ""
echo "📖 For detailed configuration guide, see: ENVIRONMENT_VARIABLES.md"