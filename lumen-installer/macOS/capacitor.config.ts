import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumen.qi',
  appName: 'Lumen QI',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Lumen QI',
    contentInset: 'automatic',
    backgroundColor: '#0a0a0a',
    allowsLinkPreview: false,
    scrollEnabled: true,
    minVersion: '13.0',
    preferredContentMode: 'mobile'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0a0a",
      showSpinner: true,
      spinnerColor: "#a855f7"
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a'
    },
    Device: {
      allowedOrientations: ['portrait', 'landscape']
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#a855f7"
    }
  }
};

export default config;