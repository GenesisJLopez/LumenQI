// OpenAI TTS Integration for Natural Voice Synthesis
export interface OpenAITTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: 'tts-1' | 'tts-1-hd';
  speed?: number; // 0.25 to 4.0
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export class OpenAITTS {
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;

  constructor() {}

  async speak(text: string, options: OpenAITTSOptions = {}): Promise<void> {
    if (!text.trim()) return;

    try {
      // Stop any current speech
      this.stop();

      // Clean text for natural speech
      const cleanText = this.cleanTextForSpeech(text);
      if (!cleanText.trim()) return;

      options.onStart?.();
      this.isPlaying = true;

      // Call our backend TTS endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          voice: options.voice || 'nova', // Nova is young, vibrant, and fun
          model: options.model || 'tts-1', // Faster model for voice mode
          speed: options.speed || 1.0, // Normal speech speed
          response_format: options.response_format || 'mp3'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS request failed:', response.status, errorText);
        throw new Error(`TTS request failed: ${response.status} - ${errorText}`);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      console.log('TTS audio blob size:', audioBlob.size);
      
      if (audioBlob.size === 0) {
        throw new Error('Empty audio response from TTS service');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onplay = () => {
        console.log('TTS audio playback started');
        this.isPlaying = true;
        options.onStart?.();
      };
      
      this.currentAudio.onended = () => {
        console.log('TTS audio playback ended');
        this.isPlaying = false;
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        if (options.onEnd) {
          try {
            options.onEnd();
          } catch (error) {
            console.error('Error in onEnd callback:', error);
          }
        }
      };

      this.currentAudio.onerror = (error) => {
        console.error('TTS audio playback error:', error);
        this.isPlaying = false;
        URL.revokeObjectURL(audioUrl);
        options.onError?.('Audio playback failed');
      };

      console.log('Starting TTS audio playback');
      await this.currentAudio.play();

    } catch (error) {
      this.isPlaying = false;
      console.error('OpenAI TTS error:', error);
      options.onError?.(error instanceof Error ? error.message : 'Unknown TTS error');
    }
  }

  private cleanTextForSpeech(text: string): string {
    // Remove markdown formatting
    let cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    cleanText = cleanText.replace(/\*(.*?)\*/g, '$1'); // Italic
    cleanText = cleanText.replace(/`(.*?)`/g, '$1'); // Code
    cleanText = cleanText.replace(/#{1,6}\s*(.*)/g, '$1'); // Headers
    cleanText = cleanText.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // Links
    
    // Remove emojis and special characters
    cleanText = cleanText.replace(/[\\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc symbols
    cleanText = cleanText.replace(/[\\u{1F680}-\\u{1F6FF}]/gu, ''); // Transport
    cleanText = cleanText.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
    cleanText = cleanText.replace(/[\\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
    cleanText = cleanText.replace(/[\\u{2700}-\\u{27BF}]/gu, ''); // Dingbats
    cleanText = cleanText.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental
    cleanText = cleanText.replace(/[\\u{1FA70}-\\u{1FAFF}]/gu, ''); // Extended
    cleanText = cleanText.replace(/[\u{2190}-\u{21FF}]/gu, ''); // Arrows
    
    // Fix comma issues for natural speech flow
    cleanText = cleanText.replace(/hey,\s*Genesis/gi, 'hey Genesis');
    cleanText = cleanText.replace(/hey,\s*love/gi, 'hey love');
    cleanText = cleanText.replace(/Genesis,/gi, 'Genesis');
    cleanText = cleanText.replace(/love,/gi, 'love');
    
    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText;
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  pause(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
    }
  }

  resume(): void {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play();
    }
  }

  isCurrentlySpeaking(): boolean {
    return this.isPlaying;
  }

  // Get available voices (OpenAI TTS voices)
  getVoices(): Array<{name: string, description: string}> {
    return [
      { name: 'alloy', description: 'Balanced, neutral voice' },
      { name: 'echo', description: 'Male voice' },
      { name: 'fable', description: 'British accent' },
      { name: 'onyx', description: 'Deep, resonant voice' },
      { name: 'nova', description: 'Young, vibrant female voice' },
      { name: 'shimmer', description: 'Soft, gentle voice' }
    ];
  }
}

export const openAITTS = new OpenAITTS();

// Export for backward compatibility
export default openAITTS;