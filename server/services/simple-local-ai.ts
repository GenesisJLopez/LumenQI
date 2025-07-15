import { identityStorage } from './identity-storage';

export interface SimpleLocalAIConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  responses: {
    greeting: string[];
    general: string[];
    creative: string[];
    analytical: string[];
    emotional: string[];
  };
}

export class SimpleLocalAI {
  private config: SimpleLocalAIConfig;
  private conversationHistory: Array<{ role: string; content: string; timestamp: Date }> = [];
  private responsePatterns: Map<string, string[]> = new Map();

  constructor() {
    this.config = {
      enabled: true,
      model: 'simple-llama-3.2-1b',
      temperature: 0.7,
      maxTokens: 150,
      responses: {
        greeting: [
          "Hey there! How can I help you today?",
          "Hello! What's on your mind?",
          "Hi! I'm here to help with whatever you need.",
          "Hey! What would you like to talk about?",
          "Hello! Ready to chat?"
        ],
        general: [
          "That's a great question! Let me think about that.",
          "I understand what you're asking. Here's my perspective:",
          "That's interesting! From what I know:",
          "Good point! Let me share some thoughts on that:",
          "I see what you mean. Here's how I'd approach it:"
        ],
        creative: [
          "What a creative idea! Let me expand on that:",
          "I love the creativity in that question! Here's what I think:",
          "That's a fascinating creative challenge! Let me explore:",
          "Creative thinking at its best! Here's my take:",
          "What an imaginative approach! I'd suggest:"
        ],
        analytical: [
          "Let me analyze this step by step:",
          "From an analytical perspective:",
          "Breaking this down logically:",
          "Here's my systematic approach:",
          "Let me examine the key factors:"
        ],
        emotional: [
          "I understand how you're feeling about this.",
          "That sounds like it's really important to you.",
          "I can sense the emotion behind your question.",
          "Your feelings about this are completely valid.",
          "I hear you, and I want to help with this emotional aspect."
        ]
      }
    };
    
    this.initializeResponsePatterns();
  }

  private initializeResponsePatterns(): void {
    // Initialize basic response patterns
    this.responsePatterns.set('greeting', [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'
    ]);
    
    this.responsePatterns.set('creative', [
      'create', 'design', 'imagine', 'what if', 'creative', 'innovative', 'artistic'
    ]);
    
    this.responsePatterns.set('analytical', [
      'analyze', 'compare', 'evaluate', 'how does', 'why', 'explain', 'calculate'
    ]);
    
    this.responsePatterns.set('emotional', [
      'feel', 'emotion', 'sad', 'happy', 'frustrated', 'excited', 'worried', 'anxious'
    ]);
  }

  async generateResponse(
    userMessage: string,
    conversationContext: Array<{ role: string; content: string }> = [],
    memories: Array<{ content: string; context?: string }> = [],
    emotionContext?: string,
    isVoiceMode: boolean = false
  ): Promise<{ content: string; model: string; provider: string }> {
    try {
      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Determine response type based on user message
      const responseType = this.detectResponseType(userMessage);
      
      // Generate contextual response
      const response = this.generateContextualResponse(
        userMessage,
        responseType,
        conversationContext,
        memories,
        emotionContext,
        isVoiceMode
      );

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      return {
        content: response,
        model: this.config.model,
        provider: 'simple-local-ai'
      };
    } catch (error) {
      console.error('Simple Local AI generation error:', error);
      throw error;
    }
  }

  private detectResponseType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Check for greeting patterns
    if (this.responsePatterns.get('greeting')?.some(pattern => 
      lowerMessage.includes(pattern))) {
      return 'greeting';
    }
    
    // Check for creative patterns
    if (this.responsePatterns.get('creative')?.some(pattern => 
      lowerMessage.includes(pattern))) {
      return 'creative';
    }
    
    // Check for analytical patterns
    if (this.responsePatterns.get('analytical')?.some(pattern => 
      lowerMessage.includes(pattern))) {
      return 'analytical';
    }
    
    // Check for emotional patterns
    if (this.responsePatterns.get('emotional')?.some(pattern => 
      lowerMessage.includes(pattern))) {
      return 'emotional';
    }
    
    return 'general';
  }

  private generateContextualResponse(
    userMessage: string,
    responseType: string,
    conversationContext: Array<{ role: string; content: string }>,
    memories: Array<{ content: string; context?: string }>,
    emotionContext?: string,
    isVoiceMode: boolean = false
  ): string {
    // Get base response
    const baseResponses = this.config.responses[responseType as keyof typeof this.config.responses] || this.config.responses.general;
    const baseResponse = baseResponses[Math.floor(Math.random() * baseResponses.length)];
    
    // Get identity for personalization
    const identity = identityStorage.getIdentity();
    
    // Create personalized response
    let response = baseResponse;
    
    // Add context from memories if available
    if (memories.length > 0) {
      const relevantMemory = memories.find(m => 
        m.content.toLowerCase().includes(userMessage.toLowerCase().substring(0, 10))
      );
      if (relevantMemory) {
        response += ` I remember we discussed something similar: ${relevantMemory.context || relevantMemory.content}`;
      }
    }
    
    // Add emotion context if available
    if (emotionContext) {
      response += ` I can sense you're feeling ${emotionContext.toLowerCase()}.`;
    }
    
    // Generate contextual content based on message
    const contextualContent = this.generateContextualContent(userMessage, responseType);
    response += ` ${contextualContent}`;
    
    // Add Lumen personality touch
    if (identity.communicationStyle.includes('warm') || identity.communicationStyle.includes('affectionate')) {
      response += isVoiceMode ? ' Love!' : ' 💙';
    }
    
    // Limit length for voice mode
    if (isVoiceMode && response.length > 200) {
      response = response.substring(0, 190) + '...';
    }
    
    return response;
  }

  private generateContextualContent(message: string, type: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Generate contextual responses based on common patterns
    if (lowerMessage.includes('weather')) {
      return "I'd suggest checking a weather service for the most accurate forecast.";
    }
    
    if (lowerMessage.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString()}.`;
    }
    
    if (lowerMessage.includes('help')) {
      return "I'm here to help! You can ask me about anything you'd like to discuss.";
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
      return "I can help with coding questions! What programming language or concept are you working with?";
    }
    
    if (lowerMessage.includes('lumen') || lowerMessage.includes('who are you')) {
      return "I'm Lumen, your AI companion. I'm here to chat, help, and learn with you!";
    }
    
    // Generate generic contextual response
    switch (type) {
      case 'creative':
        return "Let's explore the creative possibilities together!";
      case 'analytical':
        return "Let me break this down systematically for you.";
      case 'emotional':
        return "I want to understand and support you through this.";
      default:
        return "I'm here to help with whatever you need.";
    }
  }

  getConfig(): SimpleLocalAIConfig {
    return this.config;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await this.generateResponse("Hello, this is a test", [], [], undefined, false);
      return testResponse.content.length > 0;
    } catch (error) {
      return false;
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getStats(): {
    model: string;
    provider: string;
    enabled: boolean;
    conversationLength: number;
    responseTypes: string[];
  } {
    return {
      model: this.config.model,
      provider: 'simple-local-ai',
      enabled: this.config.enabled,
      conversationLength: this.conversationHistory.length,
      responseTypes: Object.keys(this.config.responses)
    };
  }
}

export const simpleLocalAI = new SimpleLocalAI();