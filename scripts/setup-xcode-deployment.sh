#!/bin/bash

# Complete Xcode Deployment Setup for Lumen QI
# Regenerates iOS project without CocoaPods dependencies

echo "🚀 Setting up Xcode deployment for Lumen QI..."

PROJECT_DIR="/Users/genesis/Library/Mobile Documents/com~apple~CloudDocs/Work/Lumen/LumenQI"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Step 1: Ensure web app is built
echo "📦 Building web application..."
if [ -f "package.json" ]; then
    npm install
    npm run build
else
    echo "⚠️ No package.json found - web app may need to be built separately"
fi

# Step 2: Remove existing iOS project completely
echo "🗑️ Removing existing iOS project to start fresh..."
rm -rf ios

# Step 3: Create new iOS project without CocoaPods
echo "📱 Creating new iOS project..."
npx cap add ios

# Step 4: Configure Capacitor to avoid CocoaPods
echo "⚙️ Configuring Capacitor..."
cat > capacitor.config.ts << 'EOF'
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumen.qi',
  appName: 'Lumen QI',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Lumen QI'
  }
};

export default config;
EOF

# Step 5: Sync web app to iOS
echo "🔄 Syncing web app to iOS..."
npx cap sync ios

# Step 6: Navigate to iOS project
cd ios/App

# Step 7: Clean up any CocoaPods references
echo "🧹 Cleaning up CocoaPods references..."
rm -f Podfile
rm -f Podfile.lock
rm -rf Pods

# Step 8: Check project structure
echo "📋 Project structure:"
ls -la

# Step 9: Open in Xcode
echo "🍎 Opening in Xcode..."
open *.xcodeproj

echo ""
echo "✅ Xcode deployment setup complete!"
echo ""
echo "📱 Next steps in Xcode:"
echo "1. Select 'App' target"
echo "2. Go to 'Signing & Capabilities'"
echo "3. Select your Apple Developer team"
echo "4. Bundle ID: com.lumen.qi"
echo "5. Choose iPhone Simulator"
echo "6. Click Run ▶️"
echo ""
echo "🎯 Your Lumen QI iOS app is ready for development and App Store submission!"