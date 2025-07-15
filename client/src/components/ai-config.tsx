import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Server, Cloud, Cpu, Settings2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AIProvider {
  provider: 'ollama' | 'openai' | 'local-python';
  config: {
    provider: 'ollama' | 'openai' | 'local-python';
    model: string;
    baseUrl?: string;
    apiKey?: string;
    temperature?: number;
    maxTokens?: number;
  };
  enabled: boolean;
  priority: number;
}

interface AISettings {
  providers: AIProvider[];
  fallbackEnabled: boolean;
  autoSwitch: boolean;
  lastUpdated: string;
}

interface ProviderStatus {
  provider: string;
  status: string;
  model: string;
}

export function AIConfig() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [status, setStatus] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/ai-config');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to load AI configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/ai-config/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to load AI status:', error);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "AI configuration saved successfully",
        });
        loadStatus(); // Refresh status after saving
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to save AI configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  };

  const switchProvider = async (provider: 'ollama' | 'openai' | 'local-python') => {
    try {
      const response = await fetch('/api/ai-config/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Switched to ${provider} provider`,
        });
        loadStatus();
      } else {
        throw new Error('Failed to switch provider');
      }
    } catch (error) {
      console.error('Failed to switch provider:', error);
      toast({
        title: "Error",
        description: `Failed to switch to ${provider}`,
        variant: "destructive",
      });
    }
  };

  const updateProvider = (providerName: string, field: string, value: any) => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      providers: settings.providers.map(provider => 
        provider.provider === providerName 
          ? {
              ...provider,
              [field]: field === 'config' ? { ...provider.config, ...value } : value
            }
          : provider
      )
    };

    setSettings(updatedSettings);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return <Server className="w-4 h-4" />;
      case 'openai':
        return <Cloud className="w-4 h-4" />;
      case 'local-python':
        return <Cpu className="w-4 h-4" />;
      default:
        return <Settings2 className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'unhealthy':
        return 'text-red-600';
      case 'disabled':
        return 'text-gray-400';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'unhealthy':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'disabled':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading AI configuration...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <span className="ml-2">Failed to load AI configuration</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Configure AI providers and manage local/remote processing
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving}
            size="sm"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Provider Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            AI Provider Status
          </CardTitle>
          <CardDescription>
            Lumen can use different AI providers. OpenAI is cloud-based and currently active. 
            Ollama runs Llama 3 locally for offline use. Local Python is for advanced custom models.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.map((provider) => (
              <div key={provider.provider} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.provider)}
                    <div>
                      <div className="font-semibold text-lg capitalize">{provider.provider}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {provider.provider === 'openai' && 'Online AI • GPT-4 • Currently Active'}
                        {provider.provider === 'ollama' && 'Offline AI • Llama 3 • Requires Installation'}
                        {provider.provider === 'local-python' && 'Advanced ML • Custom Models • For Developers'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(provider.status)}
                      <Badge
                        variant={provider.status === 'healthy' ? 'default' : 'secondary'}
                        className={`${getStatusColor(provider.status)} font-medium`}
                      >
                        {provider.status}
                      </Badge>
                    </div>
                    <Button
                      variant={provider.status === 'healthy' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => switchProvider(provider.provider as any)}
                      disabled={provider.status !== 'healthy'}
                      className={provider.status === 'healthy' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {provider.status === 'healthy' ? 'Active' : 'Setup Required'}
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-4">
                  <span>Model: {provider.model}</span>
                  <span>•</span>
                  <span>
                    {provider.provider === 'openai' && 'Cloud-based • Requires internet'}
                    {provider.provider === 'ollama' && 'Local • Works offline once installed'}
                    {provider.provider === 'local-python' && 'Custom models • Advanced users only'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
          <CardDescription>
            Configure global AI behavior and fallback options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="fallback-enabled">Enable Fallback</Label>
            <Switch
              id="fallback-enabled"
              checked={settings.fallbackEnabled}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, fallbackEnabled: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-switch">Auto Switch Providers</Label>
            <Switch
              id="auto-switch"
              checked={settings.autoSwitch}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, autoSwitch: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Provider Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Provider Configuration</h3>
        
        {settings.providers.map((provider) => (
          <Card key={provider.provider}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getProviderIcon(provider.provider)}
                <span className="capitalize">{provider.provider}</span>
                <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {provider.provider === 'ollama' && 'Local AI processing with Ollama'}
                {provider.provider === 'openai' && 'OpenAI cloud processing'}
                {provider.provider === 'local-python' && 'Local Python ML backend'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Provider</Label>
                <Switch
                  checked={provider.enabled}
                  onCheckedChange={(checked) => 
                    updateProvider(provider.provider, 'enabled', checked)
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${provider.provider}-model`}>Model</Label>
                  <Input
                    id={`${provider.provider}-model`}
                    value={provider.config.model}
                    onChange={(e) => 
                      updateProvider(provider.provider, 'config', { model: e.target.value })
                    }
                    placeholder="Enter model name"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`${provider.provider}-priority`}>Priority</Label>
                  <Select
                    value={provider.priority.toString()}
                    onValueChange={(value) => 
                      updateProvider(provider.provider, 'priority', parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Highest)</SelectItem>
                      <SelectItem value="2">2 (Medium)</SelectItem>
                      <SelectItem value="3">3 (Lowest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {provider.config.baseUrl && (
                  <div>
                    <Label htmlFor={`${provider.provider}-baseurl`}>Base URL</Label>
                    <Input
                      id={`${provider.provider}-baseurl`}
                      value={provider.config.baseUrl}
                      onChange={(e) => 
                        updateProvider(provider.provider, 'config', { baseUrl: e.target.value })
                      }
                      placeholder="http://localhost:11434"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor={`${provider.provider}-temperature`}>Temperature</Label>
                  <Input
                    id={`${provider.provider}-temperature`}
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={provider.config.temperature || 0.7}
                    onChange={(e) => 
                      updateProvider(provider.provider, 'config', { temperature: parseFloat(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor={`${provider.provider}-max-tokens`}>Max Tokens</Label>
                  <Input
                    id={`${provider.provider}-max-tokens`}
                    type="number"
                    min="1"
                    max="4000"
                    value={provider.config.maxTokens || 500}
                    onChange={(e) => 
                      updateProvider(provider.provider, 'config', { maxTokens: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Quick start guide for setting up local AI processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold mb-2">🚀 Quick Ollama Setup</h4>
            <div className="space-y-2 text-sm">
              <p>1. Run the setup script: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">node scripts/setup-ollama.js</code></p>
              <p>2. Wait for models to download (this may take 10-30 minutes)</p>
              <p>3. Enable Ollama provider above and set as priority 1</p>
              <p>4. Test the connection and start using local AI!</p>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-semibold mb-2">💡 Benefits of Local AI</h4>
            <ul className="text-sm space-y-1">
              <li>• Complete privacy - data never leaves your device</li>
              <li>• No subscription costs or API fees</li>
              <li>• Offline operation - works without internet</li>
              <li>• No rate limits or usage restrictions</li>
              <li>• Customizable models and parameters</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}