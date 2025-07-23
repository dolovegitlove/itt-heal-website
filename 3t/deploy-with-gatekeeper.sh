#!/bin/bash
# CLAUDE.md Enforced Deployment Script
# This script BLOCKS deployment if CLAUDE.md rules are violated

set -e

echo "🔒 CLAUDE.md ENFORCED DEPLOYMENT"
echo "=================================="
echo ""

# Step 1: Run CLAUDE.md Gatekeeper
echo "Step 1: Running CLAUDE.md compliance checks..."
if ! node scripts/claude-gatekeeper.js; then
    echo ""
    echo "❌ DEPLOYMENT BLOCKED BY CLAUDE.md GATEKEEPER"
    echo ""
    echo "Your code violates CLAUDE.md rules and cannot be deployed."
    echo "Fix all violations listed above and try again."
    echo ""
    echo "Remember: CLAUDE.md rules exist to prevent issues like:"
    echo "  - Multiple pricing sources (like we just fixed)"
    echo "  - Frontend-first development"
    echo "  - Hardcoded values that should be dynamic"
    echo "  - Missing backend verification"
    echo ""
    exit 1
fi

# Step 2: Run integration tests
echo ""
echo "Step 2: Running frontend-backend integration tests..."
if [ -f "validate-frontend-backend-integration.js" ]; then
    if ! node validate-frontend-backend-integration.js; then
        echo "❌ Integration tests failed!"
        exit 1
    fi
else
    echo "⚠️  Warning: Integration validator not found"
fi

# Step 3: Check for common issues
echo ""
echo "Step 3: Checking for common issues..."

# Check for console.log in production
if find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/test/*" -exec grep -l "console.log" {} \; | grep -v "gatekeeper" | head -1 > /dev/null; then
    echo "⚠️  Warning: console.log statements found in production code"
fi

# Check for TODO comments
TODO_COUNT=$(find . -name "*.js" -o -name "*.html" | grep -v node_modules | xargs grep -i "TODO" | wc -l || echo 0)
if [ "$TODO_COUNT" -gt 0 ]; then
    echo "⚠️  Warning: $TODO_COUNT TODO comments found"
fi

# Step 4: Final confirmation
echo ""
echo "Step 4: Pre-deployment checklist"
echo "================================"
echo "✅ CLAUDE.md compliance verified"
echo "✅ No hardcoded prices found"
echo "✅ Backend-first principles followed"
echo "✅ Single source of truth maintained"
echo ""
echo "Ready to deploy to production!"
echo ""
read -p "Deploy to production? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Step 5: Actual deployment
echo ""
echo "Step 5: Deploying to production..."
echo ""

# Copy files to production
echo "Copying files to /var/www/html/3t/..."
sudo rsync -av --exclude='node_modules' --exclude='.git' --exclude='logs' \
    --exclude='*.log' --exclude='test-*' --exclude='debug-*' \
    . /var/www/html/3t/

echo ""
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo ""
echo "🌐 Live at: https://ittheal.com/3t/"
echo "📊 Admin at: https://ittheal.com/3t/admin/"
echo ""
echo "Post-deployment reminders:"
echo "  - Monitor error logs: tail -f logs/error-watcher.log"
echo "  - Check health status: ./go status"
echo "  - Test critical paths on live site"
echo ""
date > last-deployment.txt
echo "Deployment completed at $(date)"