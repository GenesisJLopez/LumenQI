export interface EmotionData {
  emotion: string;
  confidence: number;
  intensity: number;
  valence: number; // positive/negative
  arousal: number; // calm/excited
  timestamp: number;
}

export interface VoiceFeatures {
  pitch: number;
  energy: number;
  speechRate: number;
  volume: number;
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  mfcc: number[];
}

export class EmotionDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isAnalyzing = false;
  private emotionHistory: EmotionData[] = [];
  private frameData: Float32Array | null = null;
  private previousFeatures: VoiceFeatures | null = null;

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.frameData = new Float32Array(this.analyser.frequencyBinCount);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  async startAnalyzing(stream: MediaStream): Promise<void> {
    if (!this.audioContext || !this.analyser) {
      throw new Error('Audio context not initialized');
    }

    this.microphone = this.audioContext.createMediaStreamSource(stream);
    this.microphone.connect(this.analyser);
    this.isAnalyzing = true;

    // Start emotion detection loop
    this.analyzeEmotionLoop();
  }

  stopAnalyzing(): void {
    this.isAnalyzing = false;
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
  }

  private analyzeEmotionLoop(): void {
    if (!this.isAnalyzing || !this.analyser || !this.frameData) return;

    this.analyser.getFloatFrequencyData(this.frameData);
    
    const features = this.extractVoiceFeatures(this.frameData);
    const emotion = this.classifyEmotion(features);
    
    this.emotionHistory.push(emotion);
    
    // Keep only last 10 emotions for trend analysis
    if (this.emotionHistory.length > 10) {
      this.emotionHistory.shift();
    }

    // Continue analyzing
    requestAnimationFrame(() => this.analyzeEmotionLoop());
  }

  private extractVoiceFeatures(frequencyData: Float32Array): VoiceFeatures {
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    
    // Extract basic features
    const pitch = this.estimatePitch(frequencyData);
    const energy = this.calculateEnergy(frequencyData);
    const spectralCentroid = this.calculateSpectralCentroid(frequencyData);
    const spectralRolloff = this.calculateSpectralRolloff(frequencyData);
    const zeroCrossingRate = this.calculateZeroCrossingRate(frequencyData);
    const mfcc = this.calculateMFCC(frequencyData);

    // Estimate speech rate based on energy changes
    const speechRate = this.previousFeatures 
      ? Math.abs(energy - this.previousFeatures.energy) * 100 
      : 1.0;

    const features: VoiceFeatures = {
      pitch,
      energy,
      speechRate,
      volume: energy,
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate,
      mfcc
    };

    this.previousFeatures = features;
    return features;
  }

  private estimatePitch(frequencyData: Float32Array): number {
    let maxIndex = 0;
    let maxValue = -Infinity;
    
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }
    
    const sampleRate = this.audioContext?.sampleRate || 44100;
    return (maxIndex * sampleRate) / (2 * frequencyData.length);
  }

  private calculateEnergy(frequencyData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i] * frequencyData[i];
    }
    return Math.sqrt(sum / frequencyData.length);
  }

  private calculateSpectralCentroid(frequencyData: Float32Array): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = Math.abs(frequencyData[i]);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum === 0 ? 0 : weightedSum / magnitudeSum;
  }

  private calculateSpectralRolloff(frequencyData: Float32Array): number {
    const threshold = 0.85;
    let totalEnergy = 0;
    let cumulativeEnergy = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      totalEnergy += frequencyData[i] * frequencyData[i];
    }
    
    for (let i = 0; i < frequencyData.length; i++) {
      cumulativeEnergy += frequencyData[i] * frequencyData[i];
      if (cumulativeEnergy / totalEnergy >= threshold) {
        return i;
      }
    }
    
    return frequencyData.length - 1;
  }

  private calculateZeroCrossingRate(frequencyData: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < frequencyData.length; i++) {
      if ((frequencyData[i] >= 0) !== (frequencyData[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / frequencyData.length;
  }

  private calculateMFCC(frequencyData: Float32Array): number[] {
    // Simplified MFCC calculation
    const mfccCoefficients = [];
    const numCoefficients = 13;
    
    for (let i = 0; i < numCoefficients; i++) {
      let sum = 0;
      for (let j = 0; j < frequencyData.length; j++) {
        sum += frequencyData[j] * Math.cos((Math.PI * i * (j + 0.5)) / frequencyData.length);
      }
      mfccCoefficients.push(sum);
    }
    
    return mfccCoefficients;
  }

  private classifyEmotion(features: VoiceFeatures): EmotionData {
    // Rule-based emotion classification
    let emotion = 'neutral';
    let confidence = 0.5;
    let intensity = 0.5;
    let valence = 0.5; // neutral
    let arousal = 0.5; // neutral

    // High pitch + high energy = excited/happy
    if (features.pitch > 200 && features.energy > 0.7) {
      emotion = 'excited';
      confidence = 0.8;
      valence = 0.8;
      arousal = 0.9;
      intensity = 0.8;
    }
    // High pitch + low energy = nervous/anxious
    else if (features.pitch > 200 && features.energy < 0.3) {
      emotion = 'nervous';
      confidence = 0.7;
      valence = 0.3;
      arousal = 0.7;
      intensity = 0.6;
    }
    // Low pitch + high energy = angry/frustrated
    else if (features.pitch < 150 && features.energy > 0.8) {
      emotion = 'frustrated';
      confidence = 0.75;
      valence = 0.2;
      arousal = 0.8;
      intensity = 0.7;
    }
    // Low pitch + low energy = sad/tired
    else if (features.pitch < 150 && features.energy < 0.4) {
      emotion = 'sad';
      confidence = 0.7;
      valence = 0.2;
      arousal = 0.3;
      intensity = 0.6;
    }
    // Fast speech rate = excited/anxious
    else if (features.speechRate > 5) {
      emotion = 'anxious';
      confidence = 0.6;
      valence = 0.4;
      arousal = 0.8;
      intensity = 0.7;
    }
    // Slow speech rate = calm/sad
    else if (features.speechRate < 2) {
      emotion = 'calm';
      confidence = 0.6;
      valence = 0.6;
      arousal = 0.2;
      intensity = 0.4;
    }
    // High spectral centroid = bright/happy
    else if (features.spectralCentroid > 2000) {
      emotion = 'happy';
      confidence = 0.65;
      valence = 0.8;
      arousal = 0.6;
      intensity = 0.7;
    }
    // Low spectral centroid = dark/sad
    else if (features.spectralCentroid < 1000) {
      emotion = 'melancholy';
      confidence = 0.6;
      valence = 0.3;
      arousal = 0.4;
      intensity = 0.5;
    }

    return {
      emotion,
      confidence,
      intensity,
      valence,
      arousal,
      timestamp: Date.now()
    };
  }

  getCurrentEmotion(): EmotionData | null {
    if (this.emotionHistory.length === 0) return null;
    return this.emotionHistory[this.emotionHistory.length - 1];
  }

  getEmotionTrend(): string {
    if (this.emotionHistory.length < 3) return 'stable';
    
    const recent = this.emotionHistory.slice(-3);
    const valenceChange = recent[2].valence - recent[0].valence;
    const arousalChange = recent[2].arousal - recent[0].arousal;
    
    if (valenceChange > 0.2 && arousalChange > 0.2) return 'improving';
    if (valenceChange < -0.2 && arousalChange > 0.2) return 'agitated';
    if (valenceChange < -0.2 && arousalChange < -0.2) return 'declining';
    if (valenceChange > 0.2 && arousalChange < -0.2) return 'calming';
    
    return 'stable';
  }

  getEmotionSummary(): {
    dominant: string;
    confidence: number;
    trend: string;
    recommendations: string[];
  } {
    if (this.emotionHistory.length === 0) {
      return {
        dominant: 'neutral',
        confidence: 0.5,
        trend: 'stable',
        recommendations: []
      };
    }

    // Find most frequent emotion
    const emotionCounts: { [key: string]: number } = {};
    this.emotionHistory.forEach(emotion => {
      emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1;
    });

    const dominant = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    const avgConfidence = this.emotionHistory.reduce((sum, e) => sum + e.confidence, 0) / this.emotionHistory.length;
    const trend = this.getEmotionTrend();

    // Generate recommendations
    const recommendations = this.generateRecommendations(dominant, trend);

    return {
      dominant,
      confidence: avgConfidence,
      trend,
      recommendations
    };
  }

  private generateRecommendations(emotion: string, trend: string): string[] {
    const recommendations: string[] = [];

    switch (emotion) {
      case 'excited':
        recommendations.push('Match the energy level', 'Use enthusiastic responses', 'Suggest action-oriented activities');
        break;
      case 'nervous':
        recommendations.push('Use calming tone', 'Provide reassurance', 'Offer support and encouragement');
        break;
      case 'frustrated':
        recommendations.push('Acknowledge feelings', 'Offer solutions', 'Use patient and understanding tone');
        break;
      case 'sad':
        recommendations.push('Show empathy', 'Offer comfort', 'Use gentle and supportive language');
        break;
      case 'happy':
        recommendations.push('Share the positivity', 'Use upbeat responses', 'Encourage continued engagement');
        break;
      case 'calm':
        recommendations.push('Maintain peaceful tone', 'Use thoughtful responses', 'Provide stable interaction');
        break;
      default:
        recommendations.push('Use balanced approach', 'Monitor for changes', 'Adapt as needed');
    }

    if (trend === 'improving') {
      recommendations.push('Continue positive reinforcement');
    } else if (trend === 'declining') {
      recommendations.push('Increase supportive responses');
    }

    return recommendations;
  }
}

export const emotionDetector = new EmotionDetector();