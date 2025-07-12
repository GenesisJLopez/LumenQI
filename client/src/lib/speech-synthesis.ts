export class SpeechSynthesisService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices() {
    const loadVoicesWhenReady = () => {
      this.voices = this.synthesis.getVoices();
      if (this.voices.length === 0) {
        // Some browsers need a moment to load voices
        setTimeout(loadVoicesWhenReady, 100);
      }
    };

    loadVoicesWhenReady();

    // Listen for voice changes
    this.synthesis.addEventListener('voiceschanged', () => {
      this.voices = this.synthesis.getVoices();
    });
  }

  private findBestVoice(): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) return null;

    // Preference order for natural, Siri-like female voices
    const preferredFemaleVoices = [
      'Samantha', // macOS Siri-like voice
      'Alex', // macOS natural voice
      'Victoria', // Natural sounding
      'Allison', // Natural US English
      'Ava', // Natural and clear
      'Susan', // Smooth and natural
      'Zoe', // Clear and feminine
      'Fiona', // Natural Scottish accent
      'Moira', // Natural Irish accent
      'Tessa', // Natural South African
      'Karen', // Natural Australian
      'Veena', // Natural Indian English
      'Raveena', // Natural Indian English
      'Joanna', // Amazon Polly style
      'Salli', // Natural US English
      'Kimberly', // Natural US English
      'Kendra', // Natural US English
      'Ivy', // Natural US English
      'Amy', // Natural British English
      'Emma', // Natural British English
      'Olivia', // Natural Australian English
      'Microsoft Zira', // Windows natural voice
      'Google UK English Female',
      'Google US English',
      'Natural',
      'Premium',
      'Enhanced'
    ];

    // Try to find a preferred female voice
    for (const preferred of preferredFemaleVoices) {
      const voice = this.voices.find(v => 
        v.name.includes(preferred) && 
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('woman') ||
         preferredFemaleVoices.includes(v.name))
      );
      if (voice) return voice;
    }

    // Fallback to any English female voice
    const femaleVoice = this.voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('woman'))
    );
    if (femaleVoice) return femaleVoice;

    // Fallback to any English voice
    const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) return englishVoice;

    // Last resort: use the first available voice
    return this.voices[0] || null;
  }

  speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: SpeechSynthesisErrorEvent) => void;
  } = {}): void {
    if (!text.trim()) return;

    // Stop any ongoing speech
    this.synthesis.cancel();

    // Clean text: remove emojis and unwanted characters
    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set voice - prioritize Siri-like natural voices
    const bestVoice = this.findBestVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Siri-like natural speech settings
    utterance.rate = options.rate || 0.85; // Slower, more natural pace
    utterance.pitch = options.pitch || 0.95; // Natural pitch, not too high
    utterance.volume = options.volume || 1.0; // Full volume for clarity

    // Set event handlers
    utterance.onstart = () => {
      if (options.onStart) {
        options.onStart();
      }
    };

    utterance.onend = () => {
      if (options.onEnd) {
        options.onEnd();
      }
    };
    
    utterance.onerror = (error) => {
      if (options.onError) {
        options.onError(error);
      }
    };

    // Speak the text
    this.synthesis.speak(utterance);
  }

  private cleanTextForSpeech(text: string): string {
    // Remove emojis by removing common emoji characters
    let cleanText = text;
    
    // Remove emojis using a simple approach
    cleanText = cleanText.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // emoticons
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // misc symbols
    cleanText = cleanText.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // transport symbols  
    cleanText = cleanText.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // flags
    cleanText = cleanText.replace(/[\u{2600}-\u{26FF}]/gu, ''); // misc symbols
    cleanText = cleanText.replace(/[\u{2700}-\u{27BF}]/gu, ''); // dingbats
    cleanText = cleanText.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // supplemental symbols
    cleanText = cleanText.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // extended symbols
    cleanText = cleanText.replace(/[\u{2190}-\u{21FF}]/gu, ''); // arrows
    
    // Clean up extra spaces
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText;
  }

  stop(): void {
    this.synthesis.cancel();
  }

  pause(): void {
    this.synthesis.pause();
  }

  resume(): void {
    this.synthesis.resume();
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('en'));
  }
}

export const speechSynthesis = new SpeechSynthesisService();