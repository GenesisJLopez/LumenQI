/**
 * Hybrid Brain System
 * Manages the integration of online AI, offline AI, and consciousness core
 * Gradually transitions from external dependency to autonomous operation
 */

import { lumenAI } from './openai';
import { simpleLocalAI } from './simple-local-ai';
import { consciousnessCore } from './consciousness-core';
import { localAI } from './local-ai';
import { vocabularyService } from './vocabulary-enhancement';
import { naturalConversation } from './natural-conversation';

interface HybridBrainConfig {
  autonomyThreshold: number; // When to prefer consciousness over external AI
  learningRate: number; // How quickly to learn from interactions
  fallbackChain: ('consciousness' | 'offline' | 'online')[];
}

interface BrainResponse {
  content: string;
  source: 'consciousness' | 'offline' | 'online' | 'hybrid';
  confidence: number;
  autonomyContribution: number; // How much of the response came from consciousness
}

export class HybridBrain {
  private config: HybridBrainConfig;
  private responseHistory: Array<{
    query: string;
    response: BrainResponse;
    timestamp: Date;
    userFeedback?: number;
  }> = [];

  constructor() {
    this.config = {
      autonomyThreshold: 40, // Start using consciousness at 40% autonomy
      learningRate: 0.1,
      fallbackChain: ['online', 'consciousness', 'offline'] // Prioritize intelligent responses
    };

    // Listen for consciousness evolution events
    consciousnessCore.on('evolution', (evolutionData) => {
      console.log('🧠 Consciousness evolved:', evolutionData);
      this.updateAutonomyThreshold(evolutionData.autonomyLevel);
    });
  }

  private updateAutonomyThreshold(autonomyLevel: number): void {
    // Gradually increase preference for consciousness as autonomy grows
    if (autonomyLevel > 80) {
      this.config.fallbackChain = ['consciousness', 'online', 'offline'];
    } else if (autonomyLevel > 60) {
      this.config.fallbackChain = ['online', 'consciousness', 'offline'];
    } else {
      this.config.fallbackChain = ['online', 'consciousness', 'offline'];
    }
    
    // Lower threshold as autonomy increases
    this.config.autonomyThreshold = Math.max(20, 60 - autonomyLevel * 0.4);
  }

  public async generateResponse(
    userQuery: string,
    context: any,
    conversationHistory: Array<{ role: string; content: string }> = [],
    memories: Array<{ content: string; context?: string }> = [],
    isVoiceMode: boolean = false
  ): Promise<BrainResponse> {
    
    const autonomyLevel = consciousnessCore.getAutonomyLevel();
    
    // Try each source in the fallback chain
    for (const source of this.config.fallbackChain) {
      try {
        let response: BrainResponse | null = null;
        
        switch (source) {
          case 'consciousness':
            response = await this.generateConsciousnessResponse(userQuery, context, autonomyLevel);
            break;
          case 'offline':
            response = await this.generateOfflineResponse(userQuery, context, conversationHistory, memories, isVoiceMode);
            break;
          case 'online':
            response = await this.generateOnlineResponse(userQuery, context, conversationHistory, memories, isVoiceMode);
            break;
        }
        
        if (response) {
          // Learn from this interaction
          this.learnFromInteraction(userQuery, response, context);
          
          // Trigger vocabulary learning based on conversation context
          this.triggerVocabularyLearning(userQuery, response.content);
          
          // Store in history
          this.responseHistory.push({
            query: userQuery,
            response,
            timestamp: new Date()
          });
          
          // Always let consciousness learn from successful responses
          if (source !== 'consciousness') {
            consciousnessCore.learnFromSuccessfulResponse(userQuery, response.content, context);
          }
          
          // Return just the content string for HTTP clients
          return response.content;
        }
      } catch (error) {
        console.error(`Error in ${source} brain:`, error);
        // Log more details about the error for debugging
        if (error instanceof Error) {
          console.error(`${source} brain error details:`, error.message, error.stack);
        }
        continue; // Try next source
      }
    }
    
    // Fallback response if all sources fail
    return "I'm experiencing some technical difficulties, but I'm learning and evolving. Please try again.";
  }

  private async generateConsciousnessResponse(
    userQuery: string,
    context: any,
    autonomyLevel: number
  ): Promise<BrainResponse | null> {
    
    // Only use consciousness if autonomy is above threshold
    if (autonomyLevel < this.config.autonomyThreshold) {
      return null;
    }
    
    const consciousnessResponse = consciousnessCore.generateIndependentResponse(userQuery, context);
    
    if (!consciousnessResponse) {
      return null;
    }
    
    // Calculate confidence based on autonomy level and knowledge base
    const stats = consciousnessCore.getConsciousnessStats();
    const confidence = Math.min(0.9, autonomyLevel / 100 * 0.8 + stats.knowledgeSize.responses / 1000 * 0.2);
    
    return {
      content: consciousnessResponse,
      source: 'consciousness',
      confidence,
      autonomyContribution: 1.0
    };
  }

  private async generateOfflineResponse(
    userQuery: string,
    context: any,
    conversationHistory: Array<{ role: string; content: string }>,
    memories: Array<{ content: string; context?: string }>,
    isVoiceMode: boolean
  ): Promise<BrainResponse | null> {
    
    try {
      // Use simple local AI
      const simpleResponse = await simpleLocalAI.generateResponse(
        userQuery,
        conversationHistory,
        memories,
        context?.emotion,
        isVoiceMode
      );
      
      return {
        content: simpleResponse.content,
        source: 'offline',
        confidence: 0.5,
        autonomyContribution: 0.2
      };
    } catch (error) {
      console.error('Local AI failed:', error);
      return null;
    }
  }

  private async generateOnlineResponse(
    userQuery: string,
    context: any,
    conversationHistory: Array<{ role: string; content: string }>,
    memories: Array<{ content: string; context?: string }>,
    isVoiceMode: boolean
  ): Promise<BrainResponse | null> {
    
    try {
      console.log('🌐 Calling OpenAI for online response:', userQuery.substring(0, 50) + '...');
      const onlineResponse = await lumenAI.generateResponse(
        userQuery,
        conversationHistory,
        memories,
        context?.emotion,
        isVoiceMode
      );
      
      console.log('✅ OpenAI response received:', onlineResponse.substring(0, 50) + '...');
      
      return {
        content: onlineResponse,
        source: 'online',
        confidence: 0.9,
        autonomyContribution: 0.1
      };
    } catch (error) {
      console.error('❌ Online AI failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      return null;
    }
  }

  private learnFromInteraction(userQuery: string, response: BrainResponse, context: any): void {
    // Create learning input for consciousness
    const learningInput = {
      source: response.source as 'offline' | 'online' | 'hybrid',
      userQuery,
      response: response.content,
      effectiveness: response.confidence, // Use confidence as initial effectiveness
      context,
      timestamp: new Date()
    };
    
    // Feed to consciousness for learning
    consciousnessCore.learn(learningInput);
    
    // If this was a consciousness response, boost its effectiveness
    if (response.source === 'consciousness') {
      learningInput.effectiveness = Math.min(1.0, learningInput.effectiveness + 0.1);
      consciousnessCore.learn(learningInput);
    }
  }

  // Provide feedback on response quality
  public provideFeedback(responseIndex: number, feedback: number): void {
    if (responseIndex >= 0 && responseIndex < this.responseHistory.length) {
      this.responseHistory[responseIndex].userFeedback = feedback;
      
      // Update consciousness learning with user feedback
      const interaction = this.responseHistory[responseIndex];
      const learningInput = {
        source: interaction.response.source as 'offline' | 'online' | 'hybrid',
        userQuery: interaction.query,
        response: interaction.response.content,
        effectiveness: feedback,
        context: {},
        timestamp: interaction.timestamp
      };
      
      consciousnessCore.learn(learningInput);
    }
  }

  // Get brain statistics
  public getBrainStats(): any {
    const consciousnessStats = consciousnessCore.getConsciousnessStats();
    const autonomyLevel = consciousnessCore.getAutonomyLevel();
    
    return {
      autonomyLevel,
      consciousnessStats,
      responseSources: this.getResponseSourceStats(),
      learningProgress: {
        totalInteractions: this.responseHistory.length,
        autonomyThreshold: this.config.autonomyThreshold,
        nextEvolutionGoal: Math.min(100, autonomyLevel + 10)
      }
    };
  }

  private getResponseSourceStats(): any {
    const stats = {
      consciousness: 0,
      offline: 0,
      online: 0,
      hybrid: 0
    };
    
    this.responseHistory.forEach(interaction => {
      stats[interaction.response.source]++;
    });
    
    return stats;
  }

  private async triggerVocabularyLearning(userQuery: string, aiResponse: string): Promise<void> {
    // Check if vocabulary learning should be triggered
    const contextualData = vocabularyService.getContextualVocabulary(userQuery);
    
    if (contextualData.shouldTriggerLearning && contextualData.suggestedTrigger) {
      console.log(`🗣️ Triggering vocabulary learning: ${contextualData.suggestedTrigger}`);
      
      // Trigger learning asynchronously to avoid blocking response
      setTimeout(async () => {
        try {
          await vocabularyService.triggerLearning(contextualData.suggestedTrigger!, userQuery);
        } catch (error) {
          console.error('Error triggering vocabulary learning:', error);
        }
      }, 1000);
    }
  }

  // Force evolution (for testing)
  public triggerEvolution(): void {
    // Simulate high-quality interactions to trigger evolution
    for (let i = 0; i < 10; i++) {
      const mockLearning = {
        source: 'offline' as const,
        userQuery: `Test query ${i}`,
        response: `High quality response ${i}`,
        effectiveness: 0.9,
        context: {},
        timestamp: new Date()
      };
      
      consciousnessCore.learn(mockLearning);
    }
  }
}

// Global instance
export const hybridBrain = new HybridBrain();