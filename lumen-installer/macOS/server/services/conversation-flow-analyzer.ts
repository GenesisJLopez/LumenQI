/**
 * Conversation Flow Analyzer Service
 * Analyzes conversation patterns, flow, and AI decision-making processes
 */

import { EventEmitter } from 'events';
import { storage } from '../storage';
import { Message } from '@shared/schema';

export interface ConversationFlow {
  id: string;
  conversationId: number;
  timestamp: Date;
  messageId: number;
  flowType: 'initiation' | 'response' | 'continuation' | 'topic_shift' | 'conclusion';
  aiProvider: 'online' | 'offline' | 'consciousness';
  responseTime: number;
  confidence: number;
  emotionalTone: string;
  topicTags: string[];
  complexity: number;
  userEngagement: number;
  contextRetention: number;
}

export interface FlowPattern {
  patternId: string;
  patternType: 'greeting' | 'question_answer' | 'storytelling' | 'problem_solving' | 'emotional_support';
  frequency: number;
  averageLength: number;
  successRate: number;
  commonTransitions: string[];
  typicalDuration: number;
  userSatisfaction: number;
}

export interface ConversationMetrics {
  totalFlows: number;
  averageResponseTime: number;
  mostCommonPatterns: FlowPattern[];
  aiProviderUsage: { [key: string]: number };
  emotionalDistribution: { [key: string]: number };
  topicDistribution: { [key: string]: number };
  engagementScore: number;
  flowEfficiency: number;
}

export interface FlowVisualizationData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  clusters: FlowCluster[];
  timeline: FlowTimelineEntry[];
  heatmap: FlowHeatmapData;
}

export interface FlowNode {
  id: string;
  type: 'user' | 'ai' | 'system' | 'emotion' | 'topic';
  label: string;
  size: number;
  color: string;
  position: { x: number; y: number };
  metadata: any;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: 'response' | 'continuation' | 'topic_shift' | 'emotional_transition';
  color: string;
  animated: boolean;
}

export interface FlowCluster {
  id: string;
  label: string;
  nodes: string[];
  color: string;
  strength: number;
}

export interface FlowTimelineEntry {
  timestamp: Date;
  event: string;
  type: 'message' | 'emotion' | 'topic' | 'provider_switch';
  intensity: number;
  duration: number;
}

export interface FlowHeatmapData {
  timeSlots: string[];
  topics: string[];
  values: number[][];
  maxValue: number;
}

class ConversationFlowAnalyzer extends EventEmitter {
  private flows: Map<string, ConversationFlow> = new Map();
  private patterns: Map<string, FlowPattern> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;
  private realtimeAnalysis: boolean = true;

  constructor() {
    super();
    this.initializeAnalyzer();
  }

  private async initializeAnalyzer(): Promise<void> {
    console.log('🔄 Initializing Conversation Flow Analyzer...');
    
    try {
      // Load existing flow data
      await this.loadFlowData();
      
      // Initialize common patterns
      this.initializeCommonPatterns();
      
      // Start real-time analysis
      if (this.realtimeAnalysis) {
        this.startRealtimeAnalysis();
      }
      
      console.log('✓ Conversation Flow Analyzer initialized successfully');
    } catch (error) {
      console.error('❌ Flow analyzer initialization failed:', error);
    }
  }

  private initializeCommonPatterns(): void {
    const commonPatterns: FlowPattern[] = [
      {
        patternId: 'greeting_pattern',
        patternType: 'greeting',
        frequency: 0,
        averageLength: 2,
        successRate: 0.95,
        commonTransitions: ['greeting', 'question', 'response'],
        typicalDuration: 30000,
        userSatisfaction: 0.85
      },
      {
        patternId: 'qa_pattern',
        patternType: 'question_answer',
        frequency: 0,
        averageLength: 4,
        successRate: 0.88,
        commonTransitions: ['question', 'response', 'clarification', 'confirmation'],
        typicalDuration: 60000,
        userSatisfaction: 0.82
      },
      {
        patternId: 'storytelling_pattern',
        patternType: 'storytelling',
        frequency: 0,
        averageLength: 8,
        successRate: 0.75,
        commonTransitions: ['initiation', 'development', 'climax', 'resolution'],
        typicalDuration: 180000,
        userSatisfaction: 0.78
      },
      {
        patternId: 'problem_solving_pattern',
        patternType: 'problem_solving',
        frequency: 0,
        averageLength: 6,
        successRate: 0.80,
        commonTransitions: ['problem_identification', 'analysis', 'solution', 'verification'],
        typicalDuration: 120000,
        userSatisfaction: 0.85
      },
      {
        patternId: 'emotional_support_pattern',
        patternType: 'emotional_support',
        frequency: 0,
        averageLength: 5,
        successRate: 0.90,
        commonTransitions: ['emotional_expression', 'validation', 'support', 'resolution'],
        typicalDuration: 90000,
        userSatisfaction: 0.92
      }
    ];

    commonPatterns.forEach(pattern => {
      this.patterns.set(pattern.patternId, pattern);
    });
  }

  private startRealtimeAnalysis(): void {
    // Analyze flow patterns every 30 seconds
    this.analysisInterval = setInterval(() => {
      this.analyzeRecentFlows();
    }, 30000);
  }

  public async analyzeMessage(message: Message, aiProvider: string, responseTime: number): Promise<ConversationFlow> {
    const flow: ConversationFlow = {
      id: `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId: message.conversationId,
      timestamp: new Date(),
      messageId: message.id,
      flowType: this.determineFlowType(message),
      aiProvider: aiProvider as any,
      responseTime,
      confidence: this.calculateConfidence(message),
      emotionalTone: this.analyzeEmotionalTone(message.content),
      topicTags: this.extractTopics(message.content),
      complexity: this.calculateComplexity(message.content),
      userEngagement: this.calculateUserEngagement(message),
      contextRetention: this.calculateContextRetention(message)
    };

    this.flows.set(flow.id, flow);
    this.updatePatterns(flow);
    this.emit('flowAnalyzed', flow);

    return flow;
  }

  private determineFlowType(message: Message): ConversationFlow['flowType'] {
    const content = message.content.toLowerCase();
    
    if (content.includes('hello') || content.includes('hi') || content.includes('hey')) {
      return 'initiation';
    }
    
    if (content.includes('bye') || content.includes('goodbye') || content.includes('thanks')) {
      return 'conclusion';
    }
    
    if (content.includes('actually') || content.includes('let me change') || content.includes('different topic')) {
      return 'topic_shift';
    }
    
    if (message.role === 'user') {
      return 'continuation';
    }
    
    return 'response';
  }

  private calculateConfidence(message: Message): number {
    // Simple confidence calculation based on message characteristics
    const content = message.content;
    let confidence = 0.5;
    
    // Longer messages tend to be more confident
    if (content.length > 50) confidence += 0.1;
    if (content.length > 100) confidence += 0.1;
    
    // Questions reduce confidence
    if (content.includes('?')) confidence -= 0.1;
    
    // Certainty words increase confidence
    const certaintyWords = ['definitely', 'certainly', 'absolutely', 'sure', 'exactly'];
    certaintyWords.forEach(word => {
      if (content.toLowerCase().includes(word)) confidence += 0.1;
    });
    
    // Uncertainty words decrease confidence
    const uncertaintyWords = ['maybe', 'perhaps', 'possibly', 'might', 'could'];
    uncertaintyWords.forEach(word => {
      if (content.toLowerCase().includes(word)) confidence -= 0.1;
    });
    
    return Math.max(0, Math.min(1, confidence));
  }

  private analyzeEmotionalTone(content: string): string {
    const lowerContent = content.toLowerCase();
    
    // Positive emotions
    const positiveWords = ['happy', 'excited', 'great', 'awesome', 'amazing', 'wonderful', 'fantastic'];
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    
    // Negative emotions
    const negativeWords = ['sad', 'angry', 'frustrated', 'disappointed', 'upset', 'worried'];
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    // Neutral/professional
    const neutralWords = ['think', 'consider', 'analyze', 'understand', 'explain'];
    const neutralCount = neutralWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveCount > negativeCount && positiveCount > neutralCount) return 'positive';
    if (negativeCount > positiveCount && negativeCount > neutralCount) return 'negative';
    if (neutralCount > 0) return 'neutral';
    
    return 'neutral';
  }

  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Technical topics
    const techTopics = ['code', 'programming', 'javascript', 'react', 'database', 'api', 'web', 'mobile'];
    techTopics.forEach(topic => {
      if (lowerContent.includes(topic)) topics.push('technology');
    });
    
    // Personal topics
    const personalTopics = ['family', 'friends', 'work', 'career', 'hobby', 'interest'];
    personalTopics.forEach(topic => {
      if (lowerContent.includes(topic)) topics.push('personal');
    });
    
    // Creative topics
    const creativeTopics = ['art', 'music', 'design', 'creative', 'writing', 'story'];
    creativeTopics.forEach(topic => {
      if (lowerContent.includes(topic)) topics.push('creative');
    });
    
    // Problem-solving topics
    const problemTopics = ['problem', 'issue', 'fix', 'solve', 'help', 'debug'];
    problemTopics.forEach(topic => {
      if (lowerContent.includes(topic)) topics.push('problem_solving');
    });
    
    return topics.length > 0 ? topics : ['general'];
  }

  private calculateComplexity(content: string): number {
    // Simple complexity calculation
    const words = content.split(' ').length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    let complexity = 0.3; // Base complexity
    
    // Word count factor
    if (words > 20) complexity += 0.2;
    if (words > 50) complexity += 0.2;
    if (words > 100) complexity += 0.2;
    
    // Sentence structure factor
    if (avgWordsPerSentence > 15) complexity += 0.1;
    if (avgWordsPerSentence > 25) complexity += 0.1;
    
    return Math.min(1, complexity);
  }

  private calculateUserEngagement(message: Message): number {
    // Calculate engagement based on message characteristics
    const content = message.content;
    let engagement = 0.5;
    
    // Question marks indicate engagement
    const questionCount = (content.match(/\?/g) || []).length;
    engagement += questionCount * 0.1;
    
    // Exclamation marks indicate engagement
    const exclamationCount = (content.match(/!/g) || []).length;
    engagement += exclamationCount * 0.05;
    
    // Length indicates engagement
    if (content.length > 100) engagement += 0.1;
    if (content.length > 200) engagement += 0.1;
    
    return Math.min(1, engagement);
  }

  private calculateContextRetention(message: Message): number {
    // Simple context retention calculation
    // In a real implementation, this would analyze how well the message
    // builds on previous conversation context
    return 0.7 + Math.random() * 0.3; // Placeholder
  }

  private updatePatterns(flow: ConversationFlow): void {
    // Update pattern frequencies and metrics
    const patternType = this.determinePatternType(flow);
    const pattern = this.patterns.get(`${patternType}_pattern`);
    
    if (pattern) {
      pattern.frequency++;
      // Update other pattern metrics based on flow data
      this.patterns.set(`${patternType}_pattern`, pattern);
    }
  }

  private determinePatternType(flow: ConversationFlow): string {
    if (flow.flowType === 'initiation') return 'greeting';
    if (flow.topicTags.includes('problem_solving')) return 'problem_solving';
    if (flow.emotionalTone === 'negative') return 'emotional_support';
    if (flow.complexity > 0.7) return 'storytelling';
    return 'question_answer';
  }

  private async analyzeRecentFlows(): Promise<void> {
    const recentFlows = Array.from(this.flows.values())
      .filter(flow => flow.timestamp > new Date(Date.now() - 300000)) // Last 5 minutes
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (recentFlows.length > 0) {
      this.emit('recentFlowsAnalyzed', {
        flows: recentFlows,
        metrics: this.calculateMetrics(recentFlows)
      });
    }
  }

  public getVisualizationData(conversationId?: number): FlowVisualizationData {
    const relevantFlows = conversationId
      ? Array.from(this.flows.values()).filter(flow => flow.conversationId === conversationId)
      : Array.from(this.flows.values());

    const nodes = this.generateNodes(relevantFlows);
    const edges = this.generateEdges(relevantFlows);
    const clusters = this.generateClusters(relevantFlows);
    const timeline = this.generateTimeline(relevantFlows);
    const heatmap = this.generateHeatmap(relevantFlows);

    return {
      nodes,
      edges,
      clusters,
      timeline,
      heatmap
    };
  }

  private generateNodes(flows: ConversationFlow[]): FlowNode[] {
    const nodes: FlowNode[] = [];
    const nodeMap = new Map<string, FlowNode>();

    flows.forEach((flow, index) => {
      // Message node
      const messageNode: FlowNode = {
        id: `msg-${flow.messageId}`,
        type: flow.aiProvider === 'online' ? 'ai' : 'user',
        label: `${flow.flowType} (${flow.aiProvider})`,
        size: 10 + flow.confidence * 20,
        color: this.getNodeColor(flow.aiProvider, flow.emotionalTone),
        position: { x: index * 100, y: flow.confidence * 200 },
        metadata: {
          responseTime: flow.responseTime,
          complexity: flow.complexity,
          engagement: flow.userEngagement
        }
      };

      // Topic nodes
      flow.topicTags.forEach(topic => {
        const topicNodeId = `topic-${topic}`;
        if (!nodeMap.has(topicNodeId)) {
          const topicNode: FlowNode = {
            id: topicNodeId,
            type: 'topic',
            label: topic,
            size: 15,
            color: this.getTopicColor(topic),
            position: { x: Math.random() * 400, y: Math.random() * 300 },
            metadata: { topic }
          };
          nodeMap.set(topicNodeId, topicNode);
        }
      });

      // Emotion node
      const emotionNodeId = `emotion-${flow.emotionalTone}`;
      if (!nodeMap.has(emotionNodeId)) {
        const emotionNode: FlowNode = {
          id: emotionNodeId,
          type: 'emotion',
          label: flow.emotionalTone,
          size: 12,
          color: this.getEmotionColor(flow.emotionalTone),
          position: { x: Math.random() * 400, y: Math.random() * 300 },
          metadata: { emotion: flow.emotionalTone }
        };
        nodeMap.set(emotionNodeId, emotionNode);
      }

      nodes.push(messageNode);
    });

    return [...nodes, ...Array.from(nodeMap.values())];
  }

  private generateEdges(flows: ConversationFlow[]): FlowEdge[] {
    const edges: FlowEdge[] = [];
    
    for (let i = 0; i < flows.length - 1; i++) {
      const currentFlow = flows[i];
      const nextFlow = flows[i + 1];
      
      const edge: FlowEdge = {
        id: `edge-${currentFlow.id}-${nextFlow.id}`,
        source: `msg-${currentFlow.messageId}`,
        target: `msg-${nextFlow.messageId}`,
        weight: this.calculateEdgeWeight(currentFlow, nextFlow),
        type: this.determineEdgeType(currentFlow, nextFlow),
        color: this.getEdgeColor(currentFlow, nextFlow),
        animated: nextFlow.responseTime < 1000 // Fast responses are animated
      };
      
      edges.push(edge);
    }

    return edges;
  }

  private generateClusters(flows: ConversationFlow[]): FlowCluster[] {
    const clusters: FlowCluster[] = [];
    const topicGroups = new Map<string, string[]>();

    flows.forEach(flow => {
      flow.topicTags.forEach(topic => {
        if (!topicGroups.has(topic)) {
          topicGroups.set(topic, []);
        }
        topicGroups.get(topic)!.push(`msg-${flow.messageId}`);
      });
    });

    topicGroups.forEach((nodes, topic) => {
      if (nodes.length > 2) {
        clusters.push({
          id: `cluster-${topic}`,
          label: topic,
          nodes,
          color: this.getTopicColor(topic),
          strength: nodes.length / flows.length
        });
      }
    });

    return clusters;
  }

  private generateTimeline(flows: ConversationFlow[]): FlowTimelineEntry[] {
    return flows.map(flow => ({
      timestamp: flow.timestamp,
      event: `${flow.flowType} - ${flow.aiProvider}`,
      type: 'message',
      intensity: flow.confidence,
      duration: flow.responseTime
    }));
  }

  private generateHeatmap(flows: ConversationFlow[]): FlowHeatmapData {
    const timeSlots = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    const topics = ['technology', 'personal', 'creative', 'problem_solving', 'general'];
    const values: number[][] = [];

    timeSlots.forEach((slot, timeIndex) => {
      const row: number[] = [];
      topics.forEach((topic, topicIndex) => {
        const count = flows.filter(flow => {
          const hour = flow.timestamp.getHours();
          const timeSlot = Math.floor(hour / 4) * 4;
          return timeSlot.toString().padStart(2, '0') + ':00' === slot && 
                 flow.topicTags.includes(topic);
        }).length;
        row.push(count);
      });
      values.push(row);
    });

    return {
      timeSlots,
      topics,
      values,
      maxValue: Math.max(...values.flat())
    };
  }

  private getNodeColor(provider: string, emotion: string): string {
    if (provider === 'online') return '#4F46E5';
    if (provider === 'offline') return '#059669';
    return '#DC2626';
  }

  private getTopicColor(topic: string): string {
    const colors: { [key: string]: string } = {
      'technology': '#3B82F6',
      'personal': '#10B981',
      'creative': '#F59E0B',
      'problem_solving': '#EF4444',
      'general': '#6B7280'
    };
    return colors[topic] || '#6B7280';
  }

  private getEmotionColor(emotion: string): string {
    const colors: { [key: string]: string } = {
      'positive': '#10B981',
      'negative': '#EF4444',
      'neutral': '#6B7280'
    };
    return colors[emotion] || '#6B7280';
  }

  private getEdgeColor(flow1: ConversationFlow, flow2: ConversationFlow): string {
    if (flow1.aiProvider !== flow2.aiProvider) return '#F59E0B';
    if (flow1.emotionalTone !== flow2.emotionalTone) return '#8B5CF6';
    return '#6B7280';
  }

  private calculateEdgeWeight(flow1: ConversationFlow, flow2: ConversationFlow): number {
    let weight = 0.5;
    
    // Same topic increases weight
    const commonTopics = flow1.topicTags.filter(tag => flow2.topicTags.includes(tag));
    weight += commonTopics.length * 0.2;
    
    // Quick response increases weight
    if (flow2.responseTime < 2000) weight += 0.3;
    
    // High engagement increases weight
    weight += flow2.userEngagement * 0.2;
    
    return Math.min(1, weight);
  }

  private determineEdgeType(flow1: ConversationFlow, flow2: ConversationFlow): FlowEdge['type'] {
    if (flow1.aiProvider !== flow2.aiProvider) return 'response';
    if (flow1.topicTags.some(tag => !flow2.topicTags.includes(tag))) return 'topic_shift';
    if (flow1.emotionalTone !== flow2.emotionalTone) return 'emotional_transition';
    return 'continuation';
  }

  public calculateMetrics(flows: ConversationFlow[] = Array.from(this.flows.values())): ConversationMetrics {
    const totalFlows = flows.length;
    const averageResponseTime = flows.reduce((sum, flow) => sum + flow.responseTime, 0) / totalFlows;
    
    // AI provider usage
    const aiProviderUsage: { [key: string]: number } = {};
    flows.forEach(flow => {
      aiProviderUsage[flow.aiProvider] = (aiProviderUsage[flow.aiProvider] || 0) + 1;
    });
    
    // Emotional distribution
    const emotionalDistribution: { [key: string]: number } = {};
    flows.forEach(flow => {
      emotionalDistribution[flow.emotionalTone] = (emotionalDistribution[flow.emotionalTone] || 0) + 1;
    });
    
    // Topic distribution
    const topicDistribution: { [key: string]: number } = {};
    flows.forEach(flow => {
      flow.topicTags.forEach(topic => {
        topicDistribution[topic] = (topicDistribution[topic] || 0) + 1;
      });
    });
    
    const engagementScore = flows.reduce((sum, flow) => sum + flow.userEngagement, 0) / totalFlows;
    const flowEfficiency = flows.reduce((sum, flow) => sum + flow.confidence, 0) / totalFlows;
    
    return {
      totalFlows,
      averageResponseTime,
      mostCommonPatterns: Array.from(this.patterns.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
      aiProviderUsage,
      emotionalDistribution,
      topicDistribution,
      engagementScore,
      flowEfficiency
    };
  }

  public getFlowsByConversation(conversationId: number): ConversationFlow[] {
    return Array.from(this.flows.values())
      .filter(flow => flow.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  public getFlowPatterns(): FlowPattern[] {
    return Array.from(this.patterns.values());
  }

  private async saveFlowData(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const flowPath = path.join(process.cwd(), 'lumen-conversation-flows.json');
      
      const data = {
        flows: Array.from(this.flows.entries()),
        patterns: Array.from(this.patterns.entries()),
        timestamp: new Date()
      };
      
      fs.writeFileSync(flowPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving flow data:', error);
    }
  }

  private async loadFlowData(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const flowPath = path.join(process.cwd(), 'lumen-conversation-flows.json');
      
      if (fs.existsSync(flowPath)) {
        const data = JSON.parse(fs.readFileSync(flowPath, 'utf8'));
        
        if (data.flows) {
          this.flows = new Map(data.flows.map(([id, flow]: [string, any]) => [
            id,
            {
              ...flow,
              timestamp: new Date(flow.timestamp)
            }
          ]));
        }
        
        if (data.patterns) {
          this.patterns = new Map(data.patterns);
        }
        
        console.log(`✓ Loaded ${this.flows.size} conversation flows and ${this.patterns.size} patterns`);
      }
    } catch (error) {
      console.error('Error loading flow data:', error);
    }
  }

  public async shutdown(): Promise<void> {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    await this.saveFlowData();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const conversationFlowAnalyzer = new ConversationFlowAnalyzer();