// Natural Speech Synthesis - No External Dependencies
export interface OpenAITTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: 'natural' | 'enhanced';
  speed?: number; // 0.25 to 4.0
  response_format?: 'speech' | 'audio';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export class OpenAITTS {
  private currentSpeech: SpeechSynthesisUtterance | null = null;
  private isPlaying = false;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.initializeVoices();
  }

  private async initializeVoices(): Promise<void> {
    // Wait for voices to be loaded
    if (speechSynthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        speechSynthesis.onvoiceschanged = () => {
          this.availableVoices = speechSynthesis.getVoices();
          resolve();
        };
      });
    } else {
      this.availableVoices = speechSynthesis.getVoices();
    }
  }

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

      // Get speech configuration from server
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          voice: options.voice || 'nova',
          model: options.model || 'natural',
          speed: options.speed || 1.0,
          response_format: options.response_format || 'speech'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS request failed:', response.status, errorText);
        throw new Error(`TTS request failed: ${response.status} - ${errorText}`);
      }

      const speechData = await response.json();
      console.log('🎤 Using Custom Natural Speech Service');
      
      if (!speechData.success) {
        throw new Error('Speech configuration failed');
      }

      // Create natural speech synthesis
      this.currentSpeech = new SpeechSynthesisUtterance(speechData.speechConfig.text);
      
      // Find the best voice
      const selectedVoice = this.findBestVoice(speechData.speechConfig.voice);
      if (selectedVoice) {
        this.currentSpeech.voice = selectedVoice;
      }
      
      // Configure for natural speech
      this.currentSpeech.rate = speechData.speechConfig.rate;
      this.currentSpeech.pitch = speechData.speechConfig.pitch;
      this.currentSpeech.volume = speechData.speechConfig.volume;
      
      // Set up event handlers
      this.currentSpeech.onstart = () => {
        console.log('Natural speech started');
        this.isPlaying = true;
        options.onStart?.();
      };
      
      this.currentSpeech.onend = () => {
        console.log('Natural speech ended');
        this.isPlaying = false;
        options.onEnd?.();
      };

      this.currentSpeech.onerror = (error) => {
        console.error('Natural speech error:', error);
        this.isPlaying = false;
        options.onError?.('Speech synthesis failed');
      };

      // Start speech synthesis
      speechSynthesis.speak(this.currentSpeech);

    } catch (error) {
      this.isPlaying = false;
      console.error('Natural TTS error:', error);
      options.onError?.(error instanceof Error ? error.message : 'Unknown TTS error');
    }
  }

  private findBestVoice(voiceName: string): SpeechSynthesisVoice | null {
    // Ensure voices are loaded
    if (this.availableVoices.length === 0) {
      this.availableVoices = speechSynthesis.getVoices();
    }

    // Voice preference order for natural speech
    const voicePreferences: { [key: string]: string[] } = {
      'Samantha': ['Samantha', 'Karen', 'Victoria', 'Zira', 'Microsoft Zira'],
      'Alex': ['Alex', 'Daniel', 'Microsoft David'],
      'Fiona': ['Fiona', 'Moira', 'Microsoft Hazel'],
      'Karen': ['Karen', 'Samantha', 'Victoria', 'Microsoft Zira'],
      'Daniel': ['Daniel', 'Alex', 'Microsoft David'],
      'Victoria': ['Victoria', 'Zira', 'Microsoft Zira']
    };

    const preferences = voicePreferences[voiceName] || [voiceName];
    
    // Find the best available voice
    for (const preferredVoice of preferences) {
      const voice = this.availableVoices.find(v => 
        v.name.includes(preferredVoice) && 
        v.lang.includes('en')
      );
      if (voice) {
        console.log(`🎤 Selected voice: ${voice.name} (${voice.lang})`);
        return voice;
      }
    }

    // Fallback to best English voice
    const englishVoices = this.availableVoices.filter(v => v.lang.includes('en'));
    if (englishVoices.length > 0) {
      console.log(`🎤 Fallback voice: ${englishVoices[0].name} (${englishVoices[0].lang})`);
      return englishVoices[0];
    }

    return null;
  }

  private cleanTextForSpeech(text: string): string {
    // Remove markdown formatting
    let cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    cleanText = cleanText.replace(/\*(.*?)\*/g, '$1'); // Italic
    cleanText = cleanText.replace(/`(.*?)`/g, '$1'); // Code
    cleanText = cleanText.replace(/#{1,6}\s*(.*)/g, '$1'); // Headers
    cleanText = cleanText.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // Links
    
    // Remove emojis and special characters
    cleanText = cleanText.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc symbols
    cleanText = cleanText.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport
    cleanText = cleanText.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
    cleanText = cleanText.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
    cleanText = cleanText.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
    cleanText = cleanText.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental
    cleanText = cleanText.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Extended
    cleanText = cleanText.replace(/[\u{2190}-\u{21FF}]/gu, ''); // Arrows
    
    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText;
  }

  stop(): void {
    if (this.currentSpeech) {
      speechSynthesis.cancel();
      this.currentSpeech = null;
    }
    this.isPlaying = false;
  }

  pause(): void {
    if (this.currentSpeech && this.isPlaying) {
      speechSynthesis.pause();
    }
  }

  resume(): void {
    if (this.currentSpeech && !this.isPlaying) {
      speechSynthesis.resume();
    }
  }

  isCurrentlySpeaking(): boolean {
    return this.isPlaying;
  }

  // Get available voices (Natural Speech voices)
  getVoices(): Array<{name: string, description: string}> {
    return [
      { name: 'alloy', description: 'Balanced, neutral voice (Alex)' },
      { name: 'echo', description: 'British voice (Fiona)' },
      { name: 'fable', description: 'Clear voice (Karen)' },
      { name: 'onyx', description: 'Deep, resonant voice (Daniel)' },
      { name: 'nova', description: 'Young, vibrant female voice (Samantha)' },
      { name: 'shimmer', description: 'Soft, gentle voice (Victoria)' }
    ];
  }
}

export const openAITTS = new OpenAITTS()