#!/bin/bash

echo "🔍 Linting AnineePlus API Services..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to lint a service
lint_service() {
    local dir=$1
    local service_name=$2
    
    if [ -d "$dir" ]; then
        echo -e "${YELLOW}🔍 Linting ${service_name}...${NC}"
        cd "$dir"
        
        # Check if lint script exists
        if grep -q '"lint"' package.json 2>/dev/null; then
            bun run lint
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ ${service_name} lint passed${NC}"
            else
                echo -e "${RED}❌ ${service_name} lint failed${NC}"
                cd - > /dev/null
                return 1
            fi
        else
            echo -e "${YELLOW}⚠️  No lint script found for ${service_name}${NC}"
        fi
        
        cd - > /dev/null
    else
        echo -e "${YELLOW}⚠️  Directory not found: ${dir} (${service_name})${NC}"
    fi
}

# Lint shared libraries
echo -e "${YELLOW}📚 Linting shared libraries...${NC}"
lint_service "shared/common" "Common Library"
lint_service "libs/casl-authorization" "CASL Authorization Library"

echo ""

# Lint core services
echo -e "${YELLOW}🏢 Linting core services...${NC}"
lint_service "apps/core" "Core Service"
lint_service "apps/gateway" "Gateway Service"

# Lint event-driven services
echo -e "${YELLOW}🔄 Linting event-driven services...${NC}"
lint_service "apps/searcher" "Searcher Service"
lint_service "apps/logger" "Logger Service"

# Lint plugins
echo -e "${YELLOW}🔌 Linting plugins...${NC}"
lint_service "plugins/payment" "Payment Plugin"

echo ""

# Run root level linting if available
if [ -f "package.json" ] && grep -q '"lint"' package.json; then
    echo -e "${YELLOW}🔍 Running root level linting...${NC}"
    bun run lint
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Root lint passed${NC}"
    else
        echo -e "${RED}❌ Root lint failed${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🎉 All linting completed!${NC}"

# Check for common issues
echo ""
echo -e "${YELLOW}🔎 Checking for common issues...${NC}"

# Check for TODO comments
echo "Checking for TODO comments..."
todo_count=$(find . -name "*.ts" -o -name "*.js" -o -name "*.json" | grep -v node_modules | xargs grep -i "TODO" | wc -l)
if [ $todo_count -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $todo_count TODO comments${NC}"
else
    echo -e "${GREEN}✅ No TODO comments found${NC}"
fi

# Check for console.log statements
echo "Checking for console.log statements..."
console_count=$(find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs grep -n "console\.log" | wc -l)
if [ $console_count -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $console_count console.log statements${NC}"
    echo "Consider using proper logging instead"
else
    echo -e "${GREEN}✅ No console.log statements found${NC}"
fi

# Check for hardcoded credentials
echo "Checking for potential hardcoded credentials..."
cred_patterns=("password" "secret" "key" "token")
cred_count=0
for pattern in "${cred_patterns[@]}"; do
    count=$(find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs grep -i "$pattern.*=" | grep -v "process.env" | wc -l)
    cred_count=$((cred_count + count))
done

if [ $cred_count -gt 0 ]; then
    echo -e "${RED}⚠️  Found $cred_count potential hardcoded credentials${NC}"
    echo "Please review and use environment variables instead"
else
    echo -e "${GREEN}✅ No hardcoded credentials detected${NC}"
fi

echo ""
echo -e "${GREEN}✨ Code quality check completed!${NC}"