#!/bin/bash
# CLAUDE.md Real-time Watcher
# Monitors file changes and alerts on violations

WATCH_DIR="/home/ittz/projects/itt/site/3t"
LOG_FILE="$WATCH_DIR/logs/claude-watcher.log"

echo "🔍 CLAUDE.md Watcher Started - $(date)" >> "$LOG_FILE"

# Function to check a file for violations
check_file() {
    local file="$1"
    local violations=""
    
    # Skip non-code files
    if [[ ! "$file" =~ \.(js|html|jsx|css)$ ]]; then
        return
    fi
    
    # Check for hardcoded prices
    if grep -q 'data-price=["'"'"']\?\$\?[0-9]\+\|price:\s*[0-9]\+' "$file" 2>/dev/null; then
        if [[ ! "$file" =~ (shared-config|pricing-booking)\.js$ ]]; then
            violations="${violations}HARDCODED_PRICE "
        fi
    fi
    
    # Check for new API calls without docs
    if grep -q 'fetch(' "$file" 2>/dev/null; then
        if ! grep -q '// Backend verified:' "$file" 2>/dev/null; then
            violations="${violations}UNVERIFIED_API "
        fi
    fi
    
    # Alert if violations found
    if [ ! -z "$violations" ]; then
        echo "❌ CLAUDE.md VIOLATION in $file: $violations" | tee -a "$LOG_FILE"
        
        # Show desktop notification if available
        if command -v notify-send &> /dev/null; then
            notify-send "CLAUDE.md Violation" "Violations in $file: $violations" -u critical
        fi
        
        # Play alert sound if available
        if [ -f /usr/share/sounds/freedesktop/stereo/dialog-error.oga ]; then
            paplay /usr/share/sounds/freedesktop/stereo/dialog-error.oga 2>/dev/null &
        fi
    fi
}

# Monitor file changes using inotifywait
if command -v inotifywait &> /dev/null; then
    echo "Monitoring $WATCH_DIR for CLAUDE.md violations..."
    
    inotifywait -mr --exclude '(node_modules|\.git|logs)' -e modify,create "$WATCH_DIR" |
    while read path action file; do
        if [[ "$action" =~ (MODIFY|CREATE) ]]; then
            check_file "$path$file"
        fi
    done
else
    echo "Error: inotifywait not found. Install with: sudo apt-get install inotify-tools"
    exit 1
fi