
#!/bin/bash

echo "🏗️ Building AnineePlus API Services..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to build a service
build_service() {
    local dir=$1
    local service_name=$2
    
    if [ -d "$dir" ]; then
        echo -e "${YELLOW}🔨 Building ${service_name}...${NC}"
        cd "$dir" && bun run build && cd - > /dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ ${service_name} built successfully${NC}"
        else
            echo -e "${RED}❌ Failed to build ${service_name}${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Directory not found: ${dir} (${service_name})${NC}"
    fi
}

# Build shared libraries first
echo -e "${YELLOW}📚 Building shared libraries...${NC}"
build_service "shared/common" "Common Library"
build_service "libs/casl-authorization" "CASL Authorization Library"

echo ""

# Build core services
echo -e "${YELLOW}🏢 Building core services...${NC}"
build_service "apps/core" "Core Service"
build_service "apps/gateway" "Gateway Service"

# Build event-driven services
echo -e "${YELLOW}🔄 Building event-driven services...${NC}"
build_service "apps/searcher" "Searcher Service"  
build_service "apps/logger" "Logger Service"

# Build plugins
echo -e "${YELLOW}🔌 Building plugins...${NC}"
build_service "plugins/payment" "Payment Plugin"

echo ""
echo -e "${YELLOW}🐳 Building Docker images...${NC}"

# Build Docker images for all services
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All Docker images built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build Docker images${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo ""
echo "Available services:"
echo "  - core: Core GraphQL API"
echo "  - gateway: GraphQL Federation Gateway" 
echo "  - searcher: Kafka Consumer → Elasticsearch"
echo "  - logger: Log Aggregation Service"
echo "  - payment: Payment Processing Plugin"
echo ""
echo "To start services:"
echo "  docker-compose up -d"