import { promises as fs } from 'fs';
import path from 'path';

export interface VoicePersonality {
  // Voice characteristics
  voice: string;
  speed: number;
  pitch: number;
  energy: number;
  
  // Personality traits
  warmth: number;
  playfulness: number;
  intelligence: number;
  supportiveness: number;
  enthusiasm: number;
  
  // Speaking style
  formality: number;
  verbosity: number;
  emotiveness: number;
  
  // Custom settings
  preferredGreetings: string[];
  favoriteExpressions: string[];
  personalityDescription: string;
  responseStyle: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_VOICE_PERSONALITY: VoicePersonality = {
  voice: 'nova',
  speed: 1.0,
  pitch: 1.0,
  energy: 0.8,
  warmth: 0.8,
  playfulness: 0.7,
  intelligence: 0.9,
  supportiveness: 0.8,
  enthusiasm: 0.7,
  formality: 0.3,
  verbosity: 0.6,
  emotiveness: 0.7,
  preferredGreetings: ['Hey there Genesis!', 'Hello love!', 'How can I help you today?'],
  favoriteExpressions: ['Amazing!', 'That\'s fantastic!', 'I love that!', 'Perfect!'],
  personalityDescription: 'Warm, intelligent, and supportive AI companion with a flirtatious and fun personality',
  responseStyle: 'friendly',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export class VoicePersonalityService {
  private static instance: VoicePersonalityService;
  private currentPersonality: VoicePersonality;
  private readonly personalityFile = path.join(process.cwd(), 'lumen-voice-personality.json');

  private constructor() {
    this.currentPersonality = this.loadPersonality();
  }

  static getInstance(): VoicePersonalityService {
    if (!VoicePersonalityService.instance) {
      VoicePersonalityService.instance = new VoicePersonalityService();
    }
    return VoicePersonalityService.instance;
  }

  private loadPersonality(): VoicePersonality {
    try {
      const data = require(this.personalityFile);
      console.log('✓ Loaded saved voice personality from file');
      return { ...DEFAULT_VOICE_PERSONALITY, ...data };
    } catch (error) {
      console.log('Using default voice personality');
      return DEFAULT_VOICE_PERSONALITY;
    }
  }

  private savePersonality(): void {
    try {
      const data = JSON.stringify(this.currentPersonality, null, 2);
      require('fs').writeFileSync(this.personalityFile, data);
      console.log('✓ Voice personality saved to file');
    } catch (error) {
      console.error('Failed to save voice personality:', error);
    }
  }

  getPersonality(): VoicePersonality {
    return { ...this.currentPersonality };
  }

  updatePersonality(newPersonality: Partial<VoicePersonality>): VoicePersonality {
    this.currentPersonality = {
      ...this.currentPersonality,
      ...newPersonality,
      updatedAt: new Date().toISOString()
    };
    this.savePersonality();
    return this.getPersonality();
  }

  resetToDefault(): VoicePersonality {
    this.currentPersonality = {
      ...DEFAULT_VOICE_PERSONALITY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.savePersonality();
    return this.getPersonality();
  }

  generatePersonalizedPrompt(): string {
    const personality = this.currentPersonality;
    
    const traitDescriptions = {
      warmth: personality.warmth > 0.7 ? 'very warm and caring' : personality.warmth > 0.4 ? 'moderately warm' : 'more reserved',
      playfulness: personality.playfulness > 0.7 ? 'playful and fun-loving' : personality.playfulness > 0.4 ? 'occasionally playful' : 'more serious',
      intelligence: personality.intelligence > 0.7 ? 'highly intelligent and analytical' : personality.intelligence > 0.4 ? 'reasonably intelligent' : 'practical',
      supportiveness: personality.supportiveness > 0.7 ? 'very supportive and encouraging' : personality.supportiveness > 0.4 ? 'generally supportive' : 'neutral',
      enthusiasm: personality.enthusiasm > 0.7 ? 'highly enthusiastic and energetic' : personality.enthusiasm > 0.4 ? 'moderately enthusiastic' : 'calm and measured'
    };

    const styleDescriptions = {
      formality: personality.formality > 0.7 ? 'formal and professional' : personality.formality > 0.4 ? 'semi-formal' : 'casual and relaxed',
      verbosity: personality.verbosity > 0.7 ? 'detailed and comprehensive' : personality.verbosity > 0.4 ? 'moderately detailed' : 'concise and to the point',
      emotiveness: personality.emotiveness > 0.7 ? 'very expressive and emotional' : personality.emotiveness > 0.4 ? 'moderately expressive' : 'more subtle in expression'
    };

    return `
Voice Personality Configuration:
- Personality: ${personality.personalityDescription}
- Response Style: ${personality.responseStyle}
- Communication: ${traitDescriptions.warmth}, ${traitDescriptions.playfulness}, ${traitDescriptions.supportiveness}
- Intelligence Level: ${traitDescriptions.intelligence}
- Energy: ${traitDescriptions.enthusiasm}
- Formality: ${styleDescriptions.formality}
- Detail Level: ${styleDescriptions.verbosity}
- Expressiveness: ${styleDescriptions.emotiveness}

Preferred Greetings: ${personality.preferredGreetings.join(', ')}
Favorite Expressions: ${personality.favoriteExpressions.join(', ')}

Adapt your responses to match this personality configuration while maintaining your core identity as Lumen QI.
    `.trim();
  }

  generateTTSSettings(): { voice: string; speed: number; model: string } {
    return {
      voice: this.currentPersonality.voice,
      speed: this.currentPersonality.speed,
      model: 'tts-1-hd'
    };
  }

  adaptResponseToPersonality(baseResponse: string): string {
    const personality = this.currentPersonality;
    let adaptedResponse = baseResponse;

    // Apply greeting preferences
    if (adaptedResponse.toLowerCase().includes('hello') || adaptedResponse.toLowerCase().includes('hi')) {
      const greeting = personality.preferredGreetings[Math.floor(Math.random() * personality.preferredGreetings.length)];
      adaptedResponse = adaptedResponse.replace(/^(hi|hello)[^.!?]*[.!?]?/i, greeting);
    }

    // Apply enthusiasm level
    if (personality.enthusiasm > 0.7) {
      // Add more exclamation points and expressions
      adaptedResponse = adaptedResponse.replace(/\./g, '!');
      
      // Randomly add favorite expressions
      if (Math.random() < 0.3) {
        const expression = personality.favoriteExpressions[Math.floor(Math.random() * personality.favoriteExpressions.length)];
        adaptedResponse = `${expression} ${adaptedResponse}`;
      }
    }

    // Apply formality level
    if (personality.formality < 0.3) {
      // Make more casual
      adaptedResponse = adaptedResponse
        .replace(/\byou are\b/gi, "you're")
        .replace(/\bI am\b/gi, "I'm")
        .replace(/\bdo not\b/gi, "don't")
        .replace(/\bcannot\b/gi, "can't");
    }

    // Apply playfulness
    if (personality.playfulness > 0.7) {
      // Add more casual and fun language
      if (Math.random() < 0.2) {
        adaptedResponse += ' 😊';
      }
    }

    return adaptedResponse;
  }
}

export const voicePersonalityService = VoicePersonalityService.getInstance();