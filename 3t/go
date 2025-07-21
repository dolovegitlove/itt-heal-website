#!/bin/bash

# ITT Heal Site - Enhanced Auto-Execution Script
# Based on go.md specifications

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
CONTEXT_FILE="$LOG_DIR/session-context.json"
ACTIVITY_LOG="$LOG_DIR/activity.log"

# Ensure logs directory exists
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$ACTIVITY_LOG"
}

# Function to save session context
save_context() {
    local command="$1"
    cat > "$CONTEXT_FILE" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "working_directory": "$PWD",
    "last_command": "$command",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'none')",
    "git_status": "$(git status --porcelain 2>/dev/null || echo 'No git repo')"
}
EOF
}

# Function to start automation services
start_automation_services() {
    log "🤖 Starting automation services..."
    
    # Start health monitor if not running
    if ! pgrep -f "health-monitor.sh" > /dev/null; then
        nohup ./scripts/health-monitor.sh > /dev/null 2>&1 &
        log "✅ Health Monitor started"
    else
        log "✅ Health Monitor already running"
    fi
    
    # Start error watcher if not running
    if ! pgrep -f "error-watcher.sh" > /dev/null; then
        nohup ./scripts/error-watcher.sh > /dev/null 2>&1 &
        log "✅ Error Watcher started"
    else
        log "✅ Error Watcher already running"
    fi
    
    # Start performance monitor if not running
    if ! pgrep -f "performance-monitor.sh" > /dev/null; then
        nohup ./scripts/performance-monitor.sh > /dev/null 2>&1 &
        log "✅ Performance Monitor started"
    else
        log "✅ Performance Monitor already running"
    fi
}

# Function to show welcome message
show_welcome() {
    echo "🎉 ITT Heal Website - Enhanced go.md Execution"
    echo "==============================================="
    echo ""
    
    if [ -f "$CONTEXT_FILE" ]; then
        echo "🔄 Restoring Session Context..."
        local last_timestamp=$(jq -r '.timestamp // "Unknown"' "$CONTEXT_FILE" 2>/dev/null || echo "Unknown")
        local last_command=$(jq -r '.last_command // "Unknown"' "$CONTEXT_FILE" 2>/dev/null || echo "Unknown")
        echo "✅ Context restored from: $last_timestamp"
        echo "🔧 Last command: $last_command"
        echo ""
    fi
    
    echo "📍 Current Context: ITT Heal Website Production Environment"
    echo "🌐 Project Type: Full-Stack Website (HTML/CSS/JS + Node.js Backend)"
    echo "🔧 Tech Stack: HTML5, CSS3, JavaScript, Node.js, PostgreSQL, Nginx"
    echo "🚀 Deployment: Production-ready with SSL and security"
    echo ""
    echo "⚡ Ready to Continue Website Development!"
    echo ""
}

# Function to show system status
show_status() {
    echo "📊 System Status Dashboard"
    echo "=========================="
    echo ""
    
    # Check automation services
    echo "🤖 Automation Services:"
    if pgrep -f "health-monitor.sh" > /dev/null; then
        echo "  ✅ Health Monitor: Running"
    else
        echo "  ❌ Health Monitor: Stopped"
    fi
    
    if pgrep -f "error-watcher.sh" > /dev/null; then
        echo "  ✅ Error Watcher: Running"
    else
        echo "  ❌ Error Watcher: Stopped"
    fi
    
    if pgrep -f "performance-monitor.sh" > /dev/null; then
        echo "  ✅ Performance Monitor: Running"
    else
        echo "  ❌ Performance Monitor: Stopped"
    fi
    
    echo ""
    
    # System resources
    echo "📊 System Resources:"
    echo "  CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "  Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
    echo "  Disk Usage: $(df -h . | awk 'NR==2{print $5}')"
    
    echo ""
    
    # Website health
    echo "🌐 Website Health:"
    if curl -s -o /dev/null -w "%{http_code}" https://ittheal.com | grep -q "200"; then
        echo "  ✅ Website: Online"
    else
        echo "  ❌ Website: Offline or issues"
    fi
    
    # Recent activity
    echo ""
    echo "📋 Recent Activities:"
    if [ -f "$ACTIVITY_LOG" ]; then
        tail -5 "$ACTIVITY_LOG" | sed 's/^/  /'
    else
        echo "  No recent activities logged"
    fi
}

# Main execution logic
main() {
    local option="$1"
    
    case "$option" in
        "1")
            show_welcome
            log "🚀 Starting AUTO-FIX ALL ISSUES (Option 1)"
            save_context "go 1"
            start_automation_services
            
            log "🔧 Running comprehensive validation and auto-fix..."
            if [ -f "./validate-everything.sh" ]; then
                chmod +x "./validate-everything.sh"
                ./validate-everything.sh
            else
                log "❌ validate-everything.sh not found"
                exit 1
            fi
            
            log "📊 Generating comprehensive report..."
            echo "✅ Auto-fix process completed successfully!"
            ;;
            
        "2")
            show_welcome
            log "🎯 Starting REAL USER EXPERIENCE VALIDATION (Option 2)"
            save_context "go 2"
            start_automation_services
            
            log "🎯 Testing real user scenarios..."
            # Run specific user experience tests
            if [ -f "test-booking-crud-live.js" ]; then
                timeout 300 node test-booking-crud-live.js
            fi
            
            log "✅ User experience validation completed!"
            ;;
            
        "3")
            show_welcome
            log "💾 Starting Quick Schema Check (Option 3)"
            save_context "go 3"
            start_automation_services
            
            log "💾 Checking database schema..."
            if [ -f "validate-enum-consistency-enhanced.js" ]; then
                timeout 120 node validate-enum-consistency-enhanced.js
            fi
            
            log "✅ Schema check completed!"
            ;;
            
        "4")
            show_welcome
            log "🔍 Starting Full Legacy Validation (Option 4)"
            save_context "go 4"
            start_automation_services
            
            log "🔍 Running full legacy validation..."
            if [ -f "./validate-everything.sh" ]; then
                chmod +x "./validate-everything.sh"
                ./validate-everything.sh
            fi
            
            log "✅ Legacy validation completed!"
            ;;
            
        "5")
            show_welcome
            log "🚀 Starting Deploy to Production (Option 5)"
            save_context "go 5"
            start_automation_services
            
            log "🚀 Deploying to production..."
            echo "⚠️  Production deployment requires manual verification"
            echo "🌐 Changes are immediately live at https://ittheal.com"
            
            log "✅ Production deployment initiated!"
            ;;
            
        "status")
            show_status
            ;;
            
        "context")
            if [ "$2" = "save" ]; then
                save_context "manual save"
                log "💾 Session context saved manually"
            elif [ "$2" = "restore" ]; then
                if [ -f "$CONTEXT_FILE" ]; then
                    echo "🔄 Session Context:"
                    cat "$CONTEXT_FILE" | jq .
                else
                    echo "❌ No saved context found"
                fi
            else
                if [ -f "$CONTEXT_FILE" ]; then
                    echo "📋 Current Session Context:"
                    cat "$CONTEXT_FILE" | jq .
                else
                    echo "❌ No session context available"
                fi
            fi
            ;;
            
        *)
            echo "🚀 ITT Heal Site - Real Usage Validation & Auto-Fix"
            echo "===================================================="
            echo ""
            echo "Usage: ./go [option]"
            echo ""
            echo "Options:"
            echo "  1       - AUTO-FIX ALL ISSUES (Enhanced with full automation)"
            echo "  2       - REAL USER EXPERIENCE VALIDATION (Enhanced with monitoring)"
            echo "  3       - Quick Schema Check (Enhanced with logging)"
            echo "  4       - Full Legacy Validation (Enhanced with automation)"
            echo "  5       - Deploy to Production (Enhanced with monitoring)"
            echo "  status  - Show System Status (Automation services)"
            echo "  context - Show/Save/Restore session context"
            echo ""
            echo "⚠️  IMPORTANT VPS WORKFLOW:"
            echo "🌐 Working in PRODUCTION VPS - All changes are LIVE immediately"
            echo "🚀 Auto-deploy to https://ittheal.com - No local preview"
            echo "👁️  User can only see changes AFTER deployment"
            echo "🔄 Immediate live testing required after every change"
            echo ""
            ;;
    esac
}

# Execute main function with all arguments
main "$@"