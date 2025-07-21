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
