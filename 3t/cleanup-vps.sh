#!/bin/bash

echo "🧹 ITT Heal VPS Cleanup Script"
echo "=============================="
echo ""

# Function to show disk usage before and after
show_disk_usage() {
    echo "💾 Current disk usage:"
    df -h / | grep -E "Filesystem|/dev"
    echo ""
}

# Show initial disk usage
echo "📊 Initial disk usage:"
show_disk_usage

# 1. Clean PM2 logs (keep last 1000 lines)
echo "📝 Cleaning PM2 logs..."
if [ -d ~/.pm2/logs ]; then
    for log in ~/.pm2/logs/*.log; do
        if [ -f "$log" ]; then
            echo "  Truncating: $(basename $log)"
            tail -n 1000 "$log" > "$log.tmp" && mv "$log.tmp" "$log"
        fi
    done
    echo "  ✅ PM2 logs cleaned"
else
    echo "  ℹ️  No PM2 logs found"
fi
echo ""

# 2. Remove temporary files
echo "🗑️  Removing temporary files..."
find /home/ittz/projects/itt/site -type f \( -name "*.tmp" -o -name "*~" -o -name "*.swp" -o -name ".DS_Store" \) -delete 2>/dev/null
echo "  ✅ Temporary files removed"
echo ""

# 3. Clean up old log files (older than 7 days)
echo "📋 Removing old log files..."
find /home/ittz/projects/itt/site -name "*.log" -mtime +7 -delete 2>/dev/null
echo "  ✅ Old log files removed"
echo ""

# 4. Remove duplicate/unnecessary validation report files
echo "📊 Cleaning validation reports..."
find /home/ittz/projects/itt/site -name "validation-report*.json" -mtime +1 -delete 2>/dev/null
echo "  ✅ Old validation reports removed"
echo ""

# 5. Clean npm cache
echo "📦 Cleaning npm cache..."
npm cache clean --force 2>/dev/null
echo "  ✅ npm cache cleaned"
echo ""

# 6. Remove build artifacts
echo "🏗️  Cleaning build artifacts..."
find /home/ittz/projects/itt/site -name "dist" -type d -not -path "*/node_modules/*" | while read dir; do
    if [ -d "$dir" ] && [ "$(find "$dir" -mtime +7 | wc -l)" -gt 0 ]; then
        echo "  Removing old files in: $dir"
        find "$dir" -mtime +7 -delete
    fi
done
echo "  ✅ Old build artifacts cleaned"
echo ""

# 7. Clean package-lock files in subdirectories (keep main ones)
echo "🔒 Cleaning duplicate package-lock files..."
find /home/ittz/projects/itt/site -name "package-lock.json" -not -path "/home/ittz/projects/itt/site/package-lock.json" -not -path "/home/ittz/projects/itt/site/backend/package-lock.json" -delete 2>/dev/null
echo "  ✅ Duplicate package-lock files removed"
echo ""

# 8. Optional: Remove unused node_modules (commented out for safety)
echo "📦 Node modules analysis:"
echo "  Main site node_modules: $(du -sh /home/ittz/projects/itt/site/node_modules 2>/dev/null | cut -f1)"
echo "  Backend node_modules: $(du -sh /home/ittz/projects/itt/site/backend/node_modules 2>/dev/null | cut -f1)"
echo "  Total nested node_modules: $(find /home/ittz/projects/itt/site -name "node_modules" -type d | wc -l)"
echo ""
echo "  💡 To remove all nested node_modules (saves ~10MB), run:"
echo "     find /home/ittz/projects/itt/site -name 'node_modules' -type d -path '*/node_modules/*/node_modules' -exec rm -rf {} +"
echo ""

# Show final disk usage
echo "📊 Final disk usage:"
show_disk_usage

# Calculate space saved
echo "✅ Cleanup complete!"
echo ""
echo "💡 Additional cleanup options:"
echo "   - Clear browser cache files: rm -rf ~/.cache/*"
echo "   - Remove old kernel packages: sudo apt-get autoremove"
echo "   - Clean apt cache: sudo apt-get clean"
echo ""