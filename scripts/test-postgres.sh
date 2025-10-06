#!/bin/bash

# PostgreSQL 18 Connection Test Script
echo "🔍 Testing PostgreSQL 18 Connection..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection settings
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USERNAME:-postgres}
DB_PASS=${DB_PASSWORD:-postgres}
DB_NAME=${DB_DATABASE:-anineplus_core}

# Function to test connection
test_connection() {
    local host=$1
    local port=$2
    local user=$3
    local dbname=$4
    
    echo -n "Testing connection to $host:$port/$dbname as $user... "
    
    if PGPASSWORD=$DB_PASS psql -h $host -p $port -U $user -d $dbname -c "SELECT version();" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Function to check PostgreSQL version
check_version() {
    local host=$1
    local port=$2
    local user=$3
    local dbname=$4
    
    echo -e "${BLUE}📊 PostgreSQL Version Information:${NC}"
    PGPASSWORD=$DB_PASS psql -h $host -p $port -U $user -d $dbname -c "
        SELECT 
            version() as full_version,
            current_setting('server_version') as version_number,
            current_setting('server_version_num') as version_numeric;
    " 2>/dev/null || echo -e "${RED}Could not retrieve version information${NC}"
}

# Function to check extensions
check_extensions() {
    local host=$1
    local port=$2
    local user=$3
    local dbname=$4
    
    echo -e "${BLUE}🔧 Installed Extensions:${NC}"
    PGPASSWORD=$DB_PASS psql -h $host -p $port -U $user -d $dbname -c "
        SELECT 
            extname as extension_name,
            extversion as version,
            nspname as schema
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        ORDER BY extname;
    " 2>/dev/null || echo -e "${RED}Could not retrieve extension information${NC}"
}

# Function to check database performance settings
check_settings() {
    local host=$1
    local port=$2
    local user=$3
    local dbname=$4
    
    echo -e "${BLUE}⚙️  Key Configuration Settings:${NC}"
    PGPASSWORD=$DB_PASS psql -h $host -p $port -U $user -d $dbname -c "
        SELECT 
            name,
            setting,
            unit,
            context,
            short_desc
        FROM pg_settings 
        WHERE name IN (
            'shared_buffers',
            'effective_cache_size',
            'work_mem',
            'maintenance_work_mem',
            'max_connections',
            'wal_level',
            'max_wal_size',
            'checkpoint_completion_target'
        )
        ORDER BY name;
    " 2>/dev/null || echo -e "${RED}Could not retrieve configuration settings${NC}"
}

# Function to check database sizes
check_databases() {
    local host=$1
    local port=$2
    local user=$3
    local dbname=$4
    
    echo -e "${BLUE}💾 Database Information:${NC}"
    PGPASSWORD=$DB_PASS psql -h $host -p $port -U $user -d $dbname -c "
        SELECT 
            datname as database_name,
            pg_size_pretty(pg_database_size(datname)) as size,
            datcollate as collation,
            datctype as character_type
        FROM pg_database 
        WHERE datname NOT IN ('template0', 'template1', 'postgres')
        ORDER BY pg_database_size(datname) DESC;
    " 2>/dev/null || echo -e "${RED}Could not retrieve database information${NC}"
}

# Function to check active connections
check_connections() {
    local host=$1
    local port=$2
    local user=$3
    local dbname=$4
    
    echo -e "${BLUE}🔗 Active Connections:${NC}"
    PGPASSWORD=$DB_PASS psql -h $host -p $port -U $user -d $dbname -c "
        SELECT 
            datname as database,
            usename as user,
            application_name,
            client_addr,
            state,
            query_start,
            now() - query_start as duration
        FROM pg_stat_activity 
        WHERE state != 'idle' 
        AND pid != pg_backend_pid()
        ORDER BY query_start;
    " 2>/dev/null || echo -e "${RED}Could not retrieve connection information${NC}"
}

# Main test execution
echo -e "${BLUE}🚀 PostgreSQL 18 Comprehensive Test${NC}"
echo "================================================"

# Test basic connection
if test_connection $DB_HOST $DB_PORT $DB_USER $DB_NAME; then
    echo ""
    
    # Check version
    check_version $DB_HOST $DB_PORT $DB_USER $DB_NAME
    echo ""
    
    # Check extensions
    check_extensions $DB_HOST $DB_PORT $DB_USER $DB_NAME
    echo ""
    
    # Check settings
    check_settings $DB_HOST $DB_PORT $DB_USER $DB_NAME
    echo ""
    
    # Check databases
    check_databases $DB_HOST $DB_PORT $DB_USER $DB_NAME
    echo ""
    
    # Check connections
    check_connections $DB_HOST $DB_PORT $DB_USER $DB_NAME
    echo ""
    
    # Test application databases
    echo -e "${BLUE}🧪 Testing Application Databases:${NC}"
    
    # Test core database
    if test_connection $DB_HOST $DB_PORT $DB_USER "anineplus_core"; then
        echo "  Core database connection: OK"
    else
        echo -e "  ${YELLOW}Core database may not be created yet${NC}"
    fi
    
    # Test payment database
    if test_connection $DB_HOST $DB_PORT $DB_USER "anineplus_payment"; then
        echo "  Payment database connection: OK"
    else
        echo -e "  ${YELLOW}Payment database may not be created yet${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ PostgreSQL 18 test completed successfully!${NC}"
    
else
    echo ""
    echo -e "${RED}❌ Cannot connect to PostgreSQL${NC}"
    echo "Please check:"
    echo "1. PostgreSQL container is running: docker ps"
    echo "2. Environment variables are set correctly"
    echo "3. Network connectivity"
    echo "4. Credentials are correct"
    
    exit 1
fi

echo ""
echo -e "${BLUE}💡 Useful Commands:${NC}"
echo "• Connect to PostgreSQL: psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
echo "• Check PostgreSQL logs: docker logs core-database-dev"
echo "• Monitor performance: docker exec -it core-database-dev psql -U $DB_USER -d $DB_NAME -c 'SELECT * FROM v_slow_queries LIMIT 10;'"