#!/bin/bash

echo "🚀 Installing AnineePlus API Dependencies..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to install dependencies in a directory
install_deps() {
    local dir=$1
    local service_name=$2
    
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        echo -e "${YELLOW}📦 Installing dependencies for ${service_name}...${NC}"
        cd "$dir" && bun install && cd - > /dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ ${service_name} dependencies installed${NC}"
        else
            echo -e "${RED}❌ Failed to install ${service_name} dependencies${NC}"
            return 1
        fi
    fi
}

# Install root dependencies
echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
bun install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Root dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install root dependencies${NC}"
    exit 1
fi

echo ""

# Dynamically install apps
echo -e "${YELLOW}📦 Installing dependencies for apps...${NC}"
for dir in apps/*; do
    if [ -d "$dir" ]; then
        install_deps "$dir" "$(basename "$dir") Service"
    fi
done

# Dynamically install plugins
echo -e "${YELLOW}🔌 Installing dependencies for plugins...${NC}"
for dir in plugins/*; do
    if [ -d "$dir" ]; then
        install_deps "$dir" "$(basename "$dir") Plugin"
    fi
done

# Dynamically install shared libraries
echo ""
echo -e "${YELLOW}📚 Installing shared libraries...${NC}"
for dir in shared/*; do
    if [ -d "$dir" ]; then
        install_deps "$dir" "$(basename "$dir") Library"
    fi
done

echo ""
echo -e "${YELLOW}🔗 Setting up shared libraries...${NC}"

# First build the libraries
echo "Building shared libraries..."
./scripts/link-libs.sh

echo ""
echo -e "${GREEN}🎉 All dependencies installed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env: cp .env.example .env"
echo "2. Update .env with your configuration"
echo "3. Start infrastructure: ./scripts/setup-event-driven.sh"
echo "4. Start development: ./scripts/start-dev-event-driven.sh"