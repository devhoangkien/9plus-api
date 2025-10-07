#!/usr/bin/env bash

# Kafka Management Script for Searcher Service
# Usage: ./kafka-mgmt.sh [command]

SEARCHER_URL="http://localhost:3003"
CONSUMER_GROUP="searcher-consumer-group"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function print_header() {
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=================================================${NC}"
}

function print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

function print_error() {
    echo -e "${RED}❌ $1${NC}"
}

function check_health() {
    print_header "Checking Kafka Health"
    curl -s "$SEARCHER_URL/kafka/health" | jq '.'
    echo ""
}

function check_lag() {
    print_header "Checking Consumer Lag"
    curl -s "$SEARCHER_URL/kafka/lag/$CONSUMER_GROUP" | jq '.'
    echo ""
}

function check_sync() {
    print_header "Checking Sync Status"
    curl -s "$SEARCHER_URL/kafka/sync-status" | jq '.'
    echo ""
}

function sync_report() {
    print_header "Generating Sync Report"
    curl -s "$SEARCHER_URL/kafka/sync-report" | jq '.'
    echo ""
}

function resync_topic() {
    local topic=$1
    if [ -z "$topic" ]; then
        print_error "Please provide topic name"
        echo "Usage: ./kafka-mgmt.sh resync <topic>"
        echo "Example: ./kafka-mgmt.sh resync user.created"
        exit 1
    fi
    
    print_warning "This will resync ALL messages from the beginning!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        print_header "Resyncing topic: $topic"
        curl -s -X POST "$SEARCHER_URL/kafka/resync/$topic" | jq '.'
        echo ""
        print_success "Resync initiated. Check logs for progress."
    else
        print_warning "Resync cancelled."
    fi
}

function reset_counters() {
    print_header "Resetting Health Counters"
    curl -s -X POST "$SEARCHER_URL/kafka/reset-counters" | jq '.'
    echo ""
    print_success "Counters reset successfully"
}

function full_check() {
    print_header "🔍 FULL KAFKA HEALTH CHECK"
    echo ""
    
    echo "1. Health Status:"
    check_health
    sleep 1
    
    echo "2. Consumer Lag:"
    check_lag
    sleep 1
    
    echo "3. Sync Status:"
    check_sync
    sleep 1
    
    echo "4. Detailed Report:"
    sync_report
    
    print_header "✅ Full check completed"
}

function show_help() {
    echo "Kafka Management Script for Searcher Service"
    echo ""
    echo "Usage: ./kafka-mgmt.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  health          - Check Kafka connection health"
    echo "  lag             - Check consumer lag"
    echo "  sync            - Check sync status between Kafka and Elasticsearch"
    echo "  report          - Generate detailed sync report"
    echo "  resync <topic>  - Resync topic from beginning (⚠️ USE WITH CAUTION)"
    echo "  reset           - Reset health counters"
    echo "  check           - Run full health check (recommended daily)"
    echo "  help            - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./kafka-mgmt.sh check                    # Full health check"
    echo "  ./kafka-mgmt.sh lag                      # Check lag only"
    echo "  ./kafka-mgmt.sh resync user.created      # Resync user.created topic"
    echo ""
}

# Main script
case "$1" in
    health)
        check_health
        ;;
    lag)
        check_lag
        ;;
    sync)
        check_sync
        ;;
    report)
        sync_report
        ;;
    resync)
        resync_topic "$2"
        ;;
    reset)
        reset_counters
        ;;
    check)
        full_check
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
