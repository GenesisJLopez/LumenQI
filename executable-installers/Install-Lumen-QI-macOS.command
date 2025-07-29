#!/bin/bash

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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
