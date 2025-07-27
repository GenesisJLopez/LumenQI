#!/bin/bash

# Lumen QI - Complete Apple App Store Deployment Script
# Builds and deploys to both Mac App Store and iOS App Store

set -e

echo "🍎 Starting Lumen QI Apple App Store Deployment..."

# Load configuration
if [ -f "build/apple-config.env" ]; then
    source build/apple-config.env
    echo "✅ Loaded Apple Developer configuration"
else
    echo "❌ Apple configuration not found!"
    echo "Please create build/apple-config.env with your Apple Developer details"
    echo "See build/apple-config.env for template"
    exit 1
fi

# Verify required tools
echo "🔧 Verifying deployment tools..."

if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode not found. Please install Xcode from the Mac App Store"
    exit 1
fi

if ! command -v xcrun &> /dev/null; then
    echo "❌ Xcode Command Line Tools not found. Please install with: xcode-select --install"
    exit 1
fi

echo "✅ All deployment tools verified"

# Build web application
echo "🔨 Building web application..."
npm run build

if [ ! -d "dist/public" ]; then
    echo "❌ Web build failed - dist/public not found"
    exit 1
fi

echo "✅ Web application built successfully"

# Mac App Store Deployment
echo "🖥️ Building for Mac App Store..."

# Build Electron app for Mac
npm run electron:build -- --mac --publish=never

if [ -d "dist-electron" ]; then
    echo "✅ Mac app built successfully"
    
    # Sign the app (if certificates are configured)
    if [ ! -z "$MAS_CODE_SIGN_IDENTITY" ]; then
        echo "🔐 Signing Mac app for App Store..."
        
        # Sign the app bundle
        codesign --force --options runtime --deep --sign "$MAS_CODE_SIGN_IDENTITY" "dist-electron/mac/Lumen QI.app"
        
        # Create installer package
        productbuild --component "dist-electron/mac/Lumen QI.app" /Applications --sign "$MAS_INSTALLER_IDENTITY" "dist-electron/LumenQI-macOS.pkg"
        
        echo "✅ Mac app signed and packaged for App Store"
    else
        echo "⚠️ Mac App Store signing skipped - configure MAS_CODE_SIGN_IDENTITY"
    fi
else
    echo "❌ Mac app build failed"
fi

# iOS App Store Deployment
echo "📱 Building for iOS App Store..."

# Sync Capacitor
echo "📱 Syncing Capacitor iOS..."
npx cap sync ios

if [ ! -d "ios" ]; then
    echo "❌ iOS project not found. Run: npx cap add ios"
    exit 1
fi

# Build iOS app
echo "📱 Building iOS app archive..."
cd ios

# Check if workspace exists
if [ -f "App/App.xcworkspace" ]; then
    XCODE_PROJECT="App/App.xcworkspace"
    BUILD_FLAG="-workspace"
elif [ -f "App/App.xcodeproj" ]; then
    XCODE_PROJECT="App/App.xcodeproj"
    BUILD_FLAG="-project"
else
    echo "❌ iOS Xcode project not found"
    exit 1
fi

# Archive the app
xcodebuild $BUILD_FLAG "$XCODE_PROJECT" \
    -scheme "App" \
    -configuration Release \
    -destination "generic/platform=iOS" \
    -archivePath "build/LumenQI.xcarchive" \
    archive

if [ -d "build/LumenQI.xcarchive" ]; then
    echo "✅ iOS app archived successfully"
    
    # Export for App Store
    if [ -f "../build/exportOptions.plist" ]; then
        echo "📤 Exporting iOS app for App Store..."
        
        xcodebuild -exportArchive \
            -archivePath "build/LumenQI.xcarchive" \
            -exportPath "build/AppStore" \
            -exportOptionsPlist "../build/exportOptions.plist"
        
        if [ -d "build/AppStore" ]; then
            echo "✅ iOS app exported for App Store"
        else
            echo "❌ iOS app export failed"
        fi
    else
        echo "⚠️ Export options not found - skipping App Store export"
    fi
else
    echo "❌ iOS app archive failed"
fi

cd ..

# Upload to App Store (optional)
echo "📤 App Store Upload Options:"
echo ""
echo "📁 Built Files:"
echo "  Mac App Store: dist-electron/LumenQI-macOS.pkg"
echo "  iOS App Store: ios/build/AppStore/App.ipa"
echo ""
echo "📤 Upload Commands:"
echo "  Mac App Store: xcrun altool --upload-app -f 'dist-electron/LumenQI-macOS.pkg' -u 'your-apple-id' -p 'app-specific-password'"
echo "  iOS App Store: xcrun altool --upload-app -f 'ios/build/AppStore/App.ipa' -u 'your-apple-id' -p 'app-specific-password'"
echo ""
echo "🌐 Alternative: Use Xcode -> Window -> Organizer to upload"
echo ""
echo "✅ Lumen QI Apple deployment completed!"
echo "🍎 Ready for App Store submission"