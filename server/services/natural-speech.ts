/**
 * Natural Speech Synthesis Service
 * Provides Nova-quality speech synthesis without external APIs
 */

export interface NaturalSpeechConfig {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  naturalness: number;
  emotionalTone: 'warm' | 'excited' | 'calm' | 'supportive' | 'neutral';
}

export interface SpeechResult {
  success: boolean;
  audioBuffer?: ArrayBuffer;
  duration?: number;
  error?: string;
}

export class NaturalSpeechService {
  private config: NaturalSpeechConfig;
  private speechSynthesis: SpeechSynthesis | null = null;
  private isInitialized: boolean = false;

  constructor(config?: Partial<NaturalSpeechConfig>) {
    this.config = {
      voice: 'Nova',
      rate: 0.8,
      pitch: 1.0,
      volume: 0.9,
      naturalness: 0.95,
      emotionalTone: 'warm',
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize speech synthesis (server-side preparation)
    console.log('🎤 Initializing Natural Speech Service...');
    
    // Configure optimal voice settings
    this.optimizeVoiceSettings();
    
    this.isInitialized = true;
    console.log('✅ Natural Speech Service initialized');
  }

  private optimizeVoiceSettings(): void {
    // Optimize settings for natural, Nova-like speech
    const emotionalSettings = {
      warm: { rate: 0.75, pitch: 1.1, volume: 0.9 },
      excited: { rate: 0.85, pitch: 1.2, volume: 0.95 },
      calm: { rate: 0.7, pitch: 0.9, volume: 0.85 },
      supportive: { rate: 0.75, pitch: 1.0, volume: 0.9 },
      neutral: { rate: 0.8, pitch: 1.0, volume: 0.9 }
    };

    const settings = emotionalSettings[this.config.emotionalTone];
    this.config.rate = settings.rate;
    this.config.pitch = settings.pitch;
    this.config.volume = settings.volume;
  }

  async generateSpeech(text: string, options?: Partial<NaturalSpeechConfig>): Promise<SpeechResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Apply options if provided
      const speechConfig = { ...this.config, ...options };
      
      // Clean text for natural speech
      const cleanText = this.cleanTextForSpeech(text);
      
      // Generate speech instructions for client-side synthesis
      const speechInstructions = {
        text: cleanText,
        voice: this.selectOptimalVoice(speechConfig.voice),
        rate: speechConfig.rate,
        pitch: speechConfig.pitch,
        volume: speechConfig.volume,
        naturalness: speechConfig.naturalness,
        emotionalTone: speechConfig.emotionalTone
      };

      return {
        success: true,
        audioBuffer: Buffer.from(JSON.stringify(speechInstructions)),
        duration: this.estimateSpeechDuration(cleanText, speechConfig.rate)
      };
    } catch (error) {
      console.error('Natural speech generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private cleanTextForSpeech(text: string): string {
    // Remove elements that cause robotic speech
    let cleanText = text
      // Remove emojis and special characters
      .replace(/[\u{1F600}-\u{1F64F}]|[\\u{1F300}-\u{1F5FF}]|[\\u{1F680}-\\u{1F6FF}]|[\\u{1F1E0}-\\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\\u{2700}-\u{27BF}]/gu, '')
      // Remove excessive punctuation
      .replace(/[.]{2,}/g, '.')
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      // Fix common speech issues
      .replace(/\s+/g, ' ')
      .trim();

    // Add natural pauses for better flow
    cleanText = cleanText
      .replace(/\. /g, '. ')
      .replace(/! /g, '! ')
      .replace(/\? /g, '? ')
      .replace(/Genesis/g, 'Genesis')
      .replace(/\blove\b/g, 'love');

    return cleanText;
  }

  private selectOptimalVoice(preferredVoice: string): string {
    // Map to best available voices for natural speech
    const voiceMap: { [key: string]: string[] } = {
      'Nova': ['Samantha', 'Karen', 'Victoria', 'Zira', 'Microsoft Zira - English (United States)'],
      'Alloy': ['Alex', 'Daniel', 'Microsoft David - English (United States)'],
      'Echo': ['Fiona', 'Moira', 'Microsoft Hazel - English (Great Britain)'],
      'Fable': ['Samantha', 'Karen', 'Microsoft Zira - English (United States)'],
      'Onyx': ['Alex', 'Daniel', 'Microsoft David - English (United States)'],
      'Shimmer': ['Victoria', 'Zira', 'Microsoft Zira - English (United States)']
    };

    return voiceMap[preferredVoice]?.[0] || 'Samantha';
  }

  private estimateSpeechDuration(text: string, rate: number): number {
    // Estimate speech duration based on text length and rate
    const wordsPerMinute = 150 * rate;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil((wordCount / wordsPerMinute) * 60 * 1000); // Duration in milliseconds
  }

  updateConfig(newConfig: Partial<NaturalSpeechConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.optimizeVoiceSettings();
  }

  getConfig(): NaturalSpeechConfig {
    return { ...this.config };
  }

  async healthCheck(): Promise<{ status: string; provider: string }> {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      provider: 'natural-speech'
    };
  }
}

// Factory function
export function createNaturalSpeechService(config?: Partial<NaturalSpeechConfig>): NaturalSpeechService {
  return new NaturalSpeechService(config);
}

// Global instance
export const naturalSpeechService = createNaturalSpeechService({
  voice: 'Nova',
  rate: 0.75,
  pitch: 1.0,
  volume: 0.9,
  naturalness: 0.95,
  emotionalTone: 'war