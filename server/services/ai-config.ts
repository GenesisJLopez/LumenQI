import fs from 'fs';
import path from 'path';
import { LocalAI, LocalAIConfig, createLocalAI } from './local-ai';

interface AIProviderConfig {
  provider: 'ollama' | 'openai' | 'local-python';
  config: LocalAIConfig;
  enabled: boolean;
  priority: number;
}

interface AISettings {
  providers: AIProviderConfig[];
  fallbackEnabled: boolean;
  autoSwitch: boolean;
  lastUpdated: string;
}

const CONFIG_FILE = path.join(process.cwd(), 'ai-config.json');

const DEFAULT_AI_SETTINGS: AISettings = {
  providers: [
    {
      provider: 'openai',
      config: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 500
      },
      enabled: true,
      priority: 1 // Prefer online GPT-4 when available
    },
    {
      provider: 'ollama',
      config: {
        provider: 'ollama',
        model: 'llama3.1:8b',
        baseUrl: 'http://localhost:11434',
        temperature: 0.7,
        maxTokens: 500
      },
      enabled: true,
      priority: 2 // Fallback to offline Llama3 when online unavailable
    },
    {
      provider: 'local-python',
      config: {
        provider: 'local-python',
        model: 'local-llama',
        baseUrl: 'http://localhost:8000',
        temperature: 0.7,
        maxTokens: 500
      },
      enabled: false,
      priority: 3
    }
  ],
  fallbackEnabled: true,
  autoSwitch: true,
  lastUpdated: new Date().toISOString()
};

export class AIConfigManager {
  private static instance: AIConfigManager;
  private settings: AISettings;
  private activeAI: LocalAI | null = null;
  private lastHealthCheck: Date | null = null;

  private constructor() {
    this.settings = this.loadSettings();
    this.initializeActiveAI();
  }

  static getInstance(): AIConfigManager {
    if (!AIConfigManager.instance) {
      AIConfigManager.instance = new AIConfigManager();
    }
    return AIConfigManager.instance;
  }

  private loadSettings(): AISettings {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
    return DEFAULT_AI_SETTINGS;
  }

  private saveSettings(): void {
    try {
      this.settings.lastUpdated = new Date().toISOString();
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Error saving AI config:', error);
    }
  }

  private async initializeActiveAI(): Promise<void> {
    const enabledProviders = this.settings.providers
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of enabledProviders) {
      try {
        const ai = createLocalAI(provider.config);
        const health = await ai.healthCheck();
        
        if (health.status === 'healthy') {
          this.activeAI = ai;
          console.log(`✓ AI Provider initialized: ${provider.provider} (${provider.config.model})`);
          return;
        }
      } catch (error) {
        console.log(`⚠ AI Provider ${provider.provider} not available:`, error.message);
      }
    }

    // If no provider is available, use the first enabled one as fallback
    if (enabledProviders.length > 0) {
      this.activeAI = createLocalAI(enabledProviders[0].config);
      console.log(`⚠ Using fallback AI provider: ${enabledProviders[0].provider}`);
    } else {
      console.error('❌ No AI providers available');
    }
  }

  async getActiveAI(): Promise<LocalAI> {
    if (!this.activeAI) {
      await this.initializeActiveAI();
    }
    
    // Auto-switch based on connectivity if enabled
    if (this.settings.autoSwitch) {
      await this.checkAndSwitchProvider();
    }
    
    if (!this.activeAI) {
      throw new Error('No AI provider available');
    }

    return this.activeAI;
  }

  private async checkAndSwitchProvider(): Promise<void> {
    try {
      // Check internet connectivity and OpenAI availability
      const isOnline = await this.checkInternetConnectivity();
      
      if (isOnline) {
        // Try OpenAI first when online
        const openaiProvider = this.settings.providers.find(p => p.provider === 'openai' && p.enabled);
        if (openaiProvider && this.activeAI?.provider !== 'openai') {
          console.log('🌐 Online detected - switching to OpenAI GPT-4');
          await this.switchProvider('openai');
        }
      } else {
        // Fall back to Ollama/Llama3 when offline
        const ollamaProvider = this.settings.providers.find(p => p.provider === 'ollama' && p.enabled);
        if (ollamaProvider && this.activeAI?.provider !== 'ollama') {
          console.log('🔌 Offline detected - switching to local Llama3');
          await this.switchProvider('ollama');
        }
      }
    } catch (error) {
      console.error('Error checking connectivity:', error);
    }
  }

  private async checkInternetConnectivity(): Promise<boolean> {
    try {
      // Quick OpenAI API health check
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'User-Agent': 'Lumen-QI/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.log('Internet connectivity check failed, using offline mode');
      return false;
    }
  }

  async switchProvider(provider: 'ollama' | 'openai' | 'local-python'): Promise<boolean> {
    const providerConfig = this.settings.providers.find(p => p.provider === provider);
    
    if (!providerConfig || !providerConfig.enabled) {
      return false;
    }

    try {
      const ai = createLocalAI(providerConfig.config);
      const health = await ai.healthCheck();
      
      if (health.status === 'healthy') {
        this.activeAI = ai;
        console.log(`✓ Switched to AI provider: ${provider}`);
        return true;
      }
    } catch (error) {
      console.error(`Failed to switch to ${provider}:`, error);
    }

    return false;
  }

  async getProviderStatus(): Promise<Array<{ provider: string; status: string; model: string }>> {
    const statuses = [];
    
    for (const provider of this.settings.providers) {
      if (provider.enabled) {
        try {
          const ai = createLocalAI(provider.config);
          const health = await ai.healthCheck();
          statuses.push({
            provider: provider.provider,
            status: health.status,
            model: provider.config.model
          });
        } catch (error) {
          statuses.push({
            provider: provider.provider,
            status: 'error',
            model: provider.config.model
          });
        }
      } else {
        statuses.push({
          provider: provider.provider,
          status: 'disabled',
          model: provider.config.model
        });
      }
    }

    return statuses;
  }

  getSettings(): AISettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<AISettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    
    // Reinitialize if providers changed
    if (newSettings.providers) {
      this.initializeActiveAI();
    }
  }

  updateProvider(provider: 'ollama' | 'openai' | 'local-python', config: Partial<LocalAIConfig>): void {
    const providerIndex = this.settings.providers.findIndex(p => p.provider === provider);
    
    if (providerIndex !== -1) {
      this.settings.providers[providerIndex].config = {
        ...this.settings.providers[providerIndex].config,
        ...config
      };
      this.saveSettings();
    }
  }

  enableProvider(provider: 'ollama' | 'openai' | 'local-python', enabled: boolean): void {
    const providerConfig = this.settings.providers.find(p => p.provider === provider);
    
    if (providerConfig) {
      providerConfig.enabled = enabled;
      this.saveSettings();
    }
  }

  async performHealthCheck(): Promise<void> {
    if (this.lastHealthCheck && (Date.now() - this.lastHealthCheck.getTime()) < 30000) {
      return; // Skip if checked within last 30 seconds
    }

    this.lastHealthCheck = new Date();
    
    if (this.settings.autoSwitch) {
      const statuses = await this.getProviderStatus();
      const healthyProviders = statuses.filter(s => s.status === 'healthy');
      
      if (healthyProviders.length > 0) {
        const currentProvider = this.activeAI?.getConfig().provider;
        const currentStatus = statuses.find(s => s.provider === currentProvider);
        
        if (!currentStatus || currentStatus.status !== 'healthy') {
          // Switch to the highest priority healthy provider
          const enabledProviders = this.settings.providers
            .filter(p => p.enabled)
            .sort((a, b) => a.priority - b.priority);
          
          for (const provider of enabledProviders) {
            if (healthyProviders.find(hp => hp.provider === provider.provider)) {
              await this.switchProvider(provider.provider);
              break;
            }
          }
        }
      }
    }
  }
}

export const aiConfigManager = AIConfigManager.getInstance();