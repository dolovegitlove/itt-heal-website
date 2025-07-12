#!/bin/bash

# ITT Heal Backup Monitoring
# ==========================

source /home/ittz/.backup_env 2>/dev/null || true

BACKUP_DIR="${BACKUP_DIR:-/home/ittz/backups}"
LOG_DIR="/home/ittz/projects/itt/site/logs"
ALERT_LOG="$LOG_DIR/backup-alerts.log"

log_alert() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] BACKUP_ALERT: $1" | tee -a "$ALERT_LOG"
    # Integration with existing monitoring system
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] BACKUP_ALERT: $1" >> "$LOG_DIR/health-monitor.log"
}

# Check if backups are recent
check_backup_freshness() {
    local max_age_hours=25  # Allow 1 hour buffer for daily backups
    
    # Check database backup
    local latest_db=$(find "$BACKUP_DIR/database" -name "*.sql.gz" -mtime -1 2>/dev/null | head -1)
    if [ -z "$latest_db" ]; then
        log_alert "❌ No recent database backup found (older than $max_age_hours hours)"
        return 1
    fi
    
    # Check files backup  
    local latest_files=$(find "$BACKUP_DIR/files" -name "*.tar.gz" -mtime -1 2>/dev/null | head -1)
    if [ -z "$latest_files" ]; then
        log_alert "❌ No recent files backup found (older than $max_age_hours hours)"
        return 1
    fi
    
    log_alert "✅ Recent backups found - system healthy"
    return 0
}

# Check backup integrity
check_backup_integrity() {
    local failed=0
    
    # Test latest database backup
    local latest_db=$(ls -t "$BACKUP_DIR/database"/*.sql.gz 2>/dev/null | head -1)
    if [ -n "$latest_db" ] && ! gunzip -t "$latest_db" 2>/dev/null; then
        log_alert "❌ Latest database backup is corrupted: $(basename $latest_db)"
        ((failed++))
    fi
    
    # Test latest files backup
    local latest_files=$(ls -t "$BACKUP_DIR/files"/*.tar.gz 2>/dev/null | head -1)
    if [ -n "$latest_files" ] && ! tar -tzf "$latest_files" >/dev/null 2>&1; then
        log_alert "❌ Latest files backup is corrupted: $(basename $latest_files)"
        ((failed++))
    fi
    
    if [ $failed -eq 0 ]; then
        log_alert "✅ Backup integrity verified"
    fi
    
    return $failed
}

# Check disk space
check_disk_space() {
    local usage=$(df "$BACKUP_DIR" 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 85 ]; then
        log_alert "⚠️ Backup disk usage high: ${usage}% - cleanup recommended"
    elif [ "$usage" -gt 95 ]; then
        log_alert "❌ Backup disk usage critical: ${usage}% - immediate action required"
        return 1
    fi
    
    return 0
}

# Main monitoring function
main() {
    check_backup_freshness
    check_backup_integrity  
    check_disk_space
}

main "$@"
