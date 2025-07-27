/**
 * Apple Ecosystem Integration Service
 * Handles iOS-specific features, Mac App Store integration, and Apple ecosystem APIs
 */

export interface AppleDeviceInfo {
  platform: 'ios' | 'macos' | 'web';
  version: string;
  model: string;
  isSimulator: boolean;
  capabilities: {
    faceid: boolean;
    touchid: boolean;
    camera: boolean;
    microphone: boolean;
    location: boolean;
    notifications: boolean;
    siri: boolean;
    handoff: boolean;
    continuity: boolean;
  };
}

export interface AppleCalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  attendees?: string[];
  allDay: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface AppleNotification {
  id: string;
  title: string;
  body: string;
  badge?: number;
  sound?: string;
  category?: string;
  threadId?: string;
  scheduledAt?: Date;
  data?: Record<string, any>;
}

export class AppleIntegrationService {
  private static instance: AppleIntegrationService;
  private deviceInfo: AppleDeviceInfo | null = null;
  private isCapacitorAvailable = false;

  private constructor() {
    this.checkCapacitorAvailability();
    this.initializeDeviceInfo();
  }

  static getInstance(): AppleIntegrationService {
    if (!AppleIntegrationService.instance) {
      AppleIntegrationService.instance = new AppleIntegrationService();
    }
    return AppleIntegrationService.instance;
  }

  private checkCapacitorAvailability(): void {
    this.isCapacitorAvailable = typeof window !== 'undefined' && 
                               'Capacitor' in window && 
                               (window as any).Capacitor?.isNativePlatform();
  }

  private async initializeDeviceInfo(): Promise<void> {
    if (!this.isCapacitorAvailable) {
      this.deviceInfo = {
        platform: 'web',
        version: navigator.userAgent,
        model: 'Web Browser',
        isSimulator: false,
        capabilities: {
          faceid: false,
          touchid: false,
          camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
          microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
          location: 'geolocation' in navigator,
          notifications: 'Notification' in window,
          siri: false,
          handoff: false,
          continuity: false
        }
      };
      return;
    }

    try {
      const { Device } = await import('@capacitor/device');
      const deviceInfo = await Device.getInfo();
      
      this.deviceInfo = {
        platform: deviceInfo.platform as 'ios' | 'macos',
        version: deviceInfo.osVersion,
        model: deviceInfo.model,
        isSimulator: deviceInfo.isVirtual,
        capabilities: {
          faceid: deviceInfo.platform === 'ios',
          touchid: deviceInfo.platform === 'ios' || deviceInfo.platform === 'macos',
          camera: true,
          microphone: true,
          location: true,
          notifications: true,
          siri: deviceInfo.platform === 'ios',
          handoff: deviceInfo.platform === 'ios' || deviceInfo.platform === 'macos',
          continuity: deviceInfo.platform === 'ios' || deviceInfo.platform === 'macos'
        }
      };
    } catch (error) {
      console.warn('Failed to get device info:', error);
    }
  }

  // Calendar Integration
  async requestCalendarPermission(): Promise<boolean> {
    if (!this.isCapacitorAvailable) {
      return false;
    }

    try {
      // This would be implemented with a custom Capacitor plugin
      // For now, return true as placeholder
      return true;
    } catch (error) {
      console.error('Calendar permission error:', error);
      return false;
    }
  }

  async getCalendarEvents(startDate: Date, endDate: Date): Promise<AppleCalendarEvent[]> {
    if (!this.isCapacitorAvailable) {
      return [];
    }

    try {
      // This would integrate with iOS EventKit
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  }

  async createCalendarEvent(event: Omit<AppleCalendarEvent, 'id'>): Promise<string | null> {
    if (!this.isCapacitorAvailable) {
      return null;
    }

    try {
      // This would create an event using iOS EventKit
      // For now, return a mock ID
      return `event_${Date.now()}`;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      return null;
    }
  }

  // Local Notifications
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (this.isCapacitorAvailable) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } else {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  async scheduleNotification(notification: AppleNotification): Promise<boolean> {
    try {
      if (this.isCapacitorAvailable) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.schedule({
          notifications: [{
            id: parseInt(notification.id),
            title: notification.title,
            body: notification.body,
            schedule: notification.scheduledAt ? {
              at: notification.scheduledAt
            } : undefined,
            extra: notification.data,
            sound: notification.sound,
            badge: notification.badge
          }]
        });
        return true;
      } else {
        // Web notification fallback
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            badge: notification.badge,
            data: notification.data
          });
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
    return false;
  }

  // Voice & Speech
  async requestSpeechRecognitionPermission(): Promise<boolean> {
    if (!this.isCapacitorAvailable) {
      return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    try {
      // This would request iOS Speech Recognition permission
      return true;
    } catch (error) {
      console.error('Speech recognition permission error:', error);
      return false;
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (this.isCapacitorAvailable) {
        // This would request iOS microphone permission
        return true;
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  }

  // Siri Integration (iOS only)
  async registerSiriShortcuts(): Promise<boolean> {
    if (!this.isCapacitorAvailable || this.deviceInfo?.platform !== 'ios') {
      return false;
    }

    try {
      // This would register Siri shortcuts for Lumen QI
      // Common shortcuts: "Hey Siri, open Lumen", "Hey Siri, ask Lumen about..."
      return true;
    } catch (error) {
      console.error('Failed to register Siri shortcuts:', error);
      return false;
    }
  }

  // Haptic Feedback (iOS/Mac)
  async triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    try {
      if (this.isCapacitorAvailable) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        const style = type === 'light' ? ImpactStyle.Light : 
                     type === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Medium;
        await Haptics.impact({ style });
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  // App State & Lifecycle
  async handleAppStateChange(callback: (isActive: boolean) => void): Promise<void> {
    if (this.isCapacitorAvailable) {
      const { App } = await import('@capacitor/app');
      App.addListener('appStateChange', ({ isActive }) => {
        callback(isActive);
      });
    } else {
      // Web fallback
      document.addEventListener('visibilitychange', () => {
        callback(!document.hidden);
      });
    }
  }

  // Deep Linking
  async handleDeepLinks(callback: (url: string) => void): Promise<void> {
    if (this.isCapacitorAvailable) {
      const { App } = await import('@capacitor/app');
      App.addListener('appUrlOpen', ({ url }) => {
        callback(url);
      });
    }
  }

  // Share Integration
  async shareText(text: string, title?: string): Promise<boolean> {
    try {
      if (this.isCapacitorAvailable) {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: title || 'Shared from Lumen QI',
          text: text,
          dialogTitle: 'Share with...'
        });
        return true;
      } else if (navigator.share) {
        await navigator.share({
          title: title || 'Shared from Lumen QI',
          text: text
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
    return false;
  }

  // Device Information
  getDeviceInfo(): AppleDeviceInfo | null {
    return this.deviceInfo;
  }

  isAppleDevice(): boolean {
    return this.deviceInfo?.platform === 'ios' || this.deviceInfo?.platform === 'macos';
  }

  isIOS(): boolean {
    return this.deviceInfo?.platform === 'ios';
  }

  isMacOS(): boolean {
    return this.deviceInfo?.platform === 'macos';
  }

  // Check if running in Mac App Store build
  isMacAppStore(): boolean {
    return this.isMacOS() && this.isCapacitorAvailable;
  }

  // Check if running in iOS App Store build
  isIOSAppStore(): boolean {
    return this.isIOS() && this.isCapacitorAvailable;
  }
}

export const appleIntegration = AppleIntegrationService.getInstance();