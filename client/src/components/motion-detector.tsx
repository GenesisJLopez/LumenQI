import React from 'react';
import { useMotionDetection } from '@/hooks/use-motion-detection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Camera, 
  CameraOff, 
  Activity, 
  AlertCircle, 
  Eye, 
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Minus
} from 'lucide-react';

interface MotionDetectorProps {
  onMotionDetected?: (motionData: any) => void;
  onAutoWake?: (motionData: any) => void;
}

export function MotionDetector({ onMotionDetected, onAutoWake }: MotionDetectorProps) {
  const {
    isActive,
    isInitialized,
    currentMotion,
    error,
    sensitivity,
    autoWakeEnabled,
    startMotionDetection,
    stopMotionDetection,
    setSensitivity,
    setAutoWakeEnabled
  } = useMotionDetection();

  const handleToggleDetection = async () => {
    if (isActive) {
      stopMotionDetection();
    } else {
      try {
        await startMotionDetection();
      } catch (error) {
        console.error('Failed to start motion detection:', error);
      }
    }
  };

  const handleSensitivityChange = (value: string) => {
    setSensitivity(value as 'low' | 'medium' | 'high');
  };

  const handleAutoWakeToggle = (enabled: boolean) => {
    setAutoWakeEnabled(enabled);
  };

  // Trigger callbacks when motion is detected
  React.useEffect(() => {
    if (currentMotion.isMotionDetected && onMotionDetected) {
      onMotionDetected(currentMotion);
    }
  }, [currentMotion, onMotionDetected]);

  // Listen for auto-wake events
  React.useEffect(() => {
    const handleAutoWakeEvent = (event: CustomEvent) => {
      if (onAutoWake) {
        onAutoWake(event.detail.motionData);
      }
    };

    window.addEventListener('motionAutoWake', handleAutoWakeEvent as EventListener);
    return () => {
      window.removeEventListener('motionAutoWake', handleAutoWakeEvent as EventListener);
    };
  }, [onAutoWake]);

  const getMotionIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <ArrowUp className="w-4 h-4" />;
      case 'down': return <ArrowDown className="w-4 h-4" />;
      case 'left': return <ArrowLeft className="w-4 h-4" />;
      case 'right': return <ArrowRight className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getMotionStatusColor = () => {
    if (!isActive) return 'bg-gray-500';
    if (currentMotion.isMotionDetected) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getMotionStatusText = () => {
    if (!isActive) return 'Inactive';
    if (currentMotion.isMotionDetected) return 'Motion Detected';
    return 'Monitoring';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Motion Detection
          <Badge variant="outline" className="ml-auto">
            <div className={`w-2 h-2 rounded-full ${getMotionStatusColor()} mr-1`} />
            {getMotionStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Button */}
        <Button
          onClick={handleToggleDetection}
          variant={isActive ? "destructive" : "default"}
          className="w-full"
        >
          {isActive ? (
            <>
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Motion Detection
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Start Motion Detection
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sensitivity">Sensitivity</Label>
            <Select value={sensitivity} onValueChange={handleSensitivityChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-wake">Auto-Wake on Motion</Label>
            <Switch
              id="auto-wake"
              checked={autoWakeEnabled}
              onCheckedChange={handleAutoWakeToggle}
            />
          </div>
        </div>

        {/* Motion Status */}
        {isActive && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Motion Status
                </span>
                <Badge variant={currentMotion.isMotionDetected ? "default" : "secondary"}>
                  {currentMotion.isMotionDetected ? "Active" : "Idle"}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Intensity</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${currentMotion.motionIntensity * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {Math.round(currentMotion.motionIntensity * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Direction</span>
                  <div className="flex items-center gap-1">
                    {getMotionIcon(currentMotion.motionDirection)}
                    <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {currentMotion.motionDirection}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Confidence</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {Math.round(currentMotion.confidenceLevel * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Indicator */}
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Camera active - monitoring for movement
              </span>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Privacy:</strong> Motion detection runs locally on your device. 
            No video data is transmitted or stored.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}