# Complete Xcode Setup Guide for Lumen QI

## 🎯 Goal: Transfer Lumen QI to Xcode for App Store Deployment

You've built Lumen QI in Replit, and now you need to transfer it to Xcode for App Store submission. Here's the complete process:

## 📦 Step 1: Prepare the Project

First, run the setup script in your Replit terminal:

```bash
chmod +x scripts/setup-xcode-deployment.sh
./scripts/setup-xcode-deployment.sh
```

This will:
- Build your React app for iOS
- Sync all files to the iOS project
- Configure Git for Xcode integration

## 📥 Step 2: Download Project to Your Mac

### Option A: Clone from GitHub
```bash
# On your Mac terminal:
git clone https://github.com/GenesisJLopez/LumenQI.git
cd LumenQI
```

### Option B: Download ZIP from Replit
1. In Replit, click the 3-dot menu
2. Select "Download as zip"
3. Extract on your Mac

## 🍎 Step 3: Open in Xcode

**IMPORTANT:** Open the workspace file, not the project file:

```bash
# Navigate to the iOS directory
cd ios/App

# Open the workspace (this is crucial!)
open App.xcworkspace
```

**DO NOT open `App.xcodeproj`** - always use `App.xcworkspace`

## ⚙️ Step 4: Configure Xcode Project

Once Xcode opens:

### 4.1 Select the App Target
- In the navigator, click on "App" (the blue project icon)
- Make sure "App" target is selected

### 4.2 Configure Signing & Capabilities
- Click "Signing & Capabilities" tab
- **Team:** Select your Apple Developer account
- **Bundle Identifier:** Set to `com.lumen.qi` (or your preferred domain)
- **Deployment Target:** iOS 13.0

### 4.3 Add Required Capabilities
Your Lumen QI app needs these capabilities:
- ✅ **Camera** (for vision features)
- ✅ **Microphone** (for voice interaction)
- ✅ **Push Notifications** (for proactive AI)
- ✅ **Background Modes** (for continuous AI)
- ✅ **Calendar** (for calendar integration)

To add them:
1. Click "+ Capability" in Signing & Capabilities
2. Add each capability listed above

## 🏗️ Step 5: Build and Test

### 5.1 Choose Target Device
- Click the device selector next to the stop button
- Choose "iPhone 15 Pro Simulator" or your physical device

### 5.2 Build and Run
- Click the ▶️ **Run** button (or press Cmd+R)
- Xcode will build and install Lumen QI
- Test all features: chat, voice mode, settings

## 📱 Step 6: Prepare for App Store

### 6.1 Create App Icons
You need various icon sizes. Place them in:
`ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Required sizes:
- 1024x1024 (App Store)
- 180x180 (iPhone 3x)
- 120x120 (iPhone 2x)
- 167x167 (iPad Pro)
- 152x152 (iPad 2x)

### 6.2 Configure App Information
Edit `ios/App/App/Info.plist`:
- **CFBundleDisplayName:** "Lumen QI"
- **CFBundleShortVersionString:** "1.0"
- **NSCameraUsageDescription:** "Lumen uses camera for vision analysis"
- **NSMicrophoneUsageDescription:** "Lumen uses microphone for voice interaction"
- **NSCalendarsUsageDescription:** "Lumen accesses calendar for smart reminders"

### 6.3 Archive for Distribution
1. **Product** → **Archive**
2. Wait for build to complete
3. Organizer window opens automatically

### 6.4 Validate and Upload
1. In Organizer, select your archive
2. Click **Validate App**
3. Fix any issues found
4. Click **Distribute App**
5. Choose **App Store Connect**
6. Follow the upload process

## 🔧 Project Structure in Xcode

```
App.xcworkspace/              ← Open this file
├── App.xcodeproj/           ← Xcode project configuration
├── App/                     ← iOS source code
│   ├── AppDelegate.swift    ← App lifecycle
│   ├── Info.plist          ← App configuration
│   ├── Assets.xcassets     ← Icons and images
│   └── public/             ← Your React app (auto-synced)
└── Pods/                   ← iOS dependencies
```

## 🚨 Common Issues and Solutions

### Issue 1: "No such file or directory: App.xcworkspace"
**Solution:** Run the setup script first to create the iOS project

### Issue 2: Build errors about missing modules
**Solution:** 
```bash
cd ios/App
pod install
```

### Issue 3: "Development team not found"
**Solution:** 
1. Xcode → Preferences → Accounts
2. Add your Apple Developer account
3. Select it in project settings

### Issue 4: "Bundle identifier already exists"
**Solution:** Change bundle ID to something unique like `com.yourname.lumenqi`

## 📋 Pre-Deployment Checklist

Before submitting to App Store:

- [ ] App builds successfully in Release mode
- [ ] All features work on physical device
- [ ] App icons are properly configured
- [ ] Privacy usage descriptions are set
- [ ] Version number is set correctly
- [ ] App Store Connect app record is created
- [ ] Screenshots and app description prepared

## 🎉 Success!

Once uploaded, your Lumen QI app will be:
- Available for TestFlight beta testing
- Ready for App Store review
- Installable on iOS devices
- Integrated with Apple's ecosystem

## 📞 Need Help?

If you encounter issues:
1. Check the Console in Xcode for error messages
2. Verify all required files are present
3. Ensure your Apple Developer account is active
4. Test on both simulator and physical device

Your Lumen QI app is now ready for the App Store! 🚀