import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Smile, 
  Frown, 
  Meh, 
  Zap, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Play,
  Pause
} from 'lucide-react';
import { useEmotionDetection } from '@/hooks/use-emotion-detection';

interface EmotionDisplayProps {
  onEmotionChange?: (emotion: string, adaptation: any) => void;
}

export function EmotionDisplay({ onEmotionChange }: EmotionDisplayProps) {
  const {
    currentEmotion,
    isAnalyzing,
    emotionTrend,
    emotionSummary,
    error,
    startDetection,
    stopDetection,
    getResponseAdaptation
  } = useEmotionDetection();

  const handleToggleDetection = async () => {
    if (isAnalyzing) {
      stopDetection();
    } else {
      try {
        await startDetection();
      } catch (error) {
        console.error('Failed to start emotion detection:', error);
      }
    }
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'happy':
      case 'excited':
        return <Smile className="w-4 h-4" />;
      case 'sad':
      case 'melancholy':
        return <Frown className="w-4 h-4" />;
      case 'frustrated':
      case 'angry':
        return <Zap className="w-4 h-4" />;
      case 'calm':
      case 'neutral':
        return <Meh className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'happy':
      case 'excited':
        return 'bg-yellow-100 text-yellow-800';
      case 'sad':
      case 'melancholy':
        return 'bg-blue-100 text-blue-800';
      case 'frustrated':
      case 'angry':
        return 'bg-red-100 text-red-800';
      case 'nervous':
      case 'anxious':
        return 'bg-orange-100 text-orange-800';
      case 'calm':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
      case 'calming':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
      case 'agitated':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  // Notify parent of emotion changes
  React.useEffect(() => {
    if (currentEmotion && onEmotionChange) {
      const adaptation = getResponseAdaptation();
      onEmotionChange(currentEmotion.emotion, adaptation);
    }
  }, [currentEmotion, onEmotionChange, getResponseAdaptation]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Emotion Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleToggleDetection}
            variant={isAnalyzing ? "destructive" : "default"}
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Detection
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Detection
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          </div>
        )}

        {/* Current Emotion */}
        {isAnalyzing && currentEmotion && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getEmotionIcon(currentEmotion.emotion)}
                <span className="font-medium">Current Emotion</span>
              </div>
              <Badge className={getEmotionColor(currentEmotion.emotion)}>
                {currentEmotion.emotion}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence</span>
                <span>{Math.round(currentEmotion.confidence * 100)}%</span>
              </div>
              <Progress value={currentEmotion.confidence * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Valence</div>
                <div className="font-semibold">
                  {currentEmotion.valence > 0.6 ? 'Positive' : 
                   currentEmotion.valence < 0.4 ? 'Negative' : 'Neutral'}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Arousal</div>
                <div className="font-semibold">
                  {currentEmotion.arousal > 0.6 ? 'High' : 
                   currentEmotion.arousal < 0.4 ? 'Low' : 'Moderate'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emotion Summary */}
        {isAnalyzing && emotionSummary && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Emotion Trend</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(emotionTrend)}
                <span className="text-sm capitalize">{emotionTrend}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Dominant Emotion</div>
              <Badge className={getEmotionColor(emotionSummary.dominant)}>
                {emotionSummary.dominant}
              </Badge>
            </div>

            {emotionSummary.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Response Recommendations</div>
                <div className="space-y-1">
                  {emotionSummary.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {isAnalyzing ? 'Analyzing voice emotions...' : 'Emotion detection inactive'}
        </div>
      </CardContent>
    </Card>
  );
}