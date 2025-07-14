import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Heart, 
  Frown, 
  Smile, 
  Zap, 
  Target,
  Shield,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface EmotionData {
  emotion: string;
  confidence: number;
  timestamp: string;
  context: string;
}

interface EmotionAnalysis {
  dominantEmotion: string;
  emotionTrajectory: 'improving' | 'declining' | 'stable';
  recommendedApproach: string;
  recentEmotions: EmotionData[];
  emotionHistory: EmotionData[];
}

export function EmotionAdaptationDisplay() {
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmotionAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/emotion/analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch emotion analysis');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmotionAnalysis();
  }, []);

  const getEmotionIcon = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'excited':
      case 'happy':
        return <Smile className="w-4 h-4 text-yellow-500" />;
      case 'sad':
      case 'disappointed':
        return <Frown className="w-4 h-4 text-blue-500" />;
      case 'frustrated':
      case 'angry':
        return <Zap className="w-4 h-4 text-red-500" />;
      case 'afraid':
      case 'anxious':
        return <Shield className="w-4 h-4 text-purple-500" />;
      case 'ambitious':
      case 'determined':
        return <Target className="w-4 h-4 text-green-500" />;
      case 'calm':
      case 'peaceful':
        return <Heart className="w-4 h-4 text-green-400" />;
      case 'nervous':
        return <Sparkles className="w-4 h-4 text-orange-500" />;
      default:
        return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'excited':
      case 'happy':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'sad':
      case 'disappointed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'frustrated':
      case 'angry':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'afraid':
      case 'anxious':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'ambitious':
      case 'determined':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'calm':
      case 'peaceful':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'nervous':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getTrajectoryIcon = (trajectory: string) => {
    switch (trajectory) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrajectoryColor = (trajectory: string) => {
    switch (trajectory) {
      case 'improving':
        return 'text-green-600 dark:text-green-400';
      case 'declining':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Emotion-Based Adaptation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Emotion-Based Adaptation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchEmotionAnalysis} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Emotion-Based Adaptation
          <Button 
            onClick={fetchEmotionAnalysis} 
            variant="ghost" 
            size="sm"
            className="ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dominant Emotion */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Dominant Emotion</span>
            <Badge className={getEmotionColor(analysis.dominantEmotion)}>
              <div className="flex items-center gap-1">
                {getEmotionIcon(analysis.dominantEmotion)}
                <span className="capitalize">{analysis.dominantEmotion}</span>
              </div>
            </Badge>
          </div>
        </div>

        {/* Emotion Trajectory */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Emotional Trajectory</span>
            <div className={`flex items-center gap-2 ${getTrajectoryColor(analysis.emotionTrajectory)}`}>
              {getTrajectoryIcon(analysis.emotionTrajectory)}
              <span className="capitalize text-sm">{analysis.emotionTrajectory}</span>
            </div>
          </div>
        </div>

        {/* Recommended Approach */}
        <div className="space-y-3">
          <span className="text-sm font-medium">Lumen's Adaptation</span>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              {analysis.recommendedApproach}
            </p>
          </div>
        </div>

        {/* Recent Emotions */}
        {analysis.recentEmotions.length > 0 && (
          <div className="space-y-3">
            <span className="text-sm font-medium">Recent Emotional States</span>
            <div className="space-y-2">
              {analysis.recentEmotions.map((emotion, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    {getEmotionIcon(emotion.emotion)}
                    <span className="text-sm capitalize">{emotion.emotion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={emotion.confidence * 100} 
                      className="w-16 h-2"
                    />
                    <span className="text-xs text-gray-500 min-w-[3ch]">
                      {Math.round(emotion.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emotion History Summary */}
        {analysis.emotionHistory.length > 0 && (
          <div className="space-y-3">
            <span className="text-sm font-medium">Emotional Journey</span>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total emotional interactions: {analysis.emotionHistory.length}
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.emotionHistory.slice(-10).map((emotion, index) => (
                <div key={index} className="flex items-center gap-1">
                  {getEmotionIcon(emotion.emotion)}
                  {index < analysis.emotionHistory.slice(-10).length - 1 && (
                    <span className="text-gray-300 dark:text-gray-600">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>How it works:</strong> Lumen analyzes your voice and adapts her personality, 
            tone, and response style based on your emotional state. She becomes more energetic 
            when you're excited, more supportive when you're sad, and more encouraging when you're ambitious.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}