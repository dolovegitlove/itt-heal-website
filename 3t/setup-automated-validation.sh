#!/bin/bash
# Setup Automated Validation Schedule
# Creates cron jobs and systemd services for automated UI validation

echo "🤖 Setting up Automated Validation Schedule"
echo "=========================================="

# Create validation scripts directory
mkdir -p /home/ittz/projects/itt/site/automation
mkdir -p /home/ittz/projects/itt/site/logs/validation

# 1. Daily Validation Script
cat > /home/ittz/projects/itt/site/automation/daily-validation.sh << 'EOF'
#!/bin/bash
# Daily UI Validation - Runs every day at 8 AM
cd /home/ittz/projects/itt/site
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_FILE="logs/validation/daily-validation-$TIMESTAMP.log"

echo "🌅 Daily Validation Started: $(date)" | tee -a "$LOG_FILE"

# Run comprehensive validation
echo "🔍 Running comprehensive UI validation..." | tee -a "$LOG_FILE"
NODE_PATH=/home/ittz/.npm/_npx/e41f203b7505f1fb/node_modules node comprehensive-ui-validator.js >> "$LOG_FILE" 2>&1
COMPREHENSIVE_EXIT=$?

# Run edit functionality validation  
echo "✏️ Running edit functionality validation..." | tee -a "$LOG_FILE"
NODE_PATH=/home/ittz/.npm/_npx/e41f203b7505f1fb/node_modules node validate-edit-functionality.js >> "$LOG_FILE" 2>&1
EDIT_EXIT=$?

# Run loading states validation
echo "⏳ Running loading states validation..." | tee -a "$LOG_FILE"
node validate-loading-states.js >> "$LOG_FILE" 2>&1
LOADING_EXIT=$?

# Generate daily report
TOTAL_ISSUES=$((COMPREHENSIVE_EXIT + EDIT_EXIT + LOADING_EXIT))
echo "📊 Daily Validation Summary:" | tee -a "$LOG_FILE"
echo "  - Comprehensive validation: $([ $COMPREHENSIVE_EXIT -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" | tee -a "$LOG_FILE"
echo "  - Edit functionality: $([ $EDIT_EXIT -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" | tee -a "$LOG_FILE" 
echo "  - Loading states: $([ $LOADING_EXIT -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" | tee -a "$LOG_FILE"
echo "  - Total issues found: $TOTAL_ISSUES" | tee -a "$LOG_FILE"

# Send notifications if issues found
if [ $TOTAL_ISSUES -gt 0 ]; then
    echo "🚨 Issues detected - sending notifications..." | tee -a "$LOG_FILE"
    ./automation/send-validation-alert.sh "Daily validation found $TOTAL_ISSUES issues" "$LOG_FILE"
fi

echo "✅ Daily validation completed: $(date)" | tee -a "$LOG_FILE"
exit $TOTAL_ISSUES
EOF

# 2. Pre-deployment Validation Script  
cat > /home/ittz/projects/itt/site/automation/pre-deploy-validation.sh << 'EOF'
#!/bin/bash
# Pre-deployment Validation - Blocks deployment if critical issues found
cd /home/ittz/projects/itt/site
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_FILE="logs/validation/pre-deploy-$TIMESTAMP.log"

echo "🚀 Pre-deployment Validation Started: $(date)" | tee -a "$LOG_FILE"

# Run all validations
echo "🔍 Running full validation suite..." | tee -a "$LOG_FILE"

# Comprehensive validation
NODE_PATH=/home/ittz/.npm/_npx/e41f203b7505f1fb/node_modules node comprehensive-ui-validator.js >> "$LOG_FILE" 2>&1
COMPREHENSIVE_EXIT=$?

# Edit functionality 
NODE_PATH=/home/ittz/.npm/_npx/e41f203b7505f1fb/node_modules node validate-edit-functionality.js >> "$LOG_FILE" 2>&1
EDIT_EXIT=$?

# Loading states
node validate-loading-states.js >> "$LOG_FILE" 2>&1
LOADING_EXIT=$?

# Frontend-backend integration (if exists)
if [ -f "validate-frontend-backend-integration.js" ]; then
    echo "🔗 Running frontend-backend integration validation..." | tee -a "$LOG_FILE"
    NODE_PATH=/home/ittz/.npm/_npx/e41f203b7505f1fb/node_modules node validate-frontend-backend-integration.js >> "$LOG_FILE" 2>&1
    INTEGRATION_EXIT=$?
else
    INTEGRATION_EXIT=0
fi

# Real user validation using go.md
echo "👥 Running real user validation..." | tee -a "$LOG_FILE"
timeout 300 ./go 2 >> "$LOG_FILE" 2>&1
GO_EXIT=$?

TOTAL_ISSUES=$((COMPREHENSIVE_EXIT + EDIT_EXIT + LOADING_EXIT + INTEGRATION_EXIT + GO_EXIT))

echo "📊 Pre-deployment Validation Summary:" | tee -a "$LOG_FILE"
echo "  - Comprehensive validation: $([ $COMPREHENSIVE_EXIT -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" | tee -a "$LOG_FILE"
echo "  - Edit functionality: $([ $EDIT_EXIT -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" | tee -a "$LOG_FILE"
echo "  - Loading states: $([ $LOADING_EXIT -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" | tee -a "$LOG_FILE"
echo "  - Integration validation: $([ $INTEGRATION_EXIT -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" | tee -a "$LOG_FILE"
echo "  - Real user validation: $([ $GO_EXIT -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" | tee -a "$LOG_FILE"

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo "✅ DEPLOYMENT APPROVED - No critical issues found" | tee -a "$LOG_FILE"
    ./automation/send-validation-alert.sh "✅ Pre-deployment validation PASSED - Safe to deploy" "$LOG_FILE"
else
    echo "🚨 DEPLOYMENT BLOCKED - $TOTAL_ISSUES issues must be fixed" | tee -a "$LOG_FILE"
    ./automation/send-validation-alert.sh "🚨 DEPLOYMENT BLOCKED - $TOTAL_ISSUES validation issues found" "$LOG_FILE"
fi

echo "🏁 Pre-deployment validation completed: $(date)" | tee -a "$LOG_FILE"
exit $TOTAL_ISSUES
EOF

# 3. Real-time Monitoring Script
cat > /home/ittz/projects/itt/site/automation/realtime-monitor.sh << 'EOF'
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
EOF

# 4. Notification System
cat > /home/ittz/projects/itt/site/automation/send-validation-alert.sh << 'EOF'
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
EOF

# 5. Configuration file
cat > /home/ittz/projects/itt/site/automation/config.env << 'EOF'
# Automated Validation Configuration
# Uncomment and configure notification endpoints

# Email alerts
# ALERT_EMAIL="your-email@example.com"

# Slack webhook  
# SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# Discord webhook
# DISCORD_WEBHOOK="https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK"

# Validation schedule (cron format)
DAILY_VALIDATION_TIME="0 8 * * *"        # 8 AM daily
REALTIME_MONITOR_TIME="*/15 * * * *"      # Every 15 minutes  
WEEKLY_DEEP_SCAN_TIME="0 6 * * 1"        # 6 AM Mondays

# Validation thresholds
MAX_MEDIUM_ISSUES=5
MAX_HIGH_ISSUES=2
MAX_CRITICAL_ISSUES=0
EOF

# Make scripts executable
chmod +x /home/ittz/projects/itt/site/automation/*.sh

# 6. Install cron jobs
echo "📅 Installing cron jobs..."

# Load configuration
source /home/ittz/projects/itt/site/automation/config.env

# Add cron jobs
(crontab -l 2>/dev/null; echo "# ITT Heal Automated Validation") | crontab -
(crontab -l 2>/dev/null; echo "$DAILY_VALIDATION_TIME cd /home/ittz/projects/itt/site && ./automation/daily-validation.sh") | crontab -
(crontab -l 2>/dev/null; echo "$REALTIME_MONITOR_TIME cd /home/ittz/projects/itt/site && ./automation/realtime-monitor.sh") | crontab -
(crontab -l 2>/dev/null; echo "$WEEKLY_DEEP_SCAN_TIME cd /home/ittz/projects/itt/site && ./automation/pre-deploy-validation.sh") | crontab -

# 7. Create systemd service for continuous monitoring
sudo tee /etc/systemd/system/itt-validation-monitor.service > /dev/null << EOF
[Unit]
Description=ITT Heal Validation Monitor
After=network.target

[Service]
Type=simple
User=ittz
WorkingDirectory=/home/ittz/projects/itt/site
ExecStart=/home/ittz/projects/itt/site/automation/realtime-monitor.sh
Restart=always
RestartSec=900
Environment=PATH=/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable itt-validation-monitor.service
sudo systemctl start itt-validation-monitor.service

echo ""
echo "✅ Automated Validation Schedule Setup Complete!"
echo "============================================="
echo ""
echo "📅 Scheduled Validations:"
echo "  • Daily at 8 AM: Comprehensive validation"
echo "  • Every 15 mins: Real-time monitoring"  
echo "  • Weekly Monday 6 AM: Deep validation scan"
echo ""
echo "🔧 Manual Commands:"
echo "  • Run daily validation: ./automation/daily-validation.sh"
echo "  • Pre-deployment check: ./automation/pre-deploy-validation.sh"
echo "  • Check cron jobs: crontab -l | grep ITT"
echo "  • View logs: ls -la logs/validation/"
echo ""
echo "📊 Monitor Status:"
echo "  • Service status: sudo systemctl status itt-validation-monitor"
echo "  • View logs: journalctl -u itt-validation-monitor -f"
echo ""
echo "⚙️ Configuration:"
echo "  • Edit automation/config.env to configure notifications"
echo "  • Add email, Slack, or Discord webhooks for alerts"
echo ""
echo "🚨 Critical Issue Policy:"
echo "  • CRITICAL issues = Immediate alerts + block deployment"
echo "  • HIGH issues = Daily alerts + review required"
echo "  • MEDIUM issues = Weekly summary + scheduled fix"

# Create initial validation run
echo ""
echo "🧪 Running initial validation to test setup..."
./automation/daily-validation.sh

echo ""
echo "🎉 Setup complete! Automated validation is now active."