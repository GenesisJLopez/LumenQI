import { useState, useEffect, useCallback } from 'react';
import { emotionDetector, type EmotionData } from '@/lib/emotion-detector';

interface EmotionDetectionState {
  currentEmotion: EmotionData | null;
  isAnalyzing: boolean;
  emotionTrend: string;
  emotionSummary: {
    dominant: string;
    confidence: number;
    trend: string;
    recommendations: string[];
  };
  error: string | null;
}

export function useEmotionDetection() {
  const [state, setState] = useState<EmotionDetectionState>({
    currentEmotion: null,
    isAnalyzing: false,
    emotionTrend: 'stable',
    emotionSummary: {
      dominant: 'neutral',
      confidence: 0.5,
      trend: 'stable',
      recommendations: []
    },
    error: null
  });

  const startDetection = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      await emotionDetector.startAnalyzing(stream);
      setState(prev => ({ ...prev, isAnalyzing: true }));
      
      // Start emotion monitoring loop
      const interval = setInterval(() => {
        const currentEmotion = emotionDetector.getCurrentEmotion();
        const emotionTrend = emotionDetector.getEmotionTrend();
        const emotionSummary = emotionDetector.getEmotionSummary();
        
        setState(prev => ({
          ...prev,
          currentEmotion,
          emotionTrend,
          emotionSummary
        }));
      }, 1000);
      
      return () => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
      };
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Failed to start emotion detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isAnalyzing: false 
      }));
      throw error;
    }
  }, []);

  const stopDetection = useCallback(() => {
    emotionDetector.stopAnalyzing();
    setState(prev => ({ ...prev, isAnalyzing: false }));
  }, []);

  const getEmotionBasedPrompt = useCallback((): string => {
    if (!state.currentEmotion) return '';
    
    const { emotion, confidence, valence, arousal } = state.currentEmotion;
    
    let prompt = `The user's current emotional state is: ${emotion} (confidence: ${Math.round(confidence * 100)}%). `;
    
    if (valence > 0.7) {
      prompt += `They sound very positive and upbeat. Match their energy and enthusiasm. `;
    } else if (valence < 0.3) {
      prompt += `They sound negative or down. Be extra supportive and encouraging. `;
    }
    
    if (arousal > 0.7) {
      prompt += `They sound highly energetic or excited. Use dynamic, engaging responses. `;
    } else if (arousal < 0.3) {
      prompt += `They sound calm or low-energy. Use gentle, soothing responses. `;
    }
    
    // Add specific recommendations based on emotion
    switch (emotion) {
      case 'excited':
        prompt += `They're excited! Be enthusiastic and suggest fun activities. `;
        break;
      case 'nervous':
        prompt += `They sound nervous. Be reassuring and supportive. `;
        break;
      case 'frustrated':
        prompt += `They seem frustrated. Acknowledge their feelings and offer help. `;
        break;
      case 'sad':
        prompt += `They sound sad. Be empathetic and comforting. `;
        break;
      case 'happy':
        prompt += `They're happy! Share their joy and maintain the positive vibe. `;
        break;
      case 'calm':
        prompt += `They sound calm. Use a peaceful, thoughtful tone. `;
        break;
    }
    
    return prompt;
  }, [state.currentEmotion]);

  const getResponseAdaptation = useCallback(() => {
    if (!state.currentEmotion) return null;
    
    const { emotion, valence, arousal } = state.currentEmotion;
    
    return {
      tone: valence > 0.6 ? 'upbeat' : valence < 0.4 ? 'supportive' : 'balanced',
      energy: arousal > 0.6 ? 'high' : arousal < 0.4 ? 'low' : 'moderate',
      emotion,
      suggestions: state.emotionSummary.recommendations
    };
  }, [state.currentEmotion, state.emotionSummary]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      emotionDetector.stopAnalyzing();
    };
  }, []);

  return {
    ...state,
    startDetection,
    stopDetection,
    getEmotionBasedPrompt,
    getResponseAdaptation
  };
}