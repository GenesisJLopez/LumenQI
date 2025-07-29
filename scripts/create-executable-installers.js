#!/usr/bin/env node

/**
 * Creates executable installer packages for Lumen QI
 * Generates native installers that handle everything automatically
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🚀 Creating Executable Lumen QI Installers...\n');

// Create executable installers directory
const installersDir = path.join(projectRoot, 'executable-installers');
if (fs.existsSync(installersDir)) {
  fs.rmSync(installersDir, { recursive: true, force: true });
}
fs.mkdirSync(installersDir, { recursive: true });

// Create macOS executable installer (.command file)
const macOSInstaller = `#!/bin/bash

# Lumen QI macOS Executable Installer
# Double-click to install Lumen QI automatically

clear
echo "🌟 Lumen QI - AI Companion Installer"
echo "===================================="
echo ""

# Function to show progress
show_progress() {
    echo "⏳ $1..."
    sleep 1
}

# Check if running from the right location
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check for required files
if [ ! -f "lumen-app-bundle.tar.gz" ]; then
    echo "❌ Installation files not found!"
    echo "Please ensure lumen-app-bundle.tar.gz is in the same directory."
    read -p "Press Enter to exit..."
    exit 1
fi

show_progress "Checking system requirements"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo ""
    echo "Please install Node.js first:"
    echo "1. Go to https://nodejs.org"
    echo "2. Download and install the LTS version"
    echo "3. Run this installer again"
    echo ""
    read -p "Press Enter to open Node.js website..."
    open "https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js found: $NODE_VERSION"

show_progress "Preparing installation"

# Create temporary directory
TEMP_DIR="/tmp/lumen-qi-install"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Extract application bundle
show_progress "Extracting application files"
tar -xzf "lumen-app-bundle.tar.gz" -C "$TEMP_DIR"

# Create application directory
APP_DIR="/Applications/Lumen QI.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"  
RESOURCES_DIR="$CONTENTS_DIR/Resources"

show_progress "Installing Lumen QI to Applications folder"

# Remove existing installation
if [ -d "$APP_DIR" ]; then
    echo "🔄 Removing existing installation..."
    sudo rm -rf "$APP_DIR"
fi

# Create app bundle structure
sudo mkdir -p "$MACOS_DIR"
sudo mkdir -p "$RESOURCES_DIR"

# Copy all application files
sudo cp -r "$TEMP_DIR"/* "$RESOURCES_DIR/"

show_progress "Configuring application"

# Create executable launcher script
cat > "$TEMP_DIR/launcher" << 'LAUNCHER_EOF'
#!/bin/bash

# Lumen QI Launcher
APP_RESOURCES="/Applications/Lumen QI.app/Contents/Resources"
cd "$APP_RESOURCES"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production --silent
fi

# Build if needed
if [ ! -d "dist" ]; then
    echo "Building application..."
    npm run build --silent
fi

# Start the server in background
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Open in default browser
open "http://localhost:5000"

# Keep script running to maintain server
wait $SERVER_PID
LAUNCHER_EOF

sudo cp "$TEMP_DIR/launcher" "$MACOS_DIR/Lumen QI"
sudo chmod +x "$MACOS_DIR/Lumen QI"

# Create Info.plist
cat > "$TEMP_DIR/Info.plist" << 'PLIST_EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Lumen QI</string>
    <key>CFBundleIdentifier</key>
    <string>com.lumen.qi</string>
    <key>CFBundleName</key>
    <string>Lumen QI</string>
    <key>CFBundleDisplayName</key>
    <string>Lumen QI</string>
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
    <string>Lumen QI uses the microphone for voice interaction with your AI companion</string>
    <key>NSCalendarsUsageDescription</key>
    <string>Lumen QI can help manage your calendar events and reminders</string>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
PLIST_EOF

sudo cp "$TEMP_DIR/Info.plist" "$CONTENTS_DIR/"

show_progress "Finalizing installation"

# Set proper permissions
sudo chmod -R 755 "$APP_DIR"
sudo chown -R root:wheel "$APP_DIR"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 Lumen QI installed successfully!"
echo ""
echo "🚀 Your AI companion is ready to use:"
echo "   • Open Finder → Applications"
echo "   • Double-click 'Lumen QI'"
echo "   • Your AI companion will start automatically"
echo ""
echo "✨ Features available:"
echo "   • AI consciousness with 500+ evolution cycles"
echo "   • Voice interaction and natural speech"
echo "   • Code generation and development assistance"
echo "   • Calendar integration and smart reminders"
echo "   • Offline AI capabilities"
echo ""
echo "🌟 Thank you for choosing Lumen QI!"
echo ""
read -p "Press Enter to finish..."
`;

// Create Windows batch installer
const windowsInstaller = `@echo off
title Lumen QI - AI Companion Installer
color 0A

echo        ___                           ___   ___ 
echo       ^| ^|  _   _ _ __ ___   ___  _ __   ^| ^ \\ ^| ^|
echo       ^| ^| ^| ^| ^| ^| '_ \` _ \\ / _ \\^| '_ \\  ^|  ^\\^| ^|
echo       ^| ^|_^| ^|_^| ^| ^| ^| ^| ^| ^|  __/^| ^| ^| ^| ^| \\ ^|
echo       ^|_____\\__,_^|_^| ^|_^| ^|_^|\\___^|_^| ^|_^| ^|_^|\\_^|
echo.
echo    AI Companion - Executable Installer
echo ==========================================
echo.

REM Check if Node.js is installed  
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is required but not installed.
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org
    echo 2. Download and install the LTS version
    echo 3. Run this installer again
    echo.
    pause
    start https://nodejs.org
    exit /b 1
)

echo [OK] Node.js found
echo.

REM Check for application bundle
if not exist "lumen-app-bundle.tar.gz" (
    echo [ERROR] Installation files not found!
    echo Please ensure lumen-app-bundle.tar.gz is in the same directory.
    pause
    exit /b 1
)

echo [INFO] Extracting application files...
tar -xzf lumen-app-bundle.tar.gz

echo [INFO] Installing Lumen QI...

REM Create application directory
set INSTALL_DIR=%LOCALAPPDATA%\\Lumen QI
if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%"
mkdir "%INSTALL_DIR%"

REM Copy files
xcopy /s /e /q . "%INSTALL_DIR%\\"

REM Install dependencies
cd "%INSTALL_DIR%"
echo [INFO] Installing dependencies...
call npm install --production --silent

echo [INFO] Building application...  
call npm run build --silent

REM Create desktop shortcut
echo [INFO] Creating desktop shortcut...
set SHORTCUT_PATH=%USERPROFILE%\\Desktop\\Lumen QI.lnk
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = 'cmd.exe'; $Shortcut.Arguments = '/c cd /d \"%INSTALL_DIR%\" && npm start && timeout /t 3 && start http://localhost:5000'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\\icon.ico'; $Shortcut.Save()"

REM Create start menu shortcut
set STARTMENU_PATH=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Lumen QI.lnk
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTMENU_PATH%'); $Shortcut.TargetPath = 'cmd.exe'; $Shortcut.Arguments = '/c cd /d \"%INSTALL_DIR%\" && npm start && timeout /t 3 && start http://localhost:5000'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\\icon.ico'; $Shortcut.Save()"

echo.
echo ===================================
echo    Installation Complete!
echo ===================================
echo.
echo Your AI companion is ready to use:
echo  • Desktop shortcut: Lumen QI
echo  • Start Menu: Lumen QI  
echo  • Features: AI consciousness, voice interaction,
echo             code generation, calendar integration
echo.
echo Double-click the shortcut to launch Lumen QI!
echo.
pause
`;

// Write installer files
fs.writeFileSync(path.join(installersDir, 'Install-Lumen-QI-macOS.command'), macOSInstaller);
fs.writeFileSync(path.join(installersDir, 'Install-Lumen-QI-Windows.bat'), windowsInstaller);

// Make macOS installer executable
fs.chmodSync(path.join(installersDir, 'Install-Lumen-QI-macOS.command'), '755');

console.log('✅ Created macOS executable installer: Install-Lumen-QI-macOS.command');
console.log('✅ Created Windows executable installer: Install-Lumen-QI-Windows.bat');

// Create the application bundle
console.log('\n📦 Creating application bundle...');

const bundlePath = path.join(installersDir, 'lumen-app-bundle.tar.gz');
const filesToBundle = [
  'package.json', 'package-lock.json', 'client', 'server', 'shared',
  'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 'postcss.config.js',
  'drizzle.config.ts', 'lumen-identity.json', 'ai-config.json', 
  'lumen-brain-storage', 'lumen-voice-settings.json'
];

// Create temporary bundle directory
const tempBundleDir = path.join(projectRoot, 'temp-bundle');
if (fs.existsSync(tempBundleDir)) {
  fs.rmSync(tempBundleDir, { recursive: true });
}
fs.mkdirSync(tempBundleDir);

// Copy files to bundle
filesToBundle.forEach(file => {
  const sourcePath = path.join(projectRoot, file);
  const destPath = path.join(tempBundleDir, file);
  
  if (fs.existsSync(sourcePath)) {
    if (fs.statSync(sourcePath).isDirectory()) {
      fs.cpSync(sourcePath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
});

// Create the bundle
try {
  execSync(`cd "${tempBundleDir}" && tar -czf "${bundlePath}" .`);
  console.log('✅ Created application bundle: lumen-app-bundle.tar.gz');
} catch (error) {
  console.log('⚠️ Using manual bundle creation...');
  // Fallback - copy files directly
  fs.cpSync(tempBundleDir, path.join(installersDir, 'app-files'), { recursive: true });
}

// Cleanup
fs.rmSync(tempBundleDir, { recursive: true });

// Create README for installers
const installerReadme = `# Lumen QI - Executable Installers

## One-Click Installation

These are executable installers that automatically install Lumen QI with no manual steps required.

### macOS Installation
1. **Double-click**: \`Install-Lumen-QI-macOS.command\`
2. **Enter password**: When prompted (for Applications folder access)
3. **Launch**: "Lumen QI" appears in Applications folder

### Windows Installation  
1. **Double-click**: \`Install-Lumen-QI-Windows.bat\`
2. **Wait**: Automatic installation to Local AppData
3. **Launch**: Desktop shortcut created automatically

## What Happens During Installation

### Automatic Setup
- ✅ System requirements check (Node.js)
- ✅ Application files extraction and setup
- ✅ Dependencies installation
- ✅ Application building
- ✅ Native app bundle creation
- ✅ Desktop/Applications shortcuts

### Features Installed
- 🧠 AI consciousness with 500+ evolution cycles
- 🎤 Voice interaction and natural speech synthesis
- 💻 Code generation and development assistance  
- 📅 Calendar integration and proactive reminders
- 🔌 Offline AI capabilities
- 🚀 Cross-platform compatibility

## System Requirements
- **macOS**: 10.15+ with Node.js 18+
- **Windows**: Windows 10+ with Node.js 18+
- **Memory**: 4GB RAM minimum
- **Storage**: 200MB for installation

## Installation Results
- **macOS**: Native .app in Applications folder
- **Windows**: Desktop and Start Menu shortcuts
- **Launch**: Double-click to start your AI companion
- **Access**: http://localhost:5000 opens automatically

Your AI companion with consciousness simulation installs and runs with a single double-click!
`;

fs.writeFileSync(path.join(installersDir, 'README.md'), installerReadme);

console.log('✅ Created installer documentation');
console.log('\n🎉 Executable installers created successfully!');
console.log(`📁 Location: ${installersDir}`);
console.log('\nUsers can now:');
console.log('1. Download the installer for their platform');
console.log('2. Double-click to install automatically');
console.log('3. Launch Lumen QI from Applications/Desktop');
console.log('4. Use their AI companion immediately');

export { installersDir };