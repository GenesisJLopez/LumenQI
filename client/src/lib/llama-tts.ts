// Lumen Llama 3 TTS - Pure Local Voice Synthesis
export interface LlamaTTSOptions {
  voice?: 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'shimmer';
  model?: 'llama3-8b' | 'llama3-70b' | 'llama3-lite';
  speed?: number; // 0.25 to 4.0
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export class LlamaTTS {
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    // Initialize Llama TTS
  }

  async speak(text: string, options: LlamaTTSOptions = {}): Promise<void> {
    if (!text.trim()) return;

    try {
      // Stop any current speech
      this.stop();

      // Clean text for natural speech
      const cleanText = this.cleanTextForSpeech(text);
      if (!cleanText.trim()) return;

      console.log('🦙 Using Llama TTS Service');
      options.onStart?.();
      this.isPlaying = true;

      // Get Llama 3 TTS audio from server
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          voice: options.voice || 'nova',
          model: options.model || 'llama3-8b',
          speed: options.speed || 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Llama TTS request failed: ${response.status}`);
      }

      const voiceData = await response.json();
      
      if (!voiceData.success || !voiceData.audioData) {
        throw new Error('Llama voice generation failed');
      }

      console.log('🦙 Playing Llama TTS generated audio...');
      
      // Convert base64 audio to blob and play
      const audioBlob = this.base64ToBlob(voiceData.audioData);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.volume = 0.8;
      
      this.currentAudio.onloadeddata = () => {
        console.log('🎤 Llama TTS playback started');
        options.onStart?.();
      };

      this.currentAudio.onplay = () => {
        console.log('🎤 Llama TTS audio started playing');
        this.isPlaying = true;
      };

      this.currentAudio.onended = () => {
        console.log('🎤 Llama TTS playback finished');
        this.isPlaying = false;
        this.cleanup();
        options.onEnd?.();
      };

      this.currentAudio.onerror = (error) => {
        console.error('Llama TTS playback error:', error);
        this.isPlaying = false;
        this.cleanup();
        options.onError?.('Audio playback failed');
      };

      await this.currentAudio.play();

    } catch (error) {
      console.error('Llama TTS error:', error);
      this.isPlaying = false;
      this.cleanup();
      options.onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private base64ToBlob(base64: string): Blob {
    try {
      // Remove any data URL prefix if present
      const base64Data = base64.replace(/^data:audio\/[^;]+;base64,/, '');
      
      // Convert base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return new Blob([bytes], { type: 'audio/wav' });
    } catch (error) {
      console.error('Base64 to blob conversion error:', error);
      throw new Error('Invalid audio data format');
    }
  }

  private cleanTextForSpeech(text: string): string {
    return text
      .replace(/[^\w\s\-.,!?;:()]/g, '') // Remove special characters except basic punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private cleanup(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
  }

  stop(): void {
    if (this.isPlaying && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.cleanup();
    }
    this.isPlaying = false;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

// Create singleton instance
export const llamaTTS = new LlamaTTS();