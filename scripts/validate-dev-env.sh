#!/bin/bash

# Development Environment Validation Script
# This script checks if the development environment is properly configured

echo "🔍 Validating AnineePlus API Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    echo -e "${GREEN}✓${NC} Docker Compose is installed"
    docker compose version
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

echo ""

# Check if .env file exists
echo "📁 Checking configuration files..."

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
else
    echo -e "${YELLOW}⚠${NC} .env file not found. Creating from example.env..."
    if [ -f "example.env" ]; then
        cp example.env .env
        echo -e "${GREEN}✓${NC} .env file created from example.env"
    else
        echo -e "${RED}✗${NC} example.env file not found"
        exit 1
    fi
fi

# Check if git submodules are initialized
echo ""
echo "📦 Checking git submodules..."

if [ -d "apps/core-service/.git" ] || [ -f "apps/core-service/.git" ]; then
    echo -e "${GREEN}✓${NC} core-service submodule is initialized"
else
    echo -e "${YELLOW}⚠${NC} core-service submodule not initialized"
    echo "  Run: git submodule update --init --recursive"
fi

if [ -d "apps/payment-service/.git" ] || [ -f "apps/payment-service/.git" ]; then
    echo -e "${GREEN}✓${NC} payment-service submodule is initialized"
else
    echo -e "${YELLOW}⚠${NC} payment-service submodule not initialized"
    echo "  Run: git submodule update --init --recursive"
fi

# Validate Docker Compose file
echo ""
echo "🐳 Validating Docker Compose configuration..."

if docker compose -f docker-compose-dev.yaml config --quiet; then
    echo -e "${GREEN}✓${NC} docker-compose-dev.yaml is valid"
else
    echo -e "${RED}✗${NC} docker-compose-dev.yaml has errors"
    exit 1
fi

# Check if ports are available
echo ""
echo "🔌 Checking port availability..."

check_port() {
    local port=$1
    local service=$2
    
    if lsof -i :$port &> /dev/null; then
        echo -e "${YELLOW}⚠${NC} Port $port is already in use (needed for $service)"
    else
        echo -e "${GREEN}✓${NC} Port $port is available for $service"
    fi
}

check_port 3000 "API Gateway"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"
check_port 50051 "User Service"
check_port 50052 "Payment Service"

echo ""
echo "🎉 Environment validation complete!"
echo ""
echo "To start the development environment, run:"
echo "  bun run docker:dev:build"
echo "  bun run docker:dev:up"
echo ""
echo "Or simply:"
echo "  bun run dev"