#!/bin/bash

set -e

echo "🔗 Linking shared libraries..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

LIBS=()

# 1. Build and Register all shared libraries
echo -e "${BLUE}📦 Building and Registering shared libraries...${NC}"

for lib_dir in shared/*; do
    if [ -d "$lib_dir" ] && [ -f "$lib_dir/package.json" ]; then
        lib_name=$(basename "$lib_dir")
        echo -e "${YELLOW}Processing library: $lib_name...${NC}"
        
        cd "$lib_dir"
        
        # Build
        echo "  Building..."
        bun run build
        
        # Register globally
        echo "  Linking globally..."
        bun link
        
        # Extract package name from package.json
        # Using grep/sed to be portable without jq
        PKG_NAME=$(grep '"name":' package.json | head -1 | sed -E 's/.*"name":[[:space:]]*"([^"]+)".*/\1/')
        
        if [ -n "$PKG_NAME" ]; then
            LIBS+=("$PKG_NAME")
            echo -e "${GREEN}✅ $PKG_NAME built and linked globally${NC}"
        else
            echo -e "${RED}⚠️ Could not determine package name for $lib_dir${NC}"
        fi
        
        cd ../..
    fi
done

echo ""
echo -e "${BLUE}🔗 Linking libraries to services...${NC}"

# Function to link libraries to a service directory
link_libs_to_service() {
    local service_dir=$1
    local service_name=$2
    
    if [ -d "$service_dir" ] && [ -f "$service_dir/package.json" ]; then
        echo -e "${BLUE}Checking $service_name ($service_dir)...${NC}"
        cd "$service_dir"
        
        LINK_ARGS=""
        for lib in "${LIBS[@]}"; do
            # Check if package.json contains the library as a dependency
            if grep -q "\"$lib\"" package.json; then
                LINK_ARGS="$LINK_ARGS $lib"
            fi
        done
        
        if [ -n "$LINK_ARGS" ]; then
            echo "  Linking: $LINK_ARGS"
            bun link $LINK_ARGS
            echo -e "${GREEN}✅ Linked libs to $service_name${NC}"
        else
            echo "  No shared libs to link."
        fi
        
        cd ../..
    fi
}

# Link to apps
for app in apps/*; do
    link_libs_to_service "$app" "$(basename "$app")"
done

# Link to plugins
for plugin in plugins/*; do
    link_libs_to_service "$plugin" "$(basename "$plugin")"
done

echo ""
echo -e "${GREEN}✨ All libraries linked successfully!${NC}"
