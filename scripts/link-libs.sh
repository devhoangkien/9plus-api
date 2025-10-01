#!/bin/bash

echo "🔗 Setting up AnineePlus Shared Libraries..."
echo ""

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to build a library
build_lib() {
    local lib_path=$1
    local lib_name=$2
    
    if [ -d "$lib_path" ]; then
        echo -e "${YELLOW}📚 Building ${lib_name}...${NC}"
        (
            cd "$lib_path"
            echo "  Installing dependencies..."
            bun install
            echo "  Building library..."
            bun run build
        )
        echo -e "${GREEN}✅ ${lib_name} built successfully${NC}"
    else
        echo -e "${RED}❌ Library directory not found: ${lib_path}${NC}"
        exit 1
    fi
}

# Build shared libraries
build_lib "libs/casl-authorization" "CASL Authorization Library"
build_lib "libs/common" "Common Library"

echo ""
echo -e "${YELLOW}🔗 Updating service dependencies to use local libraries...${NC}"

# Function to update package.json dependencies to use local paths
update_service_deps() {
    local service_path=$1
    local service_name=$2
    
    if [ -d "$service_path" ]; then
        echo -e "${YELLOW}  Updating dependencies for ${service_name}...${NC}"
        (
            cd "$service_path"
            
            # Check if we need to update dependencies
            local needs_update=false
            
            # Check for @bune/casl-authorization
            if grep -q '"@bune/casl-authorization".*"link:' package.json 2>/dev/null; then
                echo "    @bune/casl-authorization already linked"
            elif grep -q "@bune/casl-authorization" package.json 2>/dev/null; then
                echo "    Updating @bune/casl-authorization to use local path..."
                # Update to use local path instead of version
                if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
                    # macOS and Linux
                    sed -i '' 's/"@bune\/casl-authorization": ".*"/"@bune\/casl-authorization": "link:..\/..\/libs\/casl-authorization"/g' package.json
                else
                    # Windows and others
                    sed -i 's/"@bune\/casl-authorization": ".*"/"@bune\/casl-authorization": "link:..\/..\/libs\/casl-authorization"/g' package.json
                fi
                needs_update=true
            fi
            
            # Check for @bune/common
            if grep -q '"@bune/common".*"link:' package.json 2>/dev/null; then
                echo "    @bune/common already linked"
            elif grep -q "@bune/common" package.json 2>/dev/null; then
                echo "    Updating @bune/common to use local path..."
                if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
                    # macOS and Linux
                    sed -i '' 's/"@bune\/common": ".*"/"@bune\/common": "link:..\/..\/libs\/common"/g' package.json
                else
                    # Windows and others  
                    sed -i 's/"@bune\/common": ".*"/"@bune\/common": "link:..\/..\/libs\/common"/g' package.json
                fi
                needs_update=true
            fi
            
            # Reinstall dependencies if needed
            if [ "$needs_update" = true ]; then
                echo "    Reinstalling dependencies..."
                bun install
            fi
        )
        echo -e "${GREEN}  ✅ Dependencies updated for ${service_name}${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Service directory not found: ${service_path}${NC}"
    fi
}

# Define services that need library linking
services=(
    "apps/core:Core Service"
    "apps/gateway:Gateway Service"
    "apps/searcher:Searcher Service"
    "apps/logger:Logger Service"
    "plugins/payment:Payment Plugin"
)

# Update dependencies for each service
for service_info in "${services[@]}"; do
    service_path=$(echo $service_info | cut -d':' -f1)
    service_name=$(echo $service_info | cut -d':' -f2)
    update_service_deps "$service_path" "$service_name"
done

echo ""
echo -e "${GREEN}🎉 All libraries setup completed successfully!${NC}"
echo ""
echo "Built libraries:"
echo "  📚 @bune/casl-authorization - Authorization and permissions"
echo "  📚 @bune/common - Common utilities and types"
echo ""
echo "Services with local library dependencies:"
for service_info in "${services[@]}"; do
    service_name=$(echo $service_info | cut -d':' -f2)
    echo "  🏢 $service_name"
done
echo ""
echo "Libraries are now linked using local paths in package.json"
echo "Dependencies will be automatically resolved from the local build"
echo ""
echo "To verify dependencies:"
echo "  cd apps/core && bun pm ls | grep @bune"