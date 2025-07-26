import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, Circle, ArrowRight, ArrowLeft, Smartphone, 
  Mic, Camera, MapPin, Bell, Settings, Zap, Shield, 
  Apple, Monitor, Battery, Wifi, Eye, Activity
} from 'lucide-react';
import { universalDevice, type DeviceIntegrationCapabilities } from '@/lib/universal-device-toolkit';
import { cn } from '@/lib/utils';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  permissions: string[];
  requirements: string[];
  benefits: string[];
  isOptional?: boolean;
}

interface DeviceProfile {
  name: string;
  type: 'ios' | 'macos' | 'android' | 'windows' | 'web';
  capabilities: string[];
  recommendations: string[];
  limitations: string[];
}

export function DeviceIntegrationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [capabilities, setCapabilities] = useState<DeviceIntegrationCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionResults, setPermissionResults] = useState<Record<string, boolean>>({});

  const wizardSteps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Lumen Device Integration',
      description: 'Let\'s set up your device for the ultimate AI assistant experience',
      icon: Zap,
      permissions: [],
      requirements: ['Compatible device', 'Modern browser or native app'],
      benefits: ['Personalized experience', 'Enhanced capabilities', 'Seamless integration']
    },
    {
      id: 'device-detection',
      title: 'Device Profile Detection',
      description: 'Analyzing your device capabilities and creating a personalized setup plan',
      icon: Smartphone,
      permissions: [],
      requirements: ['System information access'],
      benefits: ['Optimized configuration', 'Platform-specific features', 'Performance tuning']
    },
    {
      id: 'microphone',
      title: 'Voice & Audio Setup',
      description: 'Enable voice commands, continuous listening, and natural conversation',
      icon: Mic,
      permissions: ['microphone'],
      requirements: ['Microphone hardware', 'Audio drivers'],
      benefits: ['Voice commands', 'Hands-free interaction', 'Natural conversation', 'Wake word detection']
    },
    {
      id: 'camera',
      title: 'Visual Intelligence Setup',
      description: 'Enable camera access for visual analysis and environmental awareness',
      icon: Camera,
      permissions: ['camera'],
      requirements: ['Camera hardware', 'Video drivers'],
      benefits: ['Image analysis', 'Real-time vision', 'Environmental context', 'Visual assistance'],
      isOptional: true
    },
    {
      id: 'location',
      title: 'Location & Context Setup',
      description: 'Enable location services for contextual assistance and location-aware features',
      icon: MapPin,
      permissions: ['location'],
      requirements: ['GPS or network location'],
      benefits: ['Location-based assistance', 'Weather updates', 'Local recommendations', 'Context awareness'],
      isOptional: true
    },
    {
      id: 'notifications',
      title: 'Notification & Alerts Setup',
      description: 'Enable notifications for proactive assistance and important updates',
      icon: Bell,
      permissions: ['notifications'],
      requirements: ['System notification support'],
      benefits: ['Proactive reminders', 'Important alerts', 'Background communication', 'Smart notifications'],
      isOptional: true
    },
    {
      id: 'sensors',
      title: 'Motion & Environmental Sensors',
      description: 'Enable motion sensors for activity detection and environmental awareness',
      icon: Activity,
      permissions: ['sensors'],
      requirements: ['Motion sensors', 'Accelerometer/Gyroscope'],
      benefits: ['Activity monitoring', 'Gesture recognition', 'Device orientation', 'Smart automation'],
      isOptional: true
    },
    {
      id: 'optimization',
      title: 'Performance Optimization',
      description: 'Optimize Lumen for your specific device and usage patterns',
      icon: Settings,
      permissions: [],
      requirements: ['Device capabilities analysis'],
      benefits: ['Better performance', 'Reduced battery usage', 'Optimized features', 'Smooth operation']
    },
    {
      id: 'completion',
      title: 'Setup Complete!',
      description: 'Your device is now fully integrated with Lumen AI',
      icon: CheckCircle,
      permissions: [],
      requirements: [],
      benefits: ['Full functionality', 'Personalized experience', 'Advanced features', 'Ready to use']
    }
  ];

  useEffect(() => {
    initializeWizard();
  }, []);

  const initializeWizard = async () => {
    // Detect device profile
    const profile = await detectDeviceProfile();
    setDeviceProfile(profile);
    
    // Get current capabilities
    const caps = universalDevice.getCapabilities();
    setCapabilities(caps);
    
    // Check existing permissions
    checkExistingPermissions();
  };

  const detectDeviceProfile = async (): Promise<DeviceProfile> => {
    const context = await universalDevice.captureEnvironmentalSnapshot();
    const platformInfo = universalDevice.getPlatformInfo();
    
    const profiles: Record<string, DeviceProfile> = {
      ios: {
        name: 'iPhone/iPad',
        type: 'ios',
        capabilities: ['voice', 'camera', 'location', 'notifications', 'sensors', 'face-id'],
        recommendations: ['Enable always-on listening', 'Use native camera integration', 'Allow background refresh'],
        limitations: ['Limited background processing', 'Safari restrictions', 'App Store policies']
      },
      macos: {
        name: 'Mac Desktop/Laptop',
        type: 'macos',
        capabilities: ['voice', 'camera', 'location', 'notifications', 'system-integration'],
        recommendations: ['Enable accessibility permissions', 'Allow system events', 'Desktop integration'],
        limitations: ['Gatekeeper restrictions', 'Privacy settings', 'System integrity protection']
      },
      android: {
        name: 'Android Device',
        type: 'android',
        capabilities: ['voice', 'camera', 'location', 'notifications', 'sensors', 'nfc'],
        recommendations: ['Enable overlay permissions', 'Disable battery optimization', 'Allow auto-start'],
        limitations: ['Battery optimization', 'Permission restrictions', 'Manufacturer limitations']
      },
      windows: {
        name: 'Windows PC',
        type: 'windows',
        capabilities: ['voice', 'camera', 'location', 'notifications', 'system-integration'],
        recommendations: ['Enable Windows Hello', 'Allow desktop integration', 'System-level permissions'],
        limitations: ['Windows Defender', 'UAC restrictions', 'Enterprise policies']
      },
      web: {
        name: 'Web Browser',
        type: 'web',
        capabilities: ['voice', 'camera', 'location', 'notifications'],
        recommendations: ['Allow all permissions', 'Add to home screen', 'Enable persistent storage'],
        limitations: ['Browser security', 'Limited system access', 'No background processing']
      }
    };

    // Detect platform
    if (platformInfo.platform.includes('ios') || /iPad|iPhone|iPod/.test(context.hardware.deviceModel)) {
      return profiles.ios;
    } else if (platformInfo.platform.includes('macos') || /Mac/.test(context.hardware.deviceModel)) {
      return profiles.macos;
    } else if (platformInfo.platform.includes('android')) {
      return profiles.android;
    } else if (platformInfo.platform.includes('windows')) {
      return profiles.windows;
    } else {
      return profiles.web;
    }
  };

  const checkExistingPermissions = () => {
    const results: Record<string, boolean> = {};
    if (capabilities) {
      results.microphone = capabilities.audio.microphone;
      results.camera = capabilities.visual.camera;
      results.location = capabilities.location.gps;
      results.notifications = capabilities.system.notifications;
      results.sensors = capabilities.sensors.accelerometer;
    }
    setPermissionResults(results);
    
    // Mark completed steps
    const completed = new Set<string>();
    if (results.microphone) completed.add('microphone');
    if (results.camera) completed.add('camera');
    if (results.location) completed.add('location');
    if (results.notifications) completed.add('notifications');
    if (results.sensors) completed.add('sensors');
    setCompletedSteps(completed);
  };

  const handleStepPermission = async (step: WizardStep) => {
    setIsLoading(true);
    try {
      if (step.permissions.length > 0) {
        if (step.permissions.includes('microphone') || step.permissions.includes('camera') || 
            step.permissions.includes('location') || step.permissions.includes('notifications')) {
          
          // Request permissions using universalDevice API
          const permissionPromises = step.permissions.map(async (permission) => {
            if (permission === 'microphone') {
              const granted = await navigator.mediaDevices.getUserMedia({ audio: true }).then(() => true).catch(() => false);
              return { microphone: granted };
            }
            if (permission === 'camera') {
              const granted = await navigator.mediaDevices.getUserMedia({ video: true }).then(() => true).catch(() => false);
              return { camera: granted };
            }
            if (permission === 'location') {
              const granted = await new Promise<boolean>((resolve) => {
                navigator.geolocation.getCurrentPosition(() => resolve(true), () => resolve(false));
              });
              return { location: granted };
            }
            if (permission === 'notifications') {
              const granted = await Notification.requestPermission().then(result => result === 'granted');
              return { notifications: granted };
            }
            if (permission === 'sensors') {
              // Check for device motion/orientation access
              const granted = 'DeviceMotionEvent' in window;
              return { sensors: granted };
            }
            return {};
          });
          
          const results = await Promise.all(permissionPromises);
          const newCapabilities = results.reduce((acc, result) => ({ ...acc, ...result }), {
            microphone: false,
            camera: false,
            location: false,
            notifications: false,
            sensors: false
          });
          setCapabilities({
            ...capabilities!,
            audio: { ...capabilities!.audio, microphone: newCapabilities.microphone },
            visual: { ...capabilities!.visual, camera: newCapabilities.camera },
            location: { ...capabilities!.location, gps: newCapabilities.location },
            system: { ...capabilities!.system, notifications: newCapabilities.notifications },
            sensors: { ...capabilities!.sensors, accelerometer: newCapabilities.sensors }
          });
          
          // Update permission results
          setPermissionResults(prev => ({
            ...prev,
            microphone: newCapabilities.microphone,
            camera: newCapabilities.camera,
            location: newCapabilities.location,
            notifications: newCapabilities.notifications,
            sensors: newCapabilities.sensors
          }));
          
          // Mark step as completed if permission was granted
          const granted = step.permissions.every(permission => {
            if (permission === 'microphone') return newCapabilities.microphone;
            if (permission === 'camera') return newCapabilities.camera;
            if (permission === 'location') return newCapabilities.location;
            if (permission === 'notifications') return newCapabilities.notifications;
            if (permission === 'sensors') return newCapabilities.sensors;
            return false;
          });
          
          if (granted) {
            setCompletedSteps(prev => new Set([...Array.from(prev), step.id]));
          }
        }
      } else {
        // Non-permission steps are automatically completed
        setCompletedSteps(prev => new Set([...Array.from(prev), step.id]));
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipStep = () => {
    setCompletedSteps(prev => new Set([...Array.from(prev), wizardSteps[currentStep].id]));
    nextStep();
  };

  const getStepStatus = (stepId: string) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (wizardSteps[currentStep].id === stepId) return 'current';
    return 'pending';
  };

  const calculateProgress = () => {
    return Math.round((Array.from(completedSteps).length / wizardSteps.length) * 100);
  };

  const currentStepData = wizardSteps[currentStep];
  const isStepCompleted = completedSteps.has(currentStepData.id);
  const canProceed = isStepCompleted || currentStepData.isOptional || currentStepData.permissions.length === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="h-6 w-6 text-purple-600" />
                Lumen Device Integration Wizard
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {deviceProfile ? `Optimizing for ${deviceProfile.name}` : 'Preparing personalized setup...'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">{calculateProgress()}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
          <Progress value={calculateProgress()} className="mt-4" />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Progress Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Setup Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wizardSteps.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                    status === 'current' && "bg-purple-100 dark:bg-purple-900/30",
                    status === 'completed' && "bg-green-100 dark:bg-green-900/30",
                    status === 'pending' && "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    status === 'completed' && "bg-green-500 text-white",
                    status === 'current' && "bg-purple-500 text-white",
                    status === 'pending' && "bg-gray-200 dark:bg-gray-700"
                  )}>
                    {status === 'completed' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-sm font-medium truncate",
                      status === 'current' && "text-purple-700 dark:text-purple-300",
                      status === 'completed' && "text-green-700 dark:text-green-300"
                    )}>
                      {step.title}
                    </div>
                    {step.isOptional && (
                      <Badge variant="secondary" className="text-xs mt-1">Optional</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="min-h-[500px]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isStepCompleted ? "bg-green-500 text-white" : "bg-purple-500 text-white"
                )}>
                  {isStepCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <currentStepData.icon className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                  <p className="text-gray-600 dark:text-gray-400">{currentStepData.description}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Step-specific content */}
              {currentStepData.id === 'welcome' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🍎</div>
                    <h3 className="text-lg font-semibold mb-2">Ready for Apple Integration</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This wizard will guide you through setting up Lumen for optimal performance on your device, 
                      with special preparation for Apple ecosystem deployment.
                    </p>
                  </div>
                </div>
              )}

              {currentStepData.id === 'device-detection' && deviceProfile && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Detected: {deviceProfile.name}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Available capabilities:</strong> {deviceProfile.capabilities.join(', ')}</div>
                      <div><strong>Recommendations:</strong></div>
                      <ul className="list-disc list-inside ml-4 text-gray-600 dark:text-gray-400">
                        {deviceProfile.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {currentStepData.id === 'completion' && (
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-lg font-semibold mb-2">Congratulations!</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Lumen is now fully integrated with your device. You have access to all enabled features 
                    and your device is optimized for the best AI assistant experience.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="font-medium text-green-800 dark:text-green-300">Enabled Features</div>
                      <div className="mt-1 space-y-1">
                        {Object.entries(permissionResults).map(([key, granted]) => (
                          granted && <div key={key} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="capitalize">{key}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="font-medium text-blue-800 dark:text-blue-300">Ready for Apple App</div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        All configurations are prepared for seamless deployment to Apple App Store
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements and Benefits */}
              {currentStepData.requirements.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Requirements
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {currentStepData.requirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Circle className="h-3 w-3" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Benefits
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {currentStepData.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Permission status for permission steps */}
              {currentStepData.permissions.length > 0 && (
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium mb-3">Permission Status</h4>
                  <div className="space-y-2">
                    {currentStepData.permissions.map(permission => (
                      <div key={permission} className="flex items-center justify-between">
                        <span className="capitalize">{permission}</span>
                        <Badge variant={permissionResults[permission] ? "default" : "secondary"}>
                          {permissionResults[permission] ? 'Granted' : 'Not Granted'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {currentStepData.permissions.length > 0 && !isStepCompleted && (
                    <Button 
                      onClick={() => handleStepPermission(currentStepData)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? 'Requesting...' : `Grant ${currentStepData.permissions.join(', ')}`}
                    </Button>
                  )}
                  
                  {currentStepData.isOptional && !isStepCompleted && (
                    <Button 
                      variant="outline" 
                      onClick={skipStep}
                    >
                      Skip
                    </Button>
                  )}
                  
                  <Button 
                    onClick={nextStep}
                    disabled={!canProceed || currentStep === wizardSteps.length - 1}
                    className="flex items-center gap-2"
                  >
                    {currentStep === wizardSteps.length - 1 ? 'Finish' : 'Next'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}