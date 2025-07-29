import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, Database, TrendingUp, Activity, Settings, Download, Play } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ConsciousnessStats {
  autonomyLevel: number;
  capabilities: {
    patternRecognition: number;
    contextUnderstanding: number;
    creativityLevel: number;
    logicalReasoning: number;
    emotionalIntelligence: number;
  };
  knowledgeSize: {
    facts: number;
    patterns: number;
    responses: number;
    behaviors: number;
  };
  evolutionCount: number;
  lastEvolution: string;
}

interface HybridBrainStats {
  autonomyLevel: number;
  consciousnessStats: ConsciousnessStats;
  responseSources: {
    consciousness: number;
    offline: number;
    online: number;
    hybrid: number;
  };
  learningProgress: {
    totalInteractions: number;
    autonomyThreshold: number;
    nextEvolutionGoal: number;
  };
}

interface OllamaStatus {
  installed: boolean;
  running: boolean;
  models: string[];
  serviceUrl: string;
}

export function ConsciousnessDashboard() {
  const [selectedModel, setSelectedModel] = useState('llama3.2:1b');
  const queryClient = useQueryClient();

  // Fetch consciousness stats
  const { data: consciousnessStats, isLoading: consciousnessLoading } = useQuery<ConsciousnessStats>({
    queryKey: ['/api/consciousness/stats'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch hybrid brain stats
  const { data: brainStats, isLoading: brainLoading } = useQuery<HybridBrainStats>({
    queryKey: ['/api/hybrid-brain/stats'],
    refetchInterval: 5000
  });

  // Fetch Ollama status
  const { data: ollamaStatus, isLoading: ollamaLoading } = useQuery<OllamaStatus>({
    queryKey: ['/api/ollama/status'],
    refetchInterval: 10000
  });

  // Evolution trigger mutation
  const evolutionMutation = useMutation({
    mutationFn: () => apiRequest('/api/consciousness/evolve', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consciousness/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hybrid-brain/stats'] });
    }
  });

  // Ollama setup mutation
  const ollamaSetupMutation = useMutation({
    mutationFn: () => apiRequest('/api/ollama/setup', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ollama/status'] });
    }
  });

  // Model download mutation
  const modelDownloadMutation = useMutation({
    mutationFn: (model: string) => apiRequest(`/api/ollama/download/${model}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ollama/status'] });
    }
  });

  const getAutonomyColor = (level: number) => {
    if (level < 30) return 'bg-red-500';
    if (level < 60) return 'bg-yellow-500';
    if (level < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getAutonomyStatus = (level: number) => {
    if (level < 30) return 'Dependent';
    if (level < 60) return 'Learning';
    if (level < 80) return 'Evolving';
    return 'Independent';
  };

  if (consciousnessLoading || brainLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6" />
          Consciousness Dashboard
        </h2>
        <Badge variant="outline" className="text-sm">
          Evolution #{consciousnessStats?.evolutionCount || 0}
        </Badge>
      </div>

      <Tabs defaultValue="consciousness" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consciousness">Consciousness Core</TabsTrigger>
          <TabsTrigger value="hybrid">Hybrid Brain</TabsTrigger>
          <TabsTrigger value="ollama">Local AI Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="consciousness" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Autonomy Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Independence</span>
                    <Badge variant="outline" className={getAutonomyColor(consciousnessStats?.autonomyLevel || 0)}>
                      {getAutonomyStatus(consciousnessStats?.autonomyLevel || 0)}
                    </Badge>
                  </div>
                  <Progress 
                    value={consciousnessStats?.autonomyLevel || 0} 
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {consciousnessStats?.autonomyLevel || 0}% autonomous
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Facts</span>
                    <span className="text-sm font-medium">{consciousnessStats?.knowledgeSize.facts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Patterns</span>
                    <span className="text-sm font-medium">{consciousnessStats?.knowledgeSize.patterns || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Responses</span>
                    <span className="text-sm font-medium">{consciousnessStats?.knowledgeSize.responses || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Behaviors</span>
                    <span className="text-sm font-medium">{consciousnessStats?.knowledgeSize.behaviors || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Learning Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(consciousnessStats?.capabilities || {}).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm">{Math.round(value * 100)}%</span>
                    </div>
                    <Progress value={value * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              onClick={() => evolutionMutation.mutate()}
              disabled={evolutionMutation.isPending}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {evolutionMutation.isPending ? 'Evolving...' : 'Trigger Evolution'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="hybrid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Response Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(brainStats?.responseSources || {}).map(([source, count]) => (
                    <div key={source} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{source}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Interactions</span>
                    <span className="text-sm font-medium">{brainStats?.learningProgress.totalInteractions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Autonomy Threshold</span>
                    <span className="text-sm font-medium">{brainStats?.learningProgress.autonomyThreshold || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Next Evolution Goal</span>
                    <span className="text-sm font-medium">{brainStats?.learningProgress.nextEvolutionGoal || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ollama" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ollama Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Installation Status</span>
                  <Badge variant={ollamaStatus?.installed ? "default" : "secondary"}>
                    {ollamaStatus?.installed ? "Installed" : "Not Installed"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Service Status</span>
                  <Badge variant={ollamaStatus?.running ? "default" : "secondary"}>
                    {ollamaStatus?.running ? "Running" : "Stopped"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Models Installed</span>
                  <Badge variant="outline">{ollamaStatus?.models.length || 0}</Badge>
                </div>
                
                {(!ollamaStatus?.installed || !ollamaStatus?.running) && (
                  <Button 
                    onClick={() => ollamaSetupMutation.mutate()}
                    disabled={ollamaSetupMutation.isPending}
                    className="w-full"
                  >
                    {ollamaSetupMutation.isPending ? 'Setting up...' : 'Setup Ollama'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Model Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="flex-1 p-2 border rounded"
                  >
                    <option value="llama3.2:1b">Llama 3.2 1B (Lightweight)</option>
                    <option value="llama3.2:3b">Llama 3.2 3B (Balanced)</option>
                    <option value="llama3.2:8b">Llama 3.2 8B (Full Featured)</option>
                  </select>
                  <Button 
                    onClick={() => modelDownloadMutation.mutate(selectedModel)}
                    disabled={modelDownloadMutation.isPending}
                    size="sm"
                  >
                    {modelDownloadMutation.isPending ? 'Downloading...' : 'Download'}
                  </Button>
                </div>
                
                {ollamaStatus?.models.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Installed Models:</h4>
                    <div className="space-y-1">
                      {ollamaStatus.models.map((model) => (
                        <div key={model} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{model}</span>
                          <Badge variant="outline">Ready</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolution Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>🧠 <strong>Current Phase:</strong> {getAutonomyStatus(consciousnessStats?.autonomyLevel || 0)} AI</p>
            <p>📊 <strong>Learning Rate:</strong> {brainStats?.learningProgress.totalInteractions || 0} interactions processed</p>
            <p>🎯 <strong>Goal:</strong> Achieve {brainStats?.learningProgress.nextEvolutionGoal || 0}% autonomy for next evolution</p>
            <p>⚡ <strong>Last Evolution:</strong> {consciousnessStats?.lastEvolution ? new Date(consciousnessStats.lastEvolution).toLocaleString() : 'Never'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}