#!/bin/bash
# Node_modules Optimizer - Reduce size and improve performance

echo "📦 Node_modules Optimization Tool"
echo "================================="
echo ""

# Check current size
CURRENT_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
echo "Current node_modules size: ${CURRENT_SIZE:-Not found}"
echo ""

# Function to clean and optimize
optimize_modules() {
    echo "🧹 Step 1: Removing unnecessary files..."
    
    # Remove documentation files
    find node_modules -name "*.md" -not -name "LICENSE*" -delete 2>/dev/null
    find node_modules -name "*.txt" -not -name "LICENSE*" -delete 2>/dev/null
    find node_modules -name "CHANGELOG*" -delete 2>/dev/null
    find node_modules -name "HISTORY*" -delete 2>/dev/null
    
    # Remove test files
    find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null
    find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null
    find node_modules -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null
    find node_modules -name "*.test.js" -delete 2>/dev/null
    find node_modules -name "*.spec.js" -delete 2>/dev/null
    
    # Remove source maps
    find node_modules -name "*.map" -delete 2>/dev/null
    
    # Remove TypeScript files if not needed
    find node_modules -name "*.ts" -not -name "*.d.ts" -delete 2>/dev/null
    
    # Remove example/demo directories
    find node_modules -name "example" -type d -exec rm -rf {} + 2>/dev/null
    find node_modules -name "examples" -type d -exec rm -rf {} + 2>/dev/null
    find node_modules -name "demo" -type d -exec rm -rf {} + 2>/dev/null
    
    echo "✅ Cleaned unnecessary files"
}

# Function to check for duplicates
check_duplicates() {
    echo ""
    echo "🔍 Step 2: Checking for duplicate packages..."
    
    # Use npm dedupe
    if command -v npm &> /dev/null; then
        npm dedupe
        echo "✅ Deduplication complete"
    fi
}

# Function to analyze large packages
analyze_large() {
    echo ""
    echo "📊 Step 3: Analyzing largest packages..."
    
    # Find top 10 largest packages
    echo "Top 10 largest packages:"
    du -sh node_modules/* 2>/dev/null | sort -hr | head -10
}

# Production-only install
production_install() {
    echo ""
    echo "🚀 Step 4: Production-only installation..."
    echo "Remove node_modules and reinstall with --production flag? (yes/no)"
    read -p "> " CONFIRM
    
    if [ "$CONFIRM" = "yes" ]; then
        rm -rf node_modules package-lock.json
        npm install --production
        echo "✅ Production dependencies installed"
    fi
}

# Create .npmrc for optimization
create_npmrc() {
    echo ""
    echo "⚙️  Step 5: Creating optimized .npmrc..."
    
    cat > .npmrc << 'EOF'
# Disable package lock for CI
package-lock=false

# Skip optional dependencies
omit=optional

# Don't install devDependencies in production
production=true

# Prefer offline cache
prefer-offline=true

# Reduce metadata
no-audit=true
no-fund=true

# Use pnpm-style hoisting (if using pnpm)
# shamefully-hoist=true
EOF
    
    echo "✅ .npmrc created with optimization settings"
}

# Main menu
echo "Choose optimization level:"
echo "1. Quick clean (remove docs, tests, maps)"
echo "2. Full optimization (dedupe + clean)"
echo "3. Nuclear option (production-only reinstall)"
echo "4. Analysis only"
echo ""
read -p "Select option (1-4): " OPTION

case $OPTION in
    1)
        optimize_modules
        ;;
    2)
        optimize_modules
        check_duplicates
        analyze_large
        ;;
    3)
        production_install
        create_npmrc
        ;;
    4)
        analyze_large
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

# Show results
echo ""
echo "📊 Results:"
echo "Before: ${CURRENT_SIZE:-Unknown}"
NEW_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
echo "After: ${NEW_SIZE:-Not found}"
echo ""

# Additional recommendations
echo "💡 Additional recommendations:"
echo "1. Use pnpm instead of npm (up to 50% space savings)"
echo "   npm install -g pnpm && pnpm import"
echo ""
echo "2. Use Yarn with PnP (Plug'n'Play - zero node_modules!)"
echo "   yarn set version berry && yarn install"
echo ""
echo "3. Add to .gitignore:"
echo "   echo 'node_modules/' >> .gitignore"
echo ""
echo "4. For deployment, use Docker multi-stage builds"
echo "5. Consider using CDN for large libraries"