// Ultra-natural speech synthesis with OpenAI TTS fallback
export class NaturalSpeech {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeBestVoice();
  }

  private initializeBestVoice() {
    const setVoice = () => {
      const voices = this.synthesis.getVoices();
      
      // Priority list for the most natural female voices
      const preferredVoices = [
        'Samantha',           // macOS - very natural
        'Karen',              // macOS - natural
        'Moira',              // macOS - Irish accent
        'Microsoft Zira',     // Windows - good quality
        'Google UK English Female', // Chrome - natural
        'Google US English Female', // Chrome - natural
        'Microsoft Hazel',    // Windows - UK accent
        'Alex',               // macOS - male but very natural
        'Microsoft David'     // Windows - male but clear
      ];

      // Find the best available voice
      for (const preferred of preferredVoices) {
        const voice = voices.find(v => v.name.includes(preferred));
        if (voice) {
          this.preferredVoice = voice;
          console.log(`Selected voice: ${voice.name} (${voice.lang})`);
          break;
        }
      }

      // Fallback to any English female voice
      if (!this.preferredVoice) {
        this.preferredVoice = voices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.toLowerCase().includes('female') || 
           v.name.toLowerCase().includes('woman'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      }
    };

    if (this.synthesis.getVoices().length > 0) {
      setVoice();
    } else {
      this.synthesis.onvoiceschanged = setVoice;
    }
  }

  private cleanTextForNaturalSpeech(text: string): string {
    return text
      // Remove markdown
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      
      // Remove emojis and special characters
      .replace(/[🎯🌟💫⭐✨🔥💎🚀⚡🌈🎪🎨🎭🎪🎯🎲🎰]/g, '')
      .replace(/:\w+:/g, '')
      
      // Make speech flow naturally by removing ALL pauses
      .replace(/\s*,\s*/g, ' ')  // Remove ALL commas
      .replace(/\s*;\s*/g, ' ')  // Remove semicolons
      .replace(/\s*:\s*/g, ' ')  // Remove colons
      .replace(/\s*-\s*/g, ' ')  // Remove dashes
      .replace(/\s*—\s*/g, ' ')  // Remove em dashes
      .replace(/\s*\(\s*/g, ' ') // Remove parentheses
      .replace(/\s*\)\s*/g, ' ')
      .replace(/\s*\[\s*/g, ' ') // Remove brackets
      .replace(/\s*\]\s*/g, ' ')
      
      // Handle specific terms that cause robotic speech
      .replace(/,\s*(Genesis|love|hey love|hey Genesis|there Genesis|there love)/gi, ' $1')
      .replace(/hey,\s*(love|Genesis)/gi, 'hey $1')
      .replace(/there,\s*(love|Genesis)/gi, 'there $1')
      
      // Clean up multiple spaces and punctuation
      .replace(/\s+/g, ' ')
      .replace(/\s+([.!?])/g, '$1')
      .replace(/([.!?])\s*([.!?])/g, '$1')
      .replace(/\.\s*\.\s*\./g, '.')
      .trim();
  }

  async speak(text: string, options: {
    voice?: string;
    model?: string;  
    speed?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: any) => void;
  } = {}) {
    // Stop any current speech
    this.stop();

    const cleanText = this.cleanTextForNaturalSpeech(text);
    if (!cleanText.trim()) return;

    // Try OpenAI TTS first
    try {
      await this.speakWithOpenAI(cleanText, options);
    } catch (error) {
      console.warn('OpenAI TTS failed, falling back to browser TTS:', error);
      // Fallback to browser TTS
      this.speakWithBrowserTTS(cleanText, options);
    }
  }

  private async speakWithOpenAI(text: string, options: any) {
    if (!text.trim()) return;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: options.voice || 'nova',
          model: options.model || 'tts-1-hd',
          speed: options.speed || 1.0,
          response_format: 'mp3'
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      this.currentAudio = new Audio(audioUrl);
      
      // Only start logo animation when audio actually starts playing
      this.currentAudio.onplay = () => {
        this.isPlaying = true;
        options.onStart?.();
        console.log('OpenAI TTS playback started');
      };
      
      this.currentAudio.onended = () => {
        this.isPlaying = false;
        URL.revokeObjectURL(audioUrl);
        options.onEnd?.();
      };

      this.currentAudio.onerror = () => {
        this.isPlaying = false;
        URL.revokeObjectURL(audioUrl);
        options.onError?.('Audio playback failed');
      };

      await this.currentAudio.play();

    } catch (error) {
      this.isPlaying = false;
      console.error('OpenAI TTS error:', error);
      throw error;
    }
  }

  private speakWithBrowserTTS(text: string, options: any) {
    if (!this.preferredVoice) {
      console.warn('No suitable voice found');
      options.onError?.('No voice available');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure for ultra-natural speech
    utterance.voice = this.preferredVoice;
    utterance.rate = 0.75;  // Much slower for natural human pace
    utterance.pitch = 0.9;  // Slightly lower for warmth
    utterance.volume = 1.0;
    
    // Only start logo animation when speech actually starts
    utterance.onstart = () => {
      this.isPlaying = true;
      options.onStart?.();
      console.log('Browser TTS playback started');
    };
    
    // Fine-tune based on voice characteristics
    if (this.preferredVoice.name.includes('Samantha')) {
      utterance.rate = 0.8;   // Samantha sounds best at this rate
      utterance.pitch = 0.95;
    } else if (this.preferredVoice.name.includes('Karen')) {
      utterance.rate = 0.77;  // Karen is naturally fast
      utterance.pitch = 0.92;
    } else if (this.preferredVoice.name.includes('Zira')) {
      utterance.rate = 0.85;  // Zira handles faster speech well
      utterance.pitch = 1.0;
    }

    // Add event listeners
    utterance.onstart = () => {
      console.log('Browser TTS started');
      options.onStart?.();
    };

    utterance.onend = () => {
      console.log('Browser TTS ended');
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (error) => {
      console.error('Browser TTS error:', error);
      this.currentUtterance = null;
      options.onError?.(error);
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  stop() {
    // Stop OpenAI TTS audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    // Stop browser TTS
    if (this.currentUtterance) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
    
    this.isPlaying = false;
  }

  pause() {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  resume() {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  isSpeaking(): boolean {
    return this.isPlaying || this.synthesis.speaking;
  }

  getCurrentVoice(): SpeechSynthesisVoice | null {
    return this.preferredVoice;
  }
}

// Export singleton instance
export const naturalSpeech = new NaturalSpeech();