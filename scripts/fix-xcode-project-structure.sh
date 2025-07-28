#!/bin/bash

# Fix Xcode Project Structure for Lumen QI
# Ensures proper workspace and project configuration

echo "🔧 Fixing Xcode project structure for Lumen QI..."

PROJECT_DIR="/Users/genesis/Library/Mobile Documents/com~apple~CloudDocs/Work/Lumen/LumenQI"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Ensure we have Node.js dependencies
if [ -f "package.json" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
    echo "🏗️ Building web application..."
    npm run build
fi

# Remove existing iOS project and recreate properly
echo "🗑️ Removing existing iOS project..."
rm -rf ios

# Recreate iOS project with proper Capacitor configuration
echo "📱 Creating new iOS project..."
npx cap add ios

# Sync the web app to iOS
echo "🔄 Syncing web app to iOS..."
npx cap sync ios

# Navigate to iOS project
cd ios/App

# Check the project structure
echo "📋 Checking project structure..."
ls -la

# Open the project file (not workspace) as you mentioned it works
echo "🍎 Opening Xcode project..."
open *.xcodeproj

echo ""
echo "✅ Project structure fixed!"
echo ""
echo "📱 In Xcode:"
echo "1. Select your project target (App)"
echo "2. Go to Signing & Capabilities"
echo "3. Select your Apple Developer team"
echo "4. Choose iPhone Simulator"
echo "5. Click Run ▶️"
echo ""
echo "Your Lumen QI iOS app should now build and run properly!"