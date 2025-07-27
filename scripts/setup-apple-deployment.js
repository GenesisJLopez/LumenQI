#!/usr/bin/env node

/**
 * Apple Ecosystem Deployment Setup Script
 * Configures Lumen QI for Mac App Store, iOS App Store, and macOS distribution
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const config = {
  appId: 'com.lumen.qi',
  appName: 'Lumen QI',
  teamId: process.env.APPLE_TEAM_ID || 'YOUR_TEAM_ID',
  bundleId: 'com.lumen.qi',
  version: '1.0.0',
  buildNumber: '1'
};

async function setupAppleDeployment() {
  console.log('🍎 Setting up Apple Ecosystem Deployment for Lumen QI...');
  
  try {
    // Create build directory if it doesn't exist
    if (!existsSync('build')) {
      mkdirSync('build', { recursive: true });
    }
    
    // 1. Initialize Capacitor for iOS
    console.log('📱 Initializing Capacitor for iOS...');
    try {
      execSync('npx cap init "Lumen QI" com.lumen.qi --web-dir=dist/public', { stdio: 'inherit' });
    } catch (error) {
      console.log('Capacitor already initialized or error occurred:', error.message);
    }
    
    // 2. Add iOS platform
    console.log('📱 Adding iOS platform...');
    try {
      execSync('npx cap add ios', { stdio: 'inherit' });
    } catch (error) {
      console.log('iOS platform may already be added:', error.message);
    }
    
    // 3. Create iOS configuration files
    console.log('📱 Creating iOS configuration files...');
    
    // Create iOS specific configuration
    const iosConfig = {
      CFBundleIdentifier: config.bundleId,
      CFBundleDisplayName: config.appName,
      CFBundleVersion: config.buildNumber,
      CFBundleShortVersionString: config.version,
      LSApplicationQueriesSchemes: [
        'lumen',
        'lumenqi',
        'https',
        'http'
      ],
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        NSAllowsLocalNetworking: true
      }
    };
    
    // 4. Create signing configuration template
    const signingConfig = `# Apple Developer Configuration Template
# Fill in your Apple Developer details:

APPLE_TEAM_ID=${config.teamId}
APP_BUNDLE_ID=${config.bundleId}
APP_DISPLAY_NAME="${config.appName}"
APP_VERSION=${config.version}
BUILD_NUMBER=${config.buildNumber}

# Code Signing Identity (from Keychain)
CODE_SIGN_IDENTITY="Apple Distribution: Your Name (TEAM_ID)"
PROVISIONING_PROFILE_SPECIFIER="Lumen QI Distribution"

# Mac App Store
MAS_CODE_SIGN_IDENTITY="3rd Party Mac Developer Application: Your Name (TEAM_ID)"
MAS_INSTALLER_IDENTITY="3rd Party Mac Developer Installer: Your Name (TEAM_ID)"

# iOS App Store
IOS_CODE_SIGN_IDENTITY="Apple Distribution: Your Name (TEAM_ID)"
IOS_PROVISIONING_PROFILE="Lumen QI iOS Distribution"
`;
    
    writeFileSync('build/apple-config.env', signingConfig);
    
    // 5. Create deployment scripts
    const deploymentScript = `#!/bin/bash
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
cd ios/Lumen\\ QI/
xcodebuild -workspace "Lumen QI.xcworkspace" -scheme "Lumen QI" -configuration Release -archivePath "build/Lumen QI.xcarchive" archive
xcodebuild -exportArchive -archivePath "build/Lumen QI.xcarchive" -exportPath "build/" -exportOptionsPlist "exportOptions.plist"

echo "✅ Apple builds completed successfully!"
echo "📦 Mac App: dist-electron/"
echo "📱 iOS App: ios/Lumen QI/build/"
`;
    
    writeFileSync('scripts/deploy-apple.sh', deploymentScript);
    execSync('chmod +x scripts/deploy-apple.sh');
    
    // 6. Create iOS export options
    const exportOptions = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>\${APPLE_TEAM_ID}</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>`;
    
    writeFileSync('ios/exportOptions.plist', exportOptions);
    
    console.log('✅ Apple Ecosystem setup completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Configure build/apple-config.env with your Apple Developer details');
    console.log('2. Add provisioning profiles to ios/ directory');
    console.log('3. Run: npm run build && npx cap sync ios');
    console.log('4. Open Xcode: npx cap open ios');
    console.log('5. Configure signing & build for App Store');
    console.log('\n🔧 Available Commands:');
    console.log('- npm run ios:build - Build iOS app');
    console.log('- npm run dist:mac - Build Mac app');
    console.log('- npm run dist:mas - Build for Mac App Store');
    console.log('- ./scripts/deploy-apple.sh - Full Apple deployment');
    
  } catch (error) {
    console.error('❌ Error setting up Apple deployment:', error.message);
    process.exit(1);
  }
}

setupAppleDeployment();