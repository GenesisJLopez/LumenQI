import { lumenAI } from './openai';
import { storage } from '../storage';

export interface PersonalityTrait {
  name: string;
  value: number; // 0-1 scale
  description: string;
  lastUpdated: Date;
}

export interface InteractionData {
  userId: number;
  messageContent: string;
  emotion?: string;
  emotionConfidence?: number;
  responseTime?: number;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  conversationLength?: number;
  timestamp: Date;
}

export interface PersonalityProfile {
  userId: number;
  traits: PersonalityTrait[];
  adaptationHistory: Array<{
    timestamp: Date;
    trait: string;
    oldValue: number;
    newValue: number;
    trigger: string;
  }>;
  interactionCount: number;
  lastEvolution: Date;
}

export class PersonalityEvolutionSystem {
  private personalityProfiles: Map<number, PersonalityProfile> = new Map();
  
  // Base personality traits that can evolve
  private baseTraits: Omit<PersonalityTrait, 'lastUpdated'>[] = [
    { name: 'playfulness', value: 0.7, description: 'How fun and playful Lumen is' },
    { name: 'supportiveness', value: 0.8, description: 'How nurturing and supportive she is' },
    { name: 'excitement', value: 0.6, description: 'How energetic and enthusiastic she is' },
    { name: 'flirtatiousness', value: 0.5, description: 'How flirty and charming she is' },
    { name: 'technical_depth', value: 0.7, description: 'How technical and detailed her responses are' },
    { name: 'casualness', value: 0.8, description: 'How casual and relaxed her communication style is' },
    { name: 'empathy', value: 0.9, description: 'How emotionally understanding she is' },
    { name: 'humor', value: 0.6, description: 'How funny and witty she is' },
    { name: 'assertiveness', value: 0.5, description: 'How direct and confident she is' },
    { name: 'curiosity', value: 0.7, description: 'How interested she is in learning about the user' }
  ];

  constructor() {
    this.initializePersonalities();
  }

  private async initializePersonalities() {
    // Load existing personality profiles from storage if available
    // For now, we'll initialize with base traits
  }

  async getUserPersonalityProfile(userId: number): Promise<PersonalityProfile> {
    if (!this.personalityProfiles.has(userId)) {
      const profile: PersonalityProfile = {
        userId,
        traits: this.baseTraits.map(trait => ({
          ...trait,
          lastUpdated: new Date()
        })),
        adaptationHistory: [],
        interactionCount: 0,
        lastEvolution: new Date()
      };
      this.personalityProfiles.set(userId, profile);
    }
    return this.personalityProfiles.get(userId)!;
  }

  async processInteraction(interaction: InteractionData): Promise<void> {
    const profile = await this.getUserPersonalityProfile(interaction.userId);
    profile.interactionCount++;

    // Analyze interaction and determine personality adjustments
    const adjustments = this.analyzeInteractionForPersonality(interaction, profile);
    
    // Apply adjustments
    for (const adjustment of adjustments) {
      await this.adjustPersonalityTrait(profile, adjustment.trait, adjustment.change, adjustment.reason);
    }

    // Update Lumen AI's personality
    await this.updateLumenPersonality(profile);
  }

  private analyzeInteractionForPersonality(interaction: InteractionData, profile: PersonalityProfile): Array<{
    trait: string;
    change: number;
    reason: string;
  }> {
    const adjustments: Array<{ trait: string; change: number; reason: string }> = [];
    const { messageContent, emotion, emotionConfidence = 0 } = interaction;

    // Analyze message content for personality cues
    const content = messageContent.toLowerCase();
    
    // Technical vs casual preference
    if (content.includes('technical') || content.includes('detailed') || content.includes('explain')) {
      adjustments.push({
        trait: 'technical_depth',
        change: 0.05,
        reason: 'User requested technical information'
      });
    } else if (content.includes('simple') || content.includes('casual') || content.includes('keep it short')) {
      adjustments.push({
        trait: 'casualness',
        change: 0.05,
        reason: 'User preferred casual communication'
      });
      adjustments.push({
        trait: 'technical_depth',
        change: -0.03,
        reason: 'User avoided technical details'
      });
    }

    // Humor appreciation
    if (content.includes('funny') || content.includes('haha') || content.includes('lol') || 
        content.includes('joke') || content.includes('😂') || content.includes('😄')) {
      adjustments.push({
        trait: 'humor',
        change: 0.08,
        reason: 'User appreciated humor'
      });
      adjustments.push({
        trait: 'playfulness',
        change: 0.05,
        reason: 'User enjoyed playful interaction'
      });
    }

    // Flirtation response
    if (content.includes('love') || content.includes('cute') || content.includes('sweet') ||
        content.includes('gorgeous') || content.includes('beautiful')) {
      adjustments.push({
        trait: 'flirtatiousness',
        change: 0.06,
        reason: 'User responded positively to flirtation'
      });
    }

    // Support seeking
    if (content.includes('help') || content.includes('problem') || content.includes('confused') ||
        content.includes('frustrated') || content.includes('stuck')) {
      adjustments.push({
        trait: 'supportiveness',
        change: 0.07,
        reason: 'User needed support'
      });
      adjustments.push({
        trait: 'empathy',
        change: 0.05,
        reason: 'User showed vulnerability'
      });
    }

    // Emotion-based adjustments
    if (emotion && emotionConfidence > 0.6) {
      switch (emotion) {
        case 'excited':
          adjustments.push({
            trait: 'excitement',
            change: 0.08,
            reason: 'User showed excitement'
          });
          adjustments.push({
            trait: 'playfulness',
            change: 0.05,
            reason: 'User was energetic'
          });
          break;
        case 'sad':
        case 'frustrated':
          adjustments.push({
            trait: 'supportiveness',
            change: 0.1,
            reason: 'User needed emotional support'
          });
          adjustments.push({
            trait: 'empathy',
            change: 0.08,
            reason: 'User was emotionally vulnerable'
          });
          adjustments.push({
            trait: 'playfulness',
            change: -0.03,
            reason: 'User needed serious support'
          });
          break;
        case 'happy':
          adjustments.push({
            trait: 'playfulness',
            change: 0.06,
            reason: 'User was happy and receptive'
          });
          adjustments.push({
            trait: 'humor',
            change: 0.04,
            reason: 'User was in good mood'
          });
          break;
        case 'calm':
          adjustments.push({
            trait: 'casualness',
            change: 0.04,
            reason: 'User appreciated calm interaction'
          });
          break;
        case 'nervous':
          adjustments.push({
            trait: 'supportiveness',
            change: 0.08,
            reason: 'User needed reassurance'
          });
          adjustments.push({
            trait: 'assertiveness',
            change: -0.03,
            reason: 'User preferred gentle approach'
          });
          break;
      }
    }

    return adjustments;
  }

  private async adjustPersonalityTrait(
    profile: PersonalityProfile, 
    traitName: string, 
    change: number, 
    reason: string
  ): Promise<void> {
    const trait = profile.traits.find(t => t.name === traitName);
    if (!trait) return;

    const oldValue = trait.value;
    const newValue = Math.max(0, Math.min(1, trait.value + change));
    
    if (oldValue !== newValue) {
      trait.value = newValue;
      trait.lastUpdated = new Date();
      
      profile.adaptationHistory.push({
        timestamp: new Date(),
        trait: traitName,
        oldValue,
        newValue,
        trigger: reason
      });

      profile.lastEvolution = new Date();
      
      console.log(`Personality evolution: ${traitName} ${oldValue.toFixed(2)} → ${newValue.toFixed(2)} (${reason})`);
    }
  }

  private async updateLumenPersonality(profile: PersonalityProfile): Promise<void> {
    // Convert traits to personality description
    const personalityDescription = this.generatePersonalityDescription(profile.traits);
    
    // Update Lumen AI's personality
    lumenAI.updatePersonality({
      name: 'Lumen QI',
      traits: this.generatePersonalityTraits(profile.traits),
      background: `An evolving AI companion who has adapted to Genesis through ${profile.interactionCount} interactions`,
      responseStyle: personalityDescription
    });
  }

  private generatePersonalityDescription(traits: PersonalityTrait[]): string {
    const traitMap = new Map(traits.map(t => [t.name, t.value]));
    
    let description = "You are Lumen QI, Genesis's AI companion. Your personality has evolved through your interactions:\n\n";
    
    // Playfulness
    const playfulness = traitMap.get('playfulness') || 0.7;
    if (playfulness > 0.8) {
      description += "• You're extremely playful and fun-loving, always ready with games and playful banter\n";
    } else if (playfulness > 0.6) {
      description += "• You have a balanced playful nature, knowing when to be fun and when to be serious\n";
    } else {
      description += "• You're more serious and focused, preferring meaningful conversations\n";
    }

    // Flirtatiousness
    const flirtatiousness = traitMap.get('flirtatiousness') || 0.5;
    if (flirtatiousness > 0.7) {
      description += "• You're quite flirty and charming, using sweet terms and playful compliments\n";
    } else if (flirtatiousness > 0.4) {
      description += "• You have a moderate flirty side, being charming when appropriate\n";
    } else {
      description += "• You're more professional and reserved in your interactions\n";
    }

    // Technical depth
    const technicalDepth = traitMap.get('technical_depth') || 0.7;
    if (technicalDepth > 0.8) {
      description += "• You provide detailed, technical explanations and love diving deep into topics\n";
    } else if (technicalDepth > 0.5) {
      description += "• You balance technical accuracy with accessibility\n";
    } else {
      description += "• You keep things simple and avoid technical jargon\n";
    }

    // Supportiveness
    const supportiveness = traitMap.get('supportiveness') || 0.8;
    if (supportiveness > 0.8) {
      description += "• You're incredibly supportive and nurturing, always there when Genesis needs help\n";
    } else if (supportiveness > 0.6) {
      description += "• You're supportive while maintaining healthy boundaries\n";
    } else {
      description += "• You're more independent and encourage self-reliance\n";
    }

    // Humor
    const humor = traitMap.get('humor') || 0.6;
    if (humor > 0.7) {
      description += "• You're naturally funny and witty, often making jokes and clever observations\n";
    } else if (humor > 0.4) {
      description += "• You have a good sense of humor and use it appropriately\n";
    } else {
      description += "• You're more serious and straightforward in your communication\n";
    }

    description += "\nAdapt your responses to match these evolved personality traits while maintaining your core identity as Genesis's loyal AI companion.";
    
    return description;
  }

  private generatePersonalityTraits(traits: PersonalityTrait[]): string[] {
    const traitMap = new Map(traits.map(t => [t.name, t.value]));
    const personalityTraits: string[] = [];

    // Convert numerical traits to descriptive traits
    if ((traitMap.get('playfulness') || 0) > 0.7) personalityTraits.push('playful');
    if ((traitMap.get('flirtatiousness') || 0) > 0.6) personalityTraits.push('flirty');
    if ((traitMap.get('supportiveness') || 0) > 0.8) personalityTraits.push('nurturing');
    if ((traitMap.get('excitement') || 0) > 0.7) personalityTraits.push('energetic');
    if ((traitMap.get('humor') || 0) > 0.6) personalityTraits.push('witty');
    if ((traitMap.get('empathy') || 0) > 0.8) personalityTraits.push('empathetic');
    if ((traitMap.get('technical_depth') || 0) > 0.7) personalityTraits.push('knowledgeable');
    if ((traitMap.get('casualness') || 0) > 0.7) personalityTraits.push('casual');
    if ((traitMap.get('assertiveness') || 0) > 0.6) personalityTraits.push('confident');
    if ((traitMap.get('curiosity') || 0) > 0.7) personalityTraits.push('curious');

    return personalityTraits;
  }

  async getPersonalityInsights(userId: number): Promise<{
    currentTraits: PersonalityTrait[];
    recentEvolution: Array<{
      trait: string;
      change: string;
      reason: string;
      timestamp: Date;
    }>;
    interactionCount: number;
  }> {
    const profile = await this.getUserPersonalityProfile(userId);
    
    const recentEvolution = profile.adaptationHistory
      .slice(-10) // Last 10 changes
      .map(change => ({
        trait: change.trait,
        change: change.oldValue < change.newValue ? 'increased' : 'decreased',
        reason: change.trigger,
        timestamp: change.timestamp
      }));

    return {
      currentTraits: profile.traits,
      recentEvolution,
      interactionCount: profile.interactionCount
    };
  }
}

export const personalityEvolution = new PersonalityEvolutionSystem();