import { useEffect, useCallback } from 'react';
import { useEmotionDetection } from './use-emotion-detection';
import { useMotionDetection } from './use-motion-detection';

export type DetectionMode = 'emotion' | 'motion' | 'both' | 'battery-saver';

interface SmartDetectionState {
  currentMode: DetectionMode;
  batteryLevel: number;
  isPluggedIn: boolean;
  performanceMode: 'high' | 'balanced' | 'battery-saver';
  autoSwitchEnabled: boolean;
}

export function useSmartDetection() {
  const [state, setState] =<SmartDetectionState>({
    currentMode: 'emotion',
    batteryLevel: 1,
    isPluggedIn: false,
    performanceMode: 'balanced',
    autoSwitchEnabled: true
  });

  const emotionDetection = useEmotionDetection();
  const motionDetection = useMotionDetection();

  // Monitor battery status
  const updateBatteryStatus = useCallback(async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        setState(prev => ({
          ...prev,
          batteryLevel: battery.level,
          isPluggedIn: battery.charging
        }));
      } catch (error) {
        console.log('Battery API not available');
      }
    }
  }, []);

  // Auto-switch detection mode based on battery and performance
  const autoSwitchMode = useCallback(() => {
    if (!state.autoSwitchEnabled) return;

    const { batteryLevel, isPluggedIn, performanceMode } = state;

    if (performanceMode === 'battery-saver' || (batteryLevel < 0.2 && !isPluggedIn)) {
      // Low battery: Use emotion detection only (audio is more efficient)
      if (state.currentMode !== 'emotion') {
        setState(prev => ({ ...prev, currentMode: 'emotion' }));
      }
    } else if (performanceMode === 'high' && (batteryLevel > 0.7 || isPluggedIn)) {
      // High performance: Use both detections
      if (state.currentMode !== 'both') {
        setState(prev => ({ ...prev, currentMode: 'both' }));
      }
    } else {
      // Balanced: Use emotion detection primarily
      if (state.currentMode !== 'emotion') {
        setState(prev => ({ ...prev, currentMode: 'emotion' }));
      }
    }
  }, [state.autoSwitchEnabled, state.batteryLevel, state.isPluggedIn, state.performanceMode, state.currentMode]);

  // Start appropriate detection based on mode
  const startDetection = useCallback(async () => {
    try {
      switch (state.currentMode) {
        case 'emotion':
          await emotionDetection.startDetection();
          break;
        case 'motion':
          await motionDetection.startMotionDetection();
          break;
        case 'both':
          await Promise.all([
            emotionDetection.startDetection(),
            motionDetection.startMotionDetection()
          ]);
          break;
        case 'battery-saver':
          // Only start emotion detection with reduced frequency
          await emotionDetection.startDetection();
          break;
      }
    } catch (error) {
      console.error('Failed to start detection:', error);
      throw error;
    }
  }, [state.currentMode, emotionDetection, motionDetection]);

  // Stop all detections
  const stopDetection = useCallback(() => {
    emotionDetection.stopDetection();
    motionDetection.stopMotionDetection();
  }, [emotionDetection, motionDetection]);

  // Manually set detection mode
  const setDetectionMode = useCallback((mode: DetectionMode) => {
    setState(prev => ({ ...prev, currentMode: mode }));
  }, []);

  // Set performance mode
  const setPerformanceMode = useCallback((mode: 'high' | 'balanced' | 'battery-saver') => {
    setState(prev => ({ ...prev, performanceMode: mode }));
  }, []);

  // Toggle auto-switch
  const setAutoSwitchEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoSwitchEnabled: enabled }));
  }, []);

  // Initialize battery monitoring
  useEffect(() => {
    updateBatteryStatus();
    
    // Update battery status every 30 seconds
    const interval = setInterval(updateBatteryStatus, 30000);
    
    return () => clearInterval(interval);
  }, [updateBatteryStatus]);

  // Auto-switch when conditions change
  useEffect(() => {
    autoSwitchMode();
  }, [autoSwitchMode]);

  // Get current detection status
  const getDetectionStatus = useCallback(() => {
    const emotionActive = emotionDetection.isAnalyzing;
    const motionActive = motionDetection.isActive;
    
    return {
      emotionDetection: {
        active: emotionActive,
        currentEmotion: emotionDetection.currentEmotion,
        error: emotionDetection.error
      },
      motionDetection: {
        active: motionActive,
        currentMotion: motionDetection.currentMotion,
        error: motionDetection.error
      },
      batteryOptimized: state.currentMode === 'emotion' || state.currentMode === 'battery-saver',
      recommendedMode: state.batteryLevel < 0.3 && !state.isPluggedIn ? 'emotion' : 'both'
    };
  }, [
    emotionDetection.isAnalyzing,
    emotionDetection.currentEmotion,
    emotionDetection.error,
    motionDetection.isActive,
    motionDetection.currentMotion,
    motionDetection.error,
    state.currentMode,
    state.batteryLevel,
    state.isPluggedIn
  ]);

  return {
    ...state,
    startDetection,
    stopDetection,
    setDetectionMode,
    setPerformanceMode,
    setAutoSwitchEnabled,
    getDetectionStatus,
    emotionDetection,
    motionDetection
  };
}