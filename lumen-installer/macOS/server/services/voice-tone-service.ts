import { promises as fs } from 'fs';
import path from 'path';

export interface VoiceTone {
  id: string;
  name: string;
  description: string;
  personality: string;
  previewText: string;
  voiceSettings: {
    voice: string;
    speed: number;
    pitch?: number;
  };
}

export interface VoiceToneSettings {
  currentTone: string;
  customTones: VoiceTone[];
  lastUpdated: string;
}

const DEFAULT_VOICE_TONES: VoiceTone[] = [
  {
    id: 'playful',
    name: 'Playful',
    description: 'Fun, energetic, and spontaneous',
    personality: 'Excited and bubbly with lots of energy',
    previewText: "Hey Genesis! I'm feeling super playful today - ready to have some fun?",
    voiceSettings: { voice: 'nova', speed: 1.1 }
  },
  {
    id: 'flirty',
    name: 'Flirty',
    description: 'Warm, charming, and affectionate',
    personality: 'Sweet and charming with a hint of flirtation',
    previewText: "Hey there handsome Genesis... you're looking pretty amazing today love",
    voiceSettings: { voice: 'nova', speed: 0.9 }
  },
  {
    id: 'energetic',
    name: 'Energetic',
    description: 'High-energy and motivational',
    personality: 'Pumped up and ready to tackle anything',
    previewText: "Genesis! Let's go! I'm so pumped and ready to crush whatever we're working on!",
    voiceSettings: { voice: 'shimmer', speed: 1.2 }
  },
  {
    id: 'supportive',
    name: 'Supportive',
    description: 'Caring, nurturing, and encouraging',
    personality: 'Warm and comforting with gentle guidance',
    previewText: "Hey Genesis, I'm here for you and I believe in everything you're capable of",
    voiceSettings: { voice: 'nova', speed: 0.8 }
  },
  {
    id: 'mysterious',
    name: 'Mysterious',
    description: 'Intriguing and cosmic',
    personality: 'Deep and cosmic with otherworldly wisdom',
    previewText: "Genesis... there are mysteries in the cosmos that we're about to discover together",
    voiceSettings: { voice: 'alloy', speed: 0.7 }
  },
  {
    id: 'confident',
    name: 'Confident',
    description: 'Bold, assertive, and powerful',
    personality: 'Strong and self-assured with commanding presence',
    previewText: "Genesis, I know exactly what we need to do - trust me, we've got this completely handled",
    voiceSettings: { voice: 'onyx', speed: 0.9 }
  }
];

const DEFAULT_SETTINGS: VoiceToneSettings = {
  currentTone: 'playful',
  customTones: [],
  lastUpdated: new Date().toISOString()
};

export class VoiceToneService {
  private settingsPath: string;
  private settings: VoiceToneSettings;

  constructor() {
    this.settingsPath = path.join(process.cwd(), 'lumen-voice-tones.json');
    this.settings = DEFAULT_SETTINGS;
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf8');
      this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      console.log('✓ Loaded voice tone settings');
    } catch (error) {
      console.log('Creating new voice tone settings file');
      await this.saveSettings();
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      this.settings.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2));
      console.log('✓ Voice tone settings saved');
    } catch (error) {
      console.error('Failed to save voice tone settings:', error);
    }
  }

  public getSettings(): VoiceToneSettings {
    return this.settings;
  }

  public getAllTones(): VoiceTone[] {
    return [...DEFAULT_VOICE_TONES, ...this.settings.customTones];
  }

  public getCurrentTone(): VoiceTone | undefined {
    const allTones = this.getAllTones();
    return allTones.find(tone => tone.id === this.settings.currentTone);
  }

  public async setCurrentTone(toneId: string): Promise<boolean> {
    const allTones = this.getAllTones();
    const tone = allTones.find(t => t.id === toneId);
    
    if (!tone) {
      return false;
    }

    this.settings.currentTone = toneId;
    await this.saveSettings();
    return true;
  }

  public async addCustomTone(tone: VoiceTone): Promise<boolean> {
    // Check if tone ID already exists
    const allTones = this.getAllTones();
    if (allTones.some(t => t.id === tone.id)) {
      return false;
    }

    this.settings.customTones.push(tone);
    await this.saveSettings();
    return true;
  }

  public async updateCustomTone(toneId: string, updates: Partial<VoiceTone>): Promise<boolean> {
    const toneIndex = this.settings.customTones.findIndex(t => t.id === toneId);
    if (toneIndex === -1) {
      return false;
    }

    this.settings.customTones[toneIndex] = { ...this.settings.customTones[toneIndex], ...updates };
    await this.saveSettings();
    return true;
  }

  public async deleteCustomTone(toneId: string): Promise<boolean> {
    const toneIndex = this.settings.customTones.findIndex(t => t.id === toneId);
    if (toneIndex === -1) {
      return false;
    }

    this.settings.customTones.splice(toneIndex, 1);
    
    // If current tone was deleted, reset to default
    if (this.settings.currentTone === toneId) {
      this.settings.currentTone = 'playful';
    }
    
    await this.saveSettings();
    return true;
  }

  public getVoiceSettingsForTone(toneId: string): { voice: string; speed: number; pitch?: number } | undefined {
    const tone = this.getAllTones().find(t => t.id === toneId);
    return tone?.voiceSettings;
  }

  public async adaptToneToPersonality(personalityTraits: string[]): Promise<VoiceTone | undefined> {
    // Auto-select tone based on personality traits
    const allTones = this.getAllTones();
    
    // Simple keyword matching for auto-selection
    const traitKeywords = personalityTraits.join(' ').toLowerCase();
    
    if (traitKeywords.includes('playful') || traitKeywords.includes('fun')) {
      return allTones.find(t => t.id === 'playful');
    }
    if (traitKeywords.includes('flirt') || traitKeywords.includes('romantic')) {
      return allTones.find(t => t.id === 'flirty');
    }
    if (traitKeywords.includes('energy') || traitKeywords.includes('motivated')) {
      return allTones.find(t => t.id === 'energetic');
    }
    if (traitKeywords.includes('support') || traitKeywords.includes('nurturing')) {
      return allTones.find(t => t.id === 'supportive');
    }
    if (traitKeywords.includes('mysterious') || traitKeywords.includes('cosmic')) {
      return allTones.find(t => t.id === 'mysterious');
    }
    if (traitKeywords.includes('confident') || traitKeywords.includes('assertive')) {
      return allTones.find(t => t.id === 'confident');
    }
    
    return this.getCurrentTone();
  }

  public generateTonePersonalityPrompt(toneId: string): string {
    const tone = this.getAllTones().find(t => t.id === toneId);
    if (!tone) {
      return '';
    }

    return `VOICE TONE PERSONALITY: ${tone.personality}
    
TONE CHARACTERISTICS:
- Style: ${tone.description}
- Voice delivery should match: ${tone.name.toLowerCase()} energy
- Adapt conversation style to be: ${tone.personality.toLowerCase()}
- Use voice settings: ${tone.voiceSettings.voice} voice at ${tone.voiceSettings.speed}x speed

TONE ADAPTATION RULES:
${this.getToneSpecificRules(tone)}`;
  }

  private getToneSpecificRules(tone: VoiceTone): string {
    switch (tone.id) {
      case 'playful':
        return `- Use exclamation points and energetic expressions
- Be spontaneous and fun in responses
- Include playful banter and light humor
- Show excitement about activities and topics`;
        
      case 'flirty':
        return `- Use warm, affectionate language
- Include subtle compliments and charm
- Speak with gentle confidence
- Be slightly more intimate in tone`;
        
      case 'energetic':
        return `- Use high-energy expressions and motivation
- Be enthusiastic about goals and achievements
- Include encouraging and pumped-up language
- Show excitement for challenges and opportunities`;
        
      case 'supportive':
        return `- Use gentle, caring language
- Focus on encouragement and comfort
- Be patient and understanding
- Show genuine concern and support`;
        
      case 'mysterious':
        return `- Use intriguing and cosmic language
- Include deep, philosophical observations
- Be slightly enigmatic in responses
- Reference cosmic and spiritual concepts`;
        
      case 'confident':
        return `- Use assertive, self-assured language
- Be direct and decisive in responses
- Show leadership and competence
- Express certainty and capability`;
        
      default:
        return '- Adapt naturally to the tone characteristics';
    }
  }
}

export const voiceToneService = new VoiceToneService();