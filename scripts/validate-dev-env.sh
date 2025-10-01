#!/bin/bash

# Development Environment Validation Script
# This script checks if the development environment is properly configured

echo "🔍 Validating AnineePlus API Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
echo "📋 Checking required tools..."

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed"
    docker --version
else
    echo -e "${RED}✗${NC} Docker is not installed"
    exit 1
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose is available"
    docker compose version
elif command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose (legacy) is installed"
    docker-compose --version
else
    echo -e "${RED}✗${NC} Docker Compose is not installed"
    exit 1
fi

# Check Bun
if command -v bun &> /dev/null; then
    echo -e "${GREEN}✓${NC} Bun is installed"
    bun --version
else
    echo -e "${YELLOW}⚠${NC} Bun is not installed (optional for host development)"
fi

# Check Node.js (fallback)
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js is installed"
    node --version
else
    echo -e "${YELLOW}⚠${NC} Node.js is not installed (fallback for Bun)"
fi

# Check curl for health checks
if command -v curl &> /dev/null; then
    echo -e "${GREEN}✓${NC} curl is installed"
else
    echo -e "${YELLOW}⚠${NC} curl is not installed (needed for health checks)"
fi

# Check netcat for port checks
if command -v nc &> /dev/null; then
    echo -e "${GREEN}✓${NC} netcat is installed"
elif command -v netcat &> /dev/null; then
    echo -e "${GREEN}✓${NC} netcat is installed"
else
    echo -e "${YELLOW}⚠${NC} netcat is not installed (needed for port checks)"
fi

echo ""

# Check project structure
echo -e "${BLUE}📁 Checking project structure...${NC}"

# Core structure
required_dirs=("apps/core" "apps/gateway" "libs/common" "libs/casl-authorization")
for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir exists"
    else
        echo -e "${RED}✗${NC} $dir is missing"
    fi
done

# Event-driven architecture structure
event_dirs=("apps/searcher" "apps/logger" "infra/kafka-connect" "infra/elastic-stack")
echo ""
echo -e "${BLUE}🚀 Event-driven architecture structure:${NC}"
for dir in "${event_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir exists"
    else
        echo -e "${YELLOW}⚠${NC} $dir is missing (run setup-event-driven.sh)"
    fi
done

# Plugins
plugins_dirs=("plugins/payment")
echo ""
echo -e "${BLUE}� Plugin structure:${NC}"
for dir in "${plugins_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir exists"
    else
        echo -e "${YELLOW}⚠${NC} $dir is missing (optional plugin)"
    fi
done

echo ""

# Check if .env file exists
echo -e "${BLUE}⚙️  Checking configuration files...${NC}"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Root .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Root .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} .env file created from .env.example"
    else
        echo -e "${RED}✗${NC} .env.example file not found"
        exit 1
    fi
fi

# Check service-specific .env files
services=("core" "gateway" "searcher" "logger")
for service in "${services[@]}"; do
    service_path="apps/$service"
    if [ -d "$service_path" ]; then
        if [ -f "$service_path/.env" ]; then
            echo -e "${GREEN}✓${NC} $service/.env file exists"
        elif [ -f "$service_path/.env.example" ]; then
            cp "$service_path/.env.example" "$service_path/.env"
            echo -e "${GREEN}✓${NC} $service/.env created from .env.example"
        else
            echo -e "${YELLOW}⚠${NC} $service/.env.example not found"
        fi
    fi
done

# Check plugin .env files
if [ -d "plugins/payment" ]; then
    if [ -f "plugins/payment/.env" ]; then
        echo -e "${GREEN}✓${NC} payment/.env file exists"
    elif [ -f "plugins/payment/.env.example" ]; then
        cp "plugins/payment/.env.example" "plugins/payment/.env"
        echo -e "${GREEN}✓${NC} payment/.env created from .env.example"
    else
        echo -e "${YELLOW}⚠${NC} payment/.env.example not found"
    fi
fi

# Check Docker Compose files
echo ""
echo -e "${BLUE}🐳 Checking Docker Compose files...${NC}"

compose_files=("docker-compose.yaml" "docker-compose-dev.yaml" "infra/kafka-connect/docker-compose.yml" "infra/elastic-stack/docker-compose.yml")
for file in "${compose_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${YELLOW}⚠${NC} $file is missing"
    fi
done

# Check if git submodules are initialized (optional)
echo ""
echo -e "${BLUE}📦 Checking git submodules (optional)...${NC}"

if [ -d ".git" ]; then
    if [ -d "apps/core/.git" ] || [ -f "apps/core/.git" ]; then
        echo -e "${GREEN}✓${NC} core submodule is initialized"
    else
        echo -e "${YELLOW}⚠${NC} core submodule not initialized (if using git submodules)"
        echo "  Run: git submodule update --init --recursive"
    fi

    if [ -d "plugins/payment/.git" ] || [ -f "plugins/payment/.git" ]; then
        echo -e "${GREEN}✓${NC} payment plugin submodule is initialized"
    else
        echo -e "${YELLOW}⚠${NC} payment plugin submodule not initialized (optional)"
        echo "  Run: git submodule update --init --recursive"
    fi
else
    echo -e "${YELLOW}⚠${NC} Not a git repository - skipping submodule check"
fi

# Validate Docker Compose files
echo ""
echo -e "${BLUE}🐳 Validating Docker Compose configurations...${NC}"

# Main compose files
if [ -f "docker-compose.yaml" ]; then
    if docker compose -f docker-compose.yaml config --quiet 2>/dev/null; then
        echo -e "${GREEN}✓${NC} docker-compose.yaml is valid"
    else
        echo -e "${RED}✗${NC} docker-compose.yaml has errors"
    fi
fi

if [ -f "docker-compose-dev.yaml" ]; then
    if docker compose -f docker-compose-dev.yaml config --quiet 2>/dev/null; then
        echo -e "${GREEN}✓${NC} docker-compose-dev.yaml is valid"
    else
        echo -e "${RED}✗${NC} docker-compose-dev.yaml has errors"
    fi
fi

# Infrastructure compose files
if [ -f "infra/kafka-connect/docker-compose.yml" ]; then
    if (cd infra/kafka-connect && docker compose config --quiet 2>/dev/null); then
        echo -e "${GREEN}✓${NC} kafka-connect/docker-compose.yml is valid"
    else
        echo -e "${YELLOW}⚠${NC} kafka-connect/docker-compose.yml has warnings"
    fi
fi

if [ -f "infra/elastic-stack/docker-compose.yml" ]; then
    if (cd infra/elastic-stack && docker compose config --quiet 2>/dev/null); then
        echo -e "${GREEN}✓${NC} elastic-stack/docker-compose.yml is valid"
    else
        echo -e "${YELLOW}⚠${NC} elastic-stack/docker-compose.yml has warnings"
    fi
fi

# Check if ports are available
echo ""
echo -e "${BLUE}🔌 Checking port availability...${NC}"

check_port() {
    local port=$1
    local service=$2
    
    # Try different methods to check port
    if command -v nc &> /dev/null && nc -z localhost $port 2>/dev/null; then
        echo -e "${YELLOW}⚠${NC} Port $port is already in use (needed for $service)"
    elif command -v netstat &> /dev/null && netstat -ln 2>/dev/null | grep -q ":$port "; then
        echo -e "${YELLOW}⚠${NC} Port $port is already in use (needed for $service)"
    elif command -v lsof &> /dev/null && lsof -i :$port &> /dev/null; then
        echo -e "${YELLOW}⚠${NC} Port $port is already in use (needed for $service)"
    else
        echo -e "${GREEN}✓${NC} Port $port is available for $service"
    fi
}

# Core services
check_port 3000 "Core API"
check_port 3001 "Gateway"
check_port 3002 "Searcher Service"
check_port 3003 "Logger Service"
check_port 3100 "Payment Plugin"

# Infrastructure services
check_port 2181 "Zookeeper"
check_port 9092 "Kafka"
check_port 8080 "Kafka UI"
check_port 8083 "Kafka Connect"
check_port 9200 "Elasticsearch"
check_port 5601 "Kibana"
check_port 5044 "Logstash"

# Databases
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"

# Check dependencies
echo ""
echo -e "${BLUE}� Checking dependencies...${NC}"

# Check if node_modules exist
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Root node_modules exists"
else
    echo -e "${YELLOW}⚠${NC} Root node_modules missing (run: ./scripts/install.sh)"
fi

# Check service dependencies
services=("core" "gateway" "searcher" "logger")
for service in "${services[@]}"; do
    service_path="apps/$service"
    if [ -d "$service_path" ]; then
        if [ -d "$service_path/node_modules" ]; then
            echo -e "${GREEN}✓${NC} $service node_modules exists"
        else
            echo -e "${YELLOW}⚠${NC} $service node_modules missing"
        fi
    fi
done

# Check libraries
libs=("common" "casl-authorization")
for lib in "${libs[@]}"; do
    lib_path="libs/$lib"
    if [ -d "$lib_path" ]; then
        if [ -d "$lib_path/node_modules" ]; then
            echo -e "${GREEN}✓${NC} $lib library dependencies exist"
        else
            echo -e "${YELLOW}⚠${NC} $lib library dependencies missing"
        fi
    fi
done

# Check for required environment variables
echo ""
echo -e "${BLUE}🔧 Checking required environment variables...${NC}"

# Function to check env vars in a file
check_env_vars() {
    local env_file=$1
    local service_name=$2
    
    if [ -f "$env_file" ]; then
        echo "  $service_name environment:"
        
        # Load env file safely
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip comments and empty lines
            if [[ $line =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
                continue
            fi
            
            # Extract variable name
            if [[ $line =~ ^([^=]+)= ]]; then
                var_name="${BASH_REMATCH[1]}"
                if grep -q "^${var_name}=" "$env_file" && ! grep -q "^${var_name}=$" "$env_file"; then
                    echo -e "    ${GREEN}✓${NC} $var_name is set"
                else
                    echo -e "    ${YELLOW}⚠${NC} $var_name is empty or missing"
                fi
            fi
        done < "$env_file"
    else
        echo -e "  ${RED}✗${NC} $service_name .env file missing"
    fi
}

# Check root environment
if [ -f ".env" ]; then
    check_env_vars ".env" "Root"
fi

# Check service environments
for service in "${services[@]}"; do
    service_path="apps/$service"
    if [ -d "$service_path" ] && [ -f "$service_path/.env" ]; then
        check_env_vars "$service_path/.env" "$service"
    fi
done

# Check plugin environment
if [ -d "plugins/payment" ] && [ -f "plugins/payment/.env" ]; then
    check_env_vars "plugins/payment/.env" "Payment Plugin"
fi

echo ""
echo -e "${GREEN}🎉 Environment validation complete!${NC}"
echo ""

# Quick health check if services are running
echo -e "${BLUE}🔍 Quick health check (if services are running):${NC}"

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} Docker daemon is not running"
else
    echo -e "${GREEN}✓${NC} Docker daemon is running"
    
    # Check running containers
    running_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null | tail -n +2)
    if [ -n "$running_containers" ]; then
        echo "  Running containers:"
        echo "$running_containers" | while read line; do
            echo -e "    ${GREEN}✓${NC} $line"
        done
    else
        echo -e "${YELLOW}⚠${NC} No containers are currently running"
    fi
fi

echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo ""

# Conditional recommendations
if [ ! -d "node_modules" ]; then
    echo "1. Install dependencies:"
    echo "   ./scripts/install.sh"
    echo ""
fi

if [ ! -f "apps/core/.env" ] || [ ! -f "apps/gateway/.env" ]; then
    echo "2. Setup environment files:"
    echo "   ./scripts/setup-env.sh"
    echo ""
fi

if [ ! -d "apps/searcher" ] || [ ! -d "infra/kafka-connect" ]; then
    echo "3. Setup event-driven architecture:"
    echo "   ./scripts/setup-event-driven.sh"
    echo ""
fi

echo "4. Start development environment:"
echo "   ./scripts/start-dev-event-driven.sh"
echo ""

echo "5. Test the complete system:"
echo "   ./scripts/test-event-driven.sh"
echo ""

echo "6. Monitor and verify:"
echo "   ./scripts/verify-env.sh"
echo ""

echo -e "${BLUE}📚 Additional commands:${NC}"
echo "• Build services: ./scripts/build.sh"
echo "• Run linting: ./scripts/lint.sh"
echo "• Clean environment: ./scripts/cleanup.sh"
echo ""

# Check if all scripts are executable
echo -e "${BLUE}🔐 Script permissions:${NC}"
scripts=("install.sh" "build.sh" "lint.sh" "setup-env.sh" "setup-event-driven.sh" "start-dev-event-driven.sh" "test-event-driven.sh" "verify-env.sh" "cleanup.sh" "validate-dev-env.sh")

for script in "${scripts[@]}"; do
    script_path="scripts/$script"
    if [ -f "$script_path" ]; then
        if [ -x "$script_path" ]; then
            echo -e "  ${GREEN}✓${NC} $script is executable"
        else
            echo -e "  ${YELLOW}⚠${NC} $script needs execute permission (run: chmod +x $script_path)"
        fi
    else
        echo -e "  ${RED}✗${NC} $script is missing"
    fi
done