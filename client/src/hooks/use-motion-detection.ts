import { useEffect, useCallback, useRef, useState } from 'react';

export interface MotionData {
  isMotionDetected: boolean;
  motionIntensity: number;
  lastMotionTime: number;
  motionDirection: 'none' | 'left' | 'right' | 'up' | 'down' | 'approaching' | 'departing';
  confidenceLevel: number;
}

interface MotionDetectionState {
  isActive: boolean;
  isInitialized: boolean;
  currentMotion: MotionData;
  error: string | null;
  sensitivity: 'low' | 'medium' | 'high';
  autoWakeEnabled: boolean;
}

export function useMotionDetection() {
  const [state, setState] = useState<MotionDetectionState>({
    isActive: false,
    isInitialized: false,
    currentMotion: {
      isMotionDetected: false,
      motionIntensity: 0,
      lastMotionTime: 0,
      motionDirection: 'none',
      confidenceLevel: 0
    },
    error: null,
    sensitivity: 'medium',
    autoWakeEnabled: false
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getSensitivityThreshold = useCallback(() => {
    switch (state.sensitivity) {
      case 'low': return 50;
      case 'medium': return 30;
      case 'high': return 15;
      default: return 30;
    }
  }, [state.sensitivity]);

  const calculateMotionDirection = useCallback((motionData: number[][], width: number, height: number) => {
    let leftMotion = 0, rightMotion = 0, upMotion = 0, downMotion = 0;
    let totalMotion = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const motion = motionData[y][x];
        if (motion > 0) {
          totalMotion += motion;
          
          // Determine direction based on position
          if (x < width / 3) leftMotion += motion;
          if (x > (2 * width) / 3) rightMotion += motion;
          if (y < height / 3) upMotion += motion;
          if (y > (2 * height) / 3) downMotion += motion;
        }
      }
    }

    if (totalMotion === 0) return 'none';

    // Determine primary direction
    const maxMotion = Math.max(leftMotion, rightMotion, upMotion, downMotion);
    if (maxMotion === leftMotion) return 'left';
    if (maxMotion === rightMotion) return 'right';
    if (maxMotion === upMotion) return 'up';
    if (maxMotion === downMotion) return 'down';
    
    return 'none';
  }, []);

  const detectMotion = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Use smaller resolution for better battery performance
    const width = Math.min(video.videoWidth, 320);
    const height = Math.min(video.videoHeight, 240);
    
    canvas.width = width;
    canvas.height = height;

    // Draw current frame at reduced resolution
    ctx.drawImage(video, 0, 0, width, height);
    const currentFrame = ctx.getImageData(0, 0, width, height);

    if (previousFrameRef.current) {
      const threshold = getSensitivityThreshold();
      let totalMotion = 0;
      let motionPixels = 0;
      const motionData: number[][] = [];

      // Initialize motion data array
      for (let y = 0; y < canvas.height; y++) {
        motionData[y] = [];
        for (let x = 0; x < canvas.width; x++) {
          motionData[y][x] = 0;
        }
      }

      // Compare frames pixel by pixel
      for (let i = 0; i < currentFrame.data.length; i += 4) {
        const currentR = currentFrame.data[i];
        const currentG = currentFrame.data[i + 1];
        const currentB = currentFrame.data[i + 2];
        
        const previousR = previousFrameRef.current.data[i];
        const previousG = previousFrameRef.current.data[i + 1];
        const previousB = previousFrameRef.current.data[i + 2];

        // Calculate difference
        const diff = Math.abs(currentR - previousR) + 
                    Math.abs(currentG - previousG) + 
                    Math.abs(currentB - previousB);

        if (diff > threshold) {
          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);
          
          motionData[y][x] = diff;
          totalMotion += diff;
          motionPixels++;
        }
      }

      const motionIntensity = motionPixels > 0 ? totalMotion / motionPixels : 0;
      const isMotionDetected = motionIntensity > threshold;
      const motionDirection = calculateMotionDirection(motionData, canvas.width, canvas.height);

      const newMotionData: MotionData = {
        isMotionDetected,
        motionIntensity: Math.min(motionIntensity / 100, 1), // Normalize to 0-1
        lastMotionTime: isMotionDetected ? Date.now() : state.currentMotion.lastMotionTime,
        motionDirection,
        confidenceLevel: Math.min(motionIntensity / 50, 1) // Normalize confidence
      };

      setState(prev => ({
        ...prev,
        currentMotion: newMotionData
      }));

      // Auto-wake functionality
      if (state.autoWakeEnabled && isMotionDetected && motionIntensity > threshold * 2) {
        // Dispatch custom event for auto-wake
        window.dispatchEvent(new CustomEvent('motionAutoWake', {
          detail: { motionData: newMotionData }
        }));
      }
    }

    // Store current frame for next comparison
    previousFrameRef.current = currentFrame;

    // Continue motion detection at reduced frequency for battery efficiency
    if (state.isActive) {
      animationFrameRef.current = setTimeout(() => {
        requestAnimationFrame(detectMotion);
      }, 200); // Check every 200ms instead of every frame
    }
  }, [state.isActive, state.autoWakeEnabled, state.currentMotion.lastMotionTime, getSensitivityThreshold, calculateMotionDirection]);

  const startMotionDetection = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Request camera access with battery-optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 15 } // Lower frame rate for better battery
        } 
      });

      streamRef.current = stream;

      // Create video element if not exists
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.style.display = 'none';
        document.body.appendChild(videoRef.current);
      }

      // Create canvas element if not exists
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.style.display = 'none';
        document.body.appendChild(canvasRef.current);
      }

      videoRef.current.srcObject = stream;
      videoRef.current.play();

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => resolve();
        }
      });

      setState(prev => ({ 
        ...prev, 
        isActive: true, 
        isInitialized: true 
      }));

      // Start motion detection loop
      detectMotion();

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Failed to start motion detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isActive: false 
      }));
      throw error;
    }
  }, [detectMotion]);

  const stopMotionDetection = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));

    if (animationFrameRef.current) {
      clearTimeout(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      document.body.removeChild(videoRef.current);
      videoRef.current = null;
    }

    if (canvasRef.current) {
      document.body.removeChild(canvasRef.current);
      canvasRef.current = null;
    }

    previousFrameRef.current = null;
  }, []);

  const setSensitivity = useCallback((sensitivity: 'low' | 'medium' | 'high') => {
    setState(prev => ({ ...prev, sensitivity }));
  }, []);

  const setAutoWakeEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoWakeEnabled: enabled }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMotionDetection();
    };
  }, [stopMotionDetection]);

  return {
    ...state,
    startMotionDetection,
    stopMotionDetection,
    setSensitivity,
    setAutoWakeEnabled
  };
}