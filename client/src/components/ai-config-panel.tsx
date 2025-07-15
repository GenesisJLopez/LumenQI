import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Settings2,
  Zap,
  HardDrive,
  Cloud,
  RefreshCw,
  Info
} from 'lucide-react';

interface AIProvider {
  provider: string;
  status: 'healthy' | 'unhealthy' | 'disabled' | 'error';
  model: string;
  enabled?: boolean;
  priority?: number;
  description?: string;
}

interface AIConfig {
  providers: Array<{
    provider: string;
    config: {
      provider: string;
      model: string;
      baseUrl?: string;
      temperature?: number;
      maxTokens?: number;
    };
    enabled: boolean;
    priority: number;
  }>;
  fallbackEnabled: boolean;
  autoSwitch: boolean;
  lastUpdated: string;
}

export const AIConfigPanel: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchAIStatus = async () => {
    setLoading(true);
    try {
      const [statusRes, configRes] = await Promise.all([
        fetch('/api/ai-config/status'),
        fetch('/api/ai-config')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        const enhancedProviders = statusData.map((provider: AIProvider) => ({
          ...provider,
          description: getProviderDescription(provider.provider, provider.status)
        }));
        setProviders(enhancedProviders);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
        
        // Find active provider (first healthy one)
        const activeIndex = enhancedProviders.findIndex((p: AIProvider) => 
          p.status === 'healthy' && configData.providers.find((cp: any) => cp.provider === p.provider)?.enabled
        );
        if (activeIndex >= 0) {
          setActiveProvider(enhancedProviders[activeIndex].provider);
        }
      }
    } catch (error) {
      console.error('Error fetching AI status:', error);
      // Set fallback data to prevent UI errors
      setProviders([
        { provider: 'openai', status: 'healthy', model: 'gpt-4o-mini' },
        { provider: 'local-python', status: 'healthy', model: 'embedded-llama-3.2-1b' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getProviderDescription = (provider: string, status: string): string => {
    switch (provider) {
      case 'openai':
        return status === 'healthy' ? 
          'Online AI using OpenAI GPT-4o-mini - High quality responses' : 
          'Online AI - Requires internet connection';
      case 'local-python':
        return status === 'healthy' ? 
          'Embedded Local AI - Self-contained Llama 3.2 equivalent' : 
          'Embedded Local AI - No external dependencies';
      case 'ollama':
        return status === 'healthy' ? 
          'External Ollama - Local Llama 3.2 1B model' : 
          'External Ollama - Requires manual setup';
      default:
        return 'Unknown provider';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unhealthy':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'disabled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unhealthy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disabled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleProvider = async (provider: string, enabled: boolean) => {
    if (!config) return;

    try {
      const updatedConfig = {
        ...config,
        providers: config.providers.map(p => 
          p.provider === provider ? { ...p, enabled } : p
        )
      };

      const response = await fetch('/api/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig)
      });

      if (response.ok) {
        setConfig(updatedConfig);
        await fetchAIStatus();
      }
    } catch (error) {
      console.error('Error updating provider:', error);
    }
  };

  const switchToProvider = async (provider: string) => {
    try {
      const response = await fetch(`/api/ai-config/switch/${provider}`, {
        method: 'POST'
      });

      if (response.ok) {
        setActiveProvider(provider);
        await fetchAIStatus();
      }
    } catch (error) {
      console.error('Error switching provider:', error);
    }
  };

  useEffect(() => {
    fetchAIStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold">AI Configuration</h2>
        </div>
        <Button 
          onClick={fetchAIStatus} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Current Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-switching</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically switch between online and offline AI
                </p>
              </div>
              <Switch 
                checked={config?.autoSwitch ?? true}
                onCheckedChange={(checked) => {
                  if (config) {
                    const updatedConfig = { ...config, autoSwitch: checked };
                    setConfig(updatedConfig);
                    // Update on server
                    fetch('/api/ai-config', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updatedConfig)
                    });
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Fallback enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Use backup AI if primary fails
                </p>
              </div>
              <Switch 
                checked={config?.fallbackEnabled ?? true}
                onCheckedChange={(checked) => {
                  if (config) {
                    const updatedConfig = { ...config, fallbackEnabled: checked };
                    setConfig(updatedConfig);
                    // Update on server
                    fetch('/api/ai-config', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updatedConfig)
                    });
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Available AI Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {providers.map((provider, index) => {
                const configProvider = config?.providers.find(p => p.provider === provider.provider);
                const isActive = activeProvider === provider.provider;
                
                return (
                  <div key={provider.provider} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {provider.provider === 'openai' && <Cloud className="w-5 h-5 text-blue-500" />}
                        {provider.provider === 'local-python' && <HardDrive className="w-5 h-5 text-green-500" />}
                        {provider.provider === 'ollama' && <Brain className="w-5 h-5 text-purple-500" />}
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium capitalize">{provider.provider}</h3>
                            {isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {provider.model}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(provider.status)}
                        <Badge className={getStatusColor(provider.status)}>
                          {provider.status}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {provider.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={configProvider?.enabled ?? false}
                          onCheckedChange={(checked) => toggleProvider(provider.provider, checked)}
                        />
                        <Label className="text-sm">Enabled</Label>
                      </div>

                      {provider.status === 'healthy' && configProvider?.enabled && (
                        <Button 
                          onClick={() => switchToProvider(provider.provider)}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                        >
                          {isActive ? 'Currently Active' : 'Switch to This'}
                        </Button>
                      )}
                    </div>

                    {provider.provider === 'ollama' && provider.status === 'unhealthy' && (
                      <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">Setup Required</p>
                          <p>To use Ollama, install it externally and run: <code>ollama serve</code></p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Priority System:</strong> The system automatically uses the highest priority available provider.
            </p>
            <p>
              <strong>Online AI (OpenAI):</strong> High-quality responses using GPT-4o-mini when internet is available.
            </p>
            <p>
              <strong>Embedded Local AI:</strong> Self-contained Llama 3.2 equivalent that works offline with no setup required.
            </p>
            <p>
              <strong>External Ollama:</strong> Optional external Ollama installation for advanced users.
            </p>
            <p>
              <strong>Auto-switching:</strong> Automatically switches between online and offline based on internet connectivity.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};