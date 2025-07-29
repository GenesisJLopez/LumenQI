// Use global fetch available in Node.js 18+

interface WeatherInfo {
  location: string;
  temperature: string;
  condition: string;
  humidity: string;
  windSpeed: string;
  forecast: string;
}

interface TrafficInfo {
  location: string;
  conditions: string;
  incidents: string[];
  travelTimes: string;
  congestionLevel: string;
}

interface StockInfo {
  marketSummary: string;
  majorIndices: {
    name: string;
    value: string;
    change: string;
  }[];
  topMovers: string;
  marketNews: string;
}

interface NewsInfo {
  breakingNews: string[];
  topStories: string[];
  businessNews: string[];
  technologyNews: string[];
  summary: string;
}

export class ComprehensiveInfoService {
  private perplexityApiKey: string;

  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  private async queryPerplexity(query: string): Promise<string> {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'Provide accurate, up-to-date information in a concise format. Focus on current data and real-time information.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 800,
          temperature: 0.2,
          top_p: 0.9,
          search_recency_filter: 'hour',
          return_images: false,
          return_related_questions: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.choices[0]?.message?.content || 'No data available';
    } catch (error) {
      console.error('Perplexity query failed:', error);
      throw new Error(`Perplexity query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentWeather(location: string = 'current location'): Promise<WeatherInfo> {
    const query = `Current weather conditions for ${location} including temperature, humidity, wind speed, conditions, and today's forecast. Provide specific numbers and details.`;
    
    try {
      const weatherData = await this.queryPerplexity(query);
      
      // Parse the response into structured data
      const lines = weatherData.split('\n').filter(line => line.trim());
      
      return {
        location: location,
        temperature: this.extractInfo(weatherData, ['temperature', 'temp', '°']) || 'N/A',
        condition: this.extractInfo(weatherData, ['condition', 'weather', 'sky']) || 'N/A',
        humidity: this.extractInfo(weatherData, ['humidity', '%']) || 'N/A',
        windSpeed: this.extractInfo(weatherData, ['wind', 'mph', 'km/h']) || 'N/A',
        forecast: this.extractInfo(weatherData, ['forecast', 'today', 'tonight']) || weatherData.substring(0, 200)
      };
    } catch (error) {
      throw new Error(`Weather lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTrafficConditions(location: string = 'current area'): Promise<TrafficInfo> {
    const query = `Current traffic conditions for ${location} including congestion levels, major incidents, accidents, road closures, and estimated travel times for main routes. Provide real-time traffic data.`;
    
    try {
      const trafficData = await this.queryPerplexity(query);
      
      return {
        location: location,
        conditions: this.extractInfo(trafficData, ['traffic', 'congestion', 'flow']) || 'Normal',
        incidents: this.extractList(trafficData, ['accident', 'incident', 'closure', 'construction']),
        travelTimes: this.extractInfo(trafficData, ['travel time', 'commute', 'duration']) || 'Normal',
        congestionLevel: this.extractInfo(trafficData, ['heavy', 'moderate', 'light', 'clear']) || 'Moderate'
      };
    } catch (error) {
      throw new Error(`Traffic lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStockMarketUpdate(): Promise<StockInfo> {
    const query = `Current stock market update including S&P 500, Dow Jones, NASDAQ values and changes, top gaining and losing stocks, market sentiment, and major market news from today.`;
    
    try {
      const stockData = await this.queryPerplexity(query);
      
      return {
        marketSummary: this.extractInfo(stockData, ['market', 'trading', 'session']) || stockData.substring(0, 150),
        majorIndices: [
          {
            name: 'S&P 500',
            value: this.extractInfo(stockData, ['s&p 500', 'spx']) || 'N/A',
            change: this.extractInfo(stockData, ['s&p', '+', '-', '%']) || 'N/A'
          },
          {
            name: 'Dow Jones',
            value: this.extractInfo(stockData, ['dow jones', 'djia']) || 'N/A',
            change: this.extractInfo(stockData, ['dow', '+', '-', '%']) || 'N/A'
          },
          {
            name: 'NASDAQ',
            value: this.extractInfo(stockData, ['nasdaq', 'ixic']) || 'N/A',
            change: this.extractInfo(stockData, ['nasdaq', '+', '-', '%']) || 'N/A'
          }
        ],
        topMovers: this.extractInfo(stockData, ['gainers', 'losers', 'movers']) || 'N/A',
        marketNews: this.extractInfo(stockData, ['earnings', 'fed', 'economic']) || 'N/A'
      };
    } catch (error) {
      throw new Error(`Stock market lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNewsUpdates(): Promise<NewsInfo> {
    const query = `Latest breaking news, top headlines, business news, and technology news from today. Include major world events, market-moving news, and significant technology developments.`;
    
    try {
      const newsData = await this.queryPerplexity(query);
      
      return {
        breakingNews: this.extractList(newsData, ['breaking', 'urgent', 'alert']),
        topStories: this.extractList(newsData, ['headline', 'story', 'report']),
        businessNews: this.extractList(newsData, ['business', 'economy', 'earnings', 'market']),
        technologyNews: this.extractList(newsData, ['technology', 'tech', 'ai', 'digital']),
        summary: newsData.substring(0, 300) + '...'
      };
    } catch (error) {
      throw new Error(`News lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getComprehensiveBriefing(location?: string): Promise<{
    weather: WeatherInfo;
    traffic: TrafficInfo;
    stocks: StockInfo;
    news: NewsInfo;
    timestamp: string;
  }> {
    try {
      const [weather, traffic, stocks, news] = await Promise.all([
        this.getCurrentWeather(location),
        this.getTrafficConditions(location),
        this.getStockMarketUpdate(),
        this.getNewsUpdates()
      ]);

      return {
        weather,
        traffic,
        stocks,
        news,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Comprehensive briefing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractInfo(text: string, keywords: string[]): string | null {
    const lines = text.split('\n');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword.toLowerCase())) {
          return line.trim();
        }
      }
    }
    return null;
  }

  private extractList(text: string, keywords: string[]): string[] {
    const lines = text.split('\n');
    const results: string[] = [];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword.toLowerCase()) && line.trim().length > 10) {
          results.push(line.trim());
          break;
        }
      }
    }
    
    return results.slice(0, 5); // Limit to 5 items
  }
}

export const comprehensiveInfoService = new ComprehensiveInfoService();