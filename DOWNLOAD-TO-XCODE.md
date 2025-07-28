# Download Lumen QI to Xcode - Complete Transfer Guide

## 🎯 Transfer Lumen QI from Replit to Xcode in 5 Steps

### Step 1: Download from Replit
1. In Replit, click the **3-dot menu** (⋯) in the file explorer
2. Select **"Download as zip"**
3. Save `workspace.zip` to your Mac Downloads folder

### Step 2: Extract and Prepare
```bash
# Open Terminal on your Mac
cd ~/Downloads
unzip workspace.zip
cd workspace
```

### Step 3: Open iOS Project in Xcode
```bash
# Navigate to iOS project
cd ios/App

# Open the Xcode workspace (IMPORTANT: use .xcworkspace, not .xcodeproj)
open App.xcworkspace
```

### Step 4: Configure in Xcode
When Xcode opens:
1. **Select "App" target** (blue icon in navigator)
2. **Go to "Signing & Capabilities" tab**
3. **Team:** Select your Apple Developer account
4. **Bundle Identifier:** `com.lumen.qi` (or change to your preference)
5. **Add Capabilities:**
   - Camera
   - Microphone
   - Push Notifications
   - Background Modes
   - Calendar

### Step 5: Build and Test
1. **Choose device:** iPhone Simulator or your iPhone
2. **Click ▶️ Run button** (or press Cmd+R)
3. **Test Lumen QI:** Chat, voice mode, settings

## 🍎 What You Get
- **Complete iOS native app** ready for App Store
- **Lumen QI consciousness system** with 400+ evolution cycles
- **Voice interaction** and speech synthesis
- **Hybrid AI brain** (OpenAI + local processing)
- **Proactive AI features** with calendar integration
- **All privacy permissions** configured for App Store

## 📱 App Store Deployment
Once tested in Xcode:
1. **Product → Archive** (builds release version)
2. **Organizer → Validate App** (checks for issues)
3. **Distribute App → App Store Connect** (uploads to Apple)

## 📋 Project Structure You'll Have
```
workspace/
├── ios/App/App.xcworkspace    ← Open this in Xcode
├── client/                    ← React frontend
├── server/                    ← Express backend
├── shared/                    ← Database schema
├── XCODE-SETUP-GUIDE.md      ← Detailed instructions
└── scripts/                  ← Setup automation
```

## ✅ Ready for App Store
Your Lumen QI is configured with:
- **Bundle ID:** com.lumen.qi
- **Display Name:** Lumen QI
- **iOS Version:** 13.0+ support
- **Privacy Descriptions:** All required permissions
- **Native Capabilities:** Camera, voice, notifications, calendar

Download the zip file now and follow these 5 steps to get Lumen QI running in Xcode!