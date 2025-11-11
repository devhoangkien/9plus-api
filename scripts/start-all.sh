#!/bin/bash

# Script to start all services in parallel

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting all services in parallel...${NC}"
echo ""

# Start core service
echo -e "${GREEN}✓${NC} Starting core service..."
cd apps/core && bun dev &

# Start searcher service
echo -e "${GREEN}✓${NC} Starting searcher service..."
cd apps/searcher && bun start:dev &

# Start logger service
echo -e "${GREEN}✓${NC} Starting logger service..."
cd apps/logger && bun start:dev &

# Start payment service
echo -e "${GREEN}✓${NC} Starting payment service..."
cd plugins/payment && bun dev &

# Wait a moment for other services to initialize
sleep 2

# Start gateway service last
echo -e "${GREEN}✓${NC} Starting gateway service..."
cd apps/gateway && bun dev &

echo ""
echo -e "${GREEN}🎉 All services are starting in the background!${NC}"
echo -e "${YELLOW}ℹ${NC} Use Ctrl+C to stop all services."

# Wait for all background processes to finish
wait