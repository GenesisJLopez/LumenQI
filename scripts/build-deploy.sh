#!/bin/bash

# Deployment build optimization script for Lumen
# This script prepares the project for optimal deployment size

set -e

echo "🚀 Starting deployment build optimization..."

# 1. Clean up development files
echo "🧹 Cleaning up development files..."
rm -rf node_modules/.cache
rm -rf dist
rm -rf .vite
rm -f *.log

# 2. Run our optimization script
echo "📦 Running asset optimization..."
node scripts/optimize-build.js

# 3. Build the application
echo "🔨 Building application..."
npm run build

# 4. Optimize built assets
echo "⚡ Optimizing built assets..."
if [ -d "dist/public/assets" ]; then
  # List large files for information
  find dist/public/assets -type f -size +500k -exec ls -lh {} \; | while read line; do
    echo "⚠️  Large asset: $line"
  done
  
  # Remove source maps in production (if any)
  find dist/public/assets -name "*.map" -delete 2>/dev/null || true
fi

# 5. Show final size
echo "📊 Final build size:"
du -sh dist/ 2>/dev/null || echo "dist directory not found"
du -sh . --exclude=node_modules --exclude=.git 2>/dev/null || echo "Unable to calculate total size"

echo "✅ Deployment build optimization completed!"