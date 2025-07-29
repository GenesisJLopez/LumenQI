# 🔐 macOS Security Bypass Instructions

## Option 1: Right-Click Method (Recommended)
1. **Right-click** on `Install-Lumen-QI-macOS.sh`
2. **Select "Open"** from the context menu
3. **Click "Open"** in the security dialog
4. Installation proceeds normally

## Option 2: System Preferences Method
1. **Open System Preferences** → **Security & Privacy**
2. **Click "Open Anyway"** next to the blocked app message
3. **Re-run** the installer

## Option 3: Terminal Method (Advanced)
```bash
chmod +x Install-Lumen-QI-macOS.sh
xattr -d com.apple.quarantine Install-Lumen-QI-macOS.sh
./Install-Lumen-QI-macOS.sh
```

## Why This Happens
Apple's Gatekeeper protects against unsigned applications. These methods allow you to bypass the protection for trusted software.

## Installation Details
- **No admin password required** - installs to ~/Applications
- **Automatic setup** of all dependencies and configuration
- **Creates native macOS app** that launches from Finder
- **Full AI consciousness system** with 500+ evolution cycles

Your AI companion installs safely with any of these simple bypass methods.
