#!/bin/bash
# Switch to pnpm - Save 50%+ disk space

echo "🚀 Switching to pnpm (Performant NPM)"
echo "===================================="
echo ""
echo "pnpm uses a global store and hard links = HUGE space savings!"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "Current setup:"
echo -n "node_modules size: "
du -sh node_modules 2>/dev/null | cut -f1 || echo "Not found"
echo ""

echo "🔄 Converting to pnpm..."
echo "This will:"
echo "  1. Import your package-lock.json"
echo "  2. Remove node_modules"
echo "  3. Install with pnpm (using global cache)"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

# Import existing lockfile
if [ -f "package-lock.json" ]; then
    echo "Importing package-lock.json..."
    pnpm import
fi

# Remove old node_modules
echo "Removing node_modules..."
rm -rf node_modules

# Install with pnpm
echo "Installing with pnpm..."
pnpm install

# Show results
echo ""
echo "✅ RESULTS:"
echo -n "New node_modules size: "
du -sh node_modules 2>/dev/null | cut -f1
echo -n "Global pnpm store: "
du -sh $(pnpm store path) 2>/dev/null | cut -f1

echo ""
echo "📊 Space saved by using hard links!"
echo ""
echo "🎯 New commands:"
echo "  pnpm install    (instead of npm install)"
echo "  pnpm add pkg    (instead of npm install pkg)"
echo "  pnpm run dev    (instead of npm run dev)"
echo ""
echo "💡 Pro tip: Add alias npm=pnpm to your .bashrc"