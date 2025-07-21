#!/bin/bash

# ITT Heal - Comprehensive Validation Script
# Runs all validation checks for the system

echo "🔍 ITT Heal - Comprehensive System Validation"
echo "=============================================="
echo ""

# Set up logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
VALIDATION_LOG="$LOG_DIR/cron-validation.log"

# Ensure logs directory exists
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$VALIDATION_LOG"
}

# Function to run validation step
run_validation() {
    local step_name="$1"
    local command="$2"
    
    log "🔹 Starting: $step_name"
    
    if eval "$command" >> "$VALIDATION_LOG" 2>&1; then
        log "✅ Passed: $step_name"
        return 0
    else
        log "❌ Failed: $step_name"
        return 1
    fi
}

# Initialize counters
TOTAL_TESTS=0
PASSED_TESTS=0

log "📋 Starting comprehensive validation..."

# 1. CSS Classes Validation
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_validation "CSS Classes Validation" "timeout 60 node validate-css-classes.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# 2. Button Consistency Check
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_validation "Button Consistency Check" "timeout 60 node validate-button-consistency.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# 3. Enum Consistency Check
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_validation "Enum Consistency Check" "timeout 120 node validate-enum-consistency-enhanced.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# 4. Live Booking System Test
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_validation "Live Booking System Test" "timeout 300 node test-booking-crud-live.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# 3. Health Check Endpoint
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_validation "Health Check Endpoint" "timeout 60 curl -s https://ittheal.com/api/health-check"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# 4. System Health Monitor
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_validation "System Health Monitor" "./scripts/health-monitor.sh test"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# 5. Error Watcher Check
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_validation "Error Watcher Check" "./scripts/error-watcher.sh test"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# 6. Performance Monitor
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_validation "Performance Monitor" "./scripts/performance-monitor.sh report"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Generate final report
echo ""
log "📊 Validation Summary"
log "===================="
log "Total Tests: $TOTAL_TESTS"
log "Passed: $PASSED_TESTS"
log "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
log "Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%"

if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    log "🎉 All validations passed!"
    exit 0
else
    log "💥 Some validations failed. Check logs for details."
    exit 1
fi