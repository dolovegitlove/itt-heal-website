#!/bin/bash
# Integration with go.md workflow
# Adds automated validation to existing go.md commands

echo "🔗 Integrating Automated Validation with go.md"
echo "============================================"

# Create enhanced go script that includes validation
cat > /home/ittz/projects/itt/site/go-with-validation << 'EOF'
#!/bin/bash
# Enhanced go.md with automated validation integration

# Load validation config
if [ -f "automation/config.env" ]; then
    source automation/config.env
fi

OPTION="$1"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

echo "🚀 ITT Heal Enhanced Workflow - Option $OPTION"
echo "============================================="

# Pre-execution validation for critical operations
if [ "$OPTION" = "5" ] || [ "$OPTION" = "deploy" ]; then
    echo "🛡️ Running pre-deployment validation..."
    if ! ./automation/pre-deploy-validation.sh; then
        echo ""
        echo "🚨 DEPLOYMENT BLOCKED!"
        echo "Critical issues found that must be fixed before deployment."
        echo "Check logs/validation/ for details."
        echo ""
        echo "To force deployment (not recommended):"
        echo "  export FORCE_DEPLOY=true && ./go 5"
        echo ""
        exit 1
    fi
    echo "✅ Pre-deployment validation passed"
    echo ""
fi

# Run original go.md logic
case $OPTION in
    1)
        echo "🔧 Auto-fix with enhanced validation..."
        # Run original go 1 logic + validation
        ./go 1
        GO_EXIT=$?
        
        # Post-fix validation
        echo "🔍 Running post-fix validation..."
        ./automation/daily-validation.sh
        
        if [ $? -eq 0 ]; then
            echo "✅ All validations passed after auto-fix"
        else
            echo "⚠️ Some issues remain after auto-fix - check logs"
        fi
        ;;
        
    2)
        echo "👥 Real user validation with monitoring..."
        # Run original go 2 + enhanced monitoring
        ./go 2
        GO_EXIT=$?
        
        # Real-time validation check
        ./automation/realtime-monitor.sh
        ;;
        
    3)
        echo "📊 Schema check with validation..."
        ./go 3
        GO_EXIT=$?
        
        # Run loading states validation (relevant to schema changes)
        node validate-loading-states.js
        ;;
        
    4)
        echo "🏛️ Legacy validation with comprehensive checks..."
        ./go 4
        GO_EXIT=$?
        
        # Run full validation suite
        NODE_PATH=/home/ittz/.npm/_npx/e41f203b7505f1fb/node_modules node comprehensive-ui-validator.js
        ;;
        
    5|deploy)
        echo "🚀 Production deployment with monitoring..."
        
        if [ "$FORCE_DEPLOY" != "true" ]; then
            # Already validated above, proceed with deployment
            ./go 5
            GO_EXIT=$?
        else
            echo "⚠️ FORCED DEPLOYMENT - skipping validation"
            ./go 5
            GO_EXIT=$?
        fi
        
        # Post-deployment monitoring
        if [ $GO_EXIT -eq 0 ]; then
            echo "📊 Starting post-deployment monitoring..."
            sleep 30  # Wait for deployment to settle
            ./automation/realtime-monitor.sh
            
            # Schedule intensive monitoring for next 2 hours
            echo "⏰ Scheduling intensive post-deploy monitoring..."
            (
                for i in {1..8}; do
                    sleep 900  # 15 minutes
                    ./automation/realtime-monitor.sh
                done
            ) &
        fi
        ;;
        
    "validate"|"validation")
        echo "🔍 Manual validation run..."
        ./automation/daily-validation.sh
        ;;
        
    "monitor")
        echo "📊 Real-time monitoring check..."
        ./automation/realtime-monitor.sh
        ;;
        
    "status"|"health")
        echo "💓 System health status..."
        echo ""
        echo "📅 Cron Jobs:"
        crontab -l | grep ITT || echo "  No validation cron jobs found"
        
        echo ""
        echo "🔧 Validation Service:"
        sudo systemctl status itt-validation-monitor --no-pager || echo "  Service not running"
        
        echo ""
        echo "📊 Recent Validation Logs:"
        ls -la logs/validation/ | tail -5 || echo "  No validation logs found"
        
        echo ""
        echo "🌐 Site Status:"
        SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ittheal.com)
        ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ittheal.com/admin)
        echo "  Main site: $SITE_STATUS"
        echo "  Admin panel: $ADMIN_STATUS"
        ;;
        
    "config")
        echo "⚙️ Validation Configuration:"
        echo ""
        if [ -f "automation/config.env" ]; then
            echo "📝 Current config (automation/config.env):"
            cat automation/config.env | grep -v "^#" | grep -v "^$"
        else
            echo "❌ No config file found"
        fi
        
        echo ""
        echo "🔧 To configure notifications:"
        echo "  1. Edit automation/config.env"
        echo "  2. Add email, Slack, or Discord webhooks"
        echo "  3. Reload with: source automation/config.env"
        ;;
        
    "logs")
        echo "📊 Recent Validation Logs:"
        echo ""
        if [ -d "logs/validation" ]; then
            echo "📅 Latest logs:"
            ls -la logs/validation/ | tail -10
            echo ""
            echo "📖 To view latest log:"
            LATEST_LOG=$(ls -t logs/validation/*.log 2>/dev/null | head -1)
            if [ -n "$LATEST_LOG" ]; then
                echo "  tail -f $LATEST_LOG"
            fi
        else
            echo "❌ No validation logs directory found"
        fi
        ;;
        
    *)
        echo "🤖 Enhanced go.md with Automated Validation"
        echo ""
        echo "Original options (with enhanced validation):"
        echo "  ./go 1  - Auto-fix with post-fix validation"
        echo "  ./go 2  - User validation with monitoring"
        echo "  ./go 3  - Schema check with validation"
        echo "  ./go 4  - Legacy validation with comprehensive checks"
        echo "  ./go 5  - Production deployment (with pre/post validation)"
        echo ""
        echo "New validation options:"
        echo "  ./go validate  - Run manual validation"
        echo "  ./go monitor   - Real-time monitoring check"
        echo "  ./go status    - Show system health status"
        echo "  ./go config    - Show/configure validation settings"
        echo "  ./go logs      - View recent validation logs"
        echo ""
        echo "📅 Automated Schedule:"
        echo "  • Daily 8 AM: Comprehensive validation"
        echo "  • Every 15 min: Real-time monitoring"
        echo "  • Weekly Monday 6 AM: Deep validation"
        echo ""
        echo "🚨 Emergency commands:"
        echo "  FORCE_DEPLOY=true ./go 5  - Force deploy (skip validation)"
        echo "  sudo systemctl restart itt-validation-monitor  - Restart monitoring"
        ;;
esac

echo ""
echo "✅ Enhanced go.md execution completed"
EOF

# Make executable
chmod +x /home/ittz/projects/itt/site/go-with-validation

# Create backup of original go script
if [ -f "go" ]; then
    cp go go.original
    echo "💾 Backed up original go script to go.original"
fi

# Replace go script with enhanced version
cp go-with-validation go
echo "🔄 Replaced go script with validation-enhanced version"

echo ""
echo "✅ Integration Complete!"
echo "======================"
echo ""
echo "🔧 Enhanced go.md commands now include:"
echo "  • Pre-deployment validation (blocks ./go 5 if issues found)"
echo "  • Post-execution validation checks"
echo "  • Real-time monitoring integration"
echo "  • New validation-specific commands"
echo ""
echo "📝 New commands available:"
echo "  ./go validate  - Manual validation"
echo "  ./go monitor   - Check system health"
echo "  ./go status    - Show validation status"
echo "  ./go logs      - View validation logs"
echo ""
echo "🚨 Safety features:"
echo "  • Deployment blocked if critical issues found"
echo "  • Intensive monitoring after deployments"
echo "  • Automatic alerts on failures"
echo ""
echo "🎯 Try it now:"
echo "  ./go status    # Check current health"
echo "  ./go validate  # Run manual validation"
EOF

chmod +x /home/ittz/projects/itt/site/automation/integrate-with-go.sh