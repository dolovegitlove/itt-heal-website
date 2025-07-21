#!/bin/bash
# Send validation alerts via multiple channels
MESSAGE="$1"
LOG_FILE="$2"

echo "📢 Sending alert: $MESSAGE"

# Log to system
logger "ITT-Validation: $MESSAGE"

# Email notification (if configured)
if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
    echo "Validation Alert: $MESSAGE" | mail -s "ITT Heal Validation Alert" "$ALERT_EMAIL"
fi

# Slack notification (if webhook configured)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🤖 ITT Heal Validation Alert: $MESSAGE\"}" \
        "$SLACK_WEBHOOK" 2>/dev/null
fi

# Discord notification (if webhook configured)  
if [ -n "$DISCORD_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"content\":\"🤖 ITT Heal Validation Alert: $MESSAGE\"}" \
        "$DISCORD_WEBHOOK" 2>/dev/null
fi

# Local desktop notification
if command -v notify-send &> /dev/null; then
    notify-send "ITT Validation" "$MESSAGE"
fi

echo "📨 Alert sent via available channels"
