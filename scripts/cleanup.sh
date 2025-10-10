#!/bin/bash

echo "🧹 Cleaning up AnineePlus API Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to ask for confirmation
confirm() {
    local message=$1
    echo -n -e "${YELLOW}${message} (y/N): ${NC}"
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

echo "This script will help you clean up your development environment."
echo "You can choose what to clean up."
echo ""

# Clean Docker containers and volumes
if confirm "🐳 Stop and remove Docker containers?"; then
    echo "Stopping Docker containers..."
    docker-compose down
    
    echo "Stopping infrastructure services..."
    cd infra/kafka-connect && docker-compose down && cd - >/dev/null
    cd infra/elastic-stack && docker-compose down && cd - >/dev/null
    
    echo -e "${GREEN}✅ Docker containers stopped${NC}"
    
    if confirm "🗑️  Remove Docker volumes (this will delete all data)?"; then
        echo "Removing Docker volumes..."
        docker-compose down -v
        cd infra/kafka-connect && docker-compose down -v && cd - >/dev/null
        cd infra/elastic-stack && docker-compose down -v && cd - >/dev/null
        
        # Remove specific volumes
        docker volume rm -f anineplus-api_elasticsearch_data 2>/dev/null
        docker volume rm -f anineplus-api_kafka_data 2>/dev/null
        docker volume rm -f anineplus-api_zookeeper_data 2>/dev/null
        docker volume rm -f anineplus-api_zookeeper_logs 2>/dev/null
        
        echo -e "${GREEN}✅ Docker volumes removed${NC}"
    fi
fi

echo ""

# Clean node_modules
if confirm "📦 Remove node_modules directories?"; then
    echo "Removing node_modules..."
    
    # Root
    rm -rf node_modules
    
    # Services
    rm -rf apps/core/node_modules
    rm -rf apps/gateway/node_modules
    rm -rf apps/searcher/node_modules  
    rm -rf apps/logger/node_modules
    
    # Plugins
    rm -rf plugins/payment/node_modules
    
    # Libraries
    rm -rf shared/common/node_modules
    rm -rf shared/casl-authorization/node_modules
    
    echo -e "${GREEN}✅ node_modules removed${NC}"
fi

echo ""

# Clean built files
if confirm "🏗️  Remove built files (dist directories)?"; then
    echo "Removing built files..."
    
    # Services
    rm -rf apps/core/dist
    rm -rf apps/gateway/dist
    rm -rf apps/searcher/dist
    rm -rf apps/logger/dist
    
    # Plugins
    rm -rf plugins/payment/dist
    
    # Libraries
    rm -rf shared/common/dist
    rm -rf shared/casl-authorization/dist
    
    echo -e "${GREEN}✅ Built files removed${NC}"
fi

echo ""

# Clean logs
if confirm "📄 Remove log files?"; then
    echo "Removing log files..."
    
    # Service logs
    rm -rf apps/core/logs/*.log
    rm -rf apps/gateway/logs/*.log
    rm -rf apps/searcher/logs/*.log
    rm -rf apps/logger/logs/*.log
    rm -rf plugins/payment/logs/*.log
    
    # Keep log directories but remove files
    find . -name "*.log" -type f -delete 2>/dev/null
    
    echo -e "${GREEN}✅ Log files removed${NC}"
fi

echo ""

# Clean environment files
if confirm "⚙️  Remove .env files (keep .env.example)?"; then
    echo "Removing .env files..."
    
    # Root
    rm -f .env
    
    # Services
    rm -f apps/core/.env
    rm -f apps/gateway/.env
    rm -f apps/searcher/.env
    rm -f apps/logger/.env
    
    # Plugins
    rm -f plugins/payment/.env
    
    echo -e "${GREEN}✅ .env files removed${NC}"
    echo -e "${YELLOW}⚠️  You'll need to run './scripts/setup-env.sh' to recreate them${NC}"
fi

echo ""

# Clean Docker images
if confirm "🖼️  Remove Docker images?"; then
    echo "Removing Docker images..."
    
    # Remove project images
    docker image rm -f core:dev gateway:dev searcher:dev logger:dev payment:dev 2>/dev/null
    
    # Remove dangling images
    docker image prune -f
    
    echo -e "${GREEN}✅ Docker images removed${NC}"
fi

echo ""

# Clean Docker network
if confirm "🌐 Remove Docker network?"; then
    echo "Removing Docker network..."
    docker network rm anineplus-network 2>/dev/null || echo "Network not found or already removed"
    echo -e "${GREEN}✅ Docker network removed${NC}"
fi

echo ""

# Clean bun cache
if confirm "🧹 Clean bun cache?"; then
    echo "Cleaning bun cache..."
    bun pm cache rm
    echo -e "${GREEN}✅ Bun cache cleaned${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Cleanup completed!${NC}"
echo ""
echo "To set up the environment again:"
echo "1. Run: ./scripts/setup-env.sh"
echo "2. Run: ./scripts/install.sh" 
echo "3. Run: ./scripts/setup-event-driven.sh"
echo ""
echo "For development:"
echo "  ./scripts/start-dev-event-driven.sh"
echo ""
echo "For testing:"
echo "  ./scripts/test-event-driven.sh"