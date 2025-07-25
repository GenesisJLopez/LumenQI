// Universal Device Integration Toolkit for Lumen AI
// Comprehensive hardware and software integration across all platforms

export interface DeviceIntegrationCapabilities {
  audio: {
    microphone: boolean;
    speakers: boolean;
    backgroundListening: boolean;
    noiseReduction: boolean;
    voiceEnhancement: boolean;
  };
  visual: {
    camera: boolean;
    screenCapture: boolean;
    faceDetection: boolean;
    objectRecognition: boolean;
    textRecognition: boolean;
  };
  sensors: {
    accelerometer: boolean;
    gyroscope: boolean;
    magnetometer: boolean;
    proximity: boolean;
    ambient_light: boolean;
    barometer: boolean;
  };
  location: {
    gps: boolean;
    network: boolean;
    indoor: boolean;
    geofencing: boolean;
  };
  connectivity: {
    wifi: boolean;
    cellular: boolean;
    bluetooth: boolean;
    nfc: boolean;
  };
  system: {
    notifications: boolean;
    storage: boolean;
    contacts: boolean;
    calendar: boolean;
    files: boolean;
    clipboard: boolean;
  };
  platform: {
    ios: boolean;
    macos: boolean;
    windows: boolean;
    android: boolean;
    web: boolean;
  };
}

export interface DeviceContext {
  hardware: {
    deviceModel: string;
    osVersion: string;
    screenSize: { width: number; height: number };
    batteryLevel?: number;
    storageUsed?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    networkStrength?: number;
  };
  environment: {
    location?: { lat: number; lng: number; accuracy: number };
    lightLevel?: number;
    noiseLevel?: number;
    motion?: { x: number; y: number; z: number };
    orientation?: string;
    timeZone: string;
    language: string;
  };
  user: {
    activeApp?: string;
    lastActivity?: Date;
    preferredInteractionMode?: 'voice' | 'text' | 'gesture';
    currentFocus?: string;
  };
}

class UniversalDeviceToolkit {
  private capabilities: DeviceIntegrationCapabilities;
  private context: DeviceContext;
  private sensors: Map<string, any> = new Map();
  private callbacks: Map<string, Function[]> = new Map();

  constructor() {
    this.capabilities = this.initializeCapabilities();
    this.context = this.initializeContext();
    this.setupSensorMonitoring();
  }

  private initializeCapabilities(): DeviceIntegrationCapabilities {
    return {
      audio: {
        microphone: 'mediaDevices' in navigator,
        speakers: 'speechSynthesis' in window,
        backgroundListening: 'serviceWorker' in navigator,
        noiseReduction: true, // Available in getUserMedia constraints
        voiceEnhancement: true
      },
      visual: {
        camera: 'mediaDevices' in navigator,
        screenCapture: typeof navigator !== 'undefined' && navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices,
        faceDetection: typeof window !== 'undefined' && 'FaceDetector' in window,
        objectRecognition: false, // Requires ML models
        textRecognition: false // Requires ML models
      },
      sensors: {
        accelerometer: 'DeviceMotionEvent' in window,
        gyroscope: 'DeviceOrientationEvent' in window,
        magnetometer: 'DeviceOrientationEvent' in window,
        proximity: 'ProximitySensor' in window,
        ambient_light: 'AmbientLightSensor' in window,
        barometer: false // Limited browser support
      },
      location: {
        gps: 'geolocation' in navigator,
        network: 'geolocation' in navigator,
        indoor: false, // Requires additional APIs
        geofencing: 'serviceWorker' in navigator
      },
      connectivity: {
        wifi: 'connection' in navigator,
        cellular: 'connection' in navigator,
        bluetooth: 'bluetooth' in navigator,
        nfc: 'nfc' in navigator
      },
      system: {
        notifications: 'Notification' in window,
        storage: 'storage' in navigator,
        contacts: 'contacts' in navigator,
        calendar: false, // Requires API integration
        files: 'showOpenFilePicker' in window,
        clipboard: 'clipboard' in navigator
      },
      platform: {
        ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
        macos: /Macintosh/.test(navigator.userAgent),
        windows: /Windows/.test(navigator.userAgent),
        android: /Android/.test(navigator.userAgent),
        web: true
      }
    };
  }

  private initializeContext(): DeviceContext {
    return {
      hardware: {
        deviceModel: this.getDeviceModel(),
        osVersion: this.getOSVersion(),
        screenSize: { width: screen.width, height: screen.height }
      },
      environment: {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      },
      user: {
        preferredInteractionMode: 'voice'
      }
    };
  }

  private getDeviceModel(): string {
    const userAgent = navigator.userAgent;
    if (/iPhone/.test(userAgent)) return 'iPhone';
    if (/iPad/.test(userAgent)) return 'iPad';
    if (/Macintosh/.test(userAgent)) return 'Mac';
    if (/Windows/.test(userAgent)) return 'Windows PC';
    if (/Android/.test(userAgent)) return 'Android Device';
    return 'Unknown Device';
  }

  private getOSVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/OS (\d+)_(\d+)/);
    if (match) return `${match[1]}.${match[2]}`;
    return 'Unknown';
  }

  private setupSensorMonitoring(): void {
    // Motion sensors
    if (this.capabilities.sensors.accelerometer) {
      window.addEventListener('devicemotion', (event) => {
        const motion = {
          x: event.accelerationIncludingGravity?.x || 0,
          y: event.accelerationIncludingGravity?.y || 0,
          z: event.accelerationIncludingGravity?.z || 0
        };
        this.context.environment.motion = motion;
        this.triggerCallbacks('motion', motion);
      });
    }

    // Orientation
    if (this.capabilities.sensors.gyroscope) {
      window.addEventListener('deviceorientation', (event) => {
        const orientation = this.getOrientationDescription(event);
        this.context.environment.orientation = orientation;
        this.triggerCallbacks('orientation', orientation);
      });
    }

    // Screen orientation
    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => {
        this.context.environment.orientation = screen.orientation.type;
        this.triggerCallbacks('screenOrientation', screen.orientation.type);
      });
    }

    // Network status
    window.addEventListener('online', () => this.triggerCallbacks('networkStatus', 'online'));
    window.addEventListener('offline', () => this.triggerCallbacks('networkStatus', 'offline'));

    // Battery status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.context.hardware.batteryLevel = Math.round(battery.level * 100);
        battery.addEventListener('levelchange', () => {
          this.context.hardware.batteryLevel = Math.round(battery.level * 100);
          this.triggerCallbacks('batteryLevel', this.context.hardware.batteryLevel);
        });
      });
    }

    // Memory monitoring
    if ('memory' in (performance as any)) {
      setInterval(() => {
        this.context.hardware.memoryUsage = (performance as any).memory.usedJSHeapSize;
        this.triggerCallbacks('memoryUsage', this.context.hardware.memoryUsage);
      }, 5000);
    }
  }

  private getOrientationDescription(event: DeviceOrientationEvent): string {
    const alpha = event.alpha || 0; // Z axis
    const beta = event.beta || 0;   // X axis
    const gamma = event.gamma || 0; // Y axis

    if (Math.abs(beta) > Math.abs(gamma)) {
      return beta > 0 ? 'tilted_forward' : 'tilted_backward';
    } else {
      return gamma > 0 ? 'tilted_right' : 'tilted_left';
    }
  }

  private triggerCallbacks(event: string, data: any): void {
    const callbacks = this.callbacks.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  // Public API Methods

  async enableComprehensiveMonitoring(): Promise<boolean> {
    console.log('🔧 Enabling comprehensive device monitoring...');
    
    try {
      // Location monitoring
      if (this.capabilities.location.gps) {
        navigator.geolocation.watchPosition(
          (position) => {
            this.context.environment.location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            this.triggerCallbacks('location', this.context.environment.location);
          },
          (error) => console.warn('Location monitoring failed:', error),
          { enableHighAccuracy: true, maximumAge: 60000 }
        );
      }

      // Ambient light sensor
      if ('AmbientLightSensor' in window) {
        try {
          const sensor = new (window as any).AmbientLightSensor();
          sensor.addEventListener('reading', () => {
            this.context.environment.lightLevel = sensor.illuminance;
            this.triggerCallbacks('lightLevel', sensor.illuminance);
          });
          sensor.start();
        } catch (error) {
          console.warn('Ambient light sensor failed:', error);
        }
      }

      // Camera-based monitoring for future ML features
      if (this.capabilities.visual.camera) {
        // Prepared for computer vision integration
        console.log('📷 Camera monitoring ready for ML integration');
      }

      console.log('✅ Comprehensive monitoring enabled');
      return true;
    } catch (error) {
      console.error('Failed to enable comprehensive monitoring:', error);
      return false;
    }
  }

  async captureEnvironmentalSnapshot(): Promise<DeviceContext> {
    // Update current context with latest sensor data
    const snapshot = { ...this.context };
    
    // Add timestamp
    snapshot.user.lastActivity = new Date();
    
    // Get network info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      snapshot.hardware.networkStrength = connection.downlink;
    }
    
    return snapshot;
  }

  async enableBackgroundListening(): Promise<boolean> {
    if (!this.capabilities.audio.backgroundListening) return false;
    
    try {
      // Register service worker for background processing
      const registration = await navigator.serviceWorker.register('/lumen-background-worker.js');
      console.log('✅ Background listening service registered');
      
      // Set up wake word detection
      this.setupWakeWordDetection();
      
      return true;
    } catch (error) {
      console.error('Background listening setup failed:', error);
      return false;
    }
  }

  private setupWakeWordDetection(): void {
    // Enhanced wake word detection for "Hey Lumen"
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.resultIndex][0].transcript.toLowerCase();
        if (transcript.includes('hey lumen') || transcript.includes('lumen')) {
          this.triggerCallbacks('wakeWord', transcript);
        }
      };
      
      recognition.start();
    }
  }

  async captureScreenshot(): Promise<string | null> {
    if (!this.capabilities.visual.screenCapture) return null;
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx?.drawImage(video, 0, 0);
          
          stream.getTracks().forEach(track => track.stop());
          resolve(canvas.toDataURL());
        };
      });
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    }
  }

  async analyzeUserBehavior(): Promise<any> {
    const snapshot = await this.captureEnvironmentalSnapshot();
    
    // Basic behavior analysis
    const analysis = {
      activityLevel: this.calculateActivityLevel(),
      preferredInteractionTime: this.getPreferredInteractionTime(),
      deviceUsagePattern: this.analyzeDeviceUsage(),
      environmentalPreferences: this.analyzeEnvironmentalPreferences(snapshot)
    };
    
    return analysis;
  }

  private calculateActivityLevel(): 'low' | 'medium' | 'high' {
    const motion = this.context.environment.motion;
    if (!motion) return 'low';
    
    const magnitude = Math.sqrt(motion.x ** 2 + motion.y ** 2 + motion.z ** 2);
    if (magnitude > 15) return 'high';
    if (magnitude > 5) return 'medium';
    return 'low';
  }

  private getPreferredInteractionTime(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private analyzeDeviceUsage(): any {
    return {
      screenSize: this.context.hardware.screenSize,
      batteryAware: this.context.hardware.batteryLevel ? this.context.hardware.batteryLevel < 20 : false,
      networkAware: navigator.onLine,
      orientation: this.context.environment.orientation || 'unknown'
    };
  }

  private analyzeEnvironmentalPreferences(snapshot: DeviceContext): any {
    return {
      lightConditions: snapshot.environment.lightLevel ? 
        (snapshot.environment.lightLevel > 100 ? 'bright' : 'dim') : 'unknown',
      location: snapshot.environment.location ? 'available' : 'unavailable',
      motion: snapshot.environment.motion ? 'active' : 'stationary'
    };
  }

  // Event subscription system
  onEvent(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  offEvent(event: string, callback: Function): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Getters for current state
  getCapabilities(): DeviceIntegrationCapabilities {
    return { ...this.capabilities };
  }

  getContext(): DeviceContext {
    return { ...this.context };
  }

  getPlatformInfo(): { platform: string; isNative: boolean; capabilities: string[] } {
    const platform = Object.keys(this.capabilities.platform).find(
      key => this.capabilities.platform[key as keyof typeof this.capabilities.platform]
    ) || 'unknown';
    
    const isNative = platform !== 'web';
    const capabilities = Object.entries(this.capabilities)
      .flatMap(([category, caps]) => 
        Object.entries(caps)
          .filter(([_, enabled]) => enabled)
          .map(([cap]) => `${category}.${cap}`)
      );

    return { platform, isNative, capabilities };
  }
}

export const universalDevice = new UniversalDeviceToolkit();

// Apple-specific native bridge preparation
export class AppleNativeBridge {
  static async prepareForNativeApp(): Promise<void> {
    console.log('🍎 Preparing Apple native app bridge...');
    
    // Set up message bridge for React Native / Capacitor
    if ((window as any).webkit?.messageHandlers) {
      console.log('✅ Native iOS bridge detected');
    }
    
    // Prepare for background app refresh
    if ('applicationCache' in window) {
      console.log('✅ Application cache available');
    }
    
    // Set up push notification bridge
    if ('PushManager' in window) {
      console.log('✅ Push notifications available');
    }
    
    // Initialize always-on capabilities
    await universalDevice.enableComprehensiveMonitoring();
    await universalDevice.enableBackgroundListening();
  }
  
  static sendToNative(command: string, data: any): void {
    // Bridge for native app communication
    if ((window as any).webkit?.messageHandlers?.lumenBridge) {
      (window as any).webkit.messageHandlers.lumenBridge.postMessage({
        command,
        data,
        timestamp: Date.now()
      });
    }
  }
  
  static onNativeMessage(callback: (message: any) => void): void {
    // Listen for messages from native app
    (window as any).lumenNativeCallback = callback;
  }
}