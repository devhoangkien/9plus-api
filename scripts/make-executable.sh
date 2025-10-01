#!/bin/bash

echo "🔐 Making all scripts executable..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# List of scripts to make executable
scripts=(
    "install.sh"
    "build.sh"
    "lint.sh"
    "link-libs.sh"
    "setup-env.sh"
    "setup-event-driven.sh"
    "start-dev-event-driven.sh"
    "test-event-driven.sh"
    "verify-env.sh"
    "cleanup.sh"
    "validate-dev-env.sh"
    "make-executable.sh"
)

# Make scripts executable
for script in "${scripts[@]}"; do
    script_path="scripts/$script"
    
    if [ -f "$script_path" ]; then
        chmod +x "$script_path"
        echo -e "${GREEN}✓${NC} Made $script executable"
    else
        echo -e "${YELLOW}⚠${NC} $script not found - skipping"
    fi
done

echo ""
echo -e "${GREEN}🎉 All available scripts are now executable!${NC}"
echo ""
echo "You can now run:"
echo "  ./scripts/validate-dev-env.sh"
echo "  ./scripts/install.sh"
echo "  ./scripts/setup-env.sh"
echo "  ./scripts/setup-event-driven.sh"
echo "  ./scripts/start-dev-event-driven.sh"
echo ""