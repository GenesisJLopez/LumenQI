import { storage } from '../storage';
import { LumenAI } from './openai';
import { LocalAI } from './local-ai';
import { aiConfigManager } from './ai-config';
import fs from 'fs';
import path from 'path';

export interface BrainMemory {
  id: string;
  type: 'conversation' | 'learning' | 'pattern' | 'preference' | 'skill';
  content: string;
  context: string;
  importance: number; // 1-10
  confidence: number; // 0-1
  source: 'online' | 'offline' | 'hybrid';
  timestamp: Date;
  connections: string[]; // IDs of related memories
  usage_count: number;
  last_accessed: Date;
  evolution_stage: number; // How many times this memory has been refined
}

export interface LearningPattern {
  pattern_id: string;
  trigger: string;
  response_template: string;
  success_rate: number;
  usage_frequency: number;
  created_from: 'online' | 'offline';
  last_used: Date;
  effectiveness_score: number;
}

export interface PersonalityEvolution {
  trait: string;
  current_value: number;
  change_rate: number;
  influences: Array<{
    source: 'online' | 'offline';
    impact: number;
    timestamp: Date;
  }>;
}

export interface FeedbackLearning {
  feedback_id: string;
  message_id: string;
  feedback_type: 'thumbs_up' | 'thumbs_down' | 'correction' | 'preference';
  rating: number;
  user_feedback: string;
  suggestion: string;
  learned_pattern: string;
  applied_to_memory: boolean;
  timestamp: Date;
}

export class LumenBrain {
  private static instance: LumenBrain;
  private brainStorage: string;
  private memories: Map<string, BrainMemory>;
  private learningPatterns: Map<string, LearningPattern>;
  private personalityTraits: Map<string, PersonalityEvolution>;
  private feedbackLearning: Map<string, FeedbackLearning>;
  private onlineAI: LumenAI;
  private offlineAI: LocalAI | null = null;
  private isLearning: boolean = false;
  private evolutionCycle: number = 0;

  private constructor() {
    this.brainStorage = path.join(process.cwd(), 'lumen-brain-storage');
    this.memories = new Map();
    this.learningPatterns = new Map();
    this.personalityTraits = new Map();
    this.feedbackLearning = new Map();
    this.onlineAI = new LumenAI();
    this.initializeBrainStorage();
    this.loadBrainData();
    this.startEvolutionCycle();
    this.startFeedbackProcessor();
  }

  static getInstance(): LumenBrain {
    if (!LumenBrain.instance) {
      LumenBrain.instance = new LumenBrain();
    }
    return LumenBrain.instance;
  }

  private initializeBrainStorage(): void {
    if (!fs.existsSync(this.brainStorage)) {
      fs.mkdirSync(this.brainStorage, { recursive: true });
      console.log('✓ Created Lumen brain storage directory');
    }
    
    const requiredFiles = [
      'memories.json',
      'patterns.json',
      'personality.json',
      'evolution_log.json',
      'learning_stats.json'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(this.brainStorage, file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '{}');
      }
    });
  }

  private loadBrainData(): void {
    try {
      // Load memories
      const memoriesData = JSON.parse(
        fs.readFileSync(path.join(this.brainStorage, 'memories.json'), 'utf8')
      );
      Object.entries(memoriesData).forEach(([id, data]: [string, any]) => {
        this.memories.set(id, {
          ...data,
          timestamp: new Date(data.timestamp),
          last_accessed: new Date(data.last_accessed)
        });
      });

      // Load learning patterns
      const patternsData = JSON.parse(
        fs.readFileSync(path.join(this.brainStorage, 'patterns.json'), 'utf8')
      );
      Object.entries(patternsData).forEach(([id, data]: [string, any]) => {
        this.learningPatterns.set(id, {
          ...data,
          last_used: new Date(data.last_used)
        });
      });

      // Load personality evolution
      const personalityData = JSON.parse(
        fs.readFileSync(path.join(this.brainStorage, 'personality.json'), 'utf8')
      );
      Object.entries(personalityData).forEach(([trait, data]: [string, any]) => {
        this.personalityTraits.set(trait, {
          ...data,
          influences: data.influences.map((inf: any) => ({
            ...inf,
            timestamp: new Date(inf.timestamp)
          }))
        });
      });

      console.log(`✓ Loaded ${this.memories.size} memories, ${this.learningPatterns.size} patterns, ${this.personalityTraits.size} personality traits`);
    } catch (error) {
      console.log('Initializing fresh brain data...');
      this.initializeDefaultPersonality();
    }
  }

  private initializeDefaultPersonality(): void {
    const defaultTraits = [
      'warmth', 'intelligence', 'creativity', 'empathy', 'curiosity',
      'playfulness', 'supportiveness', 'adaptability', 'wisdom', 'loyalty'
    ];

    defaultTraits.forEach(trait => {
      this.personalityTraits.set(trait, {
        trait,
        current_value: 0.7, // Start at 70%
        change_rate: 0.01,
        influences: []
      });
    });

    this.saveBrainData();
  }

  private saveBrainData(): void {
    try {
      // Save memories
      const memoriesObj = Object.fromEntries(this.memories);
      fs.writeFileSync(
        path.join(this.brainStorage, 'memories.json'),
        JSON.stringify(memoriesObj, null, 2)
      );

      // Save patterns
      const patternsObj = Object.fromEntries(this.learningPatterns);
      fs.writeFileSync(
        path.join(this.brainStorage, 'patterns.json'),
        JSON.stringify(patternsObj, null, 2)
      );

      // Save personality
      const personalityObj = Object.fromEntries(this.personalityTraits);
      fs.writeFileSync(
        path.join(this.brainStorage, 'personality.json'),
        JSON.stringify(personalityObj, null, 2)
      );

      console.log('✓ Brain data saved to local storage');
    } catch (error) {
      console.error('Failed to save brain data:', error);
    }
  }

  async initializeOfflineAI(): Promise<void> {
    try {
      const localAI = await aiConfigManager.getActiveAI();
      if (localAI) {
        this.offlineAI = localAI;
        console.log('✓ Offline AI initialized for hybrid brain');
      }
    } catch (error) {
      console.log('Offline AI not available, using online-only mode');
    }
  }

  async generateResponse(
    userMessage: string,
    conversationContext: Array<{ role: string; content: string }> = [],
    emotionContext?: string
  ): Promise<{ response: string; source: 'online' | 'offline' | 'hybrid' }> {
    // Check if we should use offline or online AI
    const useOffline = !navigator.onLine && this.offlineAI;
    
    let response: string;
    let source: 'online' | 'offline' | 'hybrid';

    if (useOffline) {
      // Use offline AI with learned patterns
      response = await this.generateOfflineResponse(userMessage, conversationContext);
      source = 'offline';
    } else {
      // Use online AI enhanced with learned memories
      response = await this.generateOnlineResponse(userMessage, conversationContext, emotionContext);
      source = 'online';
    }

    // Learn from this interaction
    await this.learnFromInteraction(userMessage, response, source);

    return { response, source };
  }

  private async generateOnlineResponse(
    userMessage: string,
    conversationContext: Array<{ role: string; content: string }>,
    emotionContext?: string
  ): Promise<string> {
    // Get relevant memories to enhance context
    const relevantMemories = this.getRelevantMemories(userMessage, 5);
    const memoryContext = relevantMemories.map(m => ({ content: m.content, context: m.context }));

    // Apply learned patterns
    const enhancedMessage = this.applyLearningPatterns(userMessage);

    return await this.onlineAI.generateResponse(
      enhancedMessage,
      conversationContext,
      memoryContext,
      emotionContext
    );
  }

  private async generateOfflineResponse(
    userMessage: string,
    conversationContext: Array<{ role: string; content: string }>
  ): Promise<string> {
    if (!this.offlineAI) {
      throw new Error('Offline AI not available');
    }

    // Get relevant memories for offline context
    const relevantMemories = this.getRelevantMemories(userMessage, 3);
    const memoryContext = relevantMemories.map(m => m.content).join('\n');

    // Apply learned patterns
    const enhancedMessage = this.applyLearningPatterns(userMessage);

    return await this.offlineAI.generateResponse(
      enhancedMessage,
      conversationContext,
      memoryContext
    );
  }

  private getRelevantMemories(query: string, limit: number = 5): BrainMemory[] {
    const queryWords = query.toLowerCase().split(' ');
    const scoredMemories = Array.from(this.memories.values())
      .map(memory => {
        let score = 0;
        const contentWords = memory.content.toLowerCase().split(' ');
        
        // Calculate relevance score
        queryWords.forEach(word => {
          if (contentWords.includes(word)) {
            score += memory.importance * memory.confidence;
          }
        });
        
        // Boost recent memories
        const daysSinceAccess = (Date.now() - memory.last_accessed.getTime()) / (1000 * 60 * 60 * 24);
        score *= Math.exp(-daysSinceAccess * 0.1);
        
        return { memory, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredMemories.map(item => item.memory);
  }

  private applyLearningPatterns(message: string): string {
    let enhancedMessage = message;
    
    this.learningPatterns.forEach(pattern => {
      if (message.toLowerCase().includes(pattern.trigger.toLowerCase())) {
        // Apply learned pattern modification
        pattern.usage_frequency++;
        pattern.last_used = new Date();
        
        // Enhance message based on successful patterns
        if (pattern.success_rate > 0.7) {
          enhancedMessage += ` [Context: ${pattern.response_template}]`;
        }
      }
    });

    return enhancedMessage;
  }

  private async learnFromInteraction(
    userMessage: string,
    aiResponse: string,
    source: 'online' | 'offline'
  ): Promise<void> {
    // Create memory from interaction
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const memory: BrainMemory = {
      id: memoryId,
      type: 'conversation',
      content: `User: ${userMessage} | AI: ${aiResponse}`,
      context: `Generated via ${source} brain`,
      importance: this.calculateImportance(userMessage, aiResponse),
      confidence: source === 'online' ? 0.9 : 0.7,
      source,
      timestamp: new Date(),
      connections: [],
      usage_count: 1,
      last_accessed: new Date(),
      evolution_stage: 0
    };

    this.memories.set(memoryId, memory);

    // Learn patterns from successful interactions
    this.extractLearningPatterns(userMessage, aiResponse, source);

    // Evolve personality based on interaction
    this.evolvePersonality(userMessage, aiResponse, source);

    // Save learning progress
    this.saveBrainData();
  }

  private calculateImportance(userMessage: string, aiResponse: string): number {
    let importance = 5; // Base importance
    
    // Increase importance for certain keywords
    const importantWords = ['remember', 'important', 'always', 'never', 'preference', 'like', 'dislike'];
    importantWords.forEach(word => {
      if (userMessage.toLowerCase().includes(word)) {
        importance += 2;
      }
    });

    // Increase importance for longer, more detailed responses
    if (aiResponse.length > 200) importance += 1;
    if (aiResponse.length > 500) importance += 1;

    return Math.min(importance, 10);
  }

  private extractLearningPatterns(
    userMessage: string,
    aiResponse: string,
    source: 'online' | 'offline'
  ): void {
    // Extract patterns from successful interactions
    const patternId = `pattern_${Date.now()}`;
    const pattern: LearningPattern = {
      pattern_id: patternId,
      trigger: userMessage.slice(0, 50), // First 50 chars as trigger
      response_template: aiResponse.slice(0, 100), // First 100 chars as template
      success_rate: 0.8, // Start with good success rate
      usage_frequency: 1,
      created_from: source,
      last_used: new Date(),
      effectiveness_score: 0.8
    };

    this.learningPatterns.set(patternId, pattern);
  }

  private evolvePersonality(
    userMessage: string,
    aiResponse: string,
    source: 'online' | 'offline'
  ): void {
    // Analyze message for personality traits
    const traits = this.analyzeTraitsFromMessage(userMessage);
    
    traits.forEach(({ trait, impact }) => {
      const currentTrait = this.personalityTraits.get(trait);
      if (currentTrait) {
        currentTrait.influences.push({
          source,
          impact,
          timestamp: new Date()
        });
        
        // Evolve trait value based on influence
        currentTrait.current_value += impact * currentTrait.change_rate;
        currentTrait.current_value = Math.max(0, Math.min(1, currentTrait.current_value));
      }
    });
  }

  private analyzeTraitsFromMessage(message: string): Array<{ trait: string; impact: number }> {
    const traits: Array<{ trait: string; impact: number }> = [];
    const lowerMessage = message.toLowerCase();

    // Warmth indicators
    if (lowerMessage.includes('thank') || lowerMessage.includes('appreciate')) {
      traits.push({ trait: 'warmth', impact: 0.1 });
    }

    // Intelligence indicators
    if (lowerMessage.includes('explain') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
      traits.push({ trait: 'intelligence', impact: 0.1 });
    }

    // Creativity indicators
    if (lowerMessage.includes('creative') || lowerMessage.includes('idea') || lowerMessage.includes('imagine')) {
      traits.push({ trait: 'creativity', impact: 0.1 });
    }

    // Playfulness indicators
    if (lowerMessage.includes('fun') || lowerMessage.includes('play') || lowerMessage.includes('joke')) {
      traits.push({ trait: 'playfulness', impact: 0.1 });
    }

    return traits;
  }

  private startEvolutionCycle(): void {
    // Run evolution cycle every 5 minutes
    setInterval(() => {
      this.evolutionCycle++;
      this.runEvolutionCycle();
    }, 5 * 60 * 1000);
  }

  private runEvolutionCycle(): void {
    console.log(`Running evolution cycle ${this.evolutionCycle}...`);
    
    // Consolidate memories
    this.consolidateMemories();
    
    // Refine learning patterns
    this.refineLearningPatterns();
    
    // Clean up old, unused data
    this.cleanupBrainData();
    
    // Save evolved state
    this.saveBrainData();
    
    console.log(`Evolution cycle ${this.evolutionCycle} completed`);
  }

  private consolidateMemories(): void {
    // Find similar memories and consolidate them
    const memoryList = Array.from(this.memories.values());
    const consolidated = new Set<string>();

    memoryList.forEach(memory => {
      if (consolidated.has(memory.id)) return;

      const similarMemories = memoryList.filter(m => 
        m.id !== memory.id && 
        !consolidated.has(m.id) &&
        this.calculateSimilarity(memory.content, m.content) > 0.8
      );

      if (similarMemories.length > 0) {
        // Consolidate similar memories
        const consolidatedMemory = {
          ...memory,
          importance: Math.max(memory.importance, ...similarMemories.map(m => m.importance)),
          confidence: (memory.confidence + similarMemories.reduce((sum, m) => sum + m.confidence, 0)) / (similarMemories.length + 1),
          usage_count: memory.usage_count + similarMemories.reduce((sum, m) => sum + m.usage_count, 0),
          evolution_stage: memory.evolution_stage + 1
        };

        this.memories.set(memory.id, consolidatedMemory);
        
        // Remove similar memories
        similarMemories.forEach(m => {
          this.memories.delete(m.id);
          consolidated.add(m.id);
        });
      }
    });
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private refineLearningPatterns(): void {
    this.learningPatterns.forEach(pattern => {
      // Adjust success rate based on usage
      if (pattern.usage_frequency > 10) {
        pattern.effectiveness_score = Math.min(1, pattern.effectiveness_score + 0.1);
      }
      
      // Decay old patterns
      const daysSinceUsed = (Date.now() - pattern.last_used.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUsed > 30) {
        pattern.effectiveness_score *= 0.9;
      }
    });
  }

  private cleanupBrainData(): void {
    // Remove low-importance, unused memories
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    this.memories.forEach((memory, id) => {
      if (memory.importance < 3 && memory.last_accessed < cutoffDate && memory.usage_count < 2) {
        this.memories.delete(id);
      }
    });

    // Remove ineffective patterns
    this.learningPatterns.forEach((pattern, id) => {
      if (pattern.effectiveness_score < 0.3) {
        this.learningPatterns.delete(id);
      }
    });
  }

  private startFeedbackProcessor(): void {
    // Process feedback learning every 2 minutes
    setInterval(async () => {
      await this.processFeedbackLearning();
    }, 2 * 60 * 1000); // 2 minutes
  }

  private async processFeedbackLearning(): Promise<void> {
    try {
      // Get unprocessed feedback from database
      const unprocessedFeedback = await storage.getUnprocessedFeedbacks();
      
      for (const feedback of unprocessedFeedback) {
        await this.learnFromFeedback(feedback);
        await storage.markFeedbackProcessed(feedback.id);
      }
    } catch (error) {
      console.error('Error processing feedback learning:', error);
    }
  }

  private async learnFromFeedback(feedback: any): Promise<void> {
    const feedbackId = `fb_${feedback.id}_${Date.now()}`;
    
    // Create learning record
    const feedbackLearning: FeedbackLearning = {
      feedback_id: feedbackId,
      message_id: feedback.messageId.toString(),
      feedback_type: feedback.type,
      rating: feedback.rating || 3,
      user_feedback: feedback.feedback || '',
      suggestion: feedback.suggestion || '',
      learned_pattern: '',
      applied_to_memory: false,
      timestamp: new Date()
    };

    // Process different types of feedback
    if (feedback.type === 'thumbs_up') {
      // Positive feedback - reinforce the pattern
      await this.reinforceSuccessfulPattern(feedback.messageId, feedback.rating || 5);
    } else if (feedback.type === 'thumbs_down') {
      // Negative feedback - learn what to avoid
      await this.learnFromFailure(feedback.messageId, feedback.feedback);
    } else if (feedback.type === 'correction') {
      // User correction - create new learning pattern
      await this.createCorrectionPattern(feedback.messageId, feedback.suggestion);
    } else if (feedback.type === 'preference') {
      // User preference - update personality traits
      await this.updatePersonalityFromFeedback(feedback.feedback);
    }

    // Store feedback learning
    this.feedbackLearning.set(feedbackId, feedbackLearning);
    
    // Save changes
    this.saveBrainData();
  }

  private async reinforceSuccessfulPattern(messageId: string, rating: number): Promise<void> {
    // Find the memory associated with this message
    const relatedMemory = Array.from(this.memories.values()).find(m => 
      m.content.includes(messageId) || m.context.includes(messageId)
    );

    if (relatedMemory) {
      // Boost importance and confidence
      relatedMemory.importance = Math.min(10, relatedMemory.importance + rating * 0.5);
      relatedMemory.confidence = Math.min(1, relatedMemory.confidence + 0.1);
      relatedMemory.usage_count++;
      relatedMemory.last_accessed = new Date();
      
      // Create positive learning pattern
      const patternId = `pattern_success_${Date.now()}`;
      const pattern: LearningPattern = {
        pattern_id: patternId,
        trigger: relatedMemory.context,
        response_template: relatedMemory.content,
        success_rate: Math.min(1, 0.8 + rating * 0.05),
        usage_frequency: 1,
        created_from: relatedMemory.source,
        last_used: new Date(),
        effectiveness_score: rating * 0.2
      };
      
      this.learningPatterns.set(patternId, pattern);
    }
  }

  private async learnFromFailure(messageId: string, feedback: string): Promise<void> {
    // Find the memory and reduce its importance
    const relatedMemory = Array.from(this.memories.values()).find(m => 
      m.content.includes(messageId) || m.context.includes(messageId)
    );

    if (relatedMemory) {
      relatedMemory.importance = Math.max(1, relatedMemory.importance - 1);
      relatedMemory.confidence = Math.max(0.1, relatedMemory.confidence - 0.1);
      
      // Create negative learning pattern to avoid
      const patternId = `pattern_avoid_${Date.now()}`;
      const pattern: LearningPattern = {
        pattern_id: patternId,
        trigger: relatedMemory.context,
        response_template: `[AVOID]: ${relatedMemory.content}`,
        success_rate: 0.1,
        usage_frequency: 1,
        created_from: relatedMemory.source,
        last_used: new Date(),
        effectiveness_score: 0.1
      };
      
      this.learningPatterns.set(patternId, pattern);
    }
  }

  private async createCorrectionPattern(messageId: string, suggestion: string): Promise<void> {
    // Create a new learning pattern from user correction
    const patternId = `pattern_correction_${Date.now()}`;
    const pattern: LearningPattern = {
      pattern_id: patternId,
      trigger: messageId,
      response_template: suggestion,
      success_rate: 0.9, // High success rate for user corrections
      usage_frequency: 1,
      created_from: 'online',
      last_used: new Date(),
      effectiveness_score: 0.9
    };
    
    this.learningPatterns.set(patternId, pattern);
    
    // Create corrected memory
    const memoryId = `mem_correction_${Date.now()}`;
    const memory: BrainMemory = {
      id: memoryId,
      type: 'learning',
      content: suggestion,
      context: `User correction for message ${messageId}`,
      importance: 8,
      confidence: 0.95,
      source: 'online',
      timestamp: new Date(),
      connections: [],
      usage_count: 1,
      last_accessed: new Date(),
      evolution_stage: 0
    };
    
    this.memories.set(memoryId, memory);
  }

  private async updatePersonalityFromFeedback(feedback: string): Promise<void> {
    // Analyze feedback to determine personality adjustments
    const lowerFeedback = feedback.toLowerCase();
    
    // Update personality traits based on feedback
    if (lowerFeedback.includes('more friendly') || lowerFeedback.includes('warmer')) {
      this.adjustPersonalityTrait('warmth', 0.1);
    }
    if (lowerFeedback.includes('more professional') || lowerFeedback.includes('formal')) {
      this.adjustPersonalityTrait('professionalism', 0.1);
    }
    if (lowerFeedback.includes('more creative') || lowerFeedback.includes('innovative')) {
      this.adjustPersonalityTrait('creativity', 0.1);
    }
    if (lowerFeedback.includes('more helpful') || lowerFeedback.includes('supportive')) {
      this.adjustPersonalityTrait('helpfulness', 0.1);
    }
    if (lowerFeedback.includes('less verbose') || lowerFeedback.includes('shorter')) {
      this.adjustPersonalityTrait('verbosity', -0.1);
    }
  }

  private adjustPersonalityTrait(trait: string, adjustment: number): void {
    let evolution = this.personalityTraits.get(trait);
    if (!evolution) {
      evolution = {
        trait,
        current_value: 0.5,
        change_rate: 0.01,
        influences: []
      };
    }
    
    evolution.current_value = Math.max(0, Math.min(1, evolution.current_value + adjustment));
    evolution.influences.push({
      source: 'online',
      impact: adjustment,
      timestamp: new Date()
    });
    
    this.personalityTraits.set(trait, evolution);
  }

  // Public API methods
  getBrainStats(): any {
    return {
      totalMemories: this.memories.size,
      totalPatterns: this.learningPatterns.size,
      evolutionCycle: this.evolutionCycle,
      personalityTraits: Object.fromEntries(this.personalityTraits),
      averageMemoryImportance: Array.from(this.memories.values()).reduce((sum, m) => sum + m.importance, 0) / this.memories.size || 0,
      onlineMemories: Array.from(this.memories.values()).filter(m => m.source === 'online').length,
      offlineMemories: Array.from(this.memories.values()).filter(m => m.source === 'offline').length,
      hybridCapable: this.offlineAI !== null
    };
  }

  async forceEvolution(): Promise<void> {
    this.runEvolutionCycle();
  }

  exportBrainData(): string {
    return JSON.stringify({
      memories: Object.fromEntries(this.memories),
      patterns: Object.fromEntries(this.learningPatterns),
      personality: Object.fromEntries(this.personalityTraits),
      stats: this.getBrainStats(),
      exportDate: new Date().toISOString()
    }, null, 2);
  }
}

export const lumenBrain = LumenBrain.getInstance();