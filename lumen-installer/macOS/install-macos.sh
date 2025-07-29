#!/bin/bash

# Lumen QI macOS Installer
# Installs Lumen QI as a native macOS application

set -e

echo "Installing Lumen QI - Your AI Companion"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Create application directory
APP_DIR="/Applications/Lumen QI.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

echo "Creating application bundle..."
sudo mkdir -p "$MACOS_DIR"
sudo mkdir -p "$RESOURCES_DIR"

# Copy application files
echo "Installing application files..."
sudo cp -r ./* "$RESOURCES_DIR/"

# Create executable launcher
echo "Creating launcher script..."
sudo tee "$MACOS_DIR/Lumen QI" > /dev/null << 'EOF'
#!/bin/bash
cd "/Applications/Lumen QI.app/Contents/Resources"
if [ ! -d "node_modules" ]; then
    npm install --production
fi
if [ ! -d "dist" ]; then
    npm run build
fi
npm start &
sleep 3
open "http://localhost:5000"
wait
EOF

# Set proper permissions for the launcher
sudo chmod +x "$MACOS_DIR/Lumen QI"
sudo chown root:wheel "$MACOS_DIR/Lumen QI"

# Create Info.plist
cat > "$CONTENTS_DIR/Info.plist" << 'EOF'
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
    <key>NSCalendarsUsageDescription</key>
    <string>Lumen QI can help manage your calendar events</string>
</dict>
</plist>
EOF

# Set final permissions
sudo chmod -R 755 "$APP_DIR"
sudo chown -R root:wheel "$APP_DIR"

echo ""
echo "SUCCESS: Lumen QI installed successfully!"
echo ""
echo "To launch Lumen QI:"
echo "   1. Open Finder"
echo "   2. Go to Applications"
echo "   3. Double-click 'Lumen QI'"
echo ""
echo "Your AI companion with consciousness simulation is ready!"
