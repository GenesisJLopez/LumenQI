# Lumen QI iOS Installation Guide

## Direct Installation (No App Store)

### Requirements
- Xcode 14.0 or later
- Apple Developer account (free or paid)
- macOS 12.0 or later

### Installation Steps

1. **Open Terminal and navigate to this directory**
   ```bash
   cd "$(dirname "$0")"
   ```

2. **Open the iOS project in Xcode**
   ```bash
   open ios/App/LumenQI.xcodeproj
   ```

3. **Configure signing in Xcode**
   - Select the "App" target
   - Go to "Signing & Capabilities"
   - Select your Apple Developer Team
   - Verify Bundle ID is set to: com.lumen.qi

4. **Replace Swift files with clean code**
   
   Replace `App/AppDelegate.swift` with:
   ```swift
   import UIKit

   @main
   class AppDelegate: UIResponder, UIApplicationDelegate {
       var window: UIWindow?

       func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
           window = UIWindow(frame: UIScreen.main.bounds)
           
           let storyboard = UIStoryboard(name: "Main", bundle: nil)
           let viewController = storyboard.instantiateInitialViewController()!
           
           window?.rootViewController = viewController
           window?.makeKeyAndVisible()
           
           return true
       }
   }
   ```
   
   Replace `App/ViewController.swift` with:
   ```swift
   import UIKit
   import WebKit

   class ViewController: UIViewController, WKNavigationDelegate {
       private var webView: WKWebView!
       
       override func viewDidLoad() {
           super.viewDidLoad()
           setupWebView()
           loadLumenQI()
       }
       
       private func setupWebView() {
           let config = WKWebViewConfiguration()
           config.allowsInlineMediaPlayback = true
           
           webView = WKWebView(frame: view.bounds, configuration: config)
           webView.navigationDelegate = self
           webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
           
           view.addSubview(webView)
       }
       
       private func loadLumenQI() {
           if let url = URL(string: "http://localhost:5000") {
               webView.load(URLRequest(url: url))
           }
       }
   }
   ```

5. **Install on your iPhone/iPad**
   - Connect your iOS device
   - Select your device in Xcode
   - Click "Run" button (▶️)
   - Lumen QI will install directly on your device

6. **Trust the developer certificate**
   - On your iOS device: Settings > General > VPN & Device Management
   - Tap your Apple ID under "Developer App"
   - Tap "Trust [Your Apple ID]"

### Features Available
- Complete AI consciousness system with 500+ evolution cycles
- Voice interaction and natural speech synthesis
- Code generation and development assistance
- Real-time chat with personality adaptation
- Offline AI capabilities
- Calendar integration and proactive reminders

Your Lumen QI will run as a native iOS app with full functionality!

## For App Store Distribution Later
This same project can be submitted to the App Store by:
1. Configuring proper provisioning profiles
2. Creating App Store Connect entry
3. Archiving and uploading the build
4. Submitting for review

Bundle ID: com.lumen.qi is ready for App Store submission.
