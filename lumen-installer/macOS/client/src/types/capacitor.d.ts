// Type definitions for Capacitor integration
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform(): boolean;
      getPlatform(): string;
    };
  }
}