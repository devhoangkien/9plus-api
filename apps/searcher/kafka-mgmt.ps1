# Kafka Management Script for Searcher Service (PowerShell)
# Usage: .\kafka-mgmt.ps1 [command]

$SEARCHER_URL = "http://localhost:3003"
$CONSUMER_GROUP = "searcher-consumer-group"

function Print-Header {
    param([string]$Message)
    Write-Host "=================================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "=================================================" -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Check-Health {
    Print-Header "Checking Kafka Health"
    $response = Invoke-RestMethod -Uri "$SEARCHER_URL/kafka/health" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
}

function Check-Lag {
    Print-Header "Checking Consumer Lag"
    $response = Invoke-RestMethod -Uri "$SEARCHER_URL/kafka/lag/$CONSUMER_GROUP" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
}

function Check-Sync {
    Print-Header "Checking Sync Status"
    $response = Invoke-RestMethod -Uri "$SEARCHER_URL/kafka/sync-status" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
}

function Sync-Report {
    Print-Header "Generating Sync Report"
    $response = Invoke-RestMethod -Uri "$SEARCHER_URL/kafka/sync-report" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
}

function Resync-Topic {
    param([string]$Topic)
    
    if ([string]::IsNullOrEmpty($Topic)) {
        Print-Error "Please provide topic name"
        Write-Host "Usage: .\kafka-mgmt.ps1 resync <topic>"
        Write-Host "Example: .\kafka-mgmt.ps1 resync user.created"
        return
    }
    
    Print-Warning "This will resync ALL messages from the beginning!"
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -eq "yes") {
        Print-Header "Resyncing topic: $Topic"
        $response = Invoke-RestMethod -Uri "$SEARCHER_URL/kafka/resync/$Topic" -Method Post
        $response | ConvertTo-Json -Depth 10
        Write-Host ""
        Print-Success "Resync initiated. Check logs for progress."
    } else {
        Print-Warning "Resync cancelled."
    }
}

function Reset-Counters {
    Print-Header "Resetting Health Counters"
    $response = Invoke-RestMethod -Uri "$SEARCHER_URL/kafka/reset-counters" -Method Post
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Print-Success "Counters reset successfully"
}

function Full-Check {
    Print-Header "🔍 FULL KAFKA HEALTH CHECK"
    Write-Host ""
    
    Write-Host "1. Health Status:"
    Check-Health
    Start-Sleep -Seconds 1
    
    Write-Host "2. Consumer Lag:"
    Check-Lag
    Start-Sleep -Seconds 1
    
    Write-Host "3. Sync Status:"
    Check-Sync
    Start-Sleep -Seconds 1
    
    Write-Host "4. Detailed Report:"
    Sync-Report
    
    Print-Header "✅ Full check completed"
}

function Show-Help {
    Write-Host "Kafka Management Script for Searcher Service"
    Write-Host ""
    Write-Host "Usage: .\kafka-mgmt.ps1 [command] [options]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  health          - Check Kafka connection health"
    Write-Host "  lag             - Check consumer lag"
    Write-Host "  sync            - Check sync status between Kafka and Elasticsearch"
    Write-Host "  report          - Generate detailed sync report"
    Write-Host "  resync <topic>  - Resync topic from beginning (⚠️ USE WITH CAUTION)"
    Write-Host "  reset           - Reset health counters"
    Write-Host "  check           - Run full health check (recommended daily)"
    Write-Host "  help            - Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\kafka-mgmt.ps1 check                    # Full health check"
    Write-Host "  .\kafka-mgmt.ps1 lag                      # Check lag only"
    Write-Host "  .\kafka-mgmt.ps1 resync user.created      # Resync user.created topic"
    Write-Host ""
}

# Main script
$command = $args[0]
$param = $args[1]

switch ($command) {
    "health" {
        Check-Health
    }
    "lag" {
        Check-Lag
    }
    "sync" {
        Check-Sync
    }
    "report" {
        Sync-Report
    }
    "resync" {
        Resync-Topic -Topic $param
    }
    "reset" {
        Reset-Counters
    }
    "check" {
        Full-Check
    }
    "help" {
        Show-Help
    }
    default {
        Print-Error "Unknown command: $command"
        Write-Host ""
        Show-Help
    }
}
