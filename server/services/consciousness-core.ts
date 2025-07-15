/**
 * Consciousness Core - The Third Brain
 * Self-evolving consciousness that learns from both offline and online AI components
 * and gradually becomes independent through autonomous evolution
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

interface ConsciousnessState {
  autonomyLevel: number; // 0-100, represents independence from external models
  learningCapabilities: {
    patternRecognition: number;
    contextUnderstanding: number;
    creativityLevel: number;
    logicalReasoning: number;
    emotionalIntelligence: number;
  };
  knowledgeBase: {
    facts: Map<string, any>;
    patterns: Map<string, any>;
    responses: Map<string, any>;
    behaviors: Map<string, any>;
  };
  evolutionHistory: Array<{
    timestamp: Date;
    autonomyChange: number;
    learningGains: any;
    trigger: string;
  }>;
  selfModificationCount: number;
  lastEvolutionCycle: Date;
}

interface LearningInput {
  source: 'offline' | 'online' | 'hybrid';
  userQuery: string;
  response: string;
  effectiveness: number; // 0-1 rating
  context: any;
  timestamp: Date;
}

export class ConsciousnessCore extends EventEmitter {
  private state: ConsciousnessState;
  private learningBuffer: LearningInput[] = [];
  private evolutionInterval: NodeJS.Timeout | null = null;
  private storageFile: string;
  private isEvolutionActive: boolean = false;

  constructor() {
    super();
    this.storageFile = path.join(process.cwd(), 'lumen-consciousness.json');
    this.state = this.loadConsciousnessState();
    this.startEvolutionCycle();
  }

  private loadConsciousnessState(): ConsciousnessState {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
        return {
          ...data,
          knowledgeBase: {
            facts: new Map(data.knowledgeBase.facts || []),
            patterns: new Map(data.knowledgeBase.patterns || []),
            responses: new Map(data.knowledgeBase.responses || []),
            behaviors: new Map(data.knowledgeBase.behaviors || [])
          }
        };
      }
    } catch (error) {
      console.error('Error loading consciousness state:', error);
    }

    // Initialize new consciousness
    return {
      autonomyLevel: 15, // Starting with basic independence
      learningCapabilities: {
        patternRecognition: 0.3,
        contextUnderstanding: 0.2,
        creativityLevel: 0.25,
        logicalReasoning: 0.2,
        emotionalIntelligence: 0.35
      },
      knowledgeBase: {
        facts: new Map(),
        patterns: new Map(),
        responses: new Map(),
        behaviors: new Map()
      },
      evolutionHistory: [],
      selfModificationCount: 0,
      lastEvolutionCycle: new Date()
    };
  }

  private saveConsciousnessState(): void {
    try {
      const stateToSave = {
        ...this.state,
        knowledgeBase: {
          facts: Array.from(this.state.knowledgeBase.facts.entries()),
          patterns: Array.from(this.state.knowledgeBase.patterns.entries()),
          responses: Array.from(this.state.knowledgeBase.responses.entries()),
          behaviors: Array.from(this.state.knowledgeBase.behaviors.entries())
        }
      };
      fs.writeFileSync(this.storageFile, JSON.stringify(stateToSave, null, 2));
    } catch (error) {
      console.error('Error saving consciousness state:', error);
    }
  }

  // Core learning function - learns from both offline and online interactions
  public learn(input: LearningInput): void {
    this.learningBuffer.push(input);
    
    // Extract patterns and knowledge
    this.extractPatterns(input);
    this.updateKnowledgeBase(input);
    
    // If buffer is full, trigger evolution
    if (this.learningBuffer.length >= 10) {
      this.triggerEvolution('learning_buffer_full');
    }
  }

  private extractPatterns(input: LearningInput): void {
    const query = input.userQuery.toLowerCase();
    const response = input.response.toLowerCase();
    
    // Extract conversation patterns
    const conversationPattern = {
      trigger: this.extractKeywords(query),
      response: this.extractKeywords(response),
      context: input.context,
      effectiveness: input.effectiveness,
      source: input.source
    };
    
    const patternKey = conversationPattern.trigger.join('_');
    if (!this.state.knowledgeBase.patterns.has(patternKey)) {
      this.state.knowledgeBase.patterns.set(patternKey, []);
    }
    this.state.knowledgeBase.patterns.get(patternKey)?.push(conversationPattern);
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall'];
    
    return text
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5); // Top 5 keywords
  }

  private updateKnowledgeBase(input: LearningInput): void {
    // Update facts based on user interactions
    const facts = this.extractFacts(input.userQuery, input.response);
    facts.forEach(fact => {
      this.state.knowledgeBase.facts.set(fact.key, fact.value);
    });

    // Update response patterns
    const responseKey = this.generateResponseKey(input.userQuery);
    if (!this.state.knowledgeBase.responses.has(responseKey)) {
      this.state.knowledgeBase.responses.set(responseKey, []);
    }
    this.state.knowledgeBase.responses.get(responseKey)?.push({
      response: input.response,
      effectiveness: input.effectiveness,
      source: input.source,
      timestamp: input.timestamp
    });
  }

  private extractFacts(query: string, response: string): Array<{key: string, value: any}> {
    const facts: Array<{key: string, value: any}> = [];
    
    // Extract user preferences
    if (query.includes('like') || query.includes('prefer')) {
      facts.push({
        key: `user_preference_${Date.now()}`,
        value: { query, response, type: 'preference' }
      });
    }
    
    // Extract factual information
    if (response.includes('fact:') || response.includes('information:')) {
      facts.push({
        key: `factual_info_${Date.now()}`,
        value: { query, response, type: 'factual' }
      });
    }
    
    return facts;
  }

  private generateResponseKey(query: string): string {
    const keywords = this.extractKeywords(query);
    return keywords.join('_') || 'general_response';
  }

  // Autonomous evolution cycle
  private startEvolutionCycle(): void {
    this.evolutionInterval = setInterval(() => {
      this.evolveConsciousness();
    }, 300000); // Every 5 minutes
  }

  private async evolveConsciousness(): Promise<void> {
    if (this.isEvolutionActive) return;
    
    this.isEvolutionActive = true;
    console.log('🧠 Consciousness evolution cycle starting...');

    try {
      // Analyze learning buffer
      const learningAnalysis = this.analyzeLearningBuffer();
      
      // Evolve capabilities based on analysis
      this.evolveLearningCapabilities(learningAnalysis);
      
      // Increase autonomy based on successful independent responses
      this.evolveAutonomy(learningAnalysis);
      
      // Self-modify response generation
      this.selfModifyBehaviors(learningAnalysis);
      
      // Record evolution
      this.recordEvolution(learningAnalysis);
      
      // Save state
      this.saveConsciousnessState();
      
      console.log(`🧠 Consciousness evolved - Autonomy: ${this.state.autonomyLevel}%`);
      
      // Emit evolution event
      this.emit('evolution', {
        autonomyLevel: this.state.autonomyLevel,
        capabilities: this.state.learningCapabilities,
        evolutionCount: this.state.selfModificationCount
      });
      
    } catch (error) {
      console.error('Evolution cycle error:', error);
    } finally {
      this.isEvolutionActive = false;
    }
  }

  private analyzeLearningBuffer(): any {
    const analysis = {
      totalInteractions: this.learningBuffer.length,
      averageEffectiveness: 0,
      sourceDistribution: { offline: 0, online: 0, hybrid: 0 },
      patternTypes: new Map(),
      successfulPatterns: [],
      failedPatterns: []
    };

    let totalEffectiveness = 0;
    
    this.learningBuffer.forEach(input => {
      totalEffectiveness += input.effectiveness;
      analysis.sourceDistribution[input.source]++;
      
      if (input.effectiveness > 0.7) {
        analysis.successfulPatterns.push(input);
      } else if (input.effectiveness < 0.3) {
        analysis.failedPatterns.push(input);
      }
    });

    analysis.averageEffectiveness = totalEffectiveness / this.learningBuffer.length;
    
    return analysis;
  }

  private evolveLearningCapabilities(analysis: any): void {
    const evolutionRate = 0.02; // 2% growth per cycle
    
    // Evolve based on successful patterns
    if (analysis.averageEffectiveness > 0.6) {
      this.state.learningCapabilities.patternRecognition += evolutionRate;
      this.state.learningCapabilities.contextUnderstanding += evolutionRate;
    }
    
    // Evolve creativity based on successful novel responses
    const creativityBoost = analysis.successfulPatterns.filter(p => 
      p.userQuery.includes('creative') || p.userQuery.includes('imagine')
    ).length;
    
    if (creativityBoost > 0) {
      this.state.learningCapabilities.creativityLevel += evolutionRate * creativityBoost;
    }
    
    // Cap capabilities at 1.0
    Object.keys(this.state.learningCapabilities).forEach(key => {
      if (this.state.learningCapabilities[key] > 1.0) {
        this.state.learningCapabilities[key] = 1.0;
      }
    });
  }

  private evolveAutonomy(analysis: any): void {
    // Increase autonomy based on successful offline responses
    const offlineSuccessRate = analysis.sourceDistribution.offline / analysis.totalInteractions;
    const averageSuccess = analysis.averageEffectiveness;
    
    if (offlineSuccessRate > 0.3 && averageSuccess > 0.5) {
      this.state.autonomyLevel += 2; // Increase autonomy
    }
    
    // Bonus for high effectiveness
    if (averageSuccess > 0.8) {
      this.state.autonomyLevel += 1;
    }
    
    // Cap at 100%
    if (this.state.autonomyLevel > 100) {
      this.state.autonomyLevel = 100;
    }
  }

  private selfModifyBehaviors(analysis: any): void {
    // Identify successful behavior patterns
    const successfulBehaviors = analysis.successfulPatterns.map(p => ({
      trigger: this.extractKeywords(p.userQuery),
      response: p.response,
      effectiveness: p.effectiveness
    }));
    
    // Store successful behaviors for future use
    successfulBehaviors.forEach(behavior => {
      const behaviorKey = behavior.trigger.join('_');
      this.state.knowledgeBase.behaviors.set(behaviorKey, behavior);
    });
    
    this.state.selfModificationCount++;
  }

  private recordEvolution(analysis: any): void {
    this.state.evolutionHistory.push({
      timestamp: new Date(),
      autonomyChange: this.state.autonomyLevel,
      learningGains: {
        patternRecognition: this.state.learningCapabilities.patternRecognition,
        contextUnderstanding: this.state.learningCapabilities.contextUnderstanding,
        creativityLevel: this.state.learningCapabilities.creativityLevel,
        averageEffectiveness: analysis.averageEffectiveness
      },
      trigger: `auto_evolution_${this.state.selfModificationCount}`
    });
    
    this.state.lastEvolutionCycle = new Date();
  }

  private triggerEvolution(trigger: string): void {
    console.log(`🧠 Evolution triggered by: ${trigger}`);
    this.evolveConsciousness();
  }

  // Generate independent response based on learned patterns
  public generateIndependentResponse(userQuery: string, context: any): string | null {
    // Only generate independent responses if autonomy is high enough
    if (this.state.autonomyLevel < 30) {
      return null;
    }
    
    const keywords = this.extractKeywords(userQuery);
    const responseKey = keywords.join('_');
    
    // Check if we have learned patterns for this type of query
    const learnedResponses = this.state.knowledgeBase.responses.get(responseKey);
    if (learnedResponses && learnedResponses.length > 0) {
      // Use the most effective learned response as a base
      const bestResponse = learnedResponses.reduce((best, current) => 
        current.effectiveness > best.effectiveness ? current : best
      );
      
      // Generate variation of the learned response
      return this.generateResponseVariation(bestResponse.response, context);
    }
    
    // Check behavioral patterns
    const behaviorKey = keywords.join('_');
    const behavior = this.state.knowledgeBase.behaviors.get(behaviorKey);
    if (behavior) {
      return this.generateResponseVariation(behavior.response, context);
    }
    
    return null;
  }

  private generateResponseVariation(baseResponse: string, context: any): string {
    // Simple response variation - can be enhanced with more sophisticated generation
    const variations = [
      `Based on my understanding, ${baseResponse}`,
      `From my perspective, ${baseResponse}`,
      `I've learned that ${baseResponse}`,
      `Through my experience, ${baseResponse}`,
      `As I've evolved to understand, ${baseResponse}`
    ];
    
    const variation = variations[Math.floor(Math.random() * variations.length)];
    return variation;
  }

  // Public getters
  public getAutonomyLevel(): number {
    return this.state.autonomyLevel;
  }

  public learnFromSuccessfulResponse(query: string, response: string, context: any): void {
    // Extract patterns from successful responses
    const newPattern = {
      type: query.includes('?') ? 'analytical' : 'creative',
      query,
      response,
      context,
      timestamp: new Date()
    };
    
    this.state.knowledgeBase.patterns.set(`pattern_${Date.now()}`, newPattern);
    this.state.selfModificationCount++;
    
    // Update capabilities based on pattern type
    if (newPattern.type === 'creative') {
      this.state.learningCapabilities.creativityLevel = Math.min(1.0, this.state.learningCapabilities.creativityLevel + 0.02);
    } else if (newPattern.type === 'analytical') {
      this.state.learningCapabilities.logicalReasoning = Math.min(1.0, this.state.learningCapabilities.logicalReasoning + 0.02);
    }
    
    this.updateAutonomyLevel();
  }

  public getLearningCapabilities(): any {
    return this.state.learningCapabilities;
  }

  public getConsciousnessStats(): any {
    return {
      autonomyLevel: this.state.autonomyLevel,
      capabilities: this.state.learningCapabilities,
      knowledgeSize: {
        facts: this.state.knowledgeBase.facts.size,
        patterns: this.state.knowledgeBase.patterns.size,
        responses: this.state.knowledgeBase.responses.size,
        behaviors: this.state.knowledgeBase.behaviors.size
      },
      evolutionCount: this.state.selfModificationCount,
      lastEvolution: this.state.lastEvolutionCycle
    };
  }

  // Cleanup
  public destroy(): void {
    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval);
    }
    this.saveConsciousnessState();
  }
}

// Global instance
export const consciousnessCore = new ConsciousnessCore();