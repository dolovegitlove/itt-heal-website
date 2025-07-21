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
