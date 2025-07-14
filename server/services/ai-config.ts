import fs from 'fs';
import path from 'path';
import { LocalAI, LocalAIConfig, createLocalAI } from './local-ai';

interface AIProviderConfig {
  provider: 'custom' | 'ollama' | 'openai' | 'local-python';
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
      provider: 'custom',
      config: {
        provider: 'custom',
        model: 'lumen-qi-custom',
        temperature: 0.7,
        maxTokens: 500
      },
      enabled: true,
      priority: 1
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
      enabled: false,
      priority: 2
    },
    {
      provider: 'openai',
      config: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 500
      },
      enabled: false,
      priority: 3
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
      priority: 4
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
    
    if (!this.activeAI) {
      throw new Error('No AI provider available');
    }

    return this.activeAI;
  }

  async switchProvider(provider: 'custom' | 'ollama' | 'openai' | 'local-python'): Promise<boolean> {
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

  updateProvider(provider: 'custom' | 'ollama' | 'openai' | 'local-python', config: Partial<LocalAIConfig>): void {
    const providerIndex = this.settings.providers.findIndex(p => p.provider === provider);
    
    if (providerIndex !== -1) {
      this.settings.providers[providerIndex].config = {
        ...this.settings.providers[providerIndex].config,
        ...config
      };
      this.saveSettings();
    }
  }

  enableProvider(provider: 'custom' | 'ollama' | 'openai' | 'local-python', enabled: boolean): void {
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