import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Clock, MessageSquare } from "lucide-react";

interface PersonalityTrait {
  name: string;
  value: number;
  description: string;
  lastUpdated: Date;
}

interface PersonalityInsights {
  currentTraits: PersonalityTrait[];
  recentEvolution: Array<{
    trait: string;
    change: string;
    reason: string;
    timestamp: Date;
  }>;
  interactionCount: number;
}

interface PersonalityEvolutionProps {
  userId: number;
}

export function PersonalityEvolution({ userId }: PersonalityEvolutionProps) {
  const [insights, setInsights] = useState<PersonalityInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonalityInsights();
  }, [userId]);

  const loadPersonalityInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/personality/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to load personality insights');
      }
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getTraitColor = (value: number) => {
    if (value > 0.8) return 'bg-green-500';
    if (value > 0.6) return 'bg-blue-500';
    if (value > 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTraitLabel = (name: string) => {
    const labels: { [key: string]: string } = {
      playfulness: 'Playfulness',
      supportiveness: 'Supportiveness', 
      excitement: 'Excitement',
      flirtatiousness: 'Flirtatiousness',
      technical_depth: 'Technical Depth',
      casualness: 'Casualness',
      empathy: 'Empathy',
      humor: 'Humor',
      assertiveness: 'Assertiveness',
      curiosity: 'Curiosity'
    };
    return labels[name] || name;
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 p-8">
        <p>Error loading personality insights: {error}</p>
        <button 
          onClick={loadPersonalityInsights}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center text-gray-400 p-8">
        <p>No personality data available yet.</p>
        <p className="text-sm mt-2">Start chatting to see Lumen's personality evolve!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gray-900/50 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{insights.interactionCount}</p>
                <p className="text-sm text-gray-400">Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{insights.recentEvolution.length}</p>
                <p className="text-sm text-gray-400">Recent Changes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="traits" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="traits">Current Traits</TabsTrigger>
          <TabsTrigger value="evolution">Recent Evolution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="traits" className="space-y-4">
          <Card className="bg-gray-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Personality Traits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {insights.currentTraits.map((trait) => (
                <div key={trait.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{getTraitLabel(trait.name)}</span>
                    <span className="text-sm text-gray-400">{Math.round(trait.value * 100)}%</span>
                  </div>
                  <Progress 
                    value={trait.value * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">{trait.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="evolution" className="space-y-4">
          <Card className="bg-gray-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Evolution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.recentEvolution.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No recent personality changes. Keep chatting to see Lumen evolve!
                </p>
              ) : (
                insights.recentEvolution.map((change, index) => (
                  <div key={index} className="border-l-2 border-purple-500/30 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{getTraitLabel(change.trait)}</span>
                      <Badge variant={change.change === 'increased' ? 'default' : 'secondary'}>
                        {change.change}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{change.reason}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(change.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}