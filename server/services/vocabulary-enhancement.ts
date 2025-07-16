/**
 * Vocabulary Enhancement System for Lumen QI
 * Integrates modern slang, pop culture references, and social media trends
 */

import fs from 'fs';
import path from 'path';
import { PerplexitySearchService } from './perplexity-search';

export interface SlangEntry {
  term: string;
  definition: string;
  usage: string;
  popularity: number;
  source: string;
  category: 'slang' | 'expression' | 'acronym' | 'phrase';
  lastUpdated: Date;
}

export interface PopCultureReference {
  title: string;
  type: 'movie' | 'tv' | 'music' | 'meme' | 'viral' | 'celebrity';
  description: string;
  relevance: number;
  keywords: string[];
  lastUpdated: Date;
}

export interface SocialTrend {
  hashtag: string;
  platform: 'twitter' | 'tiktok' | 'instagram' | 'reddit' | 'general';
  description: string;
  trendingScore: number;
  relatedTerms: string[];
  lastUpdated: Date;
}

export interface VocabularyData {
  slang: SlangEntry[];
  popCulture: PopCultureReference[];
  socialTrends: SocialTrend[];
  lastUpdate: Date;
}

export class VocabularyEnhancementService {
  private static instance: VocabularyEnhancementService;
  private vocabularyPath: string;
  private vocabularyData: VocabularyData;
  private perplexityService: PerplexitySearchService;

  private constructor() {
    this.vocabularyPath = path.join(process.cwd(), 'lumen-vocabulary.json');
    this.perplexityService = new PerplexitySearchService();
    this.vocabularyData = this.loadVocabularyData();
  }

  static getInstance(): VocabularyEnhancementService {
    if (!VocabularyEnhancementService.instance) {
      VocabularyEnhancementService.instance = new VocabularyEnhancementService();
    }
    return VocabularyEnhancementService.instance;
  }

  private loadVocabularyData(): VocabularyData {
    try {
      if (fs.existsSync(this.vocabularyPath)) {
        const data = JSON.parse(fs.readFileSync(this.vocabularyPath, 'utf8'));
        return {
          slang: data.slang || [],
          popCulture: data.popCulture || [],
          socialTrends: data.socialTrends || [],
          lastUpdate: new Date(data.lastUpdate || Date.now())
        };
      }
    } catch (error) {
      console.error('Error loading vocabulary data:', error);
    }

    return {
      slang: [],
      popCulture: [],
      socialTrends: [],
      lastUpdate: new Date()
    };
  }

  private saveVocabularyData(): void {
    try {
      fs.writeFileSync(this.vocabularyPath, JSON.stringify(this.vocabularyData, null, 2));
    } catch (error) {
      console.error('Error saving vocabulary data:', error);
    }
  }

  async updateSlangDatabase(): Promise<void> {
    console.log('🗣️ Updating slang database...');
    
    try {
      // Get current trending slang from web search
      const searchResults = await this.perplexityService.searchWeb(
        'What are the most popular slang terms and expressions trending on social media in 2025? Include definitions and usage examples.',
        {
          searchRecencyFilter: 'day',
          maxTokens: 1000
        }
      );

      const response = searchResults.choices[0].message.content;
      
      // Parse and extract slang terms from the response
      const newSlangEntries = this.parseSlangFromResponse(response);
      
      // Update existing entries and add new ones
      this.vocabularyData.slang = this.mergeSlangEntries(this.vocabularyData.slang, newSlangEntries);
      
      console.log(`✓ Added ${newSlangEntries.length} new slang terms`);
    } catch (error) {
      console.error('Error updating slang database:', error);
    }
  }

  async updatePopCultureReferences(): Promise<void> {
    console.log('🎬 Updating pop culture references...');
    
    try {
      // Get trending entertainment and pop culture
      const entertainmentResults = await this.perplexityService.searchWeb(
        'What are the most popular movies, TV shows, music, and viral memes trending right now in 2025? Include current celebrities and internet culture.',
        {
          searchRecencyFilter: 'day',
          maxTokens: 1000
        }
      );

      const response = entertainmentResults.choices[0].message.content;
      
      // Parse and extract pop culture references
      const newPopCultureRefs = this.parsePopCultureFromResponse(response);
      
      // Update existing references and add new ones
      this.vocabularyData.popCulture = this.mergePopCultureRefs(this.vocabularyData.popCulture, newPopCultureRefs);
      
      console.log(`✓ Added ${newPopCultureRefs.length} new pop culture references`);
    } catch (error) {
      console.error('Error updating pop culture references:', error);
    }
  }

  async updateSocialTrends(): Promise<void> {
    console.log('📱 Updating social media trends...');
    
    try {
      // Get current social media trends
      const trendsResults = await this.perplexityService.searchWeb(
        'What are the top trending hashtags and topics on Twitter, TikTok, and Instagram today? Include viral challenges and social media buzzwords.',
        {
          searchRecencyFilter: 'hour',
          maxTokens: 800
        }
      );

      const response = trendsResults.choices[0].message.content;
      
      // Parse and extract social trends
      const newSocialTrends = this.parseSocialTrendsFromResponse(response);
      
      // Update existing trends and add new ones
      this.vocabularyData.socialTrends = this.mergeSocialTrends(this.vocabularyData.socialTrends, newSocialTrends);
      
      console.log(`✓ Added ${newSocialTrends.length} new social trends`);
    } catch (error) {
      console.error('Error updating social trends:', error);
    }
  }

  private parseSlangFromResponse(response: string): SlangEntry[] {
    const entries: SlangEntry[] = [];
    
    // Enhanced slang parsing with better patterns
    const slangPatterns = [
      /(\w+)\s*[-–—]\s*(.+?)(?=\n|$)/g,
      /"([^"]+)"\s*[-–—]\s*(.+?)(?=\n|$)/g,
      /(\w+):\s*(.+?)(?=\n|$)/g,
      /(\w+)\s*means\s*(.+?)(?=\n|$)/gi,
      /(\w+)\s*is\s*used\s*to\s*(.+?)(?=\n|$)/gi,
      /(\w+)\s*refers\s*to\s*(.+?)(?=\n|$)/gi
    ];

    // Common slang terms to prioritize
    const commonSlangTerms = [
      'slay', 'periodt', 'no cap', 'bet', 'fire', 'lit', 'vibe', 'drip', 'flex', 'stan',
      'ship', 'tea', 'ghost', 'finsta', 'glow up', 'lowkey', 'highkey', 'sus', 'bussin',
      'slaps', 'hits different', 'main character', 'touch grass', 'ratio', 'based'
    ];

    slangPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const term = match[1].trim();
        const definition = match[2].trim();
        
        if (term.length > 1 && definition.length > 5) {
          const popularity = commonSlangTerms.includes(term.toLowerCase()) ? 0.9 : 0.7;
          
          entries.push({
            term,
            definition,
            usage: `"${term}" - ${definition}`,
            popularity,
            source: 'web_search',
            category: this.categorizeSlang(term, definition),
            lastUpdated: new Date()
          });
        }
      }
    });

    return entries;
  }

  private categorizeSlang(term: string, definition: string): 'slang' | 'expression' | 'acronym' | 'phrase' {
    const lowerTerm = term.toLowerCase();
    const lowerDef = definition.toLowerCase();
    
    if (lowerTerm.length <= 3 && lowerTerm.toUpperCase() === lowerTerm) return 'acronym';
    if (lowerTerm.includes(' ') || lowerTerm.includes('-')) return 'phrase';
    if (lowerDef.includes('expression') || lowerDef.includes('saying')) return 'expression';
    return 'slang';
  }

  private parsePopCultureFromResponse(response: string): PopCultureReference[] {
    const references: PopCultureReference[] = [];
    
    // Extract pop culture references using patterns
    const popCulturePatterns = [
      /(movie|film|show|series|album|song|meme|viral|celebrity)\s*[:\-–—]\s*([^.\n]+)/gi,
      /"([^"]+)"\s*(movie|film|show|series|album|song|meme)/gi
    ];

    popCulturePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const title = match[2] || match[1];
        const type = (match[1] || match[2]).toLowerCase();
        
        if (title && title.length > 2) {
          references.push({
            title: title.trim(),
            type: this.categorizePopCulture(type),
            description: `Trending ${type}: ${title}`,
            relevance: 0.8,
            keywords: [title.toLowerCase()],
            lastUpdated: new Date()
          });
        }
      }
    });

    return references;
  }

  private parseSocialTrendsFromResponse(response: string): SocialTrend[] {
    const trends: SocialTrend[] = [];
    
    // Extract hashtags and trends
    const hashtagPattern = /#(\w+)/g;
    const trendPattern = /trending\s*[:\-–—]\s*([^.\n]+)/gi;

    let match;
    while ((match = hashtagPattern.exec(response)) !== null) {
      const hashtag = match[1];
      trends.push({
        hashtag: `#${hashtag}`,
        platform: 'general',
        description: `Trending hashtag: #${hashtag}`,
        trendingScore: 0.8,
        relatedTerms: [hashtag.toLowerCase()],
        lastUpdated: new Date()
      });
    }

    while ((match = trendPattern.exec(response)) !== null) {
      const trendText = match[1].trim();
      trends.push({
        hashtag: trendText,
        platform: 'general',
        description: `Trending topic: ${trendText}`,
        trendingScore: 0.7,
        relatedTerms: trendText.toLowerCase().split(' '),
        lastUpdated: new Date()
      });
    }

    return trends;
  }

  private categorizePopCulture(type: string): 'movie' | 'tv' | 'music' | 'meme' | 'viral' | 'celebrity' {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('movie') || lowerType.includes('film')) return 'movie';
    if (lowerType.includes('show') || lowerType.includes('series')) return 'tv';
    if (lowerType.includes('song') || lowerType.includes('album') || lowerType.includes('music')) return 'music';
    if (lowerType.includes('meme')) return 'meme';
    if (lowerType.includes('viral')) return 'viral';
    if (lowerType.includes('celebrity')) return 'celebrity';
    return 'viral';
  }

  private mergeSlangEntries(existing: SlangEntry[], newEntries: SlangEntry[]): SlangEntry[] {
    const merged = [...existing];
    
    newEntries.forEach(newEntry => {
      const existingIndex = merged.findIndex(e => e.term.toLowerCase() === newEntry.term.toLowerCase());
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...newEntry };
      } else {
        merged.push(newEntry);
      }
    });

    return merged.slice(0, 500); // Keep top 500 entries
  }

  private mergePopCultureRefs(existing: PopCultureReference[], newRefs: PopCultureReference[]): PopCultureReference[] {
    const merged = [...existing];
    
    newRefs.forEach(newRef => {
      const existingIndex = merged.findIndex(e => e.title.toLowerCase() === newRef.title.toLowerCase());
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...newRef };
      } else {
        merged.push(newRef);
      }
    });

    return merged.slice(0, 300); // Keep top 300 references
  }

  private mergeSocialTrends(existing: SocialTrend[], newTrends: SocialTrend[]): SocialTrend[] {
    const merged = [...existing];
    
    newTrends.forEach(newTrend => {
      const existingIndex = merged.findIndex(e => e.hashtag.toLowerCase() === newTrend.hashtag.toLowerCase());
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...newTrend };
      } else {
        merged.push(newTrend);
      }
    });

    return merged.slice(0, 200); // Keep top 200 trends
  }

  async performFullUpdate(): Promise<void> {
    console.log('🔄 Starting full vocabulary update...');
    
    await Promise.all([
      this.updateSlangDatabase(),
      this.updatePopCultureReferences(),
      this.updateSocialTrends()
    ]);

    this.vocabularyData.lastUpdate = new Date();
    this.saveVocabularyData();
    
    console.log('✓ Full vocabulary update completed');
  }

  getContextualVocabulary(message: string): {
    relevantSlang: SlangEntry[];
    relevantPopCulture: PopCultureReference[];
    relevantTrends: SocialTrend[];
  } {
    const lowerMessage = message.toLowerCase();
    
    return {
      relevantSlang: this.vocabularyData.slang.filter(entry => 
        lowerMessage.includes(entry.term.toLowerCase()) ||
        entry.keywords?.some(keyword => lowerMessage.includes(keyword))
      ).slice(0, 5),
      
      relevantPopCulture: this.vocabularyData.popCulture.filter(ref => 
        lowerMessage.includes(ref.title.toLowerCase()) ||
        ref.keywords.some(keyword => lowerMessage.includes(keyword))
      ).slice(0, 3),
      
      relevantTrends: this.vocabularyData.socialTrends.filter(trend => 
        lowerMessage.includes(trend.hashtag.toLowerCase()) ||
        trend.relatedTerms.some(term => lowerMessage.includes(term))
      ).slice(0, 3)
    };
  }

  getVocabularyPrompt(): string {
    const recentSlang = this.vocabularyData.slang.slice(0, 20);
    const recentPopCulture = this.vocabularyData.popCulture.slice(0, 15);
    const recentTrends = this.vocabularyData.socialTrends.slice(0, 10);

    return `
**Current Vocabulary Enhancement Data:**

**Modern Slang & Expressions:**
${recentSlang.map(s => `- "${s.term}": ${s.definition}`).join('\n')}

**Pop Culture References:**
${recentPopCulture.map(p => `- ${p.title} (${p.type}): ${p.description}`).join('\n')}

**Trending Social Media:**
${recentTrends.map(t => `- ${t.hashtag}: ${t.description}`).join('\n')}

**Usage Guidelines:**
- Use this vocabulary naturally and contextually in conversations
- Don't overuse slang - integrate it when relevant to the topic
- Reference pop culture when it adds value to the conversation
- Stay current with trends but maintain your core personality
- Use these references to connect with users who appreciate modern language
    `.trim();
  }

  getVocabularyStats(): {
    slangCount: number;
    popCultureCount: number;
    trendsCount: number;
    lastUpdate: Date;
  } {
    return {
      slangCount: this.vocabularyData.slang.length,
      popCultureCount: this.vocabularyData.popCulture.length,
      trendsCount: this.vocabularyData.socialTrends.length,
      lastUpdate: this.vocabularyData.lastUpdate
    };
  }

  // Intelligent learning triggers based on conversation context
  async triggerLearning(trigger: string, context?: string): Promise<void> {
    console.log(`🧠 Vocabulary learning triggered: ${trigger}`);
    
    const now = new Date();
    const lastUpdate = this.vocabularyData.lastUpdate;
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    // Only update if it's been more than 2 hours since last update
    if (hoursSinceUpdate < 2) {
      console.log(`⏰ Skipping update - last update was ${hoursSinceUpdate.toFixed(1)} hours ago`);
      return;
    }

    try {
      switch (trigger) {
        case 'pop_culture':
          await this.updatePopCultureReferences();
          break;
        case 'slang':
          await this.updateSlangDatabase();
          break;
        case 'trends':
          await this.updateSocialTrends();
          break;
        case 'conversation':
          // Smart update based on conversation context
          if (context) {
            await this.contextualUpdate(context);
          }
          break;
        default:
          await this.performFullUpdate();
      }
      
      this.vocabularyData.lastUpdate = now;
      this.saveVocabularyData();
    } catch (error) {
      console.error(`Error in vocabulary learning trigger ${trigger}:`, error);
    }
  }

  private async contextualUpdate(context: string): Promise<void> {
    const lowerContext = context.toLowerCase();
    
    // Determine what type of update based on context
    if (lowerContext.includes('movie') || lowerContext.includes('show') || lowerContext.includes('music')) {
      await this.updatePopCultureReferences();
    } else if (lowerContext.includes('slang') || lowerContext.includes('cool') || lowerContext.includes('vibe')) {
      await this.updateSlangDatabase();
    } else if (lowerContext.includes('trend') || lowerContext.includes('viral') || lowerContext.includes('hashtag')) {
      await this.updateSocialTrends();
    } else {
      // General update for broad context
      await this.performFullUpdate();
    }
  }

  // Enhanced contextual vocabulary with learning triggers
  getContextualVocabulary(message: string): {
    relevantSlang: SlangEntry[];
    relevantPopCulture: PopCultureReference[];
    relevantTrends: SocialTrend[];
    shouldTriggerLearning: boolean;
    suggestedTrigger?: string;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Determine if learning should be triggered
    let shouldTriggerLearning = false;
    let suggestedTrigger: string | undefined;
    
    const learningKeywords = {
      pop_culture: ['movie', 'show', 'music', 'celebrity', 'viral', 'meme'],
      slang: ['cool', 'vibe', 'lit', 'fire', 'based', 'cap', 'bet'],
      trends: ['trending', 'viral', 'hashtag', 'tiktok', 'instagram', 'twitter']
    };
    
    for (const [trigger, keywords] of Object.entries(learningKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        shouldTriggerLearning = true;
        suggestedTrigger = trigger;
        break;
      }
    }
    
    return {
      relevantSlang: this.vocabularyData.slang.filter(entry => 
        lowerMessage.includes(entry.term.toLowerCase()) ||
        entry.keywords?.some(keyword => lowerMessage.includes(keyword))
      ).slice(0, 5),
      
      relevantPopCulture: this.vocabularyData.popCulture.filter(ref => 
        lowerMessage.includes(ref.title.toLowerCase()) ||
        ref.keywords.some(keyword => lowerMessage.includes(keyword))
      ).slice(0, 3),
      
      relevantTrends: this.vocabularyData.socialTrends.filter(trend => 
        lowerMessage.includes(trend.hashtag.toLowerCase()) ||
        trend.relatedTerms.some(term => lowerMessage.includes(term))
      ).slice(0, 3),
      
      shouldTriggerLearning,
      suggestedTrigger
    };
  }

  // Schedule automatic updates
  startAutoUpdates(): void {
    console.log('🔄 Starting vocabulary auto-updates every 6 hours');
    
    // Update every 6 hours
    setInterval(() => {
      this.performFullUpdate();
    }, 6 * 60 * 60 * 1000);

    // Initial update after 10 seconds
    setTimeout(() => {
      this.performFullUpdate();
    }, 10000);
  }
}

export const vocabularyService = VocabularyEnhancementService.getInstance();