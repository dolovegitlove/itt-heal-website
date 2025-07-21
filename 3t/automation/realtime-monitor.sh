#!/bin/bash
# Real-time UI Health Monitoring - Runs every 15 minutes
cd /home/ittz/projects/itt/site
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_FILE="logs/validation/monitor-$TIMESTAMP.log"

# Quick health check
echo "💓 Real-time Monitor: $(date)" >> "$LOG_FILE"

# Check if site is accessible
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ittheal.com)
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ittheal.com/admin)

echo "🌐 Site status: $SITE_STATUS" >> "$LOG_FILE"
echo "🔧 Admin status: $ADMIN_STATUS" >> "$LOG_FILE"

# Alert on critical failures
if [ "$SITE_STATUS" != "200" ] || [ "$ADMIN_STATUS" != "200" ]; then
    echo "🚨 Site accessibility issue detected!" >> "$LOG_FILE"
    ./automation/send-validation-alert.sh "🚨 Site Down - Main: $SITE_STATUS, Admin: $ADMIN_STATUS" "$LOG_FILE"
fi

# Quick edit functionality check (every hour)
MINUTE=$(date +%M)
if [ "$MINUTE" = "00" ]; then
    echo "⚡ Running hourly edit functionality check..." >> "$LOG_FILE"
    NODE_PATH=/home/ittz/.npm/_npx/e41f203b7505f1fb/node_modules timeout 120 node validate-edit-functionality.js >> "$LOG_FILE" 2>&1
    if [ $? -ne 0 ]; then
        ./automation/send-validation-alert.sh "⚠️ Hourly edit check failed" "$LOG_FILE"
    fi
fi

echo "✅ Monitor check completed: $(date)" >> "$LOG_FILE"
