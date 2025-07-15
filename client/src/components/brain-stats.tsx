import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Activity, Database, Zap, Download, RotateCcw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BrainStats {
  totalMemories: number;
  totalPatterns: number;
  evolutionCycle: number;
  personalityTraits: Record<string, any>;
  averageMemoryImportance: number;
  onlineMemories: number;
  offlineMemories: number;
  hybridCapable: boolean;
}

export function BrainStats() {
  const { data: stats, isLoading, refetch } = useQuery<BrainStats>({
    queryKey: ['/api/brain/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleForceEvolution = async () => {
    try {
      await apiRequest('/api/brain/evolve', {
        method: 'POST'
      });
      refetch();
    } catch (error) {
      console.error('Failed to trigger evolution:', error);
    }
  };

  const handleExportBrain = async () => {
    try {
      const response = await fetch('/api/brain/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumen-brain-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export brain:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 p-8">
        Unable to load brain statistics
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Lumen Brain System</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleForceEvolution} size="sm" variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Force Evolution
          </Button>
          <Button onClick={handleExportBrain} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Brain
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4" />
              Memory System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Memories</span>
                <Badge variant="secondary">{stats.totalMemories}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Online</span>
                <Badge variant="outline">{stats.onlineMemories}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Offline</span>
                <Badge variant="outline">{stats.offlineMemories}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Importance</span>
                <Badge variant="secondary">{stats.averageMemoryImportance.toFixed(1)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              Learning System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Learning Patterns</span>
                <Badge variant="secondary">{stats.totalPatterns}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Evolution Cycle</span>
                <Badge variant="outline">{stats.evolutionCycle}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hybrid Capable</span>
                <Badge variant={stats.hybridCapable ? "default" : "destructive"}>
                  {stats.hybridCapable ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4" />
              Personality Evolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.personalityTraits).slice(0, 4).map(([trait, data]: [string, any]) => (
                <div key={trait} className="flex justify-between">
                  <span className="text-sm text-gray-600 capitalize">{trait}</span>
                  <Badge variant="outline">
                    {(data.current_value * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brain Status</CardTitle>
          <CardDescription>
            The brain system combines online (OpenAI) and offline (Llama) capabilities for continuous learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-purple-600 animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="font-semibold">Lumen Brain Active</div>
                <div className="text-sm text-gray-600">
                  {stats.hybridCapable ? "Online + Offline Ready" : "Online Only"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}