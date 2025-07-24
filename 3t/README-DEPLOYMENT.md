# 🚀 Claude Enforcement System - Universal Deployment Guide

## 📋 Overview

This system allows you to deploy the complete Claude enforcement system (CLAUDE.md, go.md, and all dependencies) to any server with a single command.

## 🎯 Quick Deployment (TL;DR)

### On your development server (this one):
```bash
# 1. Push to git
git add .
git commit -m "Add Claude enforcement system"
git push origin main

# 2. Get the deployment script URL
echo "Deployment script ready at: https://raw.githubusercontent.com/dolovegit/itt-heal-website/main/site/3t/DEPLOY-CLAUDE-SYSTEM.sh"
```

### On any new server:
```bash
# 1. Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/dolovegit/itt-heal-website/main/site/3t/DEPLOY-CLAUDE-SYSTEM.sh | sudo bash

# 2. Test the installation
claude status
```

That's it! The entire system will be deployed and running.

## 📦 What Gets Installed

### Core Files:
- `./claude` - Main enforcement command
- `./enforce` - Quick status checker  
- `./go.md` - Command documentation
- `CLAUDE.md` - Enforcement rules
- `INSTALL-CLAUDE-ENFORCEMENT.sh` - Local installer

### Scripts Directory:
- `scripts/claude-gatekeeper.js` - Main enforcement engine
- `scripts/claude-watcher.sh` - Real-time file watcher
- `scripts/claude-md-compliance-check.sh` - Compliance checker
- `scripts/setup-claude-automation.sh` - Automation setup

### System Integration:
- Git hooks (pre-commit, post-merge, pre-push)
- Systemd service for continuous monitoring
- Cron jobs for scheduled checks
- Global commands accessible from anywhere

## 🔧 Detailed Deployment Process

### Step 1: Prepare Your Repository

First, make sure all enforcement files are in your git repository:

```bash
# Check what files exist
ls -la claude* enforce* *.md scripts/claude*

# Add all enforcement files to git
git add claude enforce go.md CLAUDE.md INSTALL-CLAUDE-ENFORCEMENT.sh
git add scripts/claude-*.js scripts/claude-*.sh
git add DEPLOY-CLAUDE-SYSTEM.sh README-DEPLOYMENT.md

# Commit with descriptive message
git commit -m "Add complete Claude enforcement system

- Claude command interface
- Enforcement automation
- Documentation and deployment scripts
- System service integration
- Global deployment capability"

# Push to your repository
git push origin main
```

### Step 2: Deploy to New Servers

#### Method 1: Direct Script Execution (Recommended)
```bash
# On the new server (as root or with sudo)
curl -fsSL https://raw.githubusercontent.com/dolovegit/itt-heal-website/main/site/3t/DEPLOY-CLAUDE-SYSTEM.sh | sudo bash
```

#### Method 2: Download and Run
```bash
# Download the script
wget https://raw.githubusercontent.com/dolovegit/itt-heal-website/main/site/3t/DEPLOY-CLAUDE-SYSTEM.sh

# Make executable and run
chmod +x DEPLOY-CLAUDE-SYSTEM.sh
sudo ./DEPLOY-CLAUDE-SYSTEM.sh
```

#### Method 3: Manual Git Clone
```bash
# Clone the repository
git clone https://github.com/dolovegit/itt-heal-website.git
cd itt-heal-website/site/3t

# Run the deployment script
sudo ./DEPLOY-CLAUDE-SYSTEM.sh
```

## 🎛️ Post-Deployment Usage

### Global Commands (Available Everywhere):
```bash
# Quick status check from anywhere
claude-check

# Full claude interface from anywhere  
claude status
claude check
claude watch
claude fix
```

### Local Commands (In Project Directory):
```bash
# Navigate to your project
cd /path/to/your/project

# Initialize enforcement in this project
claude enforce

# Check local compliance
./claude check

# Watch for violations
./claude watch
```

### System Service Management:
```bash
# Check service status
sudo systemctl status claude-enforcement

# View real-time logs
sudo journalctl -u claude-enforcement -f

# Restart service
sudo systemctl restart claude-enforcement
```

## 🌐 Multi-Server Management

### Deploy to Multiple Servers:
```bash
# Create deployment script for multiple servers
cat > deploy-to-all-servers.sh << 'EOF'
#!/bin/bash

SERVERS=(
    "user@server1.example.com"
    "user@server2.example.com" 
    "user@server3.example.com"
)

DEPLOY_SCRIPT="https://raw.githubusercontent.com/dolovegit/itt-heal-website/main/site/3t/DEPLOY-CLAUDE-SYSTEM.sh"

for server in "${SERVERS[@]}"; do
    echo "🚀 Deploying to $server..."
    ssh "$server" "curl -fsSL $DEPLOY_SCRIPT | sudo bash"
    echo "✅ Deployment to $server completed"
    echo ""
done

echo "🎉 All servers deployed!"
EOF

chmod +x deploy-to-all-servers.sh
./deploy-to-all-servers.sh
```

### Health Check Across Servers:
```bash
# Check enforcement status on all servers
cat > check-all-servers.sh << 'EOF'
#!/bin/bash

SERVERS=(
    "user@server1.example.com"
    "user@server2.example.com"
    "user@server3.example.com"
)

for server in "${SERVERS[@]}"; do
    echo "🔍 Checking $server..."
    ssh "$server" "claude-check"
    echo ""
done
EOF

chmod +x check-all-servers.sh
./check-all-servers.sh
```

## 📊 System Requirements

### Minimum Requirements:
- **OS**: Ubuntu 18.04+, Debian 9+, CentOS 7+, RHEL 7+
- **Memory**: 512MB RAM minimum
- **Storage**: 100MB free space
- **Network**: Internet access for package installation
- **Privileges**: Root or sudo access

### Software Dependencies (Auto-installed):
- Git
- Node.js (14+ LTS)
- npm
- systemd
- cron

## 🛠️ Customization

### Custom Installation Directory:
Edit `DEPLOY-CLAUDE-SYSTEM.sh` and change:
```bash
INSTALL_DIR="/opt/claude-enforcement"  # Change this path
```

### Custom Repository URL:
Edit `DEPLOY-CLAUDE-SYSTEM.sh` and change:
```bash
REPO_URL="https://github.com/your-username/your-repo.git"
```

### Custom Service User:
Edit `DEPLOY-CLAUDE-SYSTEM.sh` and change:
```bash
SERVICE_USER="claude"  # Change this username
```

## 🚨 Troubleshooting

### Common Issues:

#### 1. Permission Denied
```bash
# Make sure you're running as root/sudo
sudo ./DEPLOY-CLAUDE-SYSTEM.sh
```

#### 2. Git Clone Fails
```bash
# Check internet connectivity
ping github.com

# Verify repository URL
curl -I https://github.com/dolovegit/itt-heal-website
```

#### 3. Node.js Version Too Old
```bash
# The script auto-updates Node.js, but if it fails:
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs
```

#### 4. Service Won't Start
```bash
# Check service logs
sudo journalctl -u claude-enforcement -n 50

# Check file permissions
sudo chown -R claude:claude /opt/claude-enforcement
```

### Manual Recovery:
```bash
# If deployment fails, you can manually recover:
cd /opt/claude-enforcement/site/3t
sudo ./INSTALL-CLAUDE-ENFORCEMENT.sh
```

## 🔄 Updates and Maintenance

### Update Enforcement System:
```bash
# On each server, pull latest changes
cd /opt/claude-enforcement
sudo git pull origin main
sudo systemctl restart claude-enforcement
```

### Automated Updates:
Add to crontab for automatic updates:
```bash
# Update weekly on Sundays at 2 AM
0 2 * * 0 cd /opt/claude-enforcement && git pull origin main && systemctl restart claude-enforcement
```

## 📞 Support

### Getting Help:
1. Check deployment logs: `cat /opt/claude-enforcement/site/3t/DEPLOYMENT-INFO.txt`
2. View service status: `sudo systemctl status claude-enforcement`
3. Check enforcement logs: `tail -f /opt/claude-enforcement/site/3t/logs/claude-watcher.log`

### Reporting Issues:
Create an issue in the repository with:
- Server OS and version
- Error messages from logs
- Output of `claude status`

---

## 🎯 Quick Reference Card

```bash
# DEPLOYMENT
curl -fsSL https://raw.githubusercontent.com/dolovegit/itt-heal-website/main/site/3t/DEPLOY-CLAUDE-SYSTEM.sh | sudo bash

# USAGE
claude-check          # Quick status
claude status         # Full status  
claude watch          # Monitor violations

# MANAGEMENT
sudo systemctl status claude-enforcement    # Service status
sudo journalctl -u claude-enforcement -f    # Live logs

# LOCATIONS
/opt/claude-enforcement/                     # Installation
/usr/local/bin/claude                       # Global command
/etc/systemd/system/claude-enforcement.service  # Service file
```

🚀 **Ready to deploy Claude enforcement to all your servers!**