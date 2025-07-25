import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, Camera, MapPin, Bell, HardDrive, Smartphone, Monitor, Battery, 
  Wifi, Cpu, MemoryStick, Gauge, Activity, Eye, Zap, Globe, Settings
} from 'lucide-react';
import { 
  universalDevice, 
  type DeviceIntegrationCapabilities, 
  type DeviceContext,
  AppleNativeBridge 
} from '@/lib/universal-device-toolkit';

export function UniversalDevicePanel() {
  const [capabilities, setCapabilities] = useState<DeviceIntegrationCapabilities | null>(null);
  const [context, setContext] = useState<DeviceContext | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeToolkit();
    setupRealtimeMonitoring();
  }, []);

  const initializeToolkit = async () => {
    setIsLoading(true);
    try {
      const caps = universalDevice.getCapabilities();
      const ctx = universalDevice.getContext();
      setCapabilities(caps);
      setContext(ctx);
      
      // Prepare for Apple native app
      await AppleNativeBridge.prepareForNativeApp();
      
      console.log('🔧 Universal Device Toolkit initialized');
    } catch (error) {
      console.error('Toolkit initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeMonitoring = () => {
    // Subscribe to real-time events
    universalDevice.onEvent('motion', (data) => {
      setRealTimeData(prev => ({ ...prev, motion: data }));
    });

    universalDevice.onEvent('orientation', (data) => {
      setRealTimeData(prev => ({ ...prev, orientation: data }));
    });

    universalDevice.onEvent('batteryLevel', (data) => {
      setRealTimeData(prev => ({ ...prev, battery: data }));
    });

    universalDevice.onEvent('location', (data) => {
      setRealTimeData(prev => ({ ...prev, location: data }));
    });

    universalDevice.onEvent('networkStatus', (data) => {
      setRealTimeData(prev => ({ ...prev, network: data }));
    });

    universalDevice.onEvent('lightLevel', (data) => {
      setRealTimeData(prev => ({ ...prev, lightLevel: data }));
    });

    universalDevice.onEvent('wakeWord', (data) => {
      setRealTimeData(prev => ({ ...prev, lastWakeWord: data, wakeWordTime: Date.now() }));
    });
  };

  const enableComprehensiveMonitoring = async () => {
    setIsLoading(true);
    try {
      const success = await universalDevice.enableComprehensiveMonitoring();
      setIsMonitoring(success);
      if (success) {
        console.log('✅ Comprehensive monitoring enabled');
      }
    } catch (error) {
      console.error('Failed to enable monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const captureSnapshot = async () => {
    const snapshot = await universalDevice.captureEnvironmentalSnapshot();
    console.log('📸 Environmental snapshot:', snapshot);
    setContext(snapshot);
  };

  const analyzeUserBehavior = async () => {
    const analysis = await universalDevice.analyzeUserBehavior();
    console.log('🧠 User behavior analysis:', analysis);
    setRealTimeData(prev => ({ ...prev, behaviorAnalysis: analysis }));
  };

  const CapabilitySection = ({ 
    title, 
    capabilities: caps, 
    icon: Icon 
  }: { 
    title: string; 
    capabilities: Record<string, boolean>; 
    icon: React.ComponentType<any>;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(caps).map(([key, enabled]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="capitalize">{key.replace('_', ' ')}</span>
            <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
              {enabled ? 'Available' : 'Unavailable'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const RealtimeMetric = ({ 
    label, 
    value, 
    icon: Icon, 
    unit = '' 
  }: { 
    label: string; 
    value: any; 
    icon: React.ComponentType<any>; 
    unit?: string;
  }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <Icon className="h-5 w-5 text-blue-500" />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-500">
          {value !== undefined ? `${value}${unit}` : 'No data'}
        </div>
      </div>
    </div>
  );

  if (!capabilities || !context) {
    return <div className="p-4">Loading Universal Device Toolkit...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Universal Device Integration Toolkit
          </CardTitle>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive hardware and software integration for {context.hardware.deviceModel}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={enableComprehensiveMonitoring} 
              disabled={isLoading || isMonitoring}
              className="flex-1"
            >
              {isMonitoring ? 'Monitoring Active' : 'Enable Full Monitoring'}
            </Button>
            <Button 
              variant="outline" 
              onClick={captureSnapshot}
              disabled={isLoading}
            >
              Capture Snapshot
            </Button>
            <Button 
              variant="outline" 
              onClick={analyzeUserBehavior}
              disabled={isLoading}
            >
              Analyze Behavior
            </Button>
          </div>

          <Tabs defaultValue="capabilities" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="realtime">Real-time</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="apple">Apple Ready</TabsTrigger>
            </TabsList>

            <TabsContent value="capabilities" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CapabilitySection 
                  title="Audio" 
                  capabilities={capabilities.audio} 
                  icon={Mic} 
                />
                <CapabilitySection 
                  title="Visual" 
                  capabilities={capabilities.visual} 
                  icon={Camera} 
                />
                <CapabilitySection 
                  title="Sensors" 
                  capabilities={capabilities.sensors} 
                  icon={Activity} 
                />
                <CapabilitySection 
                  title="Location" 
                  capabilities={capabilities.location} 
                  icon={MapPin} 
                />
                <CapabilitySection 
                  title="Connectivity" 
                  capabilities={capabilities.connectivity} 
                  icon={Wifi} 
                />
                <CapabilitySection 
                  title="System" 
                  capabilities={capabilities.system} 
                  icon={Settings} 
                />
              </div>
            </TabsContent>

            <TabsContent value="realtime" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RealtimeMetric 
                  label="Battery Level" 
                  value={context.hardware.batteryLevel || realTimeData.battery} 
                  icon={Battery} 
                  unit="%" 
                />
                <RealtimeMetric 
                  label="Memory Usage" 
                  value={context.hardware.memoryUsage ? Math.round(context.hardware.memoryUsage / 1024 / 1024) : undefined} 
                  icon={MemoryStick} 
                  unit=" MB" 
                />
                <RealtimeMetric 
                  label="Network Status" 
                  value={realTimeData.network || (navigator.onLine ? 'online' : 'offline')} 
                  icon={Globe} 
                />
                <RealtimeMetric 
                  label="Device Orientation" 
                  value={realTimeData.orientation || context.environment.orientation} 
                  icon={Smartphone} 
                />
                {realTimeData.motion && (
                  <RealtimeMetric 
                    label="Motion Activity" 
                    value={Math.round(Math.sqrt(
                      realTimeData.motion.x ** 2 + 
                      realTimeData.motion.y ** 2 + 
                      realTimeData.motion.z ** 2
                    ) * 10) / 10} 
                    icon={Activity} 
                    unit=" g" 
                  />
                )}
                {realTimeData.lightLevel && (
                  <RealtimeMetric 
                    label="Ambient Light" 
                    value={Math.round(realTimeData.lightLevel)} 
                    icon={Eye} 
                    unit=" lux" 
                  />
                )}
              </div>

              {realTimeData.lastWakeWord && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Wake Word Detected</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      "{realTimeData.lastWakeWord}" - {new Date(realTimeData.wakeWordTime).toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {realTimeData.behaviorAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User Behavior Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Activity Level:</span>
                        <span className="ml-2 capitalize">{realTimeData.behaviorAnalysis.activityLevel}</span>
                      </div>
                      <div>
                        <span className="font-medium">Preferred Time:</span>
                        <span className="ml-2 capitalize">{realTimeData.behaviorAnalysis.preferredInteractionTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="environment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Hardware Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="font-medium">Device:</span> {context.hardware.deviceModel}</div>
                    <div><span className="font-medium">OS Version:</span> {context.hardware.osVersion}</div>
                    <div><span className="font-medium">Screen:</span> {context.hardware.screenSize.width} × {context.hardware.screenSize.height}</div>
                    <div><span className="font-medium">Time Zone:</span> {context.environment.timeZone}</div>
                    <div><span className="font-medium">Language:</span> {context.environment.language}</div>
                  </CardContent>
                </Card>

                {realTimeData.location && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><span className="font-medium">Latitude:</span> {realTimeData.location.lat.toFixed(6)}</div>
                      <div><span className="font-medium">Longitude:</span> {realTimeData.location.lng.toFixed(6)}</div>
                      <div><span className="font-medium">Accuracy:</span> {Math.round(realTimeData.location.accuracy)}m</div>
                    </CardContent>
                  </Card>
                )}

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm">Platform Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.entries(capabilities.platform).map(([platform, supported]) => (
                        <Badge 
                          key={platform} 
                          variant={supported ? "default" : "secondary"}
                          className="justify-center"
                        >
                          {platform.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="apple" className="space-y-4">
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    🍎 Apple Application Readiness
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Lumen is fully prepared for deployment as a native Apple application with comprehensive device integration.
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Always-on microphone access configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Camera and visual processing ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Location and sensor integration active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Push notifications enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Background processing configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Native bridge communication prepared</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs font-medium mb-2">Deployment Features:</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>• Cross-platform device sync and data transfer</div>
                      <div>• Environmental awareness and proactive assistance</div>
                      <div>• Wake word detection and always-on listening</div>
                      <div>• Real-time hardware monitoring and optimization</div>
                      <div>• Seamless integration with iOS and macOS features</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}