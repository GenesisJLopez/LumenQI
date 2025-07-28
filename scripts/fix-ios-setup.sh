#!/bin/bash

# Fix iOS Setup - Replace Capacitor Dependencies with Native Code
echo "🔧 Fixing iOS setup by removing Capacitor dependencies..."

PROJECT_DIR="/Users/genesis/Library/Mobile Documents/com~apple~CloudDocs/Work/Lumen/LumenQI"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR/ios/App"

# Replace AppDelegate.swift with clean native code
echo "📝 Creating clean AppDelegate.swift..."
cat > App/AppDelegate.swift << 'EOF'
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        
        let viewController = ViewController()
        window?.rootViewController = viewController
        window?.makeKeyAndVisible()
        
        return true
    }
}
EOF

# Create clean ViewController.swift
echo "📱 Creating clean ViewController.swift..."
cat > App/ViewController.swift << 'EOF'
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
        config.mediaTypesRequiringUserActionForPlayback = []
        
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(webView)
        
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
    
    private func loadLumenQI() {
        // Try loading local files first, fallback to development server
        if let bundlePath = Bundle.main.path(forResource: "public/index", ofType: "html"),
           let url = URL(string: "file://\(bundlePath)") {
            webView.loadFileURL(url, allowingReadAccessTo: URL(fileURLWithPath: Bundle.main.bundlePath))
        } else if let url = URL(string: "http://localhost:5000") {
            let request = URLRequest(url: url)
            webView.load(request)
        } else {
            showErrorPage()
        }
    }
    
    private func showErrorPage() {
        let html = """
        <html>
        <head>
            <title>Lumen QI</title>
            <style>
                body { font-family: -apple-system; text-align: center; padding: 50px; }
                .logo { font-size: 24px; color: #6366f1; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="logo">Lumen QI</div>
            <p>Starting up...</p>
        </body>
        </html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }
    
    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("Failed to load: \(error.localizedDescription)")
        showErrorPage()
    }
}
EOF

# Update Main.storyboard to remove references to Capacitor
echo "📋 Creating clean Main.storyboard..."
cat > App/Base.lproj/Main.storyboard << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21507" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="BYZ-38-t0r">
    <device id="retina6_12" orientation="portrait" appearance="light"/>
    <dependencies>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21505"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="System colors in document" minToolsVersion="11.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <scene sceneID="tne-QT-ifu">
            <objects>
                <viewController id="BYZ-38-t0r" customClass="ViewController" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="8bC-Xf-vdC">
                        <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <viewLayoutGuide key="safeArea" id="6Tk-OE-BBY"/>
                        <color key="backgroundColor" systemColor="systemBackgroundColor"/>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="dkx-z0-nzr" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="118.32061068702291" y="-27.464788732394368"/>
        </scene>
    </scenes>
    <resources>
        <systemColor name="systemBackgroundColor">
            <color white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
        </systemColor>
    </resources>
</document>
EOF

echo "✅ iOS setup fixed!"
echo "📱 Opening clean Xcode project..."
open *.xcodeproj

echo ""
echo "🎯 The project should now open without Capacitor import errors."
echo "Select your Apple Developer team in Signing & Capabilities and run the app."
EOF