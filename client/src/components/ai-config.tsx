import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Cpu, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AIProvider {
  provider: 'custom' | 'ollama' | 'openai' | 'local-python';
  config: {
    provider: 'custom' | 'ollama' | 'openai' | 'local-python';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      console.error('Failed to load status:', error);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/ai-config', {
        method: 'PUT',
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
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
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
          <h2 className="text-2xl font-bold">Lumen QI Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Your personal AI assistant powered by Llama 3
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

      {/* Lumen QI Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            Lumen QI Status
          </CardTitle>
          <CardDescription>
            Current status of your AI intelligence system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium">Lumen QI Custom Engine</div>
                  <div className="text-sm text-gray-600">Independent AI system running locally</div>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-medium">Llama 3 Voice Synthesis</div>
                  <div className="text-sm text-gray-600">High-quality voice generation</div>
                </div>
              </div>
              <Badge variant="outline" className="text-purple-600 border-purple-200">
                Ready
              </Badge>
            </div>
            
            {/* Advanced Settings Toggle */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Label htmlFor="show-advanced">Show Advanced Settings</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Configure advanced AI behavior and fallback options
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
      )}
    </div>
  );
}