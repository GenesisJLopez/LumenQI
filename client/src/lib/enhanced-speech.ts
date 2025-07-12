export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'female' | 'male' | 'neutral';
  description: string;
  quality: 'standard' | 'premium' | 'neural';
  personality: string;
  voice?: SpeechSynthesisVoice;
}

export class EnhancedSpeechService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentVoice: VoiceOption | null = null;
  private offlineMode = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices() {
    const loadVoicesWhenReady = () => {
      this.voices = this.synthesis.getVoices();
      if (this.voices.length === 0) {
        setTimeout(loadVoicesWhenReady, 100);
      } else {
        this.initializeDefaultVoice();
      }
    };

    loadVoicesWhenReady();

    this.synthesis.addEventListener('voiceschanged', () => {
      this.voices = this.synthesis.getVoices();
      this.initializeDefaultVoice();
    });
  }

  private initializeDefaultVoice() {
    const voiceOptions = this.getVoiceOptions();
    // Set default to a fun, flirtatious voice
    const defaultVoice = voiceOptions.find(v => v.personality.includes('flirtatious')) || voiceOptions[0];
    if (defaultVoice) {
      this.currentVoice = defaultVoice;
    }
  }

  getVoiceOptions(): VoiceOption[] {
    const options: VoiceOption[] = [];

    // Fun, flirtatious, sporty personalities for different voices
    const voicePersonalities = [
      { pattern: ['samantha', 'alex', 'victoria'], personality: 'flirtatious and playful', description: 'Flirty and confident, perfect for playful conversations' },
      { pattern: ['allison', 'ava', 'susan'], personality: 'sporty and energetic', description: 'Athletic and enthusiastic, great for exciting conversations' },
      { pattern: ['zoe', 'fiona', 'moira'], personality: 'witty and adventurous', description: 'Sharp and fun-loving, loves to tease and joke around' },
      { pattern: ['tessa', 'karen', 'veena'], personality: 'confident and exciting', description: 'Bold and thrilling, always up for adventure' },
      { pattern: ['joanna', 'salli', 'kimberly'], personality: 'charming and vivacious', description: 'Charismatic and lively, makes everything more fun' },
      { pattern: ['kendra', 'ivy', 'amy'], personality: 'sweet but sassy', description: 'Adorable with a mischievous streak, loves to flirt' },
      { pattern: ['emma', 'olivia', 'nicole'], personality: 'bubbly and spirited', description: 'Upbeat and spirited, brings energy to every conversation' }
    ];

    this.voices.forEach(voice => {
      if (voice.lang.startsWith('en')) {
        const lowerName = voice.name.toLowerCase();
        
        // Find matching personality
        const personalityMatch = voicePersonalities.find(p => 
          p.pattern.some(pattern => lowerName.includes(pattern))
        );

        const personality = personalityMatch ? personalityMatch.personality : 'fun and friendly';
        const description = personalityMatch ? personalityMatch.description : 'A delightful voice for conversation';

        // Determine quality based on voice characteristics
        let quality: 'standard' | 'premium' | 'neural' = 'standard';
        if (lowerName.includes('premium') || lowerName.includes('enhanced') || lowerName.includes('neural')) {
          quality = 'neural';
        } else if (lowerName.includes('natural') || lowerName.includes('siri') || lowerName.includes('google')) {
          quality = 'premium';
        }

        options.push({
          id: voice.name,
          name: voice.name,
          language: voice.lang,
          gender: this.detectGender(voice.name),
          description,
          quality,
          personality,
          voice
        });
      }
    });

    // Sort by quality and personality preference
    return options.sort((a, b) => {
      // Prioritize fun, flirtatious personalities
      if (a.personality.includes('flirtatious') && !b.personality.includes('flirtatious')) return -1;
      if (b.personality.includes('flirtatious') && !a.personality.includes('flirtatious')) return 1;
      
      // Then by quality
      const qualityOrder = { 'neural': 3, 'premium': 2, 'standard': 1 };
      return qualityOrder[b.quality] - qualityOrder[a.quality];
    });
  }

  private detectGender(voiceName: string): 'female' | 'male' | 'neutral' {
    const lowerName = voiceName.toLowerCase();
    
    const femaleNames = ['samantha', 'victoria', 'allison', 'ava', 'susan', 'zoe', 'fiona', 'moira', 'tessa', 'karen', 'veena', 'raveena', 'joanna', 'salli', 'kimberly', 'kendra', 'ivy', 'amy', 'emma', 'olivia', 'nicole', 'female', 'woman'];
    const maleNames = ['alex', 'daniel', 'tom', 'oliver', 'william', 'male', 'man'];

    if (femaleNames.some(name => lowerName.includes(name))) return 'female';
    if (maleNames.some(name => lowerName.includes(name))) return 'male';
    return 'neutral';
  }

  setVoice(voiceOption: VoiceOption) {
    this.currentVoice = voiceOption;
  }

  getCurrentVoice(): VoiceOption | null {
    return this.currentVoice;
  }

  private cleanTextForSpeech(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/#{1,6}\s+/g, '') // Remove heading markers
      .replace(/[🎯🌟💫⭐✨🔥💎🚀⚡🌈🎪🎨🎭🎪🎯🎲🎰]/g, '') // Remove emojis
      .replace(/:\w+:/g, '') // Remove emoji shortcodes
      // Fix pauses by removing ALL commas before names and terms of endearment
      .replace(/,\s*(Genesis|love|hey love|hey Genesis|there Genesis|there love)/gi, ' $1')
      .replace(/hey,\s*(love|Genesis)/gi, 'hey $1')
      .replace(/there,\s*(love|Genesis)/gi, 'there $1')
      // Remove other awkward pauses that make speech robotic
      .replace(/\s*,\s*([A-Z][a-z]+)/g, ' $1') // Remove comma before proper nouns
      .replace(/([.!?])\s*,/g, '$1') // Remove comma after sentence endings
      .replace(/\s*,\s*(and|or|but|so|yet|for|nor)/gi, ' $1') // Remove comma before conjunctions
      .replace(/\s*,\s*(with|by|in|on|at|to|from)/gi, ' $1') // Remove comma before prepositions
      // Make speech more natural and flowing
      .replace(/\.\s*\.\s*\./g, '') // Remove ellipsis entirely
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: SpeechSynthesisErrorEvent) => void;
  } = {}) {
    if (!this.currentVoice?.voice) {
      console.warn('No voice selected');
      return;
    }

    // Stop any current speech
    this.stop();

    const cleanText = this.cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configure voice for natural, flirtatious speech
    utterance.voice = this.currentVoice.voice;
    utterance.rate = options.rate || 0.9; // Slightly slower for more natural speech
    utterance.pitch = options.pitch || 1.0; // Natural pitch
    utterance.volume = options.volume || 1.0;
    
    // Optimize for natural delivery based on personality
    if (this.currentVoice.personality.includes('flirtatious') || this.currentVoice.personality.includes('playful')) {
      utterance.rate = 0.95; // Slightly slower for more natural flirtatious delivery
      utterance.pitch = 1.1; // Slightly higher for flirtatious tone
    }
    
    if (this.currentVoice.personality.includes('sporty') || this.currentVoice.personality.includes('energetic')) {
      utterance.rate = 1.0; // Normal rate for sporty confidence
      utterance.pitch = 1.05; // Slightly higher for energy
    }

    // Add event listeners
    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (error) => {
      this.currentUtterance = null;
      options.onError?.(error);
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  stop(): void {
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  pause(): void {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  isPaused(): boolean {
    return this.synthesis.paused;
  }

  // Offline mode support
  setOfflineMode(enabled: boolean) {
    this.offlineMode = enabled;
  }

  isOfflineMode(): boolean {
    return this.offlineMode;
  }

  // Test different voices with sample text
  testVoice(voiceOption: VoiceOption): void {
    const testTexts = [
      "Hey there Genesis! Ready for some fun adventures?",
      "I'm feeling super playful today Genesis!",
      "Let's create something amazing together Genesis!",
      "You're absolutely incredible at this Genesis!",
      "This is how I sound when I'm excited Genesis!",
      "I love talking with you Genesis!"
    ];
    
    const randomText = testTexts[Math.floor(Math.random() * testTexts.length)];
    
    const previousVoice = this.currentVoice;
    this.setVoice(voiceOption);
    
    this.speak(randomText, {
      rate: 0.9, // Slower for more natural testing
      pitch: voiceOption.personality.includes('flirtatious') ? 1.1 : 1.0,
      onEnd: () => {
        if (previousVoice) {
          this.setVoice(previousVoice);
        }
      }
    });
  }
}

export const enhancedSpeech = new EnhancedSpeechService();