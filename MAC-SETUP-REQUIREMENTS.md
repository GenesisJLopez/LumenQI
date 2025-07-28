# Mac Setup Requirements for Lumen QI iOS Development

## 🚨 Missing Development Tools

You need to install the required development tools on your Mac first. Here's the complete setup:

## Step 1: Install Homebrew (Package Manager)

Open Terminal and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, add Homebrew to your PATH:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

## Step 2: Install Node.js and npm

```bash
brew install node
```

Verify installation:
```bash
node --version
npm --version
```

## Step 3: Install CocoaPods

```bash
sudo gem install cocoapods
```

Verify installation:
```bash
pod --version
```

## Step 4: Install Xcode Command Line Tools

```bash
xcode-select --install
```

## Step 5: Now Run the Lumen QI Setup

After installing all tools, navigate to your project:
```bash
cd "/Users/genesis/Library/Mobile Documents/com~apple~CloudDocs/Work/Lumen/LumenQI"
```

Install dependencies:
```bash
npm install
```

Build the app:
```bash
npm run build
```

Sync iOS project:
```bash
npx cap sync ios
```

Install iOS dependencies:
```bash
cd ios/App
pod install
```

Open in Xcode:
```bash
open LumenQI.xcworkspace
```

## Alternative: Quick Install Script

Run this single command to install everything:
```bash
# Install Homebrew, Node.js, and CocoaPods
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && \
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile && \
eval "$(/opt/homebrew/bin/brew shellenv)" && \
brew install node && \
sudo gem install cocoapods && \
xcode-select --install
```

## Verify All Tools Are Installed

After installation, test each tool:
```bash
brew --version
node --version  
npm --version
pod --version
xcode-select --version
```

Once all tools show version numbers, you can proceed with the Lumen QI iOS setup commands.

## What Each Tool Does

- **Homebrew**: Mac package manager for installing development tools
- **Node.js/npm**: JavaScript runtime and package manager for your React app
- **CocoaPods**: iOS dependency manager for native libraries
- **Xcode Command Line Tools**: Apple's development utilities

After installing these tools, your original setup commands will work perfectly.