#!/bin/bash
# ONE-CLICK CLAUDE.md ENFORCEMENT INSTALLER
# Run this ONCE and CLAUDE.md becomes unstoppable

set -e

echo ""
echo "  ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗   ███╗   ███╗██████╗ "
echo " ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝   ████╗ ████║██╔══██╗"
echo " ██║     ██║     ███████║██║   ██║██║  ██║█████╗     ██╔████╔██║██║  ██║"
echo " ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝     ██║╚██╔╝██║██║  ██║"
echo " ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗██╗██║ ╚═╝ ██║██████╔╝"
echo "  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝╚═╝     ╚═╝╚═════╝ "
echo ""
echo "             ENFORCEMENT SYSTEM - MAKING VIOLATIONS IMPOSSIBLE"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ ERROR: CLAUDE.md not found in current directory!"
    echo "Please run this from your project root (where CLAUDE.md exists)"
    exit 1
fi

echo "📍 Installing CLAUDE.md enforcement in: $(pwd)"
echo ""
read -p "Continue with installation? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Installation cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting installation..."
echo ""

# Step 1: Check for required tools
echo "Checking requirements..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js first."
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git not found! Please install Git first."
    exit 1
fi

echo "✅ All requirements met"
echo ""

# Step 2: Create necessary directories
echo "Creating directories..."
mkdir -p scripts logs .vscode .git/hooks
echo "✅ Directories created"
echo ""

# Step 3: Download and install all components
echo "Installing enforcement components..."

# Check if scripts already exist
if [ ! -f "scripts/claude-gatekeeper.js" ]; then
    echo "❌ claude-gatekeeper.js not found! Run this after the gatekeeper is created."
    exit 1
fi

# Run the setup automation
if [ -f "scripts/setup-claude-automation.sh" ]; then
    echo "Running automated setup..."
    bash scripts/setup-claude-automation.sh
else
    echo "❌ setup-claude-automation.sh not found!"
    exit 1
fi

# Step 4: Create quick status check
cat > check-claude-status.sh << 'EOF'
#!/bin/bash
echo "🔒 CLAUDE.md Enforcement Status"
echo "=============================="
echo ""

# Check git hooks
echo -n "Git Hooks: "
if [ -f .git/hooks/pre-commit ]; then echo "✅ Installed"; else echo "❌ Missing"; fi

# Check systemd service
echo -n "Real-time Watcher: "
if systemctl is-active --quiet claude-watcher.service; then 
    echo "✅ Running"
else 
    echo "❌ Not running"
fi

# Check for recent violations
echo -n "Recent Violations: "
if [ -f logs/claude-watcher.log ]; then
    VIOLATIONS=$(grep "VIOLATION" logs/claude-watcher.log 2>/dev/null | tail -5 | wc -l)
    if [ "$VIOLATIONS" -eq 0 ]; then
        echo "✅ None"
    else
        echo "⚠️  $VIOLATIONS found"
    fi
else
    echo "No log file"
fi

# Run quick compliance check
echo ""
echo "Running compliance check..."
if node scripts/claude-gatekeeper.js > /dev/null 2>&1; then
    echo "✅ Current code is COMPLIANT"
else
    echo "❌ Current code has VIOLATIONS"
    echo "Run: node scripts/claude-gatekeeper.js"
fi
EOF

chmod +x check-claude-status.sh

# Step 5: Create uninstall script (just in case)
cat > UNINSTALL-CLAUDE-ENFORCEMENT.sh << 'EOF'
#!/bin/bash
echo "⚠️  This will remove CLAUDE.md enforcement. Are you sure?"
read -p "Type 'remove enforcement' to confirm: " CONFIRM
if [ "$CONFIRM" != "remove enforcement" ]; then
    echo "Uninstall cancelled."
    exit 0
fi

# Remove git hooks
rm -f .git/hooks/pre-commit .git/hooks/post-merge .git/hooks/pre-push

# Stop and remove systemd service
sudo systemctl stop claude-watcher.service 2>/dev/null
sudo systemctl disable claude-watcher.service 2>/dev/null
sudo rm -f /etc/systemd/system/claude-watcher.service
sudo rm -f /etc/systemd/system/claude-startup.service

# Remove cron jobs
crontab -l | grep -v "claude-gatekeeper" | grep -v "claude-daily-report" | crontab -

echo "❌ CLAUDE.md enforcement removed"
echo "⚠️  Your code is no longer protected!"
EOF

chmod +x UNINSTALL-CLAUDE-ENFORCEMENT.sh

# Final message
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🎉 CLAUDE.md ENFORCEMENT SUCCESSFULLY INSTALLED!      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🛡️  YOUR CODE IS NOW PROTECTED BY:"
echo ""
echo "  ✅ Pre-commit hooks     - Blocks bad commits"
echo "  ✅ Real-time watcher    - Monitors all file changes"
echo "  ✅ Deployment blocker   - Prevents bad deploys"
echo "  ✅ Scheduled checks     - Hourly compliance scans"
echo "  ✅ Daily reports        - 9 AM compliance summary"
echo "  ✅ CI/CD integration    - Automated PR checks"
echo "  ✅ System startup       - Auto-starts on boot"
echo ""
echo "📊 QUICK COMMANDS:"
echo ""
echo "  ./check-claude-status.sh     - Check enforcement status"
echo "  node scripts/claude-gatekeeper.js - Run manual check"
echo "  tail -f logs/claude-watcher.log   - Watch real-time logs"
echo "  sudo systemctl status claude-watcher - Service status"
echo ""
echo "🚨 TEST IT NOW:"
echo ""
echo "  Try creating a file with hardcoded price:"
echo "  echo 'const price = 100;' > test-violation.js"
echo "  git add test-violation.js && git commit -m 'test'"
echo ""
echo "  You should see: ❌ COMMIT BLOCKED!"
echo ""
echo "📝 To uninstall (not recommended):"
echo "  ./UNINSTALL-CLAUDE-ENFORCEMENT.sh"
echo ""
echo "🔒 CLAUDE.md is now FULLY AUTOMATED and UNSTOPPABLE!"
echo ""