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

    // Preference order for female voices that sound fun, playful, and intelligent
    const preferredFemaleVoices = [
      'Samantha',
      'Victoria',
      'Zoe',
      'Aria',
      'Emma',
      'Ava',
      'Serena',
      'Joanna',
      'Salli',
      'Kimberly',
      'Kendra',
      'Ivy',
      'Amy',
      'Olivia',
      'Tessa',
      'Moira',
      'Karen',
      'Fiona',
      'Veena',
      'Raveena',
      'Microsoft Zira',
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

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const bestVoice = this.findBestVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Set options for a fun, playful, and intelligent female voice
    utterance.rate = options.rate || 1.0; // Slightly faster for energy
    utterance.pitch = options.pitch || 1.1; // Slightly higher pitch for femininity
    utterance.volume = options.volume || 0.9; // Clear and confident

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
