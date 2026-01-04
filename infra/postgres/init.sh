#!/bin/bash
set -e

# PostgreSQL 18 Initialization Script for AninePlus API
# This script sets up databases, users, and extensions

echo "🚀 Initializing PostgreSQL 18 for AninePlus API..."

# Create application user if not exists
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create application user
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '${DB_USERNAME:-anineplus_user}') THEN
            CREATE USER ${DB_USERNAME:-anineplus_user} WITH PASSWORD '${DB_PASSWORD:-anineplus_pass}';
        END IF;
    END
    \$\$;

    -- Create core database
    SELECT 'CREATE DATABASE anineplus_core'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'anineplus_core')\gexec

    -- Create payment database  
    SELECT 'CREATE DATABASE anineplus_payment'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'anineplus_payment')\gexec

    -- Create AI Agent Testing database
    SELECT 'CREATE DATABASE ai_agent_testing'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_agent_testing')\gexec

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE anineplus_core TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL PRIVILEGES ON DATABASE anineplus_payment TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL PRIVILEGES ON DATABASE ai_agent_testing TO ${DB_USERNAME:-anineplus_user};
EOSQL

# Setup core database with extensions
echo "📦 Setting up core database extensions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "anineplus_core" <<-EOSQL
    -- Create extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    CREATE EXTENSION IF NOT EXISTS "btree_gist";
    
    -- PostgreSQL 18 specific extensions
    CREATE EXTENSION IF NOT EXISTS "pg_stat_monitor";
    CREATE EXTENSION IF NOT EXISTS "auto_explain";
    
    -- Grant usage on extensions
    GRANT USAGE ON SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL ON ALL TABLES IN SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    
    -- Set default privileges for future objects
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USERNAME:-anineplus_user};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USERNAME:-anineplus_user};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${DB_USERNAME:-anineplus_user};
EOSQL

# Setup payment database with extensions
echo "💳 Setting up payment database extensions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "anineplus_payment" <<-EOSQL
    -- Create extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    
    -- Grant privileges
    GRANT USAGE ON SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL ON ALL TABLES IN SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    
    -- Set default privileges
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USERNAME:-anineplus_user};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USERNAME:-anineplus_user};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${DB_USERNAME:-anineplus_user};
EOSQL

# Setup AI Agent Testing database with extensions
echo "🤖 Setting up AI Agent Testing database extensions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "ai_agent_testing" <<-EOSQL
    -- Create extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    
    -- Grant privileges
    GRANT USAGE ON SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL ON ALL TABLES IN SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO ${DB_USERNAME:-anineplus_user};
    
    -- Set default privileges
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USERNAME:-anineplus_user};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USERNAME:-anineplus_user};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${DB_USERNAME:-anineplus_user};
EOSQL

echo "🏗️  Creating performance indexes..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "anineplus_core" <<-EOSQL
    -- Create indexes for common queries (these will be created by Prisma, but as examples)
    -- Users table indexes
    -- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users USING btree(email);
    -- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users USING btree(username);
    -- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users USING btree(created_at DESC);
    
    -- Audit/Event indexes for event-driven architecture
    -- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_created_at ON events USING btree(created_at DESC);
    -- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_type ON events USING btree(event_type);
    -- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_entity ON events USING btree(entity_type, entity_id);
    
    -- Full-text search indexes
    -- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', username || ' ' || email));
EOSQL

# Configure pg_stat_statements
echo "📊 Configuring PostgreSQL statistics..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "anineplus_core" <<-EOSQL
    -- Configure pg_stat_statements
    SELECT pg_stat_statements_reset();
EOSQL

# Set up database monitoring views
echo "📈 Setting up monitoring views..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "anineplus_core" <<-EOSQL
    -- Create monitoring views
    CREATE OR REPLACE VIEW v_slow_queries AS
    SELECT 
        query,
        calls,
        total_exec_time / 1000 as total_time_seconds,
        mean_exec_time / 1000 as mean_time_seconds,
        stddev_exec_time / 1000 as stddev_time_seconds,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
    FROM pg_stat_statements 
    WHERE mean_exec_time > 100  -- queries taking more than 100ms on average
    ORDER BY mean_exec_time DESC;

    -- Create connection monitoring view
    CREATE OR REPLACE VIEW v_active_connections AS
    SELECT 
        datname,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        state_change,
        extract(epoch from (now() - query_start)) as query_duration_seconds,
        query
    FROM pg_stat_activity 
    WHERE state != 'idle'
    ORDER BY query_start;

    -- Create table size monitoring view
    CREATE OR REPLACE VIEW v_table_sizes AS
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
EOSQL

echo "✅ PostgreSQL 18 initialization completed successfully!"
echo ""
echo "📋 Database Information:"
echo "  - PostgreSQL Version: 18"
echo "  - Core Database: anineplus_core"
echo "  - Payment Database: anineplus_payment"
echo "  - AI Agent Testing Database: ai_agent_testing"
echo "  - Application User: ${DB_USERNAME:-anineplus_user}"
echo ""
echo "🔧 Installed Extensions:"
echo "  - uuid-ossp (UUID generation)"
echo "  - pgcrypto (Cryptographic functions)"
echo "  - pg_stat_statements (Query statistics)"
echo "  - pg_trgm (Trigram matching)"
echo "  - btree_gin & btree_gist (Advanced indexing)"
echo "  - pg_stat_monitor (Enhanced monitoring)"
echo "  - auto_explain (Query plan logging)"
echo ""
echo "📊 Monitoring Views Created:"
echo "  - v_slow_queries (Slow query analysis)"
echo "  - v_active_connections (Active connections)"
echo "  - v_table_sizes (Database size monitoring)"