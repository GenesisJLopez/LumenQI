// Web Search Service for Lumen QI
// Provides real-time web search capabilities for weather, traffic, and information

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

interface WeatherData {
  location: string;
  temperature: string;
  condition: string;
  forecast: string;
  humidity?: string;
  windSpeed?: string;
}

interface TrafficData {
  route: string;
  duration: string;
  conditions: string;
  incidents: string[];
}

export class WebSearchService {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  constructor() {}

  // Search for general information using multiple free APIs
  async searchGeneral(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    try {
      // Use DuckDuckGo Instant Answer API (free, no API key needed)
      const duckDuckGoResults = await this.searchDuckDuckGo(query);
      results.push(...duckDuckGoResults);
      
      // Use Wikipedia API for comprehensive information
      const wikipediaResults = await this.searchWikipedia(query);
      results.push(...wikipediaResults);
      
      return results.slice(0, 5); // Return top 5 results
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }

  // Get weather information using free weather APIs
  async getWeather(location: string): Promise<WeatherData | null> {
    try {
      // Use OpenWeatherMap free tier or wttr.in (no API key needed)
      const weatherData = await this.getWeatherFromWttr(location);
      return weatherData;
    } catch (error) {
      console.error('Weather search error:', error);
      return null;
    }
  }

  // Get traffic information using free APIs
  async getTraffic(from: string, to: string): Promise<TrafficData | null> {
    try {
      // Use OpenStreetMap routing service (free)
      const trafficData = await this.getTrafficFromOSM(from, to);
      return trafficData;
    } catch (error) {
      console.error('Traffic search error:', error);
      return null;
    }
  }

  // DuckDuckGo Instant Answer API
  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        {
          headers: {
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchResult[] = [];

      // Process instant answer
      if (data.AbstractText) {
        results.push({
          title: data.AbstractSource || 'DuckDuckGo',
          url: data.AbstractURL || '#',
          snippet: data.AbstractText,
          relevance: 0.9
        });
      }

      // Process related topics
      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
          if (topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              url: topic.FirstURL || '#',
              snippet: topic.Text,
              relevance: 0.7
            });
          }
        });
      }

      return results;
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return [];
    }
  }

  // Wikipedia API search
  private async searchWikipedia(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        // Try search API if direct page doesn't exist
        return await this.searchWikipediaPages(query);
      }

      const data = await response.json();
      
      return [{
        title: data.title || 'Wikipedia',
        url: data.content_urls?.desktop?.page || '#',
        snippet: data.extract || 'No summary available',
        relevance: 0.8
      }];
    } catch (error) {
      console.error('Wikipedia search error:', error);
      return [];
    }
  }

  // Wikipedia search API
  private async searchWikipediaPages(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json&origin=*`,
        {
          headers: {
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Wikipedia search API error: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchResult[] = [];
      
      if (data.length >= 4) {
        const titles = data[1];
        const descriptions = data[2];
        const urls = data[3];
        
        for (let i = 0; i < Math.min(titles.length, 3); i++) {
          results.push({
            title: titles[i],
            url: urls[i],
            snippet: descriptions[i] || 'No description available',
            relevance: 0.6
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Wikipedia pages search error:', error);
      return [];
    }
  }

  // Weather from wttr.in (free service)
  private async getWeatherFromWttr(location: string): Promise<WeatherData | null> {
    try {
      const response = await fetch(
        `https://wttr.in/${encodeURIComponent(location)}?format=j1`,
        {
          headers: {
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      const current = data.current_condition[0];
      const tomorrow = data.weather[1];

      return {
        location: data.nearest_area[0].areaName[0].value,
        temperature: `${current.temp_C}°C (${current.temp_F}°F)`,
        condition: current.weatherDesc[0].value,
        forecast: tomorrow ? `Tomorrow: ${tomorrow.maxtempC}°C/${tomorrow.mintempC}°C, ${tomorrow.hourly[0].weatherDesc[0].value}` : 'No forecast available',
        humidity: `${current.humidity}%`,
        windSpeed: `${current.windspeedKmph} km/h`
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      return null;
    }
  }

  // Traffic from OpenStreetMap (free routing)
  private async getTrafficFromOSM(from: string, to: string): Promise<TrafficData | null> {
    try {
      // First, geocode the locations
      const fromCoords = await this.geocodeLocation(from);
      const toCoords = await this.geocodeLocation(to);

      if (!fromCoords || !toCoords) {
        return null;
      }

      // Get route information
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?overview=false&steps=false`,
        {
          headers: {
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Routing API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const durationMinutes = Math.round(route.duration / 60);
        const distanceKm = Math.round(route.distance / 1000);

        return {
          route: `${from} to ${to}`,
          duration: `${durationMinutes} minutes (${distanceKm} km)`,
          conditions: 'Normal traffic conditions',
          incidents: [] // OSM doesn't provide real-time incidents
        };
      }

      return null;
    } catch (error) {
      console.error('Traffic fetch error:', error);
      return null;
    }
  }

  // Geocode location using Nominatim (free)
  private async geocodeLocation(location: string): Promise<{lat: number, lon: number} | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
        {
          headers: {
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Enhanced search that determines search type and routes accordingly
  async smartSearch(query: string): Promise<string> {
    const lowerQuery = query.toLowerCase();
    
    // Weather queries
    if (lowerQuery.includes('weather') || lowerQuery.includes('temperature') || lowerQuery.includes('forecast')) {
      const location = this.extractLocation(query) || 'current location';
      const weather = await this.getWeather(location);
      
      if (weather) {
        return `Weather in ${weather.location}: Currently ${weather.temperature} with ${weather.condition}. ${weather.forecast}. Humidity: ${weather.humidity}, Wind: ${weather.windSpeed}`;
      }
    }
    
    // Traffic queries
    if (lowerQuery.includes('traffic') || lowerQuery.includes('route') || lowerQuery.includes('drive')) {
      const locations = this.extractTrafficLocations(query);
      if (locations.from && locations.to) {
        const traffic = await this.getTraffic(locations.from, locations.to);
        if (traffic) {
          return `Traffic for ${traffic.route}: ${traffic.duration}. ${traffic.conditions}`;
        }
      }
    }
    
    // General search
    const results = await this.searchGeneral(query);
    if (results.length > 0) {
      const topResult = results[0];
      return `${topResult.title}: ${topResult.snippet}`;
    }
    
    return `I searched for "${query}" but couldn't find specific information. You might want to try a more specific search term.`;
  }

  private extractLocation(query: string): string | null {
    const words = query.split(' ');
    const weatherIndex = words.findIndex(word => word.toLowerCase().includes('weather'));
    if (weatherIndex !== -1 && weatherIndex < words.length - 1) {
      return words.slice(weatherIndex + 1).join(' ');
    }
    return null;
  }

  private extractTrafficLocations(query: string): {from: string | null, to: string | null} {
    const fromMatch = query.match(/from\s+([^to]+)/i);
    const toMatch = query.match(/to\s+(.+)/i);
    
    return {
      from: fromMatch ? fromMatch[1].trim() : null,
      to: toMatch ? toMatch[1].trim() : null
    };
  }
}

export const webSearchService = new WebSearchService();