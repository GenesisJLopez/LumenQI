import { useState, useEffect, useCallback } from 'react';
import { type EmotionData } from '@/lib/emotion-detector';
import { enhancedEmotionDetector } from '@/lib/enhanced-emotion-detector';
import { AdvancedEmotionDetector, type EmotionResult } from '@/lib/advanced-emotion-detector';

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

  const [advancedDetector] = useState(() => new AdvancedEmotionDetector());
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);

  // Auto-start emotion detection when voice mode is active
  useEffect(() => {
    if (isVoiceModeActive && !state.isAnalyzing) {
      startDetection();
    } else if (!isVoiceModeActive && state.isAnalyzing) {
      stopDetection();
    }
  }, [isVoiceModeActive]);

  // Listen for voice mode changes
  useEffect(() => {
    const handleVoiceModeChange = (event: CustomEvent) => {
      setIsVoiceModeActive(event.detail.active);
    };

    window.addEventListener('voiceModeChanged', handleVoiceModeChange as EventListener);
    
    return () => {
      window.removeEventListener('voiceModeChanged', handleVoiceModeChange as EventListener);
    };
  }, []);

  const startDetection = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Use advanced detector for better accuracy
      await advancedDetector.startDetection((emotionResult: EmotionResult) => {
        const emotionData: EmotionData = {
          emotion: emotionResult.emotion,
          confidence: emotionResult.confidence,
          valence: emotionResult.features.arousal > 0.6 ? 
            (emotionResult.features.valence > 0.6 ? 0.8 : 0.4) : 0.5,
          arousal: emotionResult.features.arousal,
          pitch: emotionResult.features.pitch,
          energy: emotionResult.features.energy,
          speechRate: emotionResult.features.speechRate,
          spectralCharacteristics: emotionResult.features.mfcc
        };
        
        setState(prev => ({
          ...prev,
          currentEmotion: emotionData,
          emotionSummary: {
            ...prev.emotionSummary,
            dominant: emotionResult.emotion,
            confidence: emotionResult.confidence
          }
        }));
        
        // Send high-confidence emotions to server for adaptation
        if (emotionResult.confidence > 0.6) {
          sendEmotionToServer(emotionData);
        }
      });
      
      setState(prev => ({ ...prev, isAnalyzing: true }));
      console.log('Advanced emotion detection started for voice mode');
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Failed to start emotion detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isAnalyzing: false 
      }));
      throw error;
    }
  }, [advancedDetector]);

  const stopDetection = useCallback(() => {
    advancedDetector.stopDetection();.stopAnalyzing();
    setState(prev => ({ ...prev, isAnalyzing: false, currentEmotion: null }));
    console.log('Advanced emotion detection stopped');
  }, [advancedDetector]);

  const sendEmotionToServer = useCallback((emotionData: EmotionData) => {
    try {
      // Create a custom event to send emotion data to the chat system
      const emotionEvent = new CustomEvent('emotionDetected', {
        detail: {
          emotion: emotionData.emotion,
          confidence: emotionData.confidence,
          features: {
            pitch: emotionData.pitch,
            energy: emotionData.energy,
            speechRate: emotionData.speechRate,
            arousal: emotionData.arousal,
            valence: emotionData.valence
          },
          timestamp: Date.now()
        }
      });
      
      window.dispatchEvent(emotionEvent);
    } catch (error) {
      console.error('Failed to send emotion data:', error);
    }
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
      case 'afraid':
        prompt += `They seem afraid or scared. Provide reassurance and comfort. `;
        break;
      case 'ambitious':
        prompt += `They're showing ambition and drive. Match their energy and focus on actionable steps. `;
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

  // Text-based emotion detection for chat messages
  const detectEmotionFromText = useCallback((text: string) => {
    const result = enhancedEmotionDetector.detectEmotionFromText(text);
    
    // Log the detected emotion for debugging
    console.log('Emotion detected:', result.emotion, result);
    
    return result;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      advancedDetector.stopDetection();.stopAnalyzing();
    };
  }, [advancedDetector]);

  return {
    ...state,
    startDetection,
    stopDetection,
    getEmotionBasedPrompt,
    getResponseAdaptation,
    detectEmotionFromText,
    isVoiceModeActive,
    setIsVoiceModeActive
  };
}