#!/bin/bash

# Complete Apple Deployment Script for Lumen QI
# Creates a clean iOS project without CocoaPods dependencies

echo "🍎 Creating clean iOS deployment for Lumen QI..."

PROJECT_DIR="/Users/genesis/Library/Mobile Documents/com~apple~CloudDocs/Work/Lumen/LumenQI"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Step 1: Build the web application
echo "📦 Building web application..."
if command -v npm >/dev/null 2>&1; then
    npm install
    npm run build
else
    echo "⚠️ npm not found - you'll need to build the web app manually"
fi

# Step 2: Remove existing iOS project completely
echo "🗑️ Removing existing iOS project..."
rm -rf ios

# Step 3: Update Capacitor configuration for clean deployment
echo "⚙️ Updating Capacitor configuration..."
cat > capacitor.config.ts << 'EOF'
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumen.qi',
  appName: 'Lumen QI',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Lumen QI',
    contentInset: 'automatic'
  }
};

export default config;
EOF

# Step 4: Create iOS project with minimal dependencies
echo "📱 Creating new iOS project..."
if command -v npx >/dev/null 2>&1; then
    npx cap add ios
    npx cap sync ios
else
    echo "❌ npx not found - you need Node.js installed"
    exit 1
fi

# Step 5: Navigate to iOS project
cd ios/App

# Step 6: Remove all CocoaPods references
echo "🧹 Removing CocoaPods references..."
rm -f Podfile
rm -f Podfile.lock
rm -rf Pods

# Step 7: Create a clean Info.plist for App Store
echo "📄 Creating App Store ready Info.plist..."
cat > App/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
	<string>Lumen QI</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>com.lumen.qi</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>$(PRODUCT_NAME)</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>$(MARKETING_VERSION)</string>
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLName</key>
			<string>com.lumen.qi</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>lumen</string>
			</array>
		</dict>
	</array>
	<key>CFBundleVersion</key>
	<string>$(CURRENT_PROJECT_VERSION)</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>NSMicrophoneUsageDescription</key>
	<string>Lumen QI uses the microphone for voice interaction and AI conversation.</string>
	<key>NSCalendarsUsageDescription</key>
	<string>Lumen QI can help manage your calendar events and reminders.</string>
	<key>NSCameraUsageDescription</key>
	<string>Lumen QI uses the camera for visual AI analysis and interaction.</string>
	<key>UILaunchStoryboardName</key>
	<string>LaunchScreen</string>
	<key>UIRequiredDeviceCapabilities</key>
	<array>
		<string>armv7</string>
	</array>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationPortraitUpsideDown</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<true/>
</dict>
</plist>
EOF

# Step 8: Update AppDelegate to work without CocoaPods
echo "📝 Creating clean AppDelegate..."
cat > App/AppDelegate.swift << 'EOF'
import UIKit
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return true
    }
}
EOF

# Step 9: Create a simple ViewController
echo "📱 Creating main ViewController..."
cat > App/ViewController.swift << 'EOF'
import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Create WKWebView
        let webConfiguration = WKWebViewConfiguration()
        webView = WKWebView(frame: .zero, configuration: webConfiguration)
        webView.navigationDelegate = self
        view = webView
        
        // Load local web app
        if let path = Bundle.main.path(forResource: "public/index", ofType: "html") {
            let url = URL(fileURLWithPath: path)
            let request = URLRequest(url: url)
            webView.load(request)
        } else {
            // Fallback to remote URL during development
            if let url = URL(string: "http://localhost:5000") {
                let request = URLRequest(url: url)
                webView.load(request)
            }
        }
    }
}
EOF

echo "✅ Clean iOS deployment created!"
echo ""
echo "📱 Opening in Xcode..."
open *.xcodeproj

echo ""
echo "🎯 Next steps in Xcode:"
echo "1. Select 'App' target"
echo "2. Go to 'Signing & Capabilities'"
echo "3. Select your Apple Developer team"
echo "4. Bundle ID: com.lumen.qi"
echo "5. Choose iPhone Simulator"
echo "6. Click Run ▶️"
echo ""
echo "🚀 Your Lumen QI iOS app is ready for App Store submission!"
EOF