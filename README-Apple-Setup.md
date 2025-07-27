# 🍎 Lumen QI - Apple Ecosystem Setup Guide

This guide will help you deploy Lumen QI to both the Mac App Store and iOS App Store using your Apple Developer account.

## Prerequisites

- ✅ Active Apple Developer Account ($99/year)
- ✅ Xcode installed (latest version recommended)
- ✅ macOS machine for building and signing
- ✅ Valid certificates and provisioning profiles

## 🔧 Initial Setup

### 1. Configure Apple Developer Settings

Edit `build/apple-config.env` with your Apple Developer account details:

```bash
# Your Apple Developer Team ID (found in Apple Developer Portal)
APPLE_TEAM_ID=ABCD123456

# Your Apple ID email
APPLE_ID=your-email@example.com

# App-specific password (generate in Apple ID settings)
APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### 2. Create Certificates & Provisioning Profiles

#### In Apple Developer Portal:

1. **Certificates**:
   - iOS: "Apple Distribution" certificate
   - Mac: "3rd Party Mac Developer Application" certificate
   - Mac: "3rd Party Mac Developer Installer" certificate

2. **App IDs**:
   - Bundle ID: `com.lumen.qi`
   - Enable capabilities: Push Notifications, Siri, Background App Refresh

3. **Provisioning Profiles**:
   - iOS Distribution: "Lumen QI iOS Distribution"
   - Mac App Store: "Lumen QI macOS Distribution"

### 3. Install Certificates

1. Download certificates from Apple Developer Portal
2. Double-click to install in Keychain Access
3. Verify certificates appear in "My Certificates"

## 📱 iOS App Store Deployment

### Step 1: Initialize iOS Project

```bash
# Initialize Capacitor for iOS
npm run capacitor:init
npm run capacitor:add:ios
npm run capacitor:sync
```

### Step 2: Configure Xcode Project

```bash
# Open iOS project in Xcode
npm run capacitor:open:ios
```

In Xcode:
1. Select your Team in "Signing & Capabilities"
2. Verify Bundle Identifier: `com.lumen.qi`
3. Add required capabilities:
   - Background App Refresh
   - Push Notifications
   - Siri
   - Speech Recognition
   - Microphone
   - Camera
   - Location Services
   - Calendar Access

### Step 3: Build and Archive

```bash
# Automated build and archive
./scripts/deploy-to-app-store.sh
```

Or manually in Xcode:
1. Product → Archive
2. Distribute App → App Store Connect
3. Upload to App Store Connect

## 🖥️ Mac App Store Deployment

### Step 1: Build Electron App

```bash
# Build for Mac App Store
npm run dist:mas
```

### Step 2: Sign and Package

The deployment script handles signing automatically if certificates are configured:

```bash
# Build, sign, and package for Mac App Store
./scripts/deploy-to-app-store.sh
```

### Step 3: Upload to App Store Connect

```bash
# Upload Mac app
xcrun altool --upload-app \
  -f "dist-electron/LumenQI-macOS.pkg" \
  -u "your-apple-id@example.com" \
  -p "app-specific-password"
```

## 🎨 Assets & Icons

### Generate App Icons

```bash
# Generate all required icon sizes
./scripts/build-apple-icons.sh
```

This creates:
- iOS: All required App Store icon sizes
- macOS: .icns file for Mac app
- Asset catalogs ready for Xcode

### Required Assets

- **App Icons**: Generated automatically from your logo
- **Screenshots**: Create in Xcode Simulator or devices
- **App Preview Videos**: Optional but recommended

## 🚀 App Store Connect Configuration

### App Information

1. **App Name**: "Lumen QI"
2. **Bundle ID**: `com.lumen.qi`
3. **Category**: Productivity
4. **Age Rating**: Configure based on AI features
5. **Price**: Free (configure in-app purchases if needed)

### App Description

```
Lumen QI - Your Intelligent AI Companion

Experience the future of AI interaction with Lumen QI, featuring:

🗣️ Natural Voice Conversations
📅 Proactive Calendar Integration  
💬 Advanced Chat Capabilities
🔧 Code Generation & Development
🌐 Real-time Information Access
🎯 Personalized Learning & Adaptation

Lumen QI learns your preferences and provides contextual assistance across all your Apple devices with seamless synchronization.

Perfect for professionals, developers, students, and anyone seeking an intelligent digital companion.

Features:
• Voice-activated commands with Siri integration
• Smart calendar reminders and scheduling
• Real-time web search and current information
• Advanced code generation and debugging
• Cross-device synchronization
• Privacy-focused local AI processing
• Dark mode and accessibility support
```

### Keywords

```
AI, Assistant, Productivity, Voice, Chat, Siri, Calendar, Development, Code, Smart
```

### Privacy Policy

Update your privacy policy to include:
- Voice data processing
- Calendar access
- Location services (if used)
- Data synchronization between devices

## 🔒 App Review Guidelines

### Ensure Compliance

1. **AI Disclosure**: Clearly indicate AI-generated content
2. **Data Privacy**: Explain data collection and usage
3. **Functionality**: Ensure all features work without crashes
4. **Design**: Follow Apple Human Interface Guidelines
5. **Content**: No inappropriate or harmful content

### Testing Checklist

- [ ] App launches successfully
- [ ] Voice recognition works properly
- [ ] Calendar integration functions correctly
- [ ] All permissions are properly requested
- [ ] App handles network connectivity issues
- [ ] Dark mode support works
- [ ] Accessibility features functional
- [ ] No crashes during review scenarios

## 📋 Submission Process

### 1. TestFlight (Recommended)

Before App Store submission:

```bash
# Build and upload to TestFlight
./scripts/deploy-to-app-store.sh
```

1. Upload build to App Store Connect
2. Configure TestFlight testing
3. Invite internal/external testers
4. Gather feedback and fix issues

### 2. App Store Submission

1. **Build**: Upload final build
2. **Metadata**: Complete all app information
3. **Screenshots**: Add for all supported devices
4. **Review Notes**: Provide testing credentials if needed
5. **Submit**: Submit for review

### 3. Review Timeline

- **Standard Review**: 7 days average
- **Expedited Review**: 2-4 days (limited requests)
- **Review Response**: Address any rejection feedback promptly

## 🛠️ Development Commands

```bash
# Development
npm run dev                    # Start development server
npm run electron:dev          # Start Electron in development

# Building
npm run build                 # Build web application
npm run electron:build        # Build Electron apps
npm run dist:mac              # Build macOS app
npm run dist:mas              # Build for Mac App Store

# iOS Development
npm run capacitor:sync        # Sync web build to iOS
npm run capacitor:open:ios    # Open in Xcode
npm run ios:build             # Build iOS app

# Apple Deployment  
./scripts/deploy-to-app-store.sh    # Complete Apple deployment
./scripts/build-apple-icons.sh      # Generate app icons
```

## 🆘 Troubleshooting

### Common Issues

1. **Code Signing Errors**
   - Verify certificates are installed
   - Check provisioning profile validity
   - Ensure Team ID matches

2. **Build Failures**
   - Clean build folder: `rm -rf ios/build`
   - Clean Xcode derived data
   - Restart Xcode

3. **App Store Rejection**
   - Review Apple's rejection feedback carefully
   - Test on actual devices, not just simulators
   - Ensure all metadata is complete and accurate

### Support

- Apple Developer Support: https://developer.apple.com/support/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Capacitor iOS Documentation: https://capacitorjs.com/docs/ios

## ✅ Success Checklist

- [ ] Apple Developer account configured
- [ ] Certificates and provisioning profiles created
- [ ] iOS app builds and archives successfully
- [ ] Mac app builds and signs correctly
- [ ] All app icons generated and configured
- [ ] App Store Connect metadata completed
- [ ] TestFlight testing completed
- [ ] Final submission successful

---

**Ready for Apple App Store! 🍎🚀**

Your Lumen QI app is now configured for both Mac App Store and iOS App Store deployment with your Apple Developer account.