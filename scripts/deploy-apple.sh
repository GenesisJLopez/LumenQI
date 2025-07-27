#!/bin/bash
# Apple Deployment Script for Lumen QI

set -e

echo "🍎 Building Lumen QI for Apple Ecosystem..."

# Load configuration
if [ -f "build/apple-config.env" ]; then
    source build/apple-config.env
else
    echo "❌ Apple configuration not found. Please configure build/apple-config.env"
    exit 1
fi

# Build the web app
echo "🔨 Building web application..."
npm run build

# Sync Capacitor
echo "📱 Syncing Capacitor..."
npx cap sync ios

# Build for Mac App Store
echo "🖥️ Building for Mac App Store..."
npm run electron:build -- --mac --publish=never

# Build for iOS
echo "📱 Building for iOS..."
cd ios/Lumen\ QI/
xcodebuild -workspace "Lumen QI.xcworkspace" -scheme "Lumen QI" -configuration Release -archivePath "build/Lumen QI.xcarchive" archive
xcodebuild -exportArchive -archivePath "build/Lumen QI.xcarchive" -exportPath "build/" -exportOptionsPlist "exportOptions.plist"

echo "✅ Apple builds completed successfully!"
echo "📦 Mac App: dist-electron/"
echo "📱 iOS App: ios/Lumen QI/build/"
