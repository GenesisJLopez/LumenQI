import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic, Camera, MapPin, Bell, HardDrive, Smartphone, Monitor, Battery, Wifi } from 'lucide-react';
import { deviceAccess, type DeviceCapabilities, type EnvironmentInfo } from '@/lib/device-access';

export function DeviceStatus() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    microphone: false,
    camera: false,
    location: false,
    storage: false,
    notifications: false,
    sensors: false,
    network: false,
    system: false
  });
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    const caps = deviceAccess.getCapabilities();
    const envInfo = await deviceAccess.getEnvironmentInfo();
    setCapabilities(caps);
    setEnvironmentInfo(envInfo);
  };

  const requestAllPermissions = async () => {
    setIsLoading(true);
    try {
      const newCaps = await deviceAccess.requestAllPermissions();
      setCapabilities(newCaps);
      await loadDeviceInfo();
    } catch (error) {
      console.error('Failed to request permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = () => {
    if (!environmentInfo) return <Monitor className="h-5 w-5" />;
    
    switch (environmentInfo.deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Smartphone className="h-5 w-5" />;
      case 'desktop':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const PermissionBadge = ({ 
    granted, 
    icon: Icon, 
    label 
  }: { 
    granted: boolean; 
    icon: React.ComponentType<any>; 
    label: string;
  }) => (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
      <Badge variant={granted ? "default" : "secondary"} className="ml-auto">
        {granted ? 'Granted' : 'Denied'}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getDeviceIcon()}
            Lumen Device Access & Environment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {environmentInfo && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Device Type:</span>
                <span className="ml-2 capitalize">{environmentInfo.deviceType}</span>
              </div>
              <div>
                <span className="font-medium">Platform:</span>
                <span className="ml-2">{environmentInfo.platform}</span>
              </div>
              <div>
                <span className="font-medium">Screen:</span>
                <span className="ml-2">
                  {environmentInfo.screenResolution.width} × {environmentInfo.screenResolution.height}
                </span>
              </div>
              {environmentInfo.batteryLevel && (
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  <span>{environmentInfo.batteryLevel}%</span>
                </div>
              )}
              {environmentInfo.connectionType && (
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span className="capitalize">{environmentInfo.connectionType}</span>
                </div>
              )}
              {environmentInfo.orientation && (
                <div>
                  <span className="font-medium">Orientation:</span>
                  <span className="ml-2 capitalize">{environmentInfo.orientation.replace('-', ' ')}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Device Permissions</h4>
            <div className="grid gap-2">
              <PermissionBadge 
                granted={capabilities.microphone} 
                icon={Mic} 
                label="Microphone" 
              />
              <PermissionBadge 
                granted={capabilities.camera} 
                icon={Camera} 
                label="Camera" 
              />
              <PermissionBadge 
                granted={capabilities.location} 
                icon={MapPin} 
                label="Location" 
              />
              <PermissionBadge 
                granted={capabilities.notifications} 
                icon={Bell} 
                label="Notifications" 
              />
              <PermissionBadge 
                granted={capabilities.storage} 
                icon={HardDrive} 
                label="Persistent Storage" 
              />
              <PermissionBadge 
                granted={capabilities.sensors} 
                icon={Smartphone} 
                label="Motion Sensors" 
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={requestAllPermissions} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Requesting...' : 'Grant All Permissions'}
            </Button>
            <Button 
              variant="outline" 
              onClick={loadDeviceInfo}
              disabled={isLoading}
            >
              Refresh Status
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>💡 For full Apple app functionality, Lumen needs comprehensive device access</p>
            <p>🔒 All permissions are used exclusively for your AI assistant experience</p>
            <p>📱 Device awareness enables proactive assistance and environmental context</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}