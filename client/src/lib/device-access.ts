// Device Access and Environment Awareness System for Lumen
// Designed for Apple Desktop and Mobile Applications

export interface DeviceCapabilities {
  microphone: boolean;
  camera: boolean;
  location: boolean;
  storage: boolean;
  notifications: boolean;
  sensors: boolean;
  network: boolean;
  system: boolean;
}

export interface EnvironmentInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  platform: string;
  userAgent: string;
  screenResolution: { width: number; height: number };
  availableMemory?: number;
  connectionType?: string;
  batteryLevel?: number;
  orientation?: string;
  permissions: DeviceCapabilities;
}

class DeviceAccessManager {
  private capabilities: DeviceCapabilities = {
    microphone: false,
    camera: false,
    location: false,
    storage: false,
    notifications: false,
    sensors: false,
    network: false,
    system: false
  };

  async requestAllPermissions(): Promise<DeviceCapabilities> {
    console.log('🔐 Requesting comprehensive device access for Lumen...');
    
    // Request microphone with high-quality audio settings
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 2
        }
      });
      this.capabilities.microphone = true;
      audioStream.getTracks().forEach(track => track.stop());
      console.log('✅ Microphone access granted');
    } catch (error) {
      console.warn('❌ Microphone access denied:', error);
    }

    // Request camera access
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        }
      });
      this.capabilities.camera = true;
      videoStream.getTracks().forEach(track => track.stop());
      console.log('✅ Camera access granted');
    } catch (error) {
      console.warn('❌ Camera access denied:', error);
    }

    // Request location access
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      this.capabilities.location = true;
      console.log('✅ Location access granted');
    } catch (error) {
      console.warn('❌ Location access denied:', error);
    }

    // Request notification permissions
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        this.capabilities.notifications = permission === 'granted';
        console.log(`${this.capabilities.notifications ? '✅' : '❌'} Notification access: ${permission}`);
      }
    } catch (error) {
      console.warn('❌ Notification access failed:', error);
    }

    // Check storage capabilities
    try {
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const persistent = await navigator.storage.persist();
        this.capabilities.storage = persistent;
        console.log(`${persistent ? '✅' : '❌'} Persistent storage: ${persistent}`);
      }
    } catch (error) {
      console.warn('❌ Storage access failed:', error);
    }

    // Check sensor access (accelerometer, gyroscope, etc.)
    try {
      if ('DeviceMotionEvent' in window) {
        // For iOS 13+, we need to request permission
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          this.capabilities.sensors = permission === 'granted';
        } else {
          this.capabilities.sensors = true;
        }
        console.log(`${this.capabilities.sensors ? '✅' : '❌'} Motion sensors access`);
      }
    } catch (error) {
      console.warn('❌ Sensor access failed:', error);
    }

    // Network information
    this.capabilities.network = 'navigator' in window && 'onLine' in navigator;
    console.log(`${this.capabilities.network ? '✅' : '❌'} Network access`);

    // System information (limited in browsers, full in native apps)
    this.capabilities.system = 'userAgent' in navigator;

    return this.capabilities;
  }

  async getEnvironmentInfo(): Promise<EnvironmentInfo> {
    const info: EnvironmentInfo = {
      deviceType: this.detectDeviceType(),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screenResolution: {
        width: window.screen.width,
        height: window.screen.height
      },
      permissions: this.capabilities
    };

    // Get additional info if available
    try {
      if ('memory' in (performance as any)) {
        info.availableMemory = (performance as any).memory.usedJSHeapSize;
      }
      
      if ('connection' in navigator) {
        info.connectionType = (navigator as any).connection.effectiveType;
      }

      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        info.batteryLevel = Math.round(battery.level * 100);
      }

      if (screen.orientation) {
        info.orientation = screen.orientation.type;
      }
    } catch (error) {
      console.warn('Additional device info unavailable:', error);
    }

    return info;
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/ipad|tablet|playbook|silk/.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(userAgent)) {
      return 'mobile';
    }
    
    if (/macintosh|windows|linux/.test(userAgent)) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  async enableContinuousListening(): Promise<MediaStream | null> {
    if (!this.capabilities.microphone) {
      await this.requestAllPermissions();
    }

    if (this.capabilities.microphone) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });
      } catch (error) {
        console.error('Failed to enable continuous listening:', error);
        return null;
      }
    }
    
    return null;
  }

  getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities };
  }

  // Apple-specific preparation methods
  async prepareForAppleApp(): Promise<void> {
    console.log('🍎 Preparing Lumen for Apple application deployment...');
    
    // Request all permissions upfront for Apple app store compliance
    await this.requestAllPermissions();
    
    // Set up continuous microphone monitoring for wake word detection
    if (this.capabilities.microphone) {
      console.log('🎤 Setting up always-on microphone for wake word detection');
      // This will be enhanced in the native Apple app for background listening
    }

    // Prepare for background processing capabilities
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service worker registered for background processing');
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    }

    console.log('✅ Apple application preparation complete');
  }
}

export const deviceAccess = new DeviceAccessManager();

// Voice Recognition with Enhanced Device Integration
export class EnhancedVoiceRecognition {
  private recognition: any = null;
  private stream: MediaStream | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    // Request microphone access first
    this.stream = await deviceAccess.enableContinuousListening();
    if (!this.stream) {
      console.error('Cannot initialize voice recognition without microphone access');
      return false;
    }

    // Set up speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;

      // Enhanced grammar for better "Lumen" recognition
      if ('webkitSpeechGrammarList' in window) {
        const grammar = `
          #JSGF V1.0; 
          grammar wake_words; 
          public <wake> = lumen | Lumen | LUMEN | hey lumen | hey Lumen;
          public <commands> = what time is it | what's the weather | tell me about | how are you;
        `;
        const speechRecognitionList = new (window as any).webkitSpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        this.recognition.grammars = speechRecognitionList;
      }

      this.isInitialized = true;
      console.log('✅ Enhanced voice recognition initialized');
      return true;
    }

    console.error('Speech recognition not supported');
    return false;
  }

  async startListening(callback: (transcript: string, isFinal: boolean) => void): Promise<void> {
    if (!this.isInitialized) {
      const success = await this.initialize();
      if (!success) return;
    }

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        // Enhanced name correction
        const correctedTranscript = transcript
          .replace(/\bwoman\b/gi, 'Lumen')
          .replace(/\bwomen\b/gi, 'Lumen')
          .replace(/\blumen\b/gi, 'Lumen')
          .replace(/\bluman\b/gi, 'Lumen')
          .replace(/\bloom[ea]n?\b/gi, 'Lumen')
          .replace(/\blewman\b/gi, 'Lumen')
          .replace(/\blumina\b/gi, 'Lumen');
        
        if (event.results[i].isFinal) {
          finalTranscript += correctedTranscript;
        } else {
          interimTranscript += correctedTranscript;
        }
      }
      
      const currentTranscript = finalTranscript || interimTranscript;
      callback(currentTranscript, !!finalTranscript);
    };

    this.recognition.start();
  }

  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}

export const enhancedVoice = new EnhancedVoiceRecognition();