#!/bin/bash

# Fix iOS Project Setup for Lumen QI
# Resolves CocoaPods and Capacitor configuration issues

echo "🔧 Fixing iOS project setup for Lumen QI..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the Lumen QI project root directory"
    echo "Navigate to your project folder first:"
    echo "cd '/Users/genesis/Library/Mobile Documents/com~apple~CloudDocs/Work/Lumen/LumenQI'"
    exit 1
fi

echo "📦 Step 1: Installing Node.js dependencies..."
npm install

echo "🏗️ Step 2: Building web application..."
npm run build

echo "📱 Step 3: Syncing Capacitor iOS project..."
npx cap sync ios

echo "🍎 Step 4: Installing CocoaPods dependencies..."
cd ios/App

# Check if Podfile exists
if [ ! -f "Podfile" ]; then
    echo "❌ Podfile not found. Regenerating iOS project..."
    cd ../..
    npx cap add ios
    npx cap sync ios
    cd ios/App
fi

# Install pods
if command -v pod >/dev/null 2>&1; then
    echo "Installing CocoaPods dependencies..."
    pod install
else
    echo "⚠️ CocoaPods not installed. Installing..."
    sudo gem install cocoapods
    pod install
fi

echo ""
echo "✅ iOS project setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Open Xcode with: open App.xcworkspace"
echo "2. Select your development team in Signing & Capabilities"
echo "3. Choose iPhone Simulator and click Run ▶️"
echo ""
echo "Your Lumen QI iOS app is ready for development and App Store submission!"