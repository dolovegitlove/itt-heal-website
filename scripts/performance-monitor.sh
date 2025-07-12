#!/bin/bash

# ITT Heal Automated Performance Monitoring & Optimization System
# Continuously monitors performance metrics and auto-optimizes the system

MONITOR_INTERVAL=300  # 5 minutes
LOG_FILE="/home/ittz/projects/itt/site/logs/performance-monitor.log"
METRICS_FILE="/home/ittz/projects/itt/site/logs/performance-metrics.json"
OPTIMIZATION_LOG="/home/ittz/projects/itt/site/logs/performance-optimizations.log"
SITE_URL="https://ittheal.com"
API_URL="https://ittheal.com/api"

# Performance thresholds
RESPONSE_TIME_THRESHOLD=3000  # 3 seconds
CPU_THRESHOLD=80              # 80%
MEMORY_THRESHOLD=85           # 85%
DISK_IO_THRESHOLD=80          # 80%

# Create logs directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to log optimizations
log_optimization() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] OPTIMIZATION: $1" | tee -a "$OPTIMIZATION_LOG"
}

# Function to measure website response time
measure_response_time() {
    local url="$1"
    local response_time
    
    response_time=$(curl -w "%{time_total}" -o /dev/null -s --max-time 10 "$url" | awk '{print int($1*1000)}')
    echo "$response_time"
}

# Function to check website performance
check_website_performance() {
    log_message "🚀 Checking website performance..."
    
    local main_page_time
    local api_health_time
    local booking_page_time
    
    main_page_time=$(measure_response_time "$SITE_URL")
    api_health_time=$(measure_response_time "$API_URL/health-check")
    booking_page_time=$(measure_response_time "$SITE_URL/web-booking/options")
    
    log_message "📊 Response Times: Main=${main_page_time}ms, API=${api_health_time}ms, Booking=${booking_page_time}ms"
    
    # Check if any response time exceeds threshold
    if [ "$main_page_time" -gt "$RESPONSE_TIME_THRESHOLD" ] || 
       [ "$api_health_time" -gt "$RESPONSE_TIME_THRESHOLD" ] || 
       [ "$booking_page_time" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
        log_message "⚠️  High response times detected"
        optimize_web_performance
        return 1
    else
        log_message "✅ Website performance within acceptable limits"
        return 0
    fi
}

# Function to optimize web performance
optimize_web_performance() {
    log_optimization "Optimizing web performance due to high response times"
    
    # 1. Restart backend to clear memory leaks
    log_optimization "Restarting backend to clear potential memory leaks"
    pm2 restart itt-backend
    
    # 2. Clear nginx cache if available
    if [ -d "/var/cache/nginx" ]; then
        log_optimization "Clearing nginx cache"
        sudo rm -rf /var/cache/nginx/*
        sudo systemctl reload nginx
    fi
    
    # 3. Optimize database connections
    log_optimization "Optimizing database connections"
    # Run database optimization queries
    psql -U ittheal -d ittheal_booking -c "VACUUM ANALYZE;" >/dev/null 2>&1 || true
    
    # 4. Compress static assets if needed
    log_optimization "Checking static asset compression"
    find /home/ittz/projects/itt/site -name "*.js" -o -name "*.css" -o -name "*.html" | \
    while read -r file; do
        if [ ! -f "${file}.gz" ] || [ "$file" -nt "${file}.gz" ]; then
            gzip -c "$file" > "${file}.gz"
        fi
    done
    
    sleep 10  # Wait for optimizations to take effect
}

# Function to monitor system resources
monitor_system_resources() {
    log_message "💻 Monitoring system resources..."
    
    # CPU usage
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    cpu_usage=${cpu_usage%.*}  # Remove decimal part
    
    # Memory usage
    local memory_usage
    memory_usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
    
    # Disk usage
    local disk_usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    # Disk I/O
    local disk_io
    disk_io=$(iostat -x 1 2 | tail -n +4 | awk '{sum += $10} END {printf "%.0f", sum/NR}' 2>/dev/null || echo "0")
    
    log_message "📈 System Resources: CPU=${cpu_usage}%, Memory=${memory_usage}%, Disk=${disk_usage}%, IO=${disk_io}%"
    
    # Store metrics in JSON format
    cat > "$METRICS_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "cpu_usage": $cpu_usage,
  "memory_usage": $memory_usage,
  "disk_usage": $disk_usage,
  "disk_io": $disk_io,
  "website_response_times": {
    "main_page": $(measure_response_time "$SITE_URL"),
    "api_health": $(measure_response_time "$API_URL/health-check"),
    "booking_page": $(measure_response_time "$SITE_URL/web-booking/options")
  }
}
EOF
    
    # Check for resource optimization needs
    local needs_optimization=false
    
    if [ "$cpu_usage" -gt "$CPU_THRESHOLD" ]; then
        log_message "⚠️  High CPU usage: ${cpu_usage}%"
        optimize_cpu_usage
        needs_optimization=true
    fi
    
    if [ "$memory_usage" -gt "$MEMORY_THRESHOLD" ]; then
        log_message "⚠️  High memory usage: ${memory_usage}%"
        optimize_memory_usage
        needs_optimization=true
    fi
    
    if [ "$disk_usage" -gt 85 ]; then
        log_message "⚠️  High disk usage: ${disk_usage}%"
        optimize_disk_usage
        needs_optimization=true
    fi
    
    if [ "$needs_optimization" = "false" ]; then
        log_message "✅ System resources within optimal ranges"
    fi
}

# Function to optimize CPU usage
optimize_cpu_usage() {
    log_optimization "Optimizing CPU usage"
    
    # Find and optimize high CPU processes
    local high_cpu_processes
    high_cpu_processes=$(ps aux --sort=-%cpu | head -n 6 | tail -n +2)
    log_optimization "High CPU processes detected: $high_cpu_processes"
    
    # Restart backend if it's consuming too much CPU
    local backend_cpu
    backend_cpu=$(ps aux | grep "node.*server.js" | grep -v grep | awk '{print $3}' | head -1)
    if [ -n "$backend_cpu" ] && [ "${backend_cpu%.*}" -gt 50 ]; then
        log_optimization "Backend consuming high CPU (${backend_cpu}%) - restarting"
        pm2 restart itt-backend
    fi
    
    # Adjust process priorities
    log_optimization "Adjusting process priorities for better CPU distribution"
    pgrep -f "itt-backend" | xargs -I {} sudo renice -n -5 -p {} 2>/dev/null || true
}

# Function to optimize memory usage
optimize_memory_usage() {
    log_optimization "Optimizing memory usage"
    
    # Find memory-heavy processes
    local high_mem_processes
    high_mem_processes=$(ps aux --sort=-%mem | head -n 6 | tail -n +2)
    log_optimization "High memory processes: $high_mem_processes"
    
    # Clear system caches
    log_optimization "Clearing system caches to free memory"
    sudo sync
    sudo sysctl vm.drop_caches=3
    
    # Restart backend if using too much memory
    local backend_mem
    backend_mem=$(ps aux | grep "node.*server.js" | grep -v grep | awk '{print $4}' | head -1)
    if [ -n "$backend_mem" ] && [ "${backend_mem%.*}" -gt 20 ]; then
        log_optimization "Backend consuming high memory (${backend_mem}%) - restarting"
        pm2 restart itt-backend
    fi
    
    # Force garbage collection in Node.js processes
    log_optimization "Triggering garbage collection in Node.js processes"
    pm2 trigger itt-backend gc 2>/dev/null || true
}

# Function to optimize disk usage
optimize_disk_usage() {
    log_optimization "Optimizing disk usage"
    
    # Run cleanup script
    if [ -f "/home/ittz/projects/itt/site/cleanup-vps.sh" ]; then
        log_optimization "Running VPS cleanup script"
        /home/ittz/projects/itt/site/cleanup-vps.sh
    fi
    
    # Clean old log files
    log_optimization "Cleaning old log files"
    find /home/ittz/projects/itt/site/logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
    find /home/ittz/projects/itt/site/logs -name "*.json" -mtime +3 -delete 2>/dev/null || true
    
    # Compress large log files
    find /home/ittz/projects/itt/site/logs -name "*.log" -size +10M -exec gzip {} \; 2>/dev/null || true
    
    # Clean PM2 logs if they're too large
    local pm2_log_size
    pm2_log_size=$(du -sm /home/ittz/.pm2/logs 2>/dev/null | cut -f1 || echo "0")
    if [ "$pm2_log_size" -gt 100 ]; then
        log_optimization "PM2 logs are large (${pm2_log_size}MB) - cleaning"
        pm2 flush
    fi
}

# Function to monitor database performance
monitor_database_performance() {
    log_message "🗄️  Monitoring database performance..."
    
    # Check database connection pool
    local active_connections
    active_connections=$(psql -U ittheal -d ittheal_booking -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs || echo "0")
    
    log_message "📊 Database: Active connections: $active_connections"
    
    # Check for slow queries
    local slow_queries
    slow_queries=$(psql -U ittheal -d ittheal_booking -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '30 seconds';" 2>/dev/null | xargs || echo "0")
    
    if [ "$slow_queries" -gt 0 ]; then
        log_message "⚠️  Found $slow_queries slow-running queries"
        optimize_database_performance
    else
        log_message "✅ Database performance looks good"
    fi
}

# Function to optimize database performance
optimize_database_performance() {
    log_optimization "Optimizing database performance"
    
    # Run VACUUM and ANALYZE
    log_optimization "Running database maintenance (VACUUM ANALYZE)"
    psql -U ittheal -d ittheal_booking -c "VACUUM ANALYZE;" >/dev/null 2>&1 || true
    
    # Update table statistics
    log_optimization "Updating table statistics"
    psql -U ittheal -d ittheal_booking -c "ANALYZE;" >/dev/null 2>&1 || true
    
    # Kill long-running queries
    log_optimization "Terminating queries running longer than 5 minutes"
    psql -U ittheal -d ittheal_booking -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true
}

# Function to check and optimize nginx performance
monitor_nginx_performance() {
    log_message "🌐 Monitoring nginx performance..."
    
    # Check nginx status
    if ! systemctl is-active --quiet nginx; then
        log_message "🚨 Nginx is not running - starting"
        sudo systemctl start nginx
        return 1
    fi
    
    # Check nginx connections
    local nginx_connections
    nginx_connections=$(ss -tuln | grep ':80\|:443' | wc -l)
    log_message "📊 Nginx: Active connections: $nginx_connections"
    
    # Check nginx error log for recent errors
    local nginx_errors
    nginx_errors=$(sudo tail -n 100 /var/log/nginx/error.log 2>/dev/null | grep "$(date '+%Y/%m/%d')" | wc -l || echo "0")
    
    if [ "$nginx_errors" -gt 10 ]; then
        log_message "⚠️  High nginx error count: $nginx_errors today"
        optimize_nginx_performance
    else
        log_message "✅ Nginx performance looks good"
    fi
}

# Function to optimize nginx performance
optimize_nginx_performance() {
    log_optimization "Optimizing nginx performance"
    
    # Test nginx configuration
    if sudo nginx -t >/dev/null 2>&1; then
        log_optimization "Nginx configuration is valid - reloading"
        sudo systemctl reload nginx
    else
        log_optimization "Nginx configuration has errors - not reloading"
    fi
    
    # Clear nginx cache if available
    if [ -d "/var/cache/nginx" ]; then
        log_optimization "Clearing nginx cache"
        sudo rm -rf /var/cache/nginx/*
    fi
}

# Function to generate performance report
generate_performance_report() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    local report_file="/home/ittz/projects/itt/site/logs/performance-report-$(date +%Y%m%d-%H%M).json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$timestamp",
  "system": {
    "cpu_usage": $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' | cut -d. -f1),
    "memory_usage": $(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}'),
    "disk_usage": $(df / | awk 'NR==2 {print $5}' | sed 's/%//'),
    "load_average": "$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')"
  },
  "website": {
    "main_page_response": $(measure_response_time "$SITE_URL"),
    "api_response": $(measure_response_time "$API_URL/health-check"),
    "booking_response": $(measure_response_time "$SITE_URL/web-booking/options")
  },
  "database": {
    "active_connections": $(psql -U ittheal -d ittheal_booking -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs || echo "0")
  },
  "services": {
    "nginx": $(systemctl is-active nginx),
    "postgresql": $(systemctl is-active postgresql),
    "backend": "$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="itt-backend") | .pm2_env.status' 2>/dev/null || echo "unknown")"
  }
}
EOF
    
    log_message "📊 Performance report generated: $report_file"
}

# Function to run performance optimizations
run_performance_optimizations() {
    log_message "⚡ Running scheduled performance optimizations..."
    
    # Daily optimization tasks
    if [ "$(date +%H)" = "02" ]; then  # Run at 2 AM
        log_optimization "Running daily optimization tasks"
        
        # Database maintenance
        optimize_database_performance
        
        # Clear temporary files
        find /tmp -name "*.tmp" -mtime +1 -delete 2>/dev/null || true
        
        # Compress old logs
        find /home/ittz/projects/itt/site/logs -name "*.log" -mtime +1 -exec gzip {} \; 2>/dev/null || true
        
        # Update system package cache
        sudo apt-get update >/dev/null 2>&1 || true
    fi
    
    # Hourly optimization tasks
    if [ "$(date +%M)" = "00" ]; then  # Run every hour
        log_optimization "Running hourly optimization tasks"
        
        # Clear application caches
        pm2 trigger itt-backend clear-cache 2>/dev/null || true
        
        # Optimize memory if needed
        local memory_usage
        memory_usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
        if [ "$memory_usage" -gt 70 ]; then
            optimize_memory_usage
        fi
    fi
}

# Main monitoring loop
main_performance_monitor_loop() {
    log_message "🚀 ITT Heal Performance Monitor Started"
    log_message "⏰ Monitoring interval: ${MONITOR_INTERVAL}s"
    log_message "🎯 Performance thresholds: Response=${RESPONSE_TIME_THRESHOLD}ms, CPU=${CPU_THRESHOLD}%, Memory=${MEMORY_THRESHOLD}%"
    
    while true; do
        log_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_message "🔍 Starting performance monitoring cycle..."
        
        # Run all performance checks
        check_website_performance
        monitor_system_resources
        monitor_database_performance
        monitor_nginx_performance
        
        # Run scheduled optimizations
        run_performance_optimizations
        
        # Generate performance report
        generate_performance_report
        
        log_message "✅ Performance monitoring cycle completed"
        log_message "😴 Sleeping for $MONITOR_INTERVAL seconds..."
        sleep $MONITOR_INTERVAL
    done
}

# Handle script termination
cleanup() {
    log_message "🛑 Performance monitor stopping..."
    exit 0
}

trap cleanup SIGTERM SIGINT

# Check command line arguments
case "$1" in
    "daemon")
        # Run in background as daemon
        nohup "$0" > /dev/null 2>&1 &
        echo "🚀 Performance monitor started as daemon (PID: $!)"
        echo "$!" > /home/ittz/projects/itt/site/logs/performance-monitor.pid
        ;;
    "optimize")
        # Run optimization once
        echo "⚡ Running performance optimizations..."
        optimize_web_performance
        optimize_cpu_usage
        optimize_memory_usage
        optimize_disk_usage
        optimize_database_performance
        optimize_nginx_performance
        echo "✅ Optimizations completed"
        ;;
    "report")
        # Generate performance report
        echo "📊 Generating performance report..."
        generate_performance_report
        echo "✅ Report generated"
        ;;
    "test")
        # Test mode - run once
        echo "🧪 Running performance monitor in test mode..."
        check_website_performance
        monitor_system_resources
        monitor_database_performance
        monitor_nginx_performance
        echo "✅ Test completed"
        ;;
    *)
        # Run in foreground
        main_performance_monitor_loop
        ;;
esac