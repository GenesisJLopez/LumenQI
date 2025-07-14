import React from 'react';
import { useSmartDetection } from '@/hooks/use-smart-detection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Eye, 
  Battery, 
  Zap, 
  Settings, 
  Smartphone,
  Monitor,
  Activity
} from 'lucide-react';

export function SmartDetectionPanel() {
  const {
    currentMode,
    batteryLevel,
    isPluggedIn,
    performanceMode,
    autoSwitchEnabled,
    startDetection,
    stopDetection,
    setDetectionMode,
    setPerformanceMode,
    setAutoSwitchEnabled,
    getDetectionStatus,
    emotionDetection,
    motionDetection
  } = useSmartDetection();

  const detectionStatus = getDetectionStatus();
  const isAnyDetectionActive = detectionStatus.emotionDetection.active || detectionStatus.motionDetection.active;

  const handleToggleDetection = async () => {
    if (isAnyDetectionActive) {
      stopDetection();
    } else {
      try {
        await startDetection();
      } catch (error) {
        console.error('Failed to start detection:', error);
      }
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'emotion': return <Brain className="w-4 h-4" />;
      case 'motion': return <Eye className="w-4 h-4" />;
      case 'both': return <Activity className="w-4 h-4" />;
      case 'battery-saver': return <Battery className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getModeDescription = (mode: string) => {
    switch (mode) {
      case 'emotion': return 'Audio-based emotion detection (battery efficient)';
      case 'motion': return 'Visual motion detection (higher battery usage)';
      case 'both': return 'Both emotion and motion detection (high performance)';
      case 'battery-saver': return 'Minimal detection for maximum battery life';
      default: return 'Select detection mode';
    }
  };

  const getBatteryColor = () => {
    if (batteryLevel > 0.6) return 'text-green-600';
    if (batteryLevel > 0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (mode: string) => {
    switch (mode) {
      case 'high': return <Zap className="w-4 h-4" />;
      case 'balanced': return <Monitor className="w-4 h-4" />;
      case 'battery-saver': return <Battery className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Smart Detection System
          <Badge variant="outline" className="ml-auto">
            <div className={`w-2 h-2 rounded-full ${isAnyDetectionActive ? 'bg-green-500' : 'bg-gray-500'} mr-1`} />
            {isAnyDetectionActive ? 'Active' : 'Inactive'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Battery Status */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Battery Status</span>
            <div className="flex items-center gap-2">
              <Battery className={`w-4 h-4 ${getBatteryColor()}`} />
              <span className={`text-sm ${getBatteryColor()}`}>
                {Math.round(batteryLevel * 100)}%
              </span>
              {isPluggedIn && (
                <Badge variant="secondary" className="text-xs">
                  Charging
                </Badge>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                batteryLevel > 0.6 ? 'bg-green-500' : 
                batteryLevel > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${batteryLevel * 100}%` }}
            />
          </div>
        </div>

        {/* Detection Mode Selection */}
        <div className="space-y-3">
          <Label>Detection Mode</Label>
          <Select value={currentMode} onValueChange={setDetectionMode}>
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  {getModeIcon(currentMode)}
                  <span className="capitalize">{currentMode}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emotion">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <div>
                    <div>Emotion Detection</div>
                    <div className="text-xs text-gray-500">Battery efficient</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="motion">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <div>
                    <div>Motion Detection</div>
                    <div className="text-xs text-gray-500">Higher battery usage</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="both">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <div>
                    <div>Both Detections</div>
                    <div className="text-xs text-gray-500">High performance</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="battery-saver">
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  <div>
                    <div>Battery Saver</div>
                    <div className="text-xs text-gray-500">Minimal detection</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">{getModeDescription(currentMode)}</p>
        </div>

        {/* Performance Mode */}
        <div className="space-y-3">
          <Label>Performance Mode</Label>
          <Select value={performanceMode} onValueChange={setPerformanceMode}>
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  {getPerformanceIcon(performanceMode)}
                  <span className="capitalize">{performanceMode.replace('-', ' ')}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  High Performance
                </div>
              </SelectItem>
              <SelectItem value="balanced">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Balanced
                </div>
              </SelectItem>
              <SelectItem value="battery-saver">
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  Battery Saver
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto-Switch Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-switch">Auto-Switch Based on Battery</Label>
          <Switch
            id="auto-switch"
            checked={autoSwitchEnabled}
            onCheckedChange={setAutoSwitchEnabled}
          />
        </div>

        {/* Control Button */}
        <Button
          onClick={handleToggleDetection}
          variant={isAnyDetectionActive ? "destructive" : "default"}
          className="w-full"
        >
          {isAnyDetectionActive ? 'Stop Detection' : 'Start Detection'}
        </Button>

        {/* Detection Status */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Emotion</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {detectionStatus.emotionDetection.active ? 'Active' : 'Inactive'}
              </div>
              {detectionStatus.emotionDetection.currentEmotion && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {detectionStatus.emotionDetection.currentEmotion.emotion}
                </div>
              )}
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Motion</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {detectionStatus.motionDetection.active ? 'Active' : 'Inactive'}
              </div>
              {detectionStatus.motionDetection.currentMotion && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {detectionStatus.motionDetection.currentMotion.motionDirection}
                </div>
              )}
            </div>
          </div>

          {/* Battery Optimization Status */}
          {detectionStatus.batteryOptimized && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  Battery optimized mode active
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Recommendation */}
        {detectionStatus.recommendedMode !== currentMode && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Recommendation:</strong> Switch to {detectionStatus.recommendedMode} mode for better performance
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}