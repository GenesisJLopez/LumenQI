#!/bin/bash

# Xcode Git Integration Setup Script for Lumen QI
# Configures Git repository integration with Xcode for iOS development

echo "🍎 Setting up Xcode Git Integration for Lumen QI..."

# Repository details
REPO_NAME="LumenQI"
REMOTE_URL="https://github.com/GenesisJLopez/LumenQI.git"
BRANCH_NAME="main"

echo "📋 Repository Information:"
echo "  Repository: $REPO_NAME"
echo "  Remote URL: $REMOTE_URL"
echo "  Branch: $BRANCH_NAME"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the project root directory"
    echo "Please run this script from the Lumen QI project root"
    exit 1
fi

# Initialize iOS Capacitor project if not exists
if [ ! -d "ios" ]; then
    echo "📱 Initializing iOS Capacitor project..."
    npx cap add ios
fi

cd ios

# Check for Xcode project
XCODE_PROJECT=""
if [ -f "App/App.xcworkspace" ]; then
    XCODE_PROJECT="App/App.xcworkspace"
    echo "✅ Found Xcode workspace: $XCODE_PROJECT"
elif [ -f "App/App.xcodeproj" ]; then
    XCODE_PROJECT="App/App.xcodeproj"
    echo "✅ Found Xcode project: $XCODE_PROJECT"
else
    echo "❌ No Xcode project found in ios/ directory"
    echo "Run 'npx cap add ios' first to create the iOS project"
    exit 1
fi

# Initialize git in iOS directory if needed
if [ ! -d ".git" ]; then
    echo "🔧 Initializing Git repository in iOS directory..."
    git init
    git branch -M $BRANCH_NAME
fi

# Add remote if not exists
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "🔗 Adding remote origin..."
    git remote add origin $REMOTE_URL
else
    echo "✅ Remote origin already exists"
    git remote set-url origin $REMOTE_URL
fi

# Create .gitignore for iOS if needed
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating iOS .gitignore..."
    cat > .gitignore << 'EOF'
# Xcode
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata/
*.xccheckout
*.moved-aside
DerivedData
*.hmap
*.ipa
*.xcuserstate
*.xcworkspace/xcuserdata/

# CocoaPods
Pods/
Podfile.lock

# Capacitor
App/build/
App/App.xcarchive
dist/

# iOS
*.dSYM.zip
*.dSYM

# fastlane
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots/**/*.png
fastlane/test_output
EOF
fi

# Verify git configuration
echo ""
echo "🔍 Verifying Git Configuration:"
echo "  Remote URL: $(git remote get-url origin)"
echo "  Current Branch: $(git branch --show-current)"
echo "  Git Status:"
git status --short

echo ""
echo "✅ Xcode Git Integration Setup Complete!"
echo ""
echo "📋 Next Steps for Xcode:"
echo "1. Open Xcode: open $XCODE_PROJECT"
echo "2. In Xcode menu: Source Control > Clone..."
echo "3. Enter repository URL: $REMOTE_URL"
echo "4. Or use existing project: Source Control > New Git Repositories..."
echo ""
echo "🔧 Alternative: Open existing project with Git integration"
echo "1. In Xcode: File > Open > Select $XCODE_PROJECT"
echo "2. Xcode will automatically detect the Git repository"
echo "3. Use Source Control navigator (⌘2) to manage Git operations"
echo ""
echo "📱 Repository Details for Xcode:"
echo "  Repository URL: $REMOTE_URL"
echo "  Username: GenesisJLopez"
echo "  Repository Name: LumenQI"
echo "  Default Branch: main"

cd ..