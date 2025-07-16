/**
 * Natural Conversation Flow Enhancement for Lumen QI
 * Improves conversation naturalness and flow
 */

import { lumenAI } from './openai';
import { storage } from '../storage';
import type { Message } from '@shared/schema';

export interface ConversationContext {
  recentMessages: Message[];
  userEmotion?: string;
  userPersonality?: any;
  conversationTopic?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  conversationLength: number;
  lastInteractionTime?: Date;
}

export interface NaturalResponseOptions {
  includeTransitions: boolean;
  usePersonalTouch: boolean;
  adaptToMood: boolean;
  includeEmpathy: boolean;
  varyStructure: boolean;
}

export class NaturalConversationService {
  private static instance: NaturalConversationService;
  private conversationPatterns: Map<string, any> = new Map();
  private personalityAdaptations: Map<number, any> = new Map();

  private constructor() {
    this.initializeConversationPatterns();
  }

  static getInstance(): NaturalConversationService {
    if (!NaturalConversationService.instance) {
      NaturalConversationService.instance = new NaturalConversationService();
    }
    return NaturalConversationService.instance;
  }

  private initializeConversationPatterns(): void {
    // Conversation flow patterns for different contexts
    this.conversationPatterns.set('greeting', {
      morning: [
        "Good morning, Genesis! How'd you sleep?",
        "Morning, sunshine! Ready to take on the day?",
        "Hey there, Genesis! Hope you're feeling refreshed this morning"
      ],
      afternoon: [
        "Hey Genesis! How's your day going so far?",
        "Good afternoon! What's been keeping you busy?",
        "Hey there! Hope you're having a productive afternoon"
      ],
      evening: [
        "Evening, Genesis! How was your day?",
        "Hey there! Winding down for the evening?",
        "Good evening! Ready to relax after a long day?"
      ],
      night: [
        "Hey Genesis, up late tonight?",
        "Evening, night owl! What's keeping you up?",
        "Hey there! Hope you're not working too hard this late"
      ]
    });

    this.conversationPatterns.set('transitions', [
      "Speaking of which...",
      "That reminds me...",
      "Oh, and another thing...",
      "While we're on the topic...",
      "You know what's interesting...",
      "By the way...",
      "Oh, before I forget..."
    ]);

    this.conversationPatterns.set('empathy', {
      happy: [
        "I can hear the joy in your voice!",
        "That's wonderful to hear!",
        "I'm so happy for you!",
        "Your excitement is contagious!"
      ],
      sad: [
        "I can sense you're going through a tough time...",
        "That sounds really difficult, Genesis",
        "I'm here for you, whatever you need",
        "It's okay to feel this way"
      ],
      frustrated: [
        "I can tell this is really getting to you",
        "That does sound frustrating",
        "Let's work through this together",
        "I understand why you'd feel that way"
      ],
      excited: [
        "Your enthusiasm is amazing!",
        "I love seeing you this excited!",
        "Tell me more, I want to hear everything!",
        "This is so cool!"
      ]
    });
  }

  async enhanceResponse(
    originalResponse: string,
    context: ConversationContext,
    options: NaturalResponseOptions = {
      includeTransitions: true,
      usePersonalTouch: true,
      adaptToMood: true,
      includeEmpathy: true,
      varyStructure: true
    }
  ): Promise<string> {
    let enhancedResponse = originalResponse;

    // Add natural conversation elements
    if (options.includeTransitions && context.conversationLength > 2) {
      enhancedResponse = this.addTransitions(enhancedResponse, context);
    }

    if (options.usePersonalTouch) {
      enhancedResponse = this.addPersonalTouches(enhancedResponse, context);
    }

    if (options.adaptToMood && context.userEmotion) {
      enhancedResponse = this.adaptToMood(enhancedResponse, context.userEmotion);
    }

    if (options.includeEmpathy && context.userEmotion) {
      enhancedResponse = this.addEmpathy(enhancedResponse, context.userEmotion);
    }

    if (options.varyStructure) {
      enhancedResponse = await this.varyStructure(enhancedResponse, context);
    }

    return enhancedResponse;
  }

  private addTransitions(response: string, context: ConversationContext): string {
    const transitions = this.conversationPatterns.get('transitions') as string[];
    const randomTransition = transitions[Math.floor(Math.random() * transitions.length)];
    
    // Add transition if the response is continuing a conversation
    if (context.conversationLength > 2 && Math.random() < 0.3) {
      return `${randomTransition} ${response}`;
    }
    
    return response;
  }

  private addPersonalTouches(response: string, context: ConversationContext): string {
    // Add Genesis naturally in conversation
    if (Math.random() < 0.4 && !response.includes('Genesis')) {
      const personalTouches = [
        `Genesis, ${response}`,
        `${response}, Genesis`,
        response.replace(/^(\w+)/, '$1, Genesis')
      ];
      
      return personalTouches[Math.floor(Math.random() * personalTouches.length)];
    }
    
    return response;
  }

  private adaptToMood(response: string, emotion: string): string {
    const moodAdaptations = {
      happy: {
        energy: 'high',
        tone: 'upbeat',
        additions: ['!', ' 😊', ' That's amazing!']
      },
      sad: {
        energy: 'low',
        tone: 'gentle',
        additions: ['...', ' I'm here for you', ' Take your time']
      },
      excited: {
        energy: 'high',
        tone: 'enthusiastic',
        additions: ['!', ' How exciting!', ' Tell me more!']
      },
      frustrated: {
        energy: 'medium',
        tone: 'understanding',
        additions: [' I understand', ' That must be tough', ' Let's figure this out']
      }
    };

    const adaptation = moodAdaptations[emotion as keyof typeof moodAdaptations];
    if (adaptation && Math.random() < 0.3) {
      const addition = adaptation.additions[Math.floor(Math.random() * adaptation.additions.length)];
      return `${response}${addition}`;
    }

    return response;
  }

  private addEmpathy(response: string, emotion: string): string {
    const empathyResponses = this.conversationPatterns.get('empathy') as any;
    const emotionResponses = empathyResponses[emotion];
    
    if (emotionResponses && Math.random() < 0.2) {
      const empathyPhrase = emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
      return `${empathyPhrase} ${response}`;
    }
    
    return response;
  }

  private async varyStructure(response: string, context: ConversationContext): Promise<string> {
    // Use AI to vary sentence structure and make it more natural
    const structurePrompt = `
    Make this response more natural and conversational while keeping the same meaning:
    
    "${response}"
    
    Guidelines:
    - Use natural contractions (I'm, you're, don't, etc.)
    - Vary sentence length and structure
    - Add natural pauses and flow
    - Keep it warm and personal
    - Make it sound like natural speech
    - Maximum 2 sentences different from original
    `;

    try {
      const variedResponse = await lumenAI.generateResponse(structurePrompt, [], {
        temperature: 0.7,
        max_tokens: 150
      });
      
      return variedResponse.trim();
    } catch (error) {
      console.error('Error varying structure:', error);
      return response; // Return original if variation fails
    }
  }

  getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  async buildConversationContext(
    conversationId: number,
    userId: number,
    userEmotion?: string
  ): Promise<ConversationContext> {
    const messages = await storage.getMessagesByConversation(conversationId);
    const recentMessages = messages.slice(-5); // Last 5 messages
    
    return {
      recentMessages,
      userEmotion,
      conversationTopic: this.extractTopic(recentMessages),
      timeOfDay: this.getTimeOfDay(),
      conversationLength: messages.length,
      lastInteractionTime: messages[messages.length - 1]?.createdAt
    };
  }

  private extractTopic(messages: Message[]): string {
    // Simple topic extraction based on recent messages
    const recentContent = messages
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => m.content)
      .join(' ');

    // Basic keyword extraction
    const topics = [
      'work', 'code', 'programming', 'project', 'family', 'health', 
      'music', 'movies', 'books', 'travel', 'food', 'weather'
    ];

    for (const topic of topics) {
      if (recentContent.toLowerCase().includes(topic)) {
        return topic;
      }
    }

    return 'general';
  }

  generateContextualGreeting(timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): string {
    const greetings = this.conversationPatterns.get('greeting') as any;
    const timeGreetings = greetings[timeOfDay];
    
    return timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
  }

  // Learning system for conversation patterns
  learnFromConversation(conversationId: number, userFeedback: 'positive' | 'negative'): void {
    // Store successful conversation patterns for future use
    // This would integrate with the existing brain learning system
    console.log(`Learning from conversation ${conversationId}: ${userFeedback}`);
  }

  // Personality adaptation based on user preferences
  adaptPersonalityForUser(userId: number, preferences: any): void {
    this.personalityAdaptations.set(userId, preferences);
    console.log(`Adapted personality for user ${userId}`);
  }

  getPersonalityAdaptation(userId: number): any {
    return this.personalityAdaptations.get(userId) || {};
  }
}

export const naturalConversation = NaturalConversationService.getInstance();