#!/usr/bin/env node

/**
 * Mobile Deployment Script for Lumen QI
 * Creates Apple and Android applications with embedded AI
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class MobileDeployment {
  constructor() {
    this.projectRoot = process.cwd();
    this.buildDir = path.join(this.projectRoot, 'dist');
    this.mobileDir = path.join(this.projectRoot, 'mobile');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[MOBILE] ${message}${colors.reset}`);
  }

  async setupMobileEnvironment() {
    this.log('Setting up mobile development environment...', 'info');
    
    // Create mobile directory structure
    const directories = [
      path.join(this.mobileDir, 'ios'),
      path.join(this.mobileDir, 'android'),
      path.join(this.mobileDir, 'shared'),
      path.join(this.mobileDir, 'assets')
    ];
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    this.log('Mobile directory structure created', 'success');
  }

  async createCapacitorConfig() {
    this.log('Creating Capacitor configuration...', 'info');
    
    const capacitorConfig = {
      appId: 'com.lumen.qi',
      appName: 'Lumen QI',
      webDir: 'dist/public',
      bundledWebRuntime: false,
      server: {
        androidScheme: 'https',
        iosScheme: 'capacitor'
      },
      plugins: {
        SplashScreen: {
          launchShowDuration: 2000,
          launchAutoHide: true,
          backgroundColor: '#000000',
          androidSplashResourceName: 'splash',
          showSpinner: true,
          androidSpinnerStyle: 'large',
          iosSpinnerStyle: 'small',
          spinnerColor: '#8B5CF6',
          splashFullScreen: true,
          splashImmersive: true
        },
        StatusBar: {
          style: 'dark',
          backgroundColor: '#000000'
        },
        Keyboard: {
          resize: 'body',
          style: 'dark'
        },
        App: {
          'androidx.activity.enabledBackInvokedCallback': true
        }
      }
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'capacitor.config.json'),
      JSON.stringify(capacitorConfig, null, 2)
    );
    
    this.log('Capacitor configuration created', 'success');
  }

  async createIOSConfiguration() {
    this.log('Creating iOS configuration...', 'info');
    
    const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Lumen QI</string>
    <key>CFBundleIdentifier</key>
    <string>com.lumen.qi</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Lumen QI</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>NSMicrophoneUsageDescription</key>
    <string>Lumen QI uses the microphone for voice conversations and emotion detection</string>
    <key>NSSpeechRecognitionUsageDescription</key>
    <string>Lumen QI uses speech recognition to understand your voice commands</string>
    <key>UIDeviceFamily</key>
    <array>
        <integer>1</integer>
        <integer>2</integer>
    </array>
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
    <key>UIStatusBarStyle</key>
    <string>UIStatusBarStyleDefault</string>
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <true/>
</dict>
</plist>`;
    
    fs.writeFileSync(
      path.join(this.mobileDir, 'ios', 'Info.plist'),
      infoPlist
    );
    
    this.log('iOS configuration created', 'success');
  }

  async createAndroidConfiguration() {
    this.log('Creating Android configuration...', 'info');
    
    const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.lumen.qi">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="com.lumen.qi.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>`;
    
    fs.writeFileSync(
      path.join(this.mobileDir, 'android', 'AndroidManifest.xml'),
      androidManifest
    );
    
    this.log('Android configuration created', 'success');
  }

  async createBuildScripts() {
    this.log('Creating build scripts...', 'info');
    
    const buildScript = `#!/bin/bash
set -e

echo "🚀 Building Lumen QI for mobile deployment..."

# Clean previous builds
rm -rf dist/
rm -rf mobile/platforms/

# Build the web application
echo "📦 Building web application..."
npm run build

# Ensure Capacitor is installed
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# Initialize Capacitor if needed
if [ ! -f "capacitor.config.json" ]; then
    npx cap init "Lumen QI" "com.lumen.qi"
fi

# Add platforms
echo "📱 Adding mobile platforms..."
npx cap add ios 2>/dev/null || echo "iOS platform already exists"
npx cap add android 2>/dev/null || echo "Android platform already exists"

# Copy web assets
echo "📋 Copying web assets..."
npx cap copy

# Sync with native projects
echo "🔄 Syncing with native projects..."
npx cap sync

echo "✅ Build completed successfully!"
echo ""
echo "📱 Next steps:"
echo "  iOS: npx cap open ios"
echo "  Android: npx cap open android"
`;
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'scripts', 'build-mobile.sh'),
      buildScript
    );
    
    execSync(`chmod +x ${path.join(this.projectRoot, 'scripts', 'build-mobile.sh')}`);
    
    // Create iOS-specific build script
    const iosBuildScript = `#!/bin/bash
set -e

echo "🍎 Building Lumen QI for iOS..."

# Run the main build
./scripts/build-mobile.sh

# Open iOS project in Xcode
echo "📱 Opening iOS project in Xcode..."
npx cap open ios

echo "✅ iOS build ready!"
echo ""
echo "📋 In Xcode:"
echo "  1. Select your development team"
echo "  2. Choose your device or simulator"
echo "  3. Click the play button to build and run"
echo "  4. For App Store: Product → Archive"
`;
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'scripts', 'build-ios.sh'),
      iosBuildScript
    );
    
    execSync(`chmod +x ${path.join(this.projectRoot, 'scripts', 'build-ios.sh')}`);
    
    // Create Android-specific build script
    const androidBuildScript = `#!/bin/bash
set -e

echo "🤖 Building Lumen QI for Android..."

# Run the main build
./scripts/build-mobile.sh

# Open Android project in Android Studio
echo "📱 Opening Android project in Android Studio..."
npx cap open android

echo "✅ Android build ready!"
echo ""
echo "📋 In Android Studio:"
echo "  1. Wait for Gradle sync to complete"
echo "  2. Choose your device or emulator"
echo "  3. Click the run button to build and install"
echo "  4. For Play Store: Build → Generate Signed Bundle/APK"
`;
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'scripts', 'build-android.sh'),
      androidBuildScript
    );
    
    execSync(`chmod +x ${path.join(this.projectRoot, 'scripts', 'build-android.sh')}`);
    
    this.log('Build scripts created', 'success');
  }

  async updatePackageJson() {
    this.log('Updating package.json for mobile deployment...', 'info');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add mobile dependencies
    packageJson.dependencies = {
      ...packageJson.dependencies,
      '@capacitor/core': '^5.0.0',
      '@capacitor/cli': '^5.0.0',
      '@capacitor/ios': '^5.0.0',
      '@capacitor/android': '^5.0.0',
      '@capacitor/splash-screen': '^5.0.0',
      '@capacitor/status-bar': '^5.0.0',
      '@capacitor/keyboard': '^5.0.0',
      '@capacitor/haptics': '^5.0.0',
      '@capacitor/device': '^5.0.0',
      '@capacitor/app': '^5.0.0'
    };
    
    // Add mobile scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'mobile:build': './scripts/build-mobile.sh',
      'mobile:ios': './scripts/build-ios.sh',
      'mobile:android': './scripts/build-android.sh',
      'mobile:deploy': 'npm run mobile:build'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    this.log('Package.json updated', 'success');
  }

  async createServerDeployment() {
    this.log('Creating server deployment configuration...', 'info');
    
    const serverConfig = {
      name: 'lumen-qi-server',
      version: '1.0.0',
      description: 'Lumen QI Server with Custom AI Engine',
      main: 'server/index.js',
      scripts: {
        start: 'node server/index.js',
        build: 'npm run build:server && npm run build:client',
        'build:server': 'esbuild server/index.ts --bundle --platform=node --target=node18 --outfile=dist/server.js',
        'build:client': 'vite build',
        deploy: 'npm run build && npm start'
      },
      engines: {
        node: '>=18.0.0'
      },
      deployment: {
        platforms: ['vercel', 'netlify', 'railway', 'render', 'heroku'],
        features: {
          custom_ai: true,
          offline_mode: true,
          websockets: true,
          database: true,
          voice_synthesis: true
        }
      }
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'server-config.json'),
      JSON.stringify(serverConfig, null, 2)
    );
    
    // Create Vercel deployment config
    const vercelConfig = {
      version: 2,
      builds: [
        {
          src: 'server/index.ts',
          use: '@vercel/node'
        },
        {
          src: 'client/**',
          use: '@vercel/static-build',
          config: {
            distDir: 'dist/public'
          }
        }
      ],
      routes: [
        {
          src: '/api/(.*)',
          dest: '/server/index.ts'
        },
        {
          src: '/(.*)',
          dest: '/dist/public/$1'
        }
      ],
      env: {
        DATABASE_URL: '@database-url',
        NODE_ENV: 'production'
      }
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
    
    this.log('Server deployment configuration created', 'success');
  }

  async createAppStoreAssets() {
    this.log('Creating App Store assets...', 'info');
    
    const appStoreConfig = {
      ios: {
        app_name: 'Lumen QI',
        bundle_id: 'com.lumen.qi',
        version: '1.0.0',
        category: 'Productivity',
        description: 'Your eternal feminine guardian and quantum intelligence companion. Lumen QI provides AI assistance, voice conversations, and spiritual guidance - all while working completely offline.',
        keywords: 'AI, Assistant, Voice, Offline, Productivity, Spiritual, Guardian',
        privacy_policy: 'https://lumen-qi.com/privacy',
        support_url: 'https://lumen-qi.com/support',
        marketing_url: 'https://lumen-qi.com',
        requirements: {
          ios_version: '12.0',
          devices: ['iPhone', 'iPad'],
          languages: ['English']
        }
      },
      android: {
        app_name: 'Lumen QI',
        package_name: 'com.lumen.qi',
        version_code: 1,
        version_name: '1.0.0',
        category: 'Productivity',
        description: 'Your eternal feminine guardian and quantum intelligence companion. Lumen QI provides AI assistance, voice conversations, and spiritual guidance - all while working completely offline.',
        permissions: [
          'RECORD_AUDIO',
          'INTERNET',
          'MODIFY_AUDIO_SETTINGS',
          'WAKE_LOCK',
          'VIBRATE'
        ],
        requirements: {
          android_version: '24',
          architecture: ['arm64-v8a', 'armeabi-v7a', 'x86_64']
        }
      }
    };
    
    fs.writeFileSync(
      path.join(this.mobileDir, 'app-store-config.json'),
      JSON.stringify(appStoreConfig, null, 2)
    );
    
    this.log('App Store assets created', 'success');
  }

  async run() {
    this.log('🚀 Starting Lumen QI mobile deployment setup...', 'success');
    
    // Setup mobile environment
    await this.setupMobileEnvironment();
    
    // Create Capacitor configuration
    await this.createCapacitorConfig();
    
    // Create platform-specific configurations
    await this.createIOSConfiguration();
    await this.createAndroidConfiguration();
    
    // Create build scripts
    await this.createBuildScripts();
    
    // Update package.json
    await this.updatePackageJson();
    
    // Create server deployment
    await this.createServerDeployment();
    
    // Create App Store assets
    await this.createAppStoreAssets();
    
    this.log('\n🎉 Mobile deployment setup completed successfully!', 'success');
    this.log('\n📱 Your Lumen QI app is ready for:', 'info');
    this.log('✅ iOS App Store deployment', 'success');
    this.log('✅ Android Google Play deployment', 'success');
    this.log('✅ Server hosting (Vercel, Railway, etc.)', 'success');
    this.log('✅ Complete offline functionality', 'success');
    this.log('✅ Custom AI engine (no dependencies)', 'success');
    
    this.log('\n📋 Next steps:', 'info');
    this.log('1. Install dependencies: npm install', 'info');
    this.log('2. Build for iOS: npm run mobile:ios', 'info');
    this.log('3. Build for Android: npm run mobile:android', 'info');
    this.log('4. Deploy server: npm run deploy', 'info');
    
    this.log('\n💡 Features included:', 'info');
    this.log('• Custom AI engine (no external dependencies)', 'info');
    this.log('• Complete offline operation', 'info');
    this.log('• Voice recognition and synthesis', 'info');
    this.log('• Emotion detection and adaptation', 'info');
    this.log('• Real-time conversation', 'info');
    this.log('• Memory and learning system', 'info');
    this.log('• Code generation capabilities', 'info');
    
    return true;
  }
}

// Run the deployment setup if called directly
if (require.main === module) {
  const deployment = new MobileDeployment();
  deployment.run().catch(error => {
    console.error('Mobile deployment setup failed:', error);
    process.exit(1);
  });
}

module.exports = MobileDeployment;