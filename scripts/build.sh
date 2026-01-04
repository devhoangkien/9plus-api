
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
    
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        echo -e "${YELLOW}🔨 Building ${service_name}...${NC}"
        cd "$dir" && bun run build && cd - > /dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ ${service_name} built successfully${NC}"
        else
            echo -e "${RED}❌ Failed to build ${service_name}${NC}"
            return 1
        fi
    fi
}

# Build shared libraries first
echo -e "${YELLOW}📚 Building shared libraries...${NC}"
for dir in shared/*; do
    if [ -d "$dir" ]; then
        build_service "$dir" "$(basename "$dir") Library"
    fi
done

echo ""

# Build apps
echo -e "${YELLOW}🏢 Building apps...${NC}"
for dir in apps/*; do
    if [ -d "$dir" ]; then
        build_service "$dir" "$(basename "$dir") Service"
    fi
done

# Build plugins
echo -e "${YELLOW}🔌 Building plugins...${NC}"
for dir in plugins/*; do
    if [ -d "$dir" ]; then
        build_service "$dir" "$(basename "$dir") Plugin"
    fi
done

echo ""
echo -e "${YELLOW}🐳 Building Docker images...${NC}"

# Build Docker images for all services
if [ -f "docker-compose.yaml" ]; then
    docker-compose build --no-cache

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ All Docker images built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build Docker images${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  docker-compose.yaml not found, skipping Docker build${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo ""
echo "To start services:"
echo "  docker-compose up -d"