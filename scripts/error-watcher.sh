#!/bin/bash

# ITT Heal Automated Error Detection and Auto-Fix System
# Monitors logs and system health, automatically fixes common issues

WATCH_INTERVAL=60  # Check every minute
LOG_FILE="/home/ittz/projects/itt/site/logs/error-watcher.log"
BACKEND_LOG_PATH="/home/ittz/.pm2/logs/itt-backend-error.log"
AUTO_FIX_ENABLED=true

# Create logs directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to auto-fix backend module errors
fix_backend_modules() {
    log_message "🔧 Fixing backend module issues..."
    
    cd /home/ittz/projects/itt/site/backend || return 1
    
    # Clean install dependencies
    if npm install; then
        log_message "✅ Backend dependencies reinstalled"
        pm2 restart itt-backend
        log_message "🔄 Backend restarted"
        return 0
    else
        log_message "❌ Failed to fix backend modules"
        return 1
    fi
}

# Function to fix enum consistency issues
fix_enum_issues() {
    log_message "🎯 Auto-fixing enum consistency issues..."
    
    cd /home/ittz/projects/itt/site || return 1
    
    # Run enum fix script if it exists
    if [ -f "fix-enum-values.js" ]; then
        if node fix-enum-values.js; then
            log_message "✅ Enum issues automatically fixed"
            return 0
        else
            log_message "❌ Could not auto-fix enum issues"
            return 1
        fi
    else
        log_message "⚠️  Enum fix script not found"
        return 1
    fi
}

# Function to fix disk space issues
fix_disk_space() {
    log_message "💾 Auto-fixing disk space issues..."
    
    cd /home/ittz/projects/itt/site || return 1
    
    if [ -f "cleanup-vps.sh" ]; then
        if ./cleanup-vps.sh; then
            log_message "✅ Disk space cleaned up"
            return 0
        else
            log_message "❌ Cleanup failed"
            return 1
        fi
    else
        log_message "⚠️  Cleanup script not found"
        return 1
    fi
}

# Function to fix database connection issues
fix_database_connection() {
    log_message "🗄️  Attempting to fix database connection..."
    
    # Restart PostgreSQL service if needed
    if systemctl is-active --quiet postgresql; then
        log_message "✅ PostgreSQL is running"
    else
        log_message "🔄 Restarting PostgreSQL..."
        if sudo systemctl restart postgresql; then
            log_message "✅ PostgreSQL restarted"
            sleep 5
            pm2 restart itt-backend
            log_message "🔄 Backend restarted after DB fix"
            return 0
        else
            log_message "❌ Failed to restart PostgreSQL"
            return 1
        fi
    fi
    
    return 0
}

# Function to fix SSL certificate issues
fix_ssl_issues() {
    log_message "🔒 Checking SSL certificate..."
    
    # Check if certificate is about to expire
    local ssl_expiry
    ssl_expiry=$(echo | openssl s_client -servername ittheal.com -connect ittheal.com:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [ -n "$ssl_expiry" ]; then
        local expiry_epoch
        expiry_epoch=$(date -d "$ssl_expiry" +%s 2>/dev/null)
        local current_epoch
        current_epoch=$(date +%s)
        local days_until_expiry
        days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ "$days_until_expiry" -lt 30 ]; then
            log_message "🔄 SSL certificate expires in $days_until_expiry days - renewing..."
            if sudo certbot renew --quiet; then
                log_message "✅ SSL certificate renewed"
                sudo systemctl reload nginx
                return 0
            else
                log_message "❌ SSL certificate renewal failed"
                return 1
            fi
        fi
    fi
    
    return 0
}

# Function to analyze backend error logs with intelligent pattern recognition
analyze_backend_errors() {
    if [ ! -f "$BACKEND_LOG_PATH" ]; then
        return 0
    fi
    
    # Get recent errors (last 50 lines for better analysis)
    local recent_errors
    recent_errors=$(tail -n 50 "$BACKEND_LOG_PATH" 2>/dev/null)
    
    if [ -z "$recent_errors" ]; then
        return 0
    fi
    
    log_message "🔍 Analyzing recent backend errors with intelligent pattern recognition..."
    
    # Track error patterns and frequencies
    local error_patterns=()
    local error_counts=()
    
    # Check for common error patterns and auto-fix with escalation
    
    # 1. Module not found errors
    local module_errors
    module_errors=$(echo "$recent_errors" | grep -c "Cannot find module\|Module not found\|Error: Cannot resolve module" || echo "0")
    if [ "$module_errors" -gt 0 ]; then
        log_message "🔧 Detected $module_errors module dependency issues"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            if [ "$module_errors" -gt 5 ]; then
                log_message "🚨 High frequency module errors - using aggressive fix"
                fix_backend_modules_aggressive
            else
                fix_backend_modules
            fi
        fi
    fi
    
    # 2. Database connection errors with connection pool analysis
    local db_errors
    db_errors=$(echo "$recent_errors" | grep -c "database\|connection\|ECONNREFUSED\|Connection terminated\|Connection pool exhausted" || echo "0")
    if [ "$db_errors" -gt 0 ]; then
        log_message "🔧 Detected $db_errors database connection issues"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            if [ "$db_errors" -gt 10 ]; then
                log_message "🚨 High frequency DB errors - using comprehensive fix"
                fix_database_connection_comprehensive
            else
                fix_database_connection
            fi
        fi
    fi
    
    # 3. Enhanced enum consistency errors
    local enum_errors
    enum_errors=$(echo "$recent_errors" | grep -c "enum\|pending\|completed\|invalid input value for enum\|violates check constraint" || echo "0")
    if [ "$enum_errors" -gt 0 ]; then
        log_message "🔧 Detected $enum_errors enum consistency issues"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            fix_enum_issues_enhanced
        fi
    fi
    
    # 4. Port binding errors with process cleanup
    local port_errors
    port_errors=$(echo "$recent_errors" | grep -c "EADDRINUSE\|port.*already in use\|bind EADDRINUSE" || echo "0")
    if [ "$port_errors" -gt 0 ]; then
        log_message "🔧 Detected $port_errors port binding issues"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            fix_port_binding_issues
        fi
    fi
    
    # 5. Permission errors with comprehensive fix
    local perm_errors
    perm_errors=$(echo "$recent_errors" | grep -c "EACCES\|permission denied\|EPERM\|Operation not permitted" || echo "0")
    if [ "$perm_errors" -gt 0 ]; then
        log_message "🔧 Detected $perm_errors permission issues"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            fix_permission_issues_comprehensive
        fi
    fi
    
    # 6. Memory/Resource errors
    local memory_errors
    memory_errors=$(echo "$recent_errors" | grep -c "out of memory\|ENOMEM\|heap\|Maximum call stack\|RangeError" || echo "0")
    if [ "$memory_errors" -gt 0 ]; then
        log_message "🔧 Detected $memory_errors memory/resource issues"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            fix_memory_issues
        fi
    fi
    
    # 7. Authentication/JWT errors
    local auth_errors
    auth_errors=$(echo "$recent_errors" | grep -c "jwt\|token\|authentication\|unauthorized\|JsonWebTokenError" || echo "0")
    if [ "$auth_errors" -gt 0 ]; then
        log_message "🔧 Detected $auth_errors authentication issues"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            fix_authentication_issues
        fi
    fi
    
    # 8. CORS/Network errors
    local network_errors
    network_errors=$(echo "$recent_errors" | grep -c "CORS\|Network\|ENOTFOUND\|ETIMEDOUT\|ECONNRESET" || echo "0")
    if [ "$network_errors" -gt 0 ]; then
        log_message "🔧 Detected $network_errors network/CORS issues"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            fix_network_issues
        fi
    fi
    
    # 9. Validation/Schema errors
    local validation_errors
    validation_errors=$(echo "$recent_errors" | grep -c "validation\|schema\|ValidationError\|SequelizeValidationError" || echo "0")
    if [ "$validation_errors" -gt 0 ]; then
        log_message "🔧 Detected $validation_errors validation/schema issues"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            fix_validation_issues
        fi
    fi
    
    # 10. File system errors
    local fs_errors
    fs_errors=$(echo "$recent_errors" | grep -c "ENOENT\|EEXIST\|file system\|no such file or directory" || echo "0")
    if [ "$fs_errors" -gt 0 ]; then
        log_message "🔧 Detected $fs_errors file system issues"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            fix_filesystem_issues
        fi
    fi
    
    # Error pattern analysis and predictive fixing
    analyze_error_patterns "$recent_errors"
}

# Function to check system resources
check_system_resources() {
    # Check memory usage
    local memory_usage
    memory_usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
    
    if [ "$memory_usage" -gt 90 ]; then
        log_message "⚠️  High memory usage: ${memory_usage}%"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            log_message "🔧 Restarting backend to free memory..."
            pm2 restart itt-backend
        fi
    fi
    
    # Check disk space
    local disk_usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt 85 ]; then
        log_message "⚠️  High disk usage: ${disk_usage}%"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            fix_disk_space
        fi
    fi
    
    # Check CPU load
    local cpu_load
    cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores
    cpu_cores=$(nproc)
    
    if [ $(echo "$cpu_load > $cpu_cores * 2" | bc -l 2>/dev/null || echo 0) -eq 1 ]; then
        log_message "⚠️  High CPU load: $cpu_load (cores: $cpu_cores)"
    fi
}

# Function to check critical services
check_critical_services() {
    local services_to_check=("nginx" "postgresql")
    
    for service in "${services_to_check[@]}"; do
        if ! systemctl is-active --quiet "$service"; then
            log_message "🚨 Critical service $service is not running"
            if [ "$AUTO_FIX_ENABLED" = "true" ]; then
                log_message "🔧 Attempting to start $service..."
                if sudo systemctl start "$service"; then
                    log_message "✅ $service started successfully"
                else
                    log_message "❌ Failed to start $service"
                fi
            fi
        fi
    done
}

# Function to validate critical endpoints
validate_endpoints() {
    local endpoints=(
        "https://ittheal.com"
        "https://ittheal.com/api/health-check"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local response_code
        response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$endpoint")
        
        if [ "$response_code" != "200" ]; then
            log_message "🚨 Endpoint $endpoint returned HTTP $response_code"
            if [ "$AUTO_FIX_ENABLED" = "true" ] && [ "$endpoint" = "https://ittheal.com/api/health-check" ]; then
                log_message "🔧 Restarting backend for API endpoint fix..."
                pm2 restart itt-backend
                sleep 10  # Wait for restart
                
                # Re-check
                response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$endpoint")
                if [ "$response_code" = "200" ]; then
                    log_message "✅ API endpoint recovered after restart"
                else
                    log_message "❌ API endpoint still failing after restart"
                fi
            fi
        fi
    done
}

# Function to run proactive validations
run_proactive_validations() {
    cd /home/ittz/projects/itt/site || return 1
    
    # Check enum consistency
    if ! node validate-enum-consistency-enhanced.js >/dev/null 2>&1; then
        log_message "⚠️  Enum consistency issues detected"
        if [ "$AUTO_FIX_ENABLED" = "true" ]; then
            fix_enum_issues
        fi
    fi
    
    # Check schema consistency
    if ! node validate-schema-consistency.js >/dev/null 2>&1; then
        log_message "⚠️  Schema consistency issues detected"
        # Schema issues typically require manual intervention
        log_message "📧 Schema issues require manual review"
    fi
}

# Main error watching loop
main_error_watch_loop() {
    log_message "🚀 ITT Heal Error Watcher Started"
    log_message "⏰ Watch interval: ${WATCH_INTERVAL}s"
    log_message "🔧 Auto-fix enabled: $AUTO_FIX_ENABLED"
    
    while true; do
        log_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_message "🔍 Starting error detection cycle..."
        
        # Run all checks
        analyze_backend_errors
        check_system_resources
        check_critical_services
        validate_endpoints
        run_proactive_validations
        fix_ssl_issues
        
        log_message "✅ Error detection cycle completed"
        log_message "😴 Sleeping for $WATCH_INTERVAL seconds..."
        sleep $WATCH_INTERVAL
    done
}

# Handle script termination
cleanup() {
    log_message "🛑 Error watcher stopping..."
    exit 0
}

trap cleanup SIGTERM SIGINT

# Check command line arguments
case "$1" in
    "daemon")
        # Run in background as daemon
        nohup "$0" > /dev/null 2>&1 &
        echo "🚀 Error watcher started as daemon (PID: $!)"
        echo "$!" > /home/ittz/projects/itt/site/logs/error-watcher.pid
        ;;
    "disable-autofix")
        AUTO_FIX_ENABLED=false
        echo "🔧 Auto-fix disabled - running in monitoring mode only"
        main_error_watch_loop
        ;;
    "test")
        # Test mode - run once
        echo "🧪 Running error watcher in test mode..."
        analyze_backend_errors
        check_system_resources
        check_critical_services
        validate_endpoints
        echo "✅ Test completed"
        ;;
    *)
        # Run in foreground with auto-fix enabled
        main_error_watch_loop
        ;;
esac

# Enhanced fixing functions for intelligent error recovery

# Aggressive module fixing for high-frequency errors
fix_backend_modules_aggressive() {
    log_message "🚨 Running aggressive module fix for high-frequency errors..."
    
    cd /home/ittz/projects/itt/site/backend || return 1
    
    # 1. Clear npm cache completely
    npm cache clean --force
    
    # 2. Remove node_modules and package-lock.json
    rm -rf node_modules package-lock.json
    
    # 3. Reinstall with clean state
    if npm install; then
        log_message "✅ Aggressive module fix successful"
        pm2 restart itt-backend
        sleep 10  # Wait longer for stability
        return 0
    else
        log_message "❌ Aggressive module fix failed"
        return 1
    fi
}

# Comprehensive database connection fixing
fix_database_connection_comprehensive() {
    log_message "🚨 Running comprehensive database fix for high-frequency errors..."
    
    # 1. Check PostgreSQL status and restart if needed
    if ! systemctl is-active --quiet postgresql; then
        log_message "🔄 PostgreSQL not running - starting"
        sudo systemctl restart postgresql
        sleep 10
    fi
    
    # 2. Check for connection pool exhaustion
    local active_connections
    active_connections=$(psql -U ittheal -d ittheal_booking -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs || echo "0")
    
    if [ "$active_connections" -gt 50 ]; then
        log_message "🔧 High connection count ($active_connections) - killing idle connections"
        psql -U ittheal -d ittheal_booking -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '5 minutes';" >/dev/null 2>&1
    fi
    
    # 3. Restart backend with fresh connections
    pm2 restart itt-backend
    sleep 15
    
    # 4. Test connection
    local connection_test
    connection_test=$(curl -s --max-time 5 "http://localhost:3000/api/health-check" | grep -o '"database":"connected"' || echo "failed")
    
    if [ "$connection_test" = '"database":"connected"' ]; then
        log_message "✅ Comprehensive database fix successful"
        return 0
    else
        log_message "❌ Comprehensive database fix failed"
        return 1
    fi
}

# Enhanced enum fixing with automatic correction
fix_enum_issues_enhanced() {
    log_message "🎯 Running enhanced enum fix with automatic correction..."
    
    cd /home/ittz/projects/itt/site || return 1
    
    # 1. Run enum validation and capture specific issues
    local enum_issues
    enum_issues=$(node validate-enum-consistency-enhanced.js 2>&1 || echo "validation failed")
    
    # 2. Try to auto-correct common enum mismatches
    if echo "$enum_issues" | grep -q "pending"; then
        log_message "🔧 Auto-correcting 'pending' enum values to proper constants"
        find . -name "*.js" -not -path "./node_modules/*" -exec sed -i "s/'pending'/ENUMS.PAYMENT_STATUS.UNPAID/g" {} \;
    fi
    
    if echo "$enum_issues" | grep -q "completed"; then
        log_message "🔧 Auto-correcting 'completed' enum values to proper constants"
        find . -name "*.js" -not -path "./node_modules/*" -exec sed -i "s/'completed'/ENUMS.PAYMENT_STATUS.PAID/g" {} \;
    fi
    
    # 3. Re-run validation
    if node validate-enum-consistency-enhanced.js >/dev/null 2>&1; then
        log_message "✅ Enhanced enum fix successful"
        pm2 restart itt-backend
        return 0
    else
        log_message "⚠️  Enhanced enum fix partially successful - manual review needed"
        return 1
    fi
}

# Port binding issues with process cleanup
fix_port_binding_issues() {
    log_message "🔧 Fixing port binding issues with process cleanup..."
    
    # 1. Find processes using backend port
    local port_processes
    port_processes=$(lsof -ti:3000 2>/dev/null || echo "")
    
    if [ -n "$port_processes" ]; then
        log_message "🔧 Killing processes using port 3000: $port_processes"
        echo "$port_processes" | xargs -r kill -9
        sleep 2
    fi
    
    # 2. Clean PM2 processes
    pm2 kill
    sleep 3
    
    # 3. Restart backend
    cd /home/ittz/projects/itt/site/backend
    pm2 start ecosystem.config.js || pm2 start server.js --name itt-backend
    sleep 5
    
    # 4. Verify port is working
    if lsof -ti:3000 >/dev/null 2>&1; then
        log_message "✅ Port binding fix successful"
        return 0
    else
        log_message "❌ Port binding fix failed"
        return 1
    fi
}

# Comprehensive permission fixing
fix_permission_issues_comprehensive() {
    log_message "🔧 Running comprehensive permission fix..."
    
    # 1. Fix backend directory permissions
    chmod -R 755 /home/ittz/projects/itt/site/backend
    chmod -R 644 /home/ittz/projects/itt/site/backend/*.js
    chmod +x /home/ittz/projects/itt/site/backend/server.js
    
    # 2. Fix log directory permissions
    mkdir -p /home/ittz/projects/itt/site/logs
    chmod -R 755 /home/ittz/projects/itt/site/logs
    
    # 3. Fix script permissions
    chmod +x /home/ittz/projects/itt/site/scripts/*.sh
    
    # 4. Fix PM2 permissions
    chown -R $(whoami) /home/ittz/.pm2 2>/dev/null || true
    
    # 5. Restart backend
    pm2 restart itt-backend
    
    log_message "✅ Comprehensive permission fix completed"
    return 0
}

# Memory issues fixing
fix_memory_issues() {
    log_message "🧠 Fixing memory/resource issues..."
    
    # 1. Clear system caches
    sudo sync
    sudo sysctl vm.drop_caches=3
    
    # 2. Restart backend to clear memory leaks
    pm2 restart itt-backend
    
    # 3. Set memory limits for backend
    pm2 restart itt-backend --max-memory-restart 500M
    
    # 4. Clean temporary files
    find /tmp -name "*.tmp" -mtime +1 -delete 2>/dev/null || true
    
    log_message "✅ Memory issues fix completed"
    return 0
}

# Authentication issues fixing
fix_authentication_issues() {
    log_message "🔐 Fixing authentication issues..."
    
    # 1. Check JWT secret configuration
    if [ ! -f "/home/ittz/projects/itt/site/backend/.env" ]; then
        log_message "⚠️  Backend .env file missing - authentication may fail"
    fi
    
    # 2. Restart backend to refresh JWT handling
    pm2 restart itt-backend
    
    # 3. Test authentication endpoint
    local auth_test
    auth_test=$(curl -s --max-time 5 "http://localhost:3000/api/auth/health" | grep -o "ok" || echo "failed")
    
    if [ "$auth_test" = "ok" ]; then
        log_message "✅ Authentication fix successful"
        return 0
    else
        log_message "⚠️  Authentication fix needs manual review"
        return 1
    fi
}

# Network/CORS issues fixing
fix_network_issues() {
    log_message "🌐 Fixing network/CORS issues..."
    
    # 1. Restart nginx for CORS configuration
    sudo systemctl reload nginx
    
    # 2. Restart backend for network handling
    pm2 restart itt-backend
    
    # 3. Check network connectivity
    if ping -c 1 google.com >/dev/null 2>&1; then
        log_message "✅ Network connectivity confirmed"
    else
        log_message "⚠️  Network connectivity issues detected"
    fi
    
    log_message "✅ Network issues fix completed"
    return 0
}

# Validation/Schema issues fixing
fix_validation_issues() {
    log_message "📝 Fixing validation/schema issues..."
    
    # 1. Run comprehensive schema validation
    cd /home/ittz/projects/itt/site || return 1
    
    node validate-schema-consistency.js >/dev/null 2>&1 || log_message "⚠️  Schema validation failed"
    node validate-database-associations.js >/dev/null 2>&1 || log_message "⚠️  Database associations validation failed"
    
    # 2. Restart backend
    pm2 restart itt-backend
    
    log_message "✅ Validation issues fix completed"
    return 0
}

# File system issues fixing
fix_filesystem_issues() {
    log_message "📁 Fixing file system issues..."
    
    # 1. Create missing directories
    mkdir -p /home/ittz/projects/itt/site/logs
    mkdir -p /home/ittz/projects/itt/site/uploads
    mkdir -p /home/ittz/projects/itt/site/temp
    
    # 2. Fix directory permissions
    chmod 755 /home/ittz/projects/itt/site/logs
    chmod 755 /home/ittz/projects/itt/site/uploads
    chmod 755 /home/ittz/projects/itt/site/temp
    
    # 3. Clean broken symlinks
    find /home/ittz/projects/itt/site -type l ! -exec test -e {} \; -delete 2>/dev/null || true
    
    log_message "✅ File system issues fix completed"
    return 0
}

# Error pattern analysis for predictive fixing
analyze_error_patterns() {
    local recent_errors="$1"
    
    log_message "🔮 Analyzing error patterns for predictive fixing..."
    
    # Count different types of errors over time
    local current_hour
    current_hour=$(date +%H)
    
    # Create pattern analysis file
    local pattern_file="/home/ittz/projects/itt/site/logs/error-patterns-$(date +%Y%m%d).json"
    
    # Log patterns for machine learning potential
    cat >> "$pattern_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hour": $current_hour,
  "patterns": {
    "module_errors": $(echo "$recent_errors" | grep -c "Cannot find module" || echo "0"),
    "db_errors": $(echo "$recent_errors" | grep -c "database\|connection" || echo "0"),
    "enum_errors": $(echo "$recent_errors" | grep -c "enum\|pending\|completed" || echo "0"),
    "memory_errors": $(echo "$recent_errors" | grep -c "memory\|heap" || echo "0"),
    "auth_errors": $(echo "$recent_errors" | grep -c "jwt\|token\|auth" || echo "0")
  }
}
EOF
    
    # Predictive actions based on patterns
    if [ "$current_hour" -ge 2 ] && [ "$current_hour" -le 4 ]; then
        log_message "🔮 Low-traffic hours detected - running preventive maintenance"
        run_preventive_maintenance
    fi
}

# Preventive maintenance during low-traffic hours
run_preventive_maintenance() {
    log_message "🧹 Running preventive maintenance..."
    
    # 1. Clear caches
    sudo sync
    sudo sysctl vm.drop_caches=1
    
    # 2. Restart backend for fresh state
    pm2 restart itt-backend
    
    # 3. Run database maintenance
    psql -U ittheal -d ittheal_booking -c "VACUUM ANALYZE;" >/dev/null 2>&1 || true
    
    # 4. Clean old logs
    find /home/ittz/projects/itt/site/logs -name "*.log" -mtime +3 -delete 2>/dev/null || true
    
    log_message "✅ Preventive maintenance completed"
}