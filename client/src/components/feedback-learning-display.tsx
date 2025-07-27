import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';

interface FeedbackStats {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  averageRating: number;
  recentFeedback: Array<{
    id: number;
    type: string;
    rating: number;
    feedback: string;
    createdAt: string;
  }>;
}

export function FeedbackLearningDisplay() {
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({
    totalFeedback: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    averageRating: 0,
    recentFeedback: []
  });
  const [unprocessedCount, setUnprocessedCount] = useState(0);

  useEffect(() => {
    const fetchFeedbackStats = async () => {
      try {
        const unprocessedResponse = await fetch('/api/feedback/unprocessed');
        const unprocessedData = await unprocessedResponse.json();
        setUnprocessedCount(unprocessedData.length);

        // Calculate stats from unprocessed feedback
        const totalFeedback = unprocessedData.length;
        const positiveFeedback = unprocessedData.filter((f: any) => f.type === 'thumbs_up' || f.rating >= 4).length;
        const negativeFeedback = unprocessedData.filter((f: any) => f.type === 'thumbs_down' || f.rating <= 2).length;
        const averageRating = totalFeedback > 0 
          ? unprocessedData.reduce((sum: number, f: any) => sum + (f.rating || 3), 0) / totalFeedback
          : 0;

        setFeedbackStats({
          totalFeedback,
          positiveFeedback,
          negativeFeedback,
          averageRating,
          recentFeedback: unprocessedData.slice(-5)
        });
      } catch (error) {
        console.error('Error fetching feedback stats:', error);
      }
    };

    fetchFeedbackStats();
    const interval = setInterval(fetchFeedbackStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'thumbs_up':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'thumbs_down':
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      case 'correction':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'preference':
        return <SettingsIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'thumbs_up':
        return 'bg-green-100 text-green-800';
      case 'thumbs_down':
        return 'bg-red-100 text-red-800';
      case 'correction':
        return 'bg-blue-100 text-blue-800';
      case 'preference':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.totalFeedback}</div>
            <div className="text-xs text-muted-foreground">
              {unprocessedCount} pending processing
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Positive Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{feedbackStats.positiveFeedback}</div>
            <div className="text-xs text-muted-foreground">
              {feedbackStats.totalFeedback > 0 ? Math.round((feedbackStats.positiveFeedback / feedbackStats.totalFeedback) * 100) : 0}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{feedbackStats.negativeFeedback}</div>
            <div className="text-xs text-muted-foreground">
              {feedbackStats.totalFeedback > 0 ? Math.round((feedbackStats.negativeFeedback / feedbackStats.totalFeedback) * 100) : 0}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.averageRating.toFixed(1)}</div>
            <Progress value={feedbackStats.averageRating * 20} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Feedback
          </CardTitle>
          <CardDescription>
            Latest feedback from conversations - processed automatically by the brain system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feedbackStats.recentFeedback.length > 0 ? (
              feedbackStats.recentFeedback.map((feedback) => (
                <div key={feedback.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    {getFeedbackIcon(feedback.type)}
                    <Badge className={getFeedbackTypeColor(feedback.type)}>
                      {feedback.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        Rating: {feedback.rating}/5
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {feedback.feedback && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {feedback.feedback}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No feedback yet. Start giving feedback to help Lumen learn!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Learning Process
          </CardTitle>
          <CardDescription>
            How Lumen learns from your feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Positive Feedback</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Reinforces successful response patterns</li>
                  <li>• Increases confidence in similar contexts</li>
                  <li>• Boosts memory importance scores</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Negative Feedback</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Creates avoidance patterns</li>
                  <li>• Reduces confidence in similar responses</li>
                  <li>• Triggers response strategy adjustment</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Corrections</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Creates new learning patterns</li>
                  <li>• Stores corrected responses as high-value memories</li>
                  <li>• Applies corrections to future similar situations</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Preferences</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Adjusts personality traits</li>
                  <li>• Modifies communication style</li>
                  <li>• Influences future response tone</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}