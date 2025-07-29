#!/usr/bin/env node

/**
 * Creates a macOS DMG installer for Lumen QI
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createDMG() {
  console.log('📦 Creating macOS DMG installer...');
  
  const appName = 'Lumen QI';
  const dmgName = 'Lumen-QI-Installer.dmg';
  const tempDir = path.join(__dirname, '../temp-dmg');
  
  // Create temporary directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Create app bundle structure
  const appPath = path.join(tempDir, `${appName}.app`);
  const contentsPath = path.join(appPath, 'Contents');
  const macOSPath = path.join(contentsPath, 'MacOS');
  const resourcesPath = path.join(contentsPath, 'Resources');
  
  fs.mkdirSync(macOSPath, { recursive: true });
  fs.mkdirSync(resourcesPath, { recursive: true });
  
  // Copy all project files to Resources
  const projectRoot = path.join(__dirname, '..');
  const filesToCopy = [
    'package.json', 'package-lock.json', 'client', 'server', 'shared',
    'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 
    'lumen-identity.json', 'ai-config.json', 'lumen-brain-storage'
  ];
  
  filesToCopy.forEach(file => {
    const source = path.join(projectRoot, file);
    const dest = path.join(resourcesPath, file);
    if (fs.existsSync(source)) {
      if (fs.statSync(source).isDirectory()) {
        fs.cpSync(source, dest, { recursive: true });
      } else {
        fs.copyFileSync(source, dest);
      }
    }
  });
  
  // Create executable launcher
  const launcherScript = `#!/bin/bash
cd "$(dirname "$0")/../Resources"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    osascript -e 'display alert "Node.js Required" message "Please install Node.js from nodejs.org to run Lumen QI"'
    exit 1
fi

# Install dependencies and start
npm install --production
npm run build
npm start &

# Open browser
sleep 3
open "http://localhost:5000"
`;
  
  fs.writeFileSync(path.join(macOSPath, appName), launcherScript);
  fs.chmodSync(path.join(macOSPath, appName), '755');
  
  // Create Info.plist
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${appName}</string>
    <key>CFBundleIdentifier</key>
    <string>com.lumen.qi</string>
    <key>CFBundleName</key>
    <string>${appName}</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSMicrophoneUsageDescription</key>
    <string>Lumen QI uses the microphone for voice interaction</string>
</dict>
</plist>`;
  
  fs.writeFileSync(path.join(contentsPath, 'Info.plist'), infoPlist);
  
  // Create DMG
  try {
    const dmgPath = path.join(projectRoot, dmgName);
    if (fs.existsSync(dmgPath)) {
      fs.unlinkSync(dmgPath);
    }
    
    execSync(`hdiutil create -volname "${appName}" -srcfolder "${tempDir}" -ov -format UDZO "${dmgPath}"`);
    console.log(`✅ DMG created: ${dmgName}`);
    
  } catch (error) {
    console.log('⚠️  DMG creation requires macOS. Created app bundle in temp-dmg folder instead.');
  }
  
  // Cleanup
  // fs.rmSync(tempDir, { recursive: true });
  
  return path.join(projectRoot, dmgName);
}

if (require.main === module) {
  createDMG();
}

module.exports = { createDMG };