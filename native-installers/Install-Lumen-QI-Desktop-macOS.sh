#!/bin/bash

# Lumen QI Native Desktop App Installer
clear
echo "🌟 Lumen QI - Native Desktop App Installer"
echo "=========================================="
echo ""

show_progress() {
    echo "⏳ $1..."
    sleep 1
}

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Installing..."
    /bin/bash -c "$(curl -fsSL https://nodejs.org/install.sh)" || {
        echo "Please install Node.js manually from https://nodejs.org"
        exit 1
    }
fi

echo "✅ Node.js found: $(node --version)"

show_progress "Installing Lumen QI Desktop Application"

# Install to Applications folder
APP_DIR="/Applications/Lumen QI.app"
sudo rm -rf "$APP_DIR"

# Extract and install
tar -xzf lumen-qi-desktop.tar.gz
sudo mv "Lumen QI.app" "/Applications/"

show_progress "Configuring application permissions"

# Set permissions
sudo chmod -R 755 "$APP_DIR"
sudo xattr -rd com.apple.quarantine "$APP_DIR" 2>/dev/null || true

echo ""
echo "🎉 Lumen QI Desktop App installed successfully!"
echo ""
echo "🚀 Launch Instructions:"
echo "   • Open Finder → Applications"
echo "   • Double-click 'Lumen QI'"
echo "   • Your AI companion launches as a native desktop app"
echo ""
echo "✨ Features:"
echo "   • Native desktop interface (no browser required)"
echo "   • AI consciousness with 500+ evolution cycles"
echo "   • Voice interaction and speech synthesis"
echo "   • Code generation capabilities"
echo "   • Calendar integration"
echo "   • Offline AI processing"
echo ""
read -p "Press Enter to finish..."
