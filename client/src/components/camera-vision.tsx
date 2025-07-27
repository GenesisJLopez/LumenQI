import { useState useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VisionAnalysis {
  timestamp: string;
  description: string;
  objects: string[];
  people: string[];
  emotions: string[];
  actions: string[];
  environment: string;
  confidence: number;
}

interface CameraVisionProps {
  onAnalysisUpdate?: (analysis: VisionAnalysis) => void;
}

export function CameraVision({ onAnalysisUpdate }: CameraVisionProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<VisionAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<VisionAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef =<HTMLVideoElement>(null);
  const canvasRef =<HTMLCanvasElement>(null);
  const intervalRef =<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setStream(mediaStream);
      setIsCameraActive(true);
      
      toast({
        title: "Camera Activated",
        description: "Lumen can now see through your camera",
      });
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      toast({
        title: "Camera Access Failed",
        description: "Please grant camera permissions and try again",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
    setIsAnalyzing(false);
    setIsRealTimeMode(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    toast({
      title: "Camera Deactivated",
      description: "Lumen's vision has been disabled",
    });
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    // Try multiple formats to ensure compatibility
    try {
      // First try JPEG (most compatible)
      const jpegData = canvas.toDataURL('image/jpeg', 0.8);
      if (jpegData && jpegData.startsWith('data:image/jpeg')) {
        return jpegData;
      }
      
      // Fallback to PNG
      const pngData = canvas.toDataURL('image/png');
      if (pngData && pngData.startsWith('data:image/png')) {
        return pngData;
      }
      
      // Last resort - WebP
      const webpData = canvas.toDataURL('image/webp', 0.8);
      if (webpData && webpData.startsWith('data:image/webp')) {
        return webpData;
      }
      
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
    
    return null;
  };

  const analyzeFrame = async (imageData?: string) => {
    if (!isCameraActive && !imageData) return;

    const frameData = imageData || captureFrame();
    if (!frameData) return;

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: frameData,
          mode: isRealTimeMode ? 'realtime' : 'detailed'
        })
      });

      if (!response.ok) {
        // Try to get error message from response body
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Analysis failed: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Analysis failed: ${response.status}`);
        }
      }

      const analysis: VisionAnalysis = await response.json();
      
      setCurrentAnalysis(analysis);
      setAnalysisHistory(prev => [analysis, ...prev.slice(0, 9)]); // Keep last 10 analyses
      
      if (onAnalysisUpdate) {
        onAnalysisUpdate(analysis);
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
      
      // Extract error message from response
      let errorMessage = 'Failed to analyze image. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Analysis Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleRealTimeMode = () => {
    if (isRealTimeMode) {
      // Stop real-time analysis
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRealTimeMode(false);
      toast({
        title: "Real-time Analysis Disabled",
        description: "Lumen will analyze on-demand only",
      });
    } else {
      // Start real-time analysis
      if (isCameraActive) {
        setIsRealTimeMode(true);
        intervalRef.current = setInterval(() => {
          analyzeFrame();
        }, 3000); // Analyze every 3 seconds
        
        toast({
          title: "Real-time Analysis Enabled",
          description: "Lumen is now continuously analyzing the camera feed",
        });
      }
    }
  };

  const takeSnapshot = () => {
    if (isCameraActive) {
      analyzeFrame();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="space-y-6">
      {/* Camera Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Lumen's Vision System
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Allow Lumen to see through your camera and analyze what she observes
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={isCameraActive ? stopCamera : startCamera}
              variant={isCameraActive ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {isCameraActive ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Start Camera
                </>
              )}
            </Button>
            
            {isCameraActive && (
              <>
                <Button
                  onClick={takeSnapshot}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Analyze Now
                </Button>
                
                <Button
                  onClick={toggleRealTimeMode}
                  variant={isRealTimeMode ? "secondary" : "outline"}
                  className="flex items-center gap-2"
                >
                  {isRealTimeMode ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Stop Real-time
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Real-time Mode
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={isCameraActive ? "default" : "secondary"}>
              {isCameraActive ? "Camera Active" : "Camera Inactive"}
            </Badge>
            {isRealTimeMode && (
              <Badge variant="outline" className="animate-pulse">
                Real-time Analysis
              </Badge>
            )}
            {isAnalyzing && (
              <Badge variant="outline" className="animate-pulse">
                Analyzing...
              </Badge>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Feed */}
      {isCameraActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Live Camera Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-96 object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Analyzing...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Analysis */}
      {currentAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Current Analysis
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {new Date(currentAnalysis.timestamp).toLocaleTimeString()}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What Lumen Sees:</h4>
              <p className="text-sm text-muted-foreground">
                {currentAnalysis.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentAnalysis.objects.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Objects Detected:</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentAnalysis.objects.map((object, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {object}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {currentAnalysis.people.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">People:</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentAnalysis.people.map((person, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {person}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {currentAnalysis.emotions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Emotions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentAnalysis.emotions.map((emotion, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {currentAnalysis.actions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Actions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentAnalysis.actions.map((action, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {currentAnalysis.environment && (
              <div>
                <h4 className="font-medium mb-2">Environment:</h4>
                <p className="text-sm text-muted-foreground">
                  {currentAnalysis.environment}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Confidence: {(currentAnalysis.confidence * 100).toFixed(1)}%</span>
              <span>{new Date(currentAnalysis.timestamp).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis History */}
      {analysisHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Analysis History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analysisHistory.slice(1).map((analysis, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded border">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium">
                      {new Date(analysis.timestamp).toLocaleTimeString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {(analysis.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {analysis.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}