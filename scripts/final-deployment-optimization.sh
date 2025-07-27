#!/bin/bash

# Final deployment optimization script
# This script prepares the most minimal possible container

echo "🚀 Final Deployment Optimization Starting..."

# Ensure we have a clean build
echo "📦 Building application..."
npm run build

# Calculate current build size
BUILD_SIZE=$(du -sh dist/ | cut -f1)
echo "📊 Current build size: $BUILD_SIZE"

# Create ultra-minimal directory for deployment
echo "🗂️  Creating deployment directory..."
rm -rf deploy-minimal/
mkdir -p deploy-minimal

# Copy only essential files
cp package-production.json deploy-minimal/package.json
cp package-lock.json deploy-minimal/
cp -r dist/ deploy-minimal/
cp Dockerfile deploy-minimal/
cp .dockerignore deploy-minimal/

# Create deployment summary
echo "📋 Deployment Summary:"
echo "- Total files copied: $(find deploy-minimal -type f | wc -l)"
echo "- Deployment size: $(du -sh deploy-minimal | cut -f1)"
echo "- Build artifacts: $(du -sh deploy-minimal/dist | cut -f1)"

# List what's included
echo "📄 Files included in deployment:"
find deploy-minimal -type f | sort

echo ""
echo "✅ Final optimization complete!"
echo "🐳 Ready for ultra-minimal Docker deployment"
echo "📁 Deployment files are in: deploy-minimal/"
echo ""
echo "Expected container size: < 100MB (down from 8+ GiB)"