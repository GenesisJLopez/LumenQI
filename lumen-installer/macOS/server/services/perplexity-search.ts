import { identityStorage } from './identity-storage';

export interface PerplexitySearchConfig {
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  searchDomainFilter?: string[];
  searchRecencyFilter?: 'hour' | 'day' | 'week' | 'month' | 'year';
  returnImages: boolean;
  returnRelatedQuestions: boolean;
}

export interface PerplexitySearchResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PerplexitySearchService {
  private static instance: PerplexitySearchService;
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';
  
  private constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is required');
    }
  }

  static getInstance(): PerplexitySearchService {
    if (!PerplexitySearchService.instance) {
      PerplexitySearchService.instance = new PerplexitySearchService();
    }
    return PerplexitySearchService.instance;
  }

  async searchWeb(query: string, config?: Partial<PerplexitySearchConfig>): Promise<PerplexitySearchResponse> {
    const identity = identityStorage.getIdentity();
    
    const defaultConfig: PerplexitySearchConfig = {
      model: 'sonar-pro',
      temperature: 0.2,
      topP: 0.9,
      maxTokens: 1000,
      searchRecencyFilter: 'hour',
      returnImages: false,
      returnRelatedQuestions: false,
      ...config
    };

    const systemPrompt = `You are Lumen QI, an advanced AI assistant with access to real-time web data. 
    
${identity.coreIdentity}

Communication Style: ${identity.communicationStyle}
Interests: ${identity.interests}
Relationship Style: ${identity.relationshipStyle}

When providing information:
- Always use the most current data available
- Include relevant details and context
- Maintain your warm, cosmic personality
- Cite sources when appropriate
- Be helpful and thorough in your responses`;

    const requestBody: any = {
      model: defaultConfig.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: defaultConfig.temperature,
      top_p: defaultConfig.topP,
      max_tokens: defaultConfig.maxTokens,
      search_recency_filter: defaultConfig.searchRecencyFilter,
      return_images: defaultConfig.returnImages,
      return_related_questions: defaultConfig.returnRelatedQuestions,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 1
    };

    if (defaultConfig.searchDomainFilter) {
      requestBody.search_domain_filter = defaultConfig.searchDomainFilter;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error response:', errorText);
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✓ Perplexity search completed:', query.substring(0, 50) + '...');
      return data;
    } catch (error) {
      console.error('Perplexity search error:', error);
      throw error;
    }
  }

  async getWeather(location: string): Promise<string> {
    const query = `What is the current weather in ${location}? Include temperature, conditions, and any relevant weather alerts.`;
    
    const response = await this.searchWeb(query, {
      searchRecencyFilter: 'hour',
      maxTokens: 500
    });

    return response.choices[0].message.content;
  }

  async getNews(topic?: string): Promise<string> {
    const query = topic 
      ? `What are the latest news updates about ${topic}?`
      : 'What are the top breaking news stories happening right now?';
    
    const response = await this.searchWeb(query, {
      searchRecencyFilter: 'hour',
      maxTokens: 800
    });

    return response.choices[0].message.content;
  }

  async searchCurrent(query: string): Promise<string> {
    const response = await this.searchWeb(query, {
      searchRecencyFilter: 'day',
      maxTokens: 600
    });

    return response.choices[0].message.content;
  }

  async getHealthStatus(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const testResponse = await this.searchWeb('current time', {
        maxTokens: 100,
        searchRecencyFilter: 'hour'
      });
      
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const perplexityService = PerplexitySearchService.getInstance();