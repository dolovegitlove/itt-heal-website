#!/bin/bash
# UNIVERSAL CLAUDE ENFORCEMENT SYSTEM DEPLOYMENT
# This script deploys the complete Claude enforcement system to ANY server

set -e

echo ""
echo "🌐 UNIVERSAL CLAUDE ENFORCEMENT SYSTEM DEPLOYMENT"
echo "=================================================="
echo ""
echo "This script will:"
echo "  ✅ Clone the enforcement system from git"
echo "  ✅ Install all dependencies"
echo "  ✅ Set up enforcement automation"
echo "  ✅ Configure system services"
echo "  ✅ Validate the installation"
echo ""

# Configuration
REPO_URL="https://github.com/dolovegit/itt-heal-website.git"
INSTALL_DIR="/opt/claude-enforcement"
SERVICE_USER="claude"

echo "📍 Target installation directory: $INSTALL_DIR"
echo "🔗 Repository URL: $REPO_URL"
echo ""

read -p "Continue with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Step 1: System requirements check
echo "1️⃣ Checking system requirements..."

# Check for root/sudo access
if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script must be run as root or with sudo"
    exit 1
fi

# Check OS
if ! command -v apt-get &> /dev/null && ! command -v yum &> /dev/null; then
    echo "❌ Unsupported OS. This script supports Ubuntu/Debian/CentOS/RHEL"
    exit 1
fi

echo "✅ System requirements met"
echo ""

# Step 2: Install dependencies
echo "2️⃣ Installing dependencies..."

# Detect package manager and install
if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    apt-get update
    apt-get install -y git nodejs npm curl wget systemd cron
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum update -y
    yum install -y git nodejs npm curl wget systemd cronie
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "⚠️ Node.js version is too old. Installing latest LTS..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt-get install -y nodejs || yum install -y nodejs
fi

echo "✅ Dependencies installed"
echo ""

# Step 3: Create service user
echo "3️⃣ Creating service user..."

if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$INSTALL_DIR" "$SERVICE_USER"
    echo "✅ Service user '$SERVICE_USER' created"
else
    echo "✅ Service user '$SERVICE_USER' already exists"
fi
echo ""

# Step 4: Clone repository
echo "4️⃣ Cloning enforcement system..."

# Remove existing installation if present
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️ Existing installation found. Backing up..."
    mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%Y%m%d-%H%M%S)"
fi

# Clone the repository
git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Navigate to the enforcement system location
if [ -d "site/3t" ]; then
    cd site/3t
    ENFORCEMENT_DIR="$INSTALL_DIR/site/3t"
else
    echo "❌ Could not find enforcement system in repository"
    exit 1
fi

echo "✅ Repository cloned to $ENFORCEMENT_DIR"
echo ""

# Step 5: Install npm dependencies
echo "5️⃣ Installing npm dependencies..."

if [ -f "package.json" ]; then
    npm install
    echo "✅ npm dependencies installed"
else
    # Create minimal package.json if not present
    cat > package.json << 'EOF'
{
  "name": "claude-enforcement",
  "version": "1.0.0",
  "description": "Claude.md enforcement system",
  "main": "scripts/claude-gatekeeper.js",
  "dependencies": {
    "puppeteer": "^21.0.0",
    "chokidar": "^3.5.0"
  },
  "scripts": {
    "test": "node scripts/claude-gatekeeper.js"
  }
}
EOF
    npm install
    echo "✅ Created package.json and installed dependencies"
fi
echo ""

# Step 6: Set up enforcement scripts
echo "6️⃣ Setting up enforcement scripts..."

# Make scripts executable
chmod +x claude enforce INSTALL-CLAUDE-ENFORCEMENT.sh
if [ -f "scripts/claude-gatekeeper.js" ]; then
    chmod +x scripts/claude-gatekeeper.js
fi

# Create logs directory
mkdir -p logs
chown -R "$SERVICE_USER:$SERVICE_USER" logs

echo "✅ Scripts configured"
echo ""

# Step 7: Install enforcement system
echo "7️⃣ Installing enforcement system..."

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    git init
    git config user.email "claude@enforcement.system"
    git config user.name "Claude Enforcement"
fi

# Run the enforcement installer
if [ -f "INSTALL-CLAUDE-ENFORCEMENT.sh" ]; then
    echo "yes" | bash INSTALL-CLAUDE-ENFORCEMENT.sh
else
    echo "❌ INSTALL-CLAUDE-ENFORCEMENT.sh not found"
    exit 1
fi

echo "✅ Enforcement system installed"
echo ""

# Step 8: Create systemd service
echo "8️⃣ Creating system service..."

cat > /etc/systemd/system/claude-enforcement.service << EOF
[Unit]
Description=Claude.md Enforcement System
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
User=$SERVICE_USER
WorkingDirectory=$ENFORCEMENT_DIR
ExecStart=/usr/bin/node scripts/claude-gatekeeper.js --daemon
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable claude-enforcement.service
systemctl start claude-enforcement.service

echo "✅ System service created and started"
echo ""

# Step 9: Set up global access
echo "9️⃣ Setting up global access..."

# Create global claude command
cat > /usr/local/bin/claude << EOF
#!/bin/bash
cd "$ENFORCEMENT_DIR"
./claude "\$@"
EOF
chmod +x /usr/local/bin/claude

# Create global enforcement check
cat > /usr/local/bin/claude-check << EOF
#!/bin/bash
cd "$ENFORCEMENT_DIR"
./enforce
EOF
chmod +x /usr/local/bin/claude-check

echo "✅ Global commands created: 'claude' and 'claude-check'"
echo ""

# Step 10: Set proper ownership
echo "🔐 Setting ownership and permissions..."

chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"

echo "✅ Ownership configured"
echo ""

# Step 11: Validation
echo "🔍 Validating installation..."

# Test enforcement system
cd "$ENFORCEMENT_DIR"
if ./claude status > /dev/null 2>&1; then
    echo "✅ Enforcement system is working"
else
    echo "⚠️ Enforcement system validation failed"
fi

# Test global commands
if command -v claude &> /dev/null; then
    echo "✅ Global 'claude' command available"
else
    echo "❌ Global 'claude' command failed"
fi

# Test service
if systemctl is-active --quiet claude-enforcement.service; then
    echo "✅ System service is running"
else
    echo "⚠️ System service is not running"
fi

echo ""

# Final message
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        🎉 CLAUDE ENFORCEMENT SYSTEM SUCCESSFULLY DEPLOYED!     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Installation Location: $ENFORCEMENT_DIR"
echo "👤 Service User: $SERVICE_USER"
echo ""
echo "🛠️ AVAILABLE COMMANDS:"
echo ""
echo "  Global Commands (from anywhere):"
echo "    claude           - Run claude enforcement commands"
echo "    claude-check     - Quick status check"
echo ""
echo "  Local Commands (in project directory):"
echo "    ./claude         - Full claude interface"
echo "    ./enforce        - Quick enforcement check"
echo ""
echo "🔧 SYSTEM MANAGEMENT:"
echo ""
echo "  Service Control:"
echo "    systemctl status claude-enforcement   - Check service status"
echo "    systemctl restart claude-enforcement  - Restart service"
echo "    systemctl stop claude-enforcement     - Stop service"
echo ""
echo "  Logs:"
echo "    journalctl -u claude-enforcement -f   - Follow service logs"
echo "    tail -f $ENFORCEMENT_DIR/logs/claude-watcher.log"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Navigate to your project directory"
echo "2. Run: claude status"
echo "3. Set up your CLAUDE.md file if not present"
echo "4. Test with: echo 'const price = 100;' > test.js && git add test.js"
echo ""
echo "🔒 Your server now has FULL CLAUDE.md ENFORCEMENT!"
echo ""

# Create deployment info file
cat > "$ENFORCEMENT_DIR/DEPLOYMENT-INFO.txt" << EOF
CLAUDE ENFORCEMENT SYSTEM DEPLOYMENT
===================================

Deployment Date: $(date)
Server: $(hostname)
Installation Directory: $ENFORCEMENT_DIR
Service User: $SERVICE_USER
Node.js Version: $(node --version)
Git Repository: $REPO_URL

Global Commands:
- claude
- claude-check

System Service:
- claude-enforcement.service

For support and updates, check the repository:
$REPO_URL
EOF

echo "📄 Deployment info saved to: $ENFORCEMENT_DIR/DEPLOYMENT-INFO.txt"
echo ""
echo "🎯 Deployment completed successfully!"