#!/bin/bash

set -e

echo "🔗 Linking shared libraries..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build shared libraries first
echo -e "${BLUE}📦 Building shared libraries...${NC}"

echo -e "${YELLOW}Building @anineplus/common...${NC}"
cd shared/common
bun run build
echo -e "${GREEN}✅ @anineplus/common built${NC}"

echo -e "${YELLOW}Building @anineplus/authorization...${NC}"
cd ../authorization
bun run build
echo -e "${GREEN}✅ @anineplus/authorization built${NC}"

# Link shared libraries globally
echo -e "${BLUE}🔗 Registering shared libraries globally...${NC}"

cd ../common
bun link
echo -e "${GREEN}✅ @anineplus/common linked globally${NC}"

cd ../authorization
bun link
echo -e "${GREEN}✅ @anineplus/authorization linked globally${NC}"

# Link to apps
cd ../../

echo -e "${BLUE}🔗 Linking to Gateway service...${NC}"
cd apps/gateway
bun link @anineplus/common @anineplus/authorization
echo -e "${GREEN}✅ Gateway linked${NC}"

echo -e "${BLUE}🔗 Linking to Core service...${NC}"
cd ../core
bun link @anineplus/common @anineplus/authorization
echo -e "${GREEN}✅ Core linked${NC}"

echo -e "${BLUE}🔗 Linking to Searcher service...${NC}"
cd ../searcher
bun link @anineplus/common
echo -e "${GREEN}✅ Searcher linked${NC}"

echo -e "${BLUE}🔗 Linking to Logger service...${NC}"
cd ../logger
bun link @anineplus/common
echo -e "${GREEN}✅ Logger linked${NC}"

cd ../../

echo -e "${GREEN}✨ All libraries linked successfully!${NC}"
