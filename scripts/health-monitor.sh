#!/bin/bash

# ITT Heal Automated Health Monitoring System
# Continuously monitors the production site and auto-fixes issues

MONITOR_INTERVAL=300  # 5 minutes (normal)
DEPLOYMENT_INTERVAL=60  # 1 minute (during deployment)
DEPLOYMENT_FLAG_FILE="/home/ittz/projects/itt/site/logs/deployment-active"
LOG_FILE="/home/ittz/projects/itt/site/logs/health-monitor.log"
ALERT_EMAIL="${ADMIN_EMAIL:-admin@ittheal.com}"
SITE_URL="https://ittheal.com"
API_URL="https://ittheal.com/api"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send alert using notification system
send_alert() {
    local severity="$1"
    local message="$2"
    log_message "ALERT [$severity]: $message"
    
    # Use the notification system to send alerts
    if [ -f "$SITE_DIR/scripts/notification-system.sh" ]; then
        "$SITE_DIR/scripts/notification-system.sh" send "ITT Heal System Alert" "$message" "$severity"
    fi
    
    echo "🚨 [$severity] $message" >> "$LOG_FILE"
}

# Function to check website accessibility
check_website() {
    log_message "🌐 Checking website accessibility..."
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SITE_URL")
    
    if [ "$response_code" = "200" ]; then
        log_message "✅ Website is accessible (HTTP $response_code)"
        return 0
    else
        send_alert "CRITICAL" "Website is not accessible (HTTP $response_code)"
        return 1
    fi
}

# Function to check API health
check_api_health() {
    log_message "🔗 Checking API health..."
    
    local response
    response=$(curl -s --max-time 10 "$API_URL/health-check")
    
    if echo "$response" | grep -q '"status":"OK"'; then
        log_message "✅ API is healthy"
        return 0
    else
        send_alert "CRITICAL" "API health check failed: $response"
        return 1
    fi
}

# Function to check backend processes
check_backend_processes() {
    log_message "⚙️  Checking backend processes..."
    
    local pm2_status
    pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="itt-backend") | .pm2_env.status' 2>/dev/null)
    
    if [ "$pm2_status" = "online" ]; then
        log_message "✅ Backend process is running"
        return 0
    else
        send_alert "HIGH" "Backend process is not running (status: $pm2_status)"
        log_message "🔧 Attempting to restart backend..."
        
        if pm2 restart itt-backend; then
            log_message "✅ Backend restarted successfully"
            sleep 5  # Wait for backend to stabilize
            return 0
        else
            send_alert "CRITICAL" "Failed to restart backend process"
            return 1
        fi
    fi
}

# Function to check database connectivity
check_database() {
    log_message "🗄️  Checking database connectivity..."
    
    # Use the health check endpoint which tests DB connection
    local db_check
    db_check=$(curl -s --max-time 10 "$API_URL/health-check" | jq -r '.database' 2>/dev/null)
    
    if [ "$db_check" = "connected" ]; then
        log_message "✅ Database is connected"
        return 0
    else
        send_alert "HIGH" "Database connection failed"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    log_message "💾 Checking disk space..."
    
    local disk_usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 85 ]; then
        log_message "✅ Disk space OK ($disk_usage% used)"
        return 0
    elif [ "$disk_usage" -lt 95 ]; then
        send_alert "MEDIUM" "Disk space is getting low ($disk_usage% used)"
        log_message "🧹 Running cleanup..."
        /home/ittz/projects/itt/site/cleanup-vps.sh
        return 0
    else
        send_alert "HIGH" "Disk space critically low ($disk_usage% used)"
        return 1
    fi
}

# Function to check SSL certificate
check_ssl_certificate() {
    log_message "🔒 Checking SSL certificate..."
    
    local ssl_expiry
    ssl_expiry=$(echo | openssl s_client -servername ittheal.com -connect ittheal.com:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [ -n "$ssl_expiry" ]; then
        local expiry_epoch
        expiry_epoch=$(date -d "$ssl_expiry" +%s 2>/dev/null)
        local current_epoch
        current_epoch=$(date +%s)
        local days_until_expiry
        days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ "$days_until_expiry" -gt 30 ]; then
            log_message "✅ SSL certificate valid ($days_until_expiry days remaining)"
            return 0
        elif [ "$days_until_expiry" -gt 7 ]; then
            send_alert "MEDIUM" "SSL certificate expires in $days_until_expiry days"
            return 0
        else
            send_alert "HIGH" "SSL certificate expires in $days_until_expiry days"
            return 1
        fi
    else
        send_alert "HIGH" "Could not check SSL certificate"
        return 1
    fi
}

# Function to check recent error logs
check_error_logs() {
    log_message "📋 Checking error logs..."
    
    local recent_errors
    recent_errors=$(pm2 logs itt-backend --err --lines 10 --nostream 2>/dev/null | grep -i "error\|exception\|failed" | wc -l)
    
    if [ "$recent_errors" -lt 5 ]; then
        log_message "✅ Error logs look clean ($recent_errors recent errors)"
        return 0
    elif [ "$recent_errors" -lt 20 ]; then
        send_alert "MEDIUM" "Elevated error count ($recent_errors recent errors)"
        return 0
    else
        send_alert "HIGH" "High error count ($recent_errors recent errors)"
        return 1
    fi
}

# Function to test critical user flows
test_critical_flows() {
    log_message "🔬 Testing critical user flows..."
    
    # Test booking endpoint
    local booking_test
    booking_test=$(curl -s --max-time 10 "$API_URL/web-booking/practitioners" | jq -r '.success' 2>/dev/null)
    
    if [ "$booking_test" = "true" ]; then
        log_message "✅ Booking system accessible"
        return 0
    else
        send_alert "HIGH" "Booking system not responding correctly"
        return 1
    fi
}

# Function to run enum consistency check
check_enum_consistency() {
    log_message "🎯 Checking enum consistency..."
    
    cd /home/ittz/projects/itt/site || return 1
    
    if node validate-enum-consistency-enhanced.js >/dev/null 2>&1; then
        log_message "✅ Enum consistency check passed"
        return 0
    else
        send_alert "MEDIUM" "Enum consistency issues detected"
        return 1
    fi
}

# Function to perform auto-healing actions
auto_heal() {
    log_message "🔧 Performing auto-healing actions..."
    
    # Restart backend if needed
    if ! check_backend_processes; then
        log_message "💊 Backend healing attempted"
    fi
    
    # Clean disk space if needed
    if ! check_disk_space; then
        log_message "💊 Disk cleanup healing attempted"
    fi
    
    # Additional healing actions can be added here
    log_message "🔧 Auto-healing completed"
}

# Function to generate health report
generate_health_report() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat > "/home/ittz/projects/itt/site/logs/health-report-$(date +%Y%m%d-%H%M).json" << EOF
{
  "timestamp": "$timestamp",
  "checks": {
    "website": $(check_website && echo "true" || echo "false"),
    "api": $(check_api_health && echo "true" || echo "false"),
    "backend": $(check_backend_processes && echo "true" || echo "false"),
    "database": $(check_database && echo "true" || echo "false"),
    "disk_space": $(check_disk_space && echo "true" || echo "false"),
    "ssl": $(check_ssl_certificate && echo "true" || echo "false"),
    "errors": $(check_error_logs && echo "true" || echo "false"),
    "flows": $(test_critical_flows && echo "true" || echo "false"),
    "enums": $(check_enum_consistency && echo "true" || echo "false")
  }
}
EOF
}

# Main monitoring loop
main_monitor_loop() {
    log_message "🚀 ITT Heal Health Monitor Started"
    log_message "⏰ Monitoring interval: ${MONITOR_INTERVAL}s"
    log_message "🌐 Monitoring site: $SITE_URL"
    
    while true; do
        log_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_message "🔍 Starting health check cycle..."
        
        local all_checks_passed=true
        
        # Run all health checks
        check_website || all_checks_passed=false
        check_api_health || all_checks_passed=false
        check_backend_processes || all_checks_passed=false
        check_database || all_checks_passed=false
        check_disk_space || all_checks_passed=false
        check_ssl_certificate || all_checks_passed=false
        check_error_logs || all_checks_passed=false
        test_critical_flows || all_checks_passed=false
        check_enum_consistency || all_checks_passed=false
        
        # Generate report
        generate_health_report
        
        if $all_checks_passed; then
            log_message "🎉 All health checks passed"
        else
            log_message "⚠️  Some health checks failed - attempting auto-healing"
            auto_heal
        fi
        
        # Check if deployment is active for shorter interval
        if [ -f "$DEPLOYMENT_FLAG_FILE" ]; then
            current_interval=$DEPLOYMENT_INTERVAL
            log_message "🚀 Deployment active - using short interval ($current_interval seconds)"
        else
            current_interval=$MONITOR_INTERVAL
        fi
        
        log_message "😴 Sleeping for $current_interval seconds..."
        sleep $current_interval
    done
}

# Handle script termination
cleanup() {
    log_message "🛑 Health monitor stopping..."
    exit 0
}

trap cleanup SIGTERM SIGINT

# Check if running as daemon
if [ "$1" = "daemon" ]; then
    # Run in background as daemon
    nohup "$0" > /dev/null 2>&1 &
    echo "🚀 Health monitor started as daemon (PID: $!)"
    echo "$!" > /home/ittz/projects/itt/site/logs/health-monitor.pid
else
    # Run in foreground
    main_monitor_loop
fi