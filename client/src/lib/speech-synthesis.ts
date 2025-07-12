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

    // Preference order for natural-sounding voices
    const preferredVoices = [
      'Natural',
      'Premium',
      'Enhanced',
      'Microsoft',
      'Google',
      'Samantha',
      'Alex',
      'Daniel',
      'Karen',
      'Moira',
      'Tessa'
    ];

    // Try to find a preferred voice
    for (const preferred of preferredVoices) {
      const voice = this.voices.find(v => 
        v.name.includes(preferred) && v.lang.startsWith('en')
      );
      if (voice) return voice;
    }

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

    // Set options
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;

    // Set event handlers
    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }
    
    if (options.onError) {
      utterance.onerror = options.onError;
    }

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
