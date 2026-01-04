#!/bin/bash

echo "⚙️ Setting up AnineePlus API Environment Files..."
echo ""

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to copy environment file
copy_env_file() {
    local dir=$1
    local service_name=$2
    
    if [ -d "$dir" ]; then
        cd "$dir"
        if [ -f ".env.example" ]; then
            if [ -f ".env" ]; then
                echo -e "${YELLOW}⚠️  .env already exists in ${service_name}, skipping...${NC}"
            else
                cp .env.example .env
                echo -e "${GREEN}✅ Created .env for ${service_name}${NC}"
            fi
        # else
            # Silent skip if no .env.example, or log verbose? 
            # echo -e "${YELLOW}⚠️  No .env.example found in ${service_name}${NC}"
        fi
        cd - > /dev/null
    fi
}

# Copy root environment file
echo -e "${YELLOW}📄 Setting up root environment...${NC}"
if [ -f ".env.example" ]; then
    if [ -f ".env" ]; then
        echo -e "${YELLOW}⚠️  Root .env already exists, skipping...${NC}"
    else
        cp .env.example .env
        echo -e "${GREEN}✅ Created root .env${NC}"
    fi
else
    echo -e "${RED}❌ Root .env.example not found${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🏢 Setting up service environments...${NC}"

# Dynamically setup apps envs
for dir in apps/*; do
    if [ -d "$dir" ]; then
        copy_env_file "$dir" "$(basename "$dir") Service"
    fi
done

echo ""
echo -e "${YELLOW}🔌 Setting up plugin environments...${NC}"
# Dynamically setup plugins envs
for dir in plugins/*; do
    if [ -d "$dir" ]; then
        copy_env_file "$dir" "$(basename "$dir") Plugin"
    fi
done

echo ""
echo -e "${GREEN}🎉 Environment setup completed!${NC}"
echo ""
echo "Created environment files (if .env.example existed):"
echo "  📄 ./.env (root configuration)"

# Dynamically list created envs
for dir in apps/*; do
    if [ -f "$dir/.env" ]; then
        echo "  📄 ./$dir/.env"
    fi
done
for dir in plugins/*; do
    if [ -f "$dir/.env" ]; then
        echo "  📄 ./$dir/.env"
    fi
done

echo ""
echo "⚠️  Important: Please update the .env files with your actual configuration:"
echo ""
echo "🔑 Required updates:"
echo "  - Database credentials (DATABASE_URL)"
echo "  - JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET)" 
echo "  - Redis connection (REDIS_HOST, REDIS_PASSWORD)"
echo "  - Kafka brokers (KAFKA_BROKERS)"
echo "  - Elasticsearch credentials (ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD)"
echo ""
echo "📖 For detailed configuration guide, see: ENVIRONMENT_VARIABLES.md"