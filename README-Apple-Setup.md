# Apple Development Setup Guide for Lumen QI

This guide covers setting up Lumen QI for iOS and macOS development with Xcode integration.

## 🍎 Xcode Git Integration

### Repository Information
- **Repository URL:** `https://github.com/GenesisJLopez/LumenQI.git`
- **Username:** `GenesisJLopez`
- **Repository Name:** `LumenQI`
- **Default Branch:** `main`

> ⚠️ **Important:** If you get a "repository not found" error, you need to create the GitHub repository first. See the troubleshooting section below.

### Method 1: Clone in Xcode (Recommended)

1. **Open Xcode**
2. **Welcome Screen:** Click "Clone an existing project"
   - Or go to **Source Control > Clone...**
3. **Enter Repository URL:** `https://github.com/GenesisJLopez/LumenQI.git`
4. **Authentication:** Enter your GitHub credentials
5. **Choose Location:** Select where to save the project locally
6. **Clone:** Xcode will clone and open the project

### Method 2: Add Remote to Existing Project

If you already have the iOS project locally:

1. **Open Terminal** in your project directory
2. **Navigate to iOS folder:** `cd ios`
3. **Add remote:** `git remote add origin https://github.com/GenesisJLopez/LumenQI.git`
4. **Open Xcode:** `open App/App.xcworkspace`
5. **Xcode will detect** the Git repository automatically

### Method 3: Use Setup Script

Run the automated setup script:

```bash
./scripts/setup-xcode-git.sh
```

This script will:
- Initialize Git in the iOS directory
- Add the correct remote URL
- Create iOS-specific .gitignore
- Verify the configuration

## 📱 iOS Project Structure

```
ios/
├── App/
│   ├── App.xcworkspace          # Main Xcode workspace (open this)
│   ├── App.xcodeproj            # Xcode project file
│   ├── App/
│   │   ├── Info.plist           # iOS app configuration
│   │   ├── Assets.xcassets      # App icons and images
│   │   └── ...
│   └── Pods/                    # CocoaPods dependencies
├── Podfile                      # CocoaPods configuration
└── .gitignore                   # iOS-specific Git ignore rules
```

## 🔧 Xcode Source Control Features

Once connected, you can use Xcode's built-in Git features:

### Source Control Navigator (⌘2)
- View repository status
- See file changes and history
- Manage branches
- Perform commits and pushes

### Source Control Menu
- **Commit:** Stage and commit changes
- **Push:** Push commits to GitHub
- **Pull:** Pull latest changes
- **Branch:** Create and switch branches
- **Merge:** Merge branches
- **Compare:** View file differences

### Common Git Operations in Xcode

1. **Stage Changes:**
   - Source Control Navigator > Select files > Right-click > "Stage for Commit"

2. **Commit Changes:**
   - Source Control > Commit...
   - Enter commit message
   - Click "Commit"

3. **Push to GitHub:**
   - Source Control > Push...
   - Select remote and branch
   - Click "Push"

4. **Pull Changes:**
   - Source Control > Pull...
   - Select remote and branch
   - Click "Pull"

## 🛠️ Build Configuration

### Required for iOS Development

1. **Apple Developer Account**
   - Sign up at [developer.apple.com](https://developer.apple.com)
   - Configure team in Xcode project settings

2. **Signing & Capabilities**
   - Open project in Xcode
   - Select "App" target
   - Go to "Signing & Capabilities" tab
   - Select your development team
   - Configure bundle identifier: `com.lumen.qi`

3. **Provisioning Profiles**
   - Xcode will manage automatically for development
   - For App Store: Create distribution profiles in Apple Developer portal

### Build Targets

- **App (iOS):** Main iOS application
- **App (macOS):** Mac Catalyst version (if enabled)

## 📋 Development Workflow

### 1. Initial Setup
```bash
# Clone the repository
git clone https://github.com/GenesisJLopez/LumenQI.git
cd LumenQI

# Install dependencies
npm install

# Build web assets
npm run build

# Add iOS platform
npx cap add ios

# Sync Capacitor
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### 2. Development Cycle
```bash
# Make changes to web code
# Rebuild web assets
npm run build

# Sync changes to iOS
npx cap sync ios

# Open Xcode and build/run
npx cap open ios
```

### 3. Git Workflow in Xcode
1. Make changes to iOS-specific files in Xcode
2. Use Source Control Navigator to review changes
3. Commit changes with descriptive messages
4. Push to GitHub repository
5. Pull latest changes from other contributors

## 🚀 Deployment

### Development Testing
- Use Xcode's iOS Simulator
- Deploy to physical devices for testing
- Use TestFlight for beta distribution

### App Store Distribution
1. **Archive:** Product > Archive in Xcode
2. **Validate:** Use Xcode Organizer to validate
3. **Upload:** Upload to App Store Connect
4. **Review:** Submit for Apple review

## 🔐 Security & Credentials

### GitHub Authentication
- Use personal access tokens instead of passwords
- Configure in Xcode: Preferences > Accounts > GitHub

### Apple Developer Certificates
- Development certificates for testing
- Distribution certificates for App Store
- Managed automatically by Xcode for most cases

## 📚 Additional Resources

- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation)
- [Git in Xcode Guide](https://developer.apple.com/documentation/xcode/source-control-management)

## 🆘 Troubleshooting

### Common Issues

1. **"Repository not found" / "Make sure a valid repository exists"**
   - The GitHub repository doesn't exist yet
   - **Solution:** Create repository at github.com:
     1. Go to GitHub.com and sign in
     2. Click "+" → "New repository"
     3. Name: `LumenQI`
     4. Make it public, add README and MIT license
     5. Click "Create repository"

2. **"No remote configured"**
   - Run: `git remote add origin https://github.com/GenesisJLopez/LumenQI.git`

3. **Authentication failed**
   - Use GitHub personal access token instead of password
   - Configure in Xcode: Preferences > Accounts > GitHub

4. **Workspace not found**
   - iOS project structure incomplete
   - **Solution:** Run `npx cap add ios` to create iOS project
   - Open `ios/App/App.xcworkspace`, not `.xcodeproj`

5. **Build failures**
   - Clean build folder: Product > Clean Build Folder
   - Sync Capacitor: `npx cap sync ios`
   - Update dependencies: `cd ios && pod update`

### Getting Help

- Check GitHub Issues: https://github.com/GenesisJLopez/LumenQI/issues
- Capacitor Community: https://capacitorjs.com/community
- Apple Developer Forums: https://developer.apple.com/forums