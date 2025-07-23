#!/bin/bash
# Revert from pnpm back to npm

echo "🔄 Reverting from pnpm to npm"
echo "============================="
echo ""

echo "Current setup:"
echo -n "node_modules size: "
du -sh node_modules 2>/dev/null | cut -f1

echo -n "pnpm global store: "
du -sh $(pnpm store path) 2>/dev/null | cut -f1

echo ""
echo "Converting back to npm..."
echo "This will:"
echo "  1. Export dependencies from pnpm-lock.yaml"
echo "  2. Remove node_modules"
echo "  3. Remove pnpm-lock.yaml"
echo "  4. Install with npm"
echo ""

read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

# Remove pnpm files
echo "Removing pnpm files..."
rm -rf node_modules
rm -f pnpm-lock.yaml

# Install with npm
echo "Installing with npm..."
npm install

echo ""
echo "✅ Reverted to npm!"
echo -n "New node_modules size: "
du -sh node_modules 2>/dev/null | cut -f1

echo ""
echo "🎯 Back to simple npm commands:"
echo "  npm install"
echo "  npm run dev"
echo "  npm add package"