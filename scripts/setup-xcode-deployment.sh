#!/bin/bash

# Complete Xcode Setup Script for Lumen QI App Store Deployment
# This script prepares your project for transfer to Xcode and App Store submission

echo "🍎 Setting up Lumen QI for Xcode and App Store deployment..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the Lumen QI project root directory"
    exit 1
fi

echo "📦 Step 1: Building web assets for iOS..."
npm run build

echo "📱 Step 2: Syncing Capacitor iOS project..."
npx cap sync ios

echo "🔧 Step 3: Setting up iOS project structure..."
cd ios

# Create iOS-specific .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
# Xcode
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata/
*.xccheckout
*.moved-aside
DerivedData
*.hmap
*.ipa
*.xcuserstate
*.xcworkspace/xcuserdata/

# CocoaPods
Pods/
Podfile.lock

# Build artifacts
App/build/
App/App.xcarchive
dist/

# iOS
*.dSYM.zip
*.dSYM

# fastlane
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots/**/*.png
fastlane/test_output
EOF
    echo "✅ Created iOS .gitignore"
fi

# Initialize Git in iOS directory for Xcode integration
if [ ! -d ".git" ]; then
    git init
    git branch -M main
    echo "✅ Initialized Git repository in iOS directory"
fi

# Add GitHub remote if it doesn't exist
if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin https://github.com/GenesisJLopez/LumenQI.git
    echo "✅ Added GitHub remote"
else
    echo "✅ GitHub remote already configured"
fi

cd ..

echo ""
echo "🎯 XCODE SETUP COMPLETE!"
echo ""
echo "📋 Next Steps to Transfer to Xcode:"
echo ""
echo "1. 📂 OPEN PROJECT IN XCODE:"
echo "   • Navigate to: ios/App/"
echo "   • Double-click: App.xcworkspace (NOT .xcodeproj)"
echo "   • Or run: open ios/App/App.xcworkspace"
echo ""
echo "2. ⚙️ CONFIGURE XCODE PROJECT:"
echo "   • Select 'App' target in Xcode"
echo "   • Go to 'Signing & Capabilities' tab"
echo "   • Select your Apple Developer Team"
echo "   • Bundle Identifier: com.lumen.qi"
echo "   • Set deployment target: iOS 13.0"
echo ""
echo "3. 🏗️ BUILD AND TEST:"
echo "   • Choose iOS Simulator or device"
echo "   • Click ▶️ Run button"
echo "   • Test all Lumen QI features"
echo ""
echo "4. 📱 APP STORE PREPARATION:"
echo "   • Product → Archive"
echo "   • Use Organizer to validate"
echo "   • Upload to App Store Connect"
echo ""
echo "📁 Project Structure:"
echo "   ios/App/App.xcworkspace  ← Open this in Xcode"
echo "   ios/App/App/             ← iOS source code"
echo "   ios/App/App/public/      ← Your React app"
echo ""
echo "🔗 Repository: https://github.com/GenesisJLopez/LumenQI"
echo ""
echo "✅ Ready for Xcode development and App Store submission!"