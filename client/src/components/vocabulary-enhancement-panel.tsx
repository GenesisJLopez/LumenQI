import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, TrendingUp, Users, MessageCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VocabularyStats {
  slangCount: number;
  popCultureCount: number;
  trendsCount: number;
  lastUpdate: string;
}

interface SlangEntry {
  term: string;
  definition: string;
  usage: string;
  popularity: number;
  category: string;
  lastUpdated: string;
}

interface PopCultureReference {
  title: string;
  type: string;
  description: string;
  relevance: number;
  keywords: string[];
  lastUpdated: string;
}

interface SocialTrend {
  hashtag: string;
  platform: string;
  description: string;
  trendingScore: number;
  relatedTerms: string[];
  lastUpdated: string;
}

export function VocabularyEnhancementPanel() {
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [contextualData, setContextualData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/vocabulary/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching vocabulary stats:', error);
    }
  };

  const triggerUpdate = async (type: 'full' | 'slang' | 'pop_culture' | 'trends' = 'full') => {
    setIsUpdating(true);
    try {
      let endpoint = '/api/vocabulary/update';
      let body = {};
      
      if (type !== 'full') {
        endpoint = '/api/vocabulary/learn';
        body = { trigger: type, context: 'manual_update' };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Vocabulary Updated",
          description: `Successfully updated ${type === 'full' ? 'all vocabulary' : type} data`,
        });
        await fetchStats();
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const testContextual = async (message: string) => {
    try {
      const response = await fetch(`/api/vocabulary/contextual/${encodeURIComponent(message)}`);
      const data = await response.json();
      setContextualData(data);
    } catch (error) {
      console.error('Error testing contextual vocabulary:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getProgressColor = (count: number, max: number) => {
    const percentage = (count / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vocabulary Enhancement</h3>
          <p className="text-sm text-muted-foreground">
            Keep Lumen's language fresh with modern slang, pop culture, and trends
          </p>
        </div>
        <Button
          onClick={() => triggerUpdate('full')}
          disabled={isUpdating}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Updating...' : 'Update All'}
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Slang Terms</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.slangCount}</div>
              <Progress 
                value={(stats.slangCount / 500) * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.slangCount}/500 terms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pop Culture</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.popCultureCount}</div>
              <Progress 
                value={(stats.popCultureCount / 300) * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.popCultureCount}/300 references
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Social Trends</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trendsCount}</div>
              <Progress 
                value={(stats.trendsCount / 200) * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.trendsCount}/200 trends
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="slang">Slang</TabsTrigger>
          <TabsTrigger value="culture">Pop Culture</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                Lumen automatically learns modern vocabulary through intelligent triggers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Automatic Learning</p>
                    <p className="text-sm text-muted-foreground">
                      Lumen detects when conversations involve slang, pop culture, or trends and automatically updates her vocabulary
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Real-time Web Search</p>
                    <p className="text-sm text-muted-foreground">
                      Uses Perplexity API to fetch the latest slang, trends, and pop culture references from the web
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Contextual Usage</p>
                    <p className="text-sm text-muted-foreground">
                      Learns how to use new vocabulary naturally in conversations, not just definitions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Offline Storage</p>
                    <p className="text-sm text-muted-foreground">
                      Vocabulary is stored locally so Lumen can use modern language even when offline
                    </p>
                  </div>
                </div>
              </div>
              
              {stats && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Last Update:</span> {formatDate(stats.lastUpdate)}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Next Auto-Update:</span> Every 6 hours
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slang" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slang Database</CardTitle>
              <CardDescription>
                Modern slang terms and expressions from social media and online culture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerUpdate('slang')}
                  disabled={isUpdating}
                >
                  Update Slang
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testContextual('That song is so fire and lit!')}
                >
                  Test Contextual
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {['slay', 'no cap', 'bet', 'fire', 'lit', 'vibe', 'drip', 'flex', 'stan', 'bussin'].map(term => (
                    <Badge key={term} variant="secondary">
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {contextualData && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Contextual Analysis Result:</p>
                  <p className="text-sm mt-1">
                    Relevant slang: {contextualData.relevantSlang?.length || 0} terms
                  </p>
                  <p className="text-sm">
                    Should trigger learning: {contextualData.shouldTriggerLearning ? 'Yes' : 'No'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="culture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pop Culture References</CardTitle>
              <CardDescription>
                Current movies, TV shows, music, memes, and celebrity culture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerUpdate('pop_culture')}
                  disabled={isUpdating}
                >
                  Update Pop Culture
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testContextual('Have you seen the new Marvel movie?')}
                >
                  Test Contextual
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {['Movies', 'TV Shows', 'Music', 'Memes', 'Celebrities', 'Viral Content'].map(category => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Trends</CardTitle>
              <CardDescription>
                Trending hashtags, topics, and buzzwords from social platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerUpdate('trends')}
                  disabled={isUpdating}
                >
                  Update Trends
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testContextual('What\'s trending on TikTok?')}
                >
                  Test Contextual
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {['Twitter', 'TikTok', 'Instagram', 'Reddit', 'YouTube', 'General'].map(platform => (
                    <Badge key={platform} variant="secondary">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}