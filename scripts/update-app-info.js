#!/usr/bin/env node

// Update iOS App Information for App Store Deployment
// This script configures the iOS project with proper App Store metadata

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🍎 Updating iOS App Information for App Store...');

const appInfoPath = path.join(__dirname, '../ios/App/App/Info.plist');
const capacitorConfigPath = path.join(__dirname, '../capacitor.config.ts');

// App Store Configuration
const appConfig = {
  displayName: 'Lumen QI',
  bundleId: 'com.lumen.qi',
  version: '1.0.0',
  buildNumber: '1',
  description: 'Advanced AI companion with quantum consciousness and Apple ecosystem integration',
  category: 'Productivity',
  keywords: ['AI', 'Assistant', 'Productivity', 'Voice', 'Chat']
};

// Privacy Usage Descriptions (required for App Store)
const privacyDescriptions = {
  NSCameraUsageDescription: 'Lumen uses your camera to analyze images and provide visual assistance.',
  NSMicrophoneUsageDescription: 'Lumen uses your microphone for voice conversations and commands.',
  NSCalendarsUsageDescription: 'Lumen accesses your calendar to provide smart scheduling and reminders.',
  NSContactsUsageDescription: 'Lumen can access contacts to help with communication and scheduling.',
  NSLocationWhenInUseUsageDescription: 'Lumen uses location for weather updates and location-based reminders.',
  NSUserNotificationsUsageDescription: 'Lumen sends notifications for reminders and important updates.',
  NSSpeechRecognitionUsageDescription: 'Lumen uses speech recognition to understand your voice commands.',
  NSPhotoLibraryUsageDescription: 'Lumen can access your photo library to analyze and organize images.'
};

// Update Info.plist with App Store requirements
function updateInfoPlist() {
  try {
    if (!fs.existsSync(appInfoPath)) {
      console.log('❌ Info.plist not found. Run setup script first.');
      return false;
    }

    let infoPlist = fs.readFileSync(appInfoPath, 'utf8');
    
    // Update app display name
    infoPlist = infoPlist.replace(
      /<key>CFBundleDisplayName<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleDisplayName</key>\n\t<string>${appConfig.displayName}</string>`
    );

    // Add privacy usage descriptions
    let privacyEntries = '';
    for (const [key, description] of Object.entries(privacyDescriptions)) {
      privacyEntries += `\t<key>${key}</key>\n\t<string>${description}</string>\n`;
    }

    // Insert privacy descriptions before closing </dict>
    infoPlist = infoPlist.replace(
      /<\/dict>\s*<\/plist>/,
      `\t${privacyEntries}</dict>\n</plist>`
    );

    // Add required iOS capabilities
    const capabilities = `
\t<key>UIRequiredDeviceCapabilities</key>
\t<array>
\t\t<string>armv7</string>
\t</array>
\t<key>UIBackgroundModes</key>
\t<array>
\t\t<string>background-processing</string>
\t\t<string>background-fetch</string>
\t</array>
\t<key>NSAppTransportSecurity</key>
\t<dict>
\t\t<key>NSAllowsArbitraryLoads</key>
\t\t<true/>
\t</dict>`;

    infoPlist = infoPlist.replace(
      /<\/dict>\s*<\/plist>/,
      `${capabilities}\n</dict>\n</plist>`
    );

    fs.writeFileSync(appInfoPath, infoPlist);
    console.log('✅ Updated Info.plist with App Store requirements');
    return true;
  } catch (error) {
    console.error('❌ Error updating Info.plist:', error.message);
    return false;
  }
}

// Create App Store assets directory
function createAppStoreAssets() {
  const assetsPath = path.join(__dirname, '../ios/App/App/Assets.xcassets');
  const appIconPath = path.join(assetsPath, 'AppIcon.appiconset');
  
  try {
    if (!fs.existsSync(appIconPath)) {
      fs.mkdirSync(appIconPath, { recursive: true });
    }

    // Create Contents.json for App Icons
    const contentsJson = {
      "images": [
        {
          "idiom": "iphone",
          "size": "20x20",
          "scale": "2x"
        },
        {
          "idiom": "iphone",
          "size": "20x20",
          "scale": "3x"
        },
        {
          "idiom": "iphone",
          "size": "29x29",
          "scale": "2x"
        },
        {
          "idiom": "iphone",
          "size": "29x29",
          "scale": "3x"
        },
        {
          "idiom": "iphone",
          "size": "40x40",
          "scale": "2x"
        },
        {
          "idiom": "iphone",
          "size": "40x40",
          "scale": "3x"
        },
        {
          "idiom": "iphone",
          "size": "60x60",
          "scale": "2x"
        },
        {
          "idiom": "iphone",
          "size": "60x60",
          "scale": "3x"
        },
        {
          "idiom": "ipad",
          "size": "20x20",
          "scale": "1x"
        },
        {
          "idiom": "ipad",
          "size": "20x20",
          "scale": "2x"
        },
        {
          "idiom": "ipad",
          "size": "29x29",
          "scale": "1x"
        },
        {
          "idiom": "ipad",
          "size": "29x29",
          "scale": "2x"
        },
        {
          "idiom": "ipad",
          "size": "40x40",
          "scale": "1x"
        },
        {
          "idiom": "ipad",
          "size": "40x40",
          "scale": "2x"
        },
        {
          "idiom": "ipad",
          "size": "76x76",
          "scale": "1x"
        },
        {
          "idiom": "ipad",
          "size": "76x76",
          "scale": "2x"
        },
        {
          "idiom": "ipad",
          "size": "83.5x83.5",
          "scale": "2x"
        },
        {
          "idiom": "ios-marketing",
          "size": "1024x1024",
          "scale": "1x"
        }
      ],
      "info": {
        "version": 1,
        "author": "xcode"
      }
    };

    fs.writeFileSync(
      path.join(appIconPath, 'Contents.json'),
      JSON.stringify(contentsJson, null, 2)
    );

    console.log('✅ Created App Icon asset structure');
    console.log(`📁 Add your app icons to: ${appIconPath}`);
    return true;
  } catch (error) {
    console.error('❌ Error creating app assets:', error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log(`📱 Configuring: ${appConfig.displayName}`);
  console.log(`🆔 Bundle ID: ${appConfig.bundleId}`);
  console.log(`📦 Version: ${appConfig.version}`);
  console.log('');

  const success = updateInfoPlist() && createAppStoreAssets();
  
  if (success) {
    console.log('');
    console.log('🎉 iOS App Store configuration complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Add app icons to ios/App/App/Assets.xcassets/AppIcon.appiconset/');
    console.log('2. Open ios/App/App.xcworkspace in Xcode');
    console.log('3. Configure signing with your Apple Developer account');
    console.log('4. Build and test your app');
    console.log('5. Archive and upload to App Store Connect');
    console.log('');
    console.log('🔗 App Store Connect: https://appstoreconnect.apple.com');
  } else {
    console.log('❌ Configuration failed. Check errors above.');
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { appConfig, updateInfoPlist, createAppStoreAssets };