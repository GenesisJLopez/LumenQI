import { useState, useEffect, useRef, useCallback } from 'react';

interface PauseDetectionConfig {
  shortPauseThreshold: number;  // ms for detecting brief pauses (500-800ms)
  longPauseThreshold: number;   // ms for detecting end of speech (1500-2000ms)
  contextAnalysisEnabled: boolean;
  volumeThreshold: number;      // Minimum volume to consider as speech
}

interface PauseAnalysis {
  isLikelyComplete: boolean;
  confidence: number;
  contextClues: string[];
  pauseDuration: number;
  speechPattern: 'incomplete' | 'complete' | 'thinking' | 'hesitation';
}

export function useIntelligentPauseDetection(
  isActive: boolean = false,
  onPauseAnalysis?: (analysis: PauseAnalysis) => void
) {
  const [config] = useState<PauseDetectionConfig>({
    shortPauseThreshold: 600,    // 600ms for brief pauses
    longPauseThreshold: 1800,    // 1.8s for speech completion
    contextAnalysisEnabled: true,
    volumeThreshold: 0.01        // Low threshold for voice detection
  });

  const [currentAnalysis, setCurrentAnalysis] = useState<PauseAnalysis | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const speechBufferRef = useRef<string[]>([]);
  const volumeHistoryRef = useRef<number[]>([]);

  // Context-aware analysis patterns
  const incompletePatterns = [
    /\b(and|but|or|so|because|since|when|if|although|while|unless)\s*$/i,
    /\b(the|a|an|this|that|these|those)\s*$/i,
    /\b(i|you|he|she|we|they)\s+(am|is|are|was|were|will|would|could|should)\s*$/i,
    /,\s*$/,  // Ending with comma
    /\b(um|uh|er|ah)\s*$/i  // Filler words
  ];

  const completePatterns = [
    /[.!?]\s*$/,  // Ending with punctuation
    /\b(thanks|thank you|bye|goodbye|see you|done|finished|complete)\s*$/i,
    /\b(yes|no|okay|ok|sure|alright|exactly|absolutely)\s*$/i
  ];

  const analyzeContext = useCallback((text: string): PauseAnalysis['contextClues'] => {
    const clues: string[] = [];
    
    // Check for incomplete sentence patterns
    for (const pattern of incompletePatterns) {
      if (pattern.test(text)) {
        clues.push('incomplete_sentence_structure');
        break;
      }
    }
    
    // Check for complete sentence patterns
    for (const pattern of completePatterns) {
      if (pattern.test(text)) {
        clues.push('complete_sentence_structure');
        break;
      }
    }
    
    // Analyze sentence structure
    const words = text.trim().split(/\s+/);
    if (words.length < 3) {
      clues.push('very_short_phrase');
    } else if (words.length > 15) {
      clues.push('long_statement');
    }
    
    // Check for question patterns
    if (/^(what|how|when|where|why|who|which|can|could|would|should|do|does|did|is|are|was|were)/i.test(text)) {
      clues.push('question_structure');
    }
    
    return clues;
  }, []);

  const analyzePause = useCallback((pauseDuration: number, recentText: string): PauseAnalysis => {
    const contextClues = config.contextAnalysisEnabled ? analyzeContext(recentText) : [];
    
    // Determine speech pattern based on pause duration and context
    let speechPattern: PauseAnalysis['speechPattern'] = 'thinking';
    let isLikelyComplete = false;
    let confidence = 0.5;
    
    // Short pause analysis (under threshold)
    if (pauseDuration < config.shortPauseThreshold) {
      speechPattern = 'hesitation';
      isLikelyComplete = false;
      confidence = 0.2;
    }
    // Medium pause analysis
    else if (pauseDuration < config.longPauseThreshold) {
      if (contextClues.includes('incomplete_sentence_structure')) {
        speechPattern = 'incomplete';
        isLikelyComplete = false;
        confidence = 0.3;
      } else if (contextClues.includes('complete_sentence_structure')) {
        speechPattern = 'complete';
        isLikelyComplete = true;
        confidence = 0.7;
      } else {
        speechPattern = 'thinking';
        isLikelyComplete = false;
        confidence = 0.4;
      }
    }
    // Long pause analysis (likely complete)
    else {
      if (contextClues.includes('incomplete_sentence_structure')) {
        speechPattern = 'incomplete';
        isLikelyComplete = false;
        confidence = 0.6; // Still uncertain due to incomplete structure
      } else {
        speechPattern = 'complete';
        isLikelyComplete = true;
        confidence = 0.8;
      }
    }
    
    // Boost confidence for clear completion indicators
    if (contextClues.includes('complete_sentence_structure')) {
      confidence = Math.min(0.9, confidence + 0.2);
      isLikelyComplete = true;
    }
    
    // Reduce confidence for clear incomplete indicators
    if (contextClues.includes('incomplete_sentence_structure')) {
      confidence = Math.max(0.1, confidence - 0.3);
      isLikelyComplete = false;
    }
    
    return {
      isLikelyComplete,
      confidence,
      contextClues,
      pauseDuration,
      speechPattern
    };
  }, [config, analyzeContext]);

  const startVolumeMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true 
        } 
      });
      
      mediaStreamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 512;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const monitorVolume = () => {
        if (!analyserRef.current || !isActive) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const normalizedVolume = average / 255;
        
        volumeHistoryRef.current.push(normalizedVolume);
        if (volumeHistoryRef.current.length > 10) {
          volumeHistoryRef.current.shift();
        }
        
        const avgVolume = volumeHistoryRef.current.reduce((a, b) => a + b) / volumeHistoryRef.current.length;
        
        if (avgVolume > config.volumeThreshold) {
          // Speech detected
          lastSpeechTimeRef.current = Date.now();
          
          // Clear any existing pause timer
          if (pauseTimerRef.current) {
            clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = null;
          }
        } else {
          // Silence detected - start/continue pause timing
          const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
          
          if (timeSinceLastSpeech > config.shortPauseThreshold && !pauseTimerRef.current) {
            // Start analyzing the pause
            const recentText = speechBufferRef.current.slice(-3).join(' ');
            const analysis = analyzePause(timeSinceLastSpeech, recentText);
            
            setCurrentAnalysis(analysis);
            onPauseAnalysis?.(analysis);
            
            // Set timer for final decision
            pauseTimerRef.current = setTimeout(() => {
              const finalPauseDuration = Date.now() - lastSpeechTimeRef.current;
              const finalAnalysis = analyzePause(finalPauseDuration, recentText);
              
              setCurrentAnalysis(finalAnalysis);
              onPauseAnalysis?.(finalAnalysis);
              pauseTimerRef.current = null;
            }, config.longPauseThreshold - timeSinceLastSpeech);
          }
        }
        
        if (isActive) {
          requestAnimationFrame(monitorVolume);
        }
      };
      
      monitorVolume();
      setIsListening(true);
      
    } catch (error) {
      console.error('Failed to start pause detection:', error);
    }
  }, [isActive, config, analyzePause, onPauseAnalysis]);

  const stopVolumeMonitoring = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setIsListening(false);
    setCurrentAnalysis(null);
  }, []);

  const updateSpeechBuffer = useCallback((text: string) => {
    speechBufferRef.current.push(text);
    if (speechBufferRef.current.length > 10) {
      speechBufferRef.current.shift();
    }
  }, []);

  // Start/stop monitoring based on isActive
  useEffect(() => {
    if (isActive) {
      startVolumeMonitoring();
    } else {
      stopVolumeMonitoring();
    }
    
    return () => stopVolumeMonitoring();
  }, [isActive, startVolumeMonitoring, stopVolumeMonitoring]);

  return {
    currentAnalysis,
    isListening,
    updateSpeechBuffer,
    config
  };
}