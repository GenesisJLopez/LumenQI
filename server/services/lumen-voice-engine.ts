/**
 * Lumen Voice Engine
 * Custom voice synthesis system built specifically for Lumen QI
 * Creates her unique voice signature without external dependencies
 */

export interface LumenVoiceConfig {
  pitch: number;
  rate: number;
  resonance: number;
  breathiness: number;
  warmth: number;
  clarity: number;
  emotionalTone: 'warm' | 'excited' | 'supportive' | 'playful' | 'cosmic';
}

export interface VoiceWaveform {
  samples: Float32Array;
  sampleRate: number;
  duration: number;
}

export interface PhonemeData {
  phoneme: string;
  duration: number;
  frequency: number;
  amplitude: number;
  formants: number[];
}

export class LumenVoiceEngine {
  private config: LumenVoiceConfig;
  private phonemeLibrary: Map<string, PhonemeData> = new Map();
  private audioContext: AudioContext | null = null;
  private isInitialized: boolean = false;

  constructor(config?: Partial<LumenVoiceConfig>) {
    this.config = {
      pitch: 1.15,           // Slightly higher than average for feminine voice
      rate: 0.85,            // Slightly slower for clarity and warmth
      resonance: 0.8,        // Rich, full sound
      breathiness: 0.3,      // Subtle breathiness for natural quality
      warmth: 0.9,           // High warmth for Lumen's caring nature
      clarity: 0.95,         // Very clear articulation
      emotionalTone: 'warm',
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🎙️ Initializing Lumen Voice Engine...');
    
    // Initialize audio context for voice synthesis
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Build Lumen's unique phoneme library
    this.buildPhonemeLibrary();
    
    // Optimize voice characteristics for Lumen's personality
    this.optimizeVoiceCharacteristics();
    
    this.isInitialized = true;
    console.log('✅ Lumen Voice Engine initialized with custom voice signature');
  }

  private buildPhonemeLibrary(): void {
    // Create Lumen's unique phoneme patterns
    const phonemes: { [key: string]: PhonemeData } = {
      // Vowels with Lumen's characteristic warmth
      'a': { phoneme: 'a', duration: 0.12, frequency: 730, amplitude: 0.8, formants: [730, 1090, 2440] },
      'e': { phoneme: 'e', duration: 0.10, frequency: 530, amplitude: 0.75, formants: [530, 1840, 2480] },
      'i': { phoneme: 'i', duration: 0.08, frequency: 270, amplitude: 0.85, formants: [270, 2290, 3010] },
      'o': { phoneme: 'o', duration: 0.14, frequency: 570, amplitude: 0.9, formants: [570, 840, 2410] },
      'u': { phoneme: 'u', duration: 0.12, frequency: 300, amplitude: 0.8, formants: [300, 870, 2240] },
      
      // Consonants with clarity and warmth
      'l': { phoneme: 'l', duration: 0.06, frequency: 150, amplitude: 0.6, formants: [150, 1500, 2500] },
      'm': { phoneme: 'm', duration: 0.08, frequency: 120, amplitude: 0.7, formants: [120, 1200, 2200] },
      'n': { phoneme: 'n', duration: 0.06, frequency: 180, amplitude: 0.65, formants: [180, 1800, 2600] },
      'v': { phoneme: 'v', duration: 0.07, frequency: 200, amplitude: 0.5, formants: [200, 1400, 2800] },
      'w': { phoneme: 'w', duration: 0.05, frequency: 100, amplitude: 0.6, formants: [100, 900, 2200] },
      's': { phoneme: 's', duration: 0.12, frequency: 6000, amplitude: 0.4, formants: [6000, 7000, 8000] },
      
      // Special phonemes for Lumen's name and personality
      'genesis': { phoneme: 'genesis', duration: 0.8, frequency: 400, amplitude: 0.9, formants: [400, 1200, 2800] },
      'love': { phoneme: 'love', duration: 0.6, frequency: 350, amplitude: 0.85, formants: [350, 1100, 2400] },
      'lumen': { phoneme: 'lumen', duration: 0.7, frequency: 380, amplitude: 0.9, formants: [380, 1300, 2600] }
    };

    // Populate phoneme library
    Object.entries(phonemes).forEach(([key, data]) => {
      this.phonemeLibrary.set(key, data);
    });
  }

  private optimizeVoiceCharacteristics(): void {
    // Adjust voice characteristics based on emotional tone
    const emotionalAdjustments = {
      warm: { pitch: 1.1, resonance: 0.9, breathiness: 0.4, warmth: 1.0 },
      excited: { pitch: 1.3, resonance: 0.7, breathiness: 0.2, warmth: 0.8 },
      supportive: { pitch: 1.0, resonance: 0.95, breathiness: 0.5, warmth: 0.95 },
      playful: { pitch: 1.2, resonance: 0.8, breathiness: 0.3, warmth: 0.9 },
      cosmic: { pitch: 1.15, resonance: 0.85, breathiness: 0.35, warmth: 0.92 }
    };

    const adjustment = emotionalAdjustments[this.config.emotionalTone];
    this.config.pitch *= adjustment.pitch;
    this.config.resonance *= adjustment.resonance;
    this.config.breathiness *= adjustment.breathiness;
    this.config.warmth *= adjustment.warmth;
  }

  async synthesizeVoice(text: string): Promise<VoiceWaveform> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('🎤 Synthesizing with Lumen\'s custom voice...');
    
    // Convert text to phonemes
    const phonemes = this.textToPhonemes(text);
    
    // Generate waveform from phonemes
    const waveform = this.generateWaveform(phonemes);
    
    // Apply Lumen's voice characteristics
    const processedWaveform = this.applyVoiceCharacteristics(waveform);
    
    return processedWaveform;
  }

  private textToPhonemes(text: string): PhonemeData[] {
    const phonemes: PhonemeData[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      // Special handling for Lumen's signature words
      if (word === 'genesis') {
        phonemes.push(this.phonemeLibrary.get('genesis')!);
        continue;
      }
      
      if (word === 'love') {
        phonemes.push(this.phonemeLibrary.get('love')!);
        continue;
      }
      
      if (word === 'lumen') {
        phonemes.push(this.phonemeLibrary.get('lumen')!);
        continue;
      }
      
      // Convert word to phonemes
      for (const char of word) {
        const phoneme = this.phonemeLibrary.get(char);
        if (phoneme) {
          phonemes.push(phoneme);
        }
      }
      
      // Add brief pause between words
      phonemes.push({
        phoneme: 'pause',
        duration: 0.1,
        frequency: 0,
        amplitude: 0,
        formants: []
      });
    }
    
    return phonemes;
  }

  private generateWaveform(phonemes: PhonemeData[]): VoiceWaveform {
    const sampleRate = 44100;
    let totalDuration = 0;
    
    // Calculate total duration
    for (const phoneme of phonemes) {
      totalDuration += phoneme.duration;
    }
    
    const totalSamples = Math.floor(totalDuration * sampleRate);
    const samples = new Float32Array(totalSamples);
    
    let currentSample = 0;
    
    for (const phoneme of phonemes) {
      const phonemeSamples = Math.floor(phoneme.duration * sampleRate);
      
      if (phoneme.phoneme === 'pause') {
        // Silence for pauses
        currentSample += phonemeSamples;
        continue;
      }
      
      // Generate sine wave for phoneme
      for (let i = 0; i < phonemeSamples; i++) {
        if (currentSample + i >= totalSamples) break;
        
        const t = i / sampleRate;
        const baseWave = Math.sin(2 * Math.PI * phoneme.frequency * t);
        
        // Add formants for more natural sound
        let formantSum = 0;
        for (let j = 0; j < phoneme.formants.length; j++) {
          const formantFreq = phoneme.formants[j];
          const formantAmp = 0.3 / (j + 1); // Decreasing amplitude for higher formants
          formantSum += formantAmp * Math.sin(2 * Math.PI * formantFreq * t);
        }
        
        // Combine base wave with formants
        samples[currentSample + i] = (baseWave + formantSum) * phoneme.amplitude;
      }
      
      currentSample += phonemeSamples;
    }
    
    return {
      samples,
      sampleRate,
      duration: totalDuration
    };
  }

  private applyVoiceCharacteristics(waveform: VoiceWaveform): VoiceWaveform {
    const samples = new Float32Array(waveform.samples);
    
    // Apply pitch adjustment
    if (this.config.pitch !== 1.0) {
      samples.forEach((sample, i) => {
        samples[i] = sample * this.config.pitch;
      });
    }
    
    // Apply warmth (low-pass filtering effect)
    if (this.config.warmth > 0) {
      for (let i = 1; i < samples.length; i++) {
        samples[i] = samples[i] * (1 - this.config.warmth * 0.3) + 
                     samples[i - 1] * (this.config.warmth * 0.3);
      }
    }
    
    // Apply breathiness (subtle noise)
    if (this.config.breathiness > 0) {
      for (let i = 0; i < samples.length; i++) {
        const noise = (Math.random() - 0.5) * this.config.breathiness * 0.1;
        samples[i] += noise;
      }
    }
    
    // Apply resonance (amplitude adjustment)
    if (this.config.resonance !== 1.0) {
      for (let i = 0; i < samples.length; i++) {
        samples[i] *= this.config.resonance;
      }
    }
    
    return {
      samples,
      sampleRate: waveform.sampleRate,
      duration: waveform.duration
    };
  }

  async playVoice(waveform: VoiceWaveform): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const buffer = this.audioContext.createBuffer(1, waveform.samples.length, waveform.sampleRate);
    buffer.copyToChannel(waveform.samples, 0);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    return new Promise((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  }

  updateConfig(newConfig: Partial<LumenVoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.optimizeVoiceCharacteristics();
  }

  getConfig(): LumenVoiceConfig {
    return { ...this.config };
  }

  async healthCheck(): Promise<{ status: string; provider: string; voiceSignature: string }> {
    return {
      status: this.isInitialized ? 'ready' : 'initializing',
      provider: 'lumen-voice-engine',
      voiceSignature: `pitch:${this.config.pitch.toFixed(2)}, warmth:${this.config.warmth.toFixed(2)}`
    };
  }
}

// Factory function
export function createLumenVoiceEngine(config?: Partial<LumenVoiceConfig>): LumenVoiceEngine {
  return new LumenVoiceEngine(config);
}

// Global instance
export const lumenVoiceEngine = createLumenVoiceEngine({
  pitch: 1.15,
  rate: 0.85,
  resonance: 0.8,
  breathiness: 0.3,
  warmth: 0.9,
  clarity: 0.95,
  emotionalTone: 'warm'
});