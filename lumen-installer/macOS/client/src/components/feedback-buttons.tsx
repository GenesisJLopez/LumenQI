import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

interface FeedbackButtonsProps {
  messageId: number;
  onFeedbackSubmitted?: () => void;
}

export function FeedbackButtons({ messageId, onFeedbackSubmitted }: FeedbackButtonsProps) {
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correction' | 'preference'>('correction');
  const [rating, setRating] = useState('3');
  const [feedback, setFeedback] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitFeedback = async (type: 'thumbs_up' | 'thumbs_down' | 'correction' | 'preference', additionalData?: any) => {
    setIsSubmitting(true);
    
    try {
      const feedbackData = {
        messageId,
        userId: 1, // Demo user ID
        type,
        rating: type === 'thumbs_up' ? 5 : type === 'thumbs_down' ? 1 : parseInt(rating),
        feedback: additionalData?.feedback || feedback,
        suggestion: additionalData?.suggestion || suggestion,
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast({
        title: "Feedback submitted!",
        description: "Lumen will learn from your feedback to improve future responses.",
      });

      // Reset form
      setFeedback('');
      setSuggestion('');
      setRating('3');
      setShowDetailedFeedback(false);
      
      onFeedbackSubmitted?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFeedback = (type: 'thumbs_up' | 'thumbs_down') => {
    submitFeedback(type);
  };

  const handleDetailedSubmit = () => {
    submitFeedback(feedbackType, { feedback, suggestion });
  };

  return (
    <div className="flex items-center space-x-1 mt-2">
      {/* Quick Feedback Buttons */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleQuickFeedback('thumbs_up')}
        disabled={isSubmitting}
        className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleQuickFeedback('thumbs_down')}
        disabled={isSubmitting}
        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>

      {/* Detailed Feedback Dialog */}
      <Dialog open={showDetailedFeedback} onOpenChange={setShowDetailedFeedback}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Provide Detailed Feedback</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="feedback-type">Feedback Type</Label>
              <RadioGroup value={feedbackType} onValueChange={(value) => setFeedbackType(value as 'correction' | 'preference')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="correction" id="correction" />
                  <Label htmlFor="correction">Correction - Suggest a better response</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="preference" id="preference" />
                  <Label htmlFor="preference">Preference - Adjust communication style</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="rating">Quality Rating (1-5)</Label>
              <RadioGroup value={rating} onValueChange={setRating}>
                <div className="flex space-x-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="flex items-center space-x-2">
                      <RadioGroupItem value={num.toString()} id={`rating-${num}`} />
                      <Label htmlFor={`rating-${num}`}>{num}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="feedback">What could be improved?</Label>
              <Textarea
                id="feedback"
                placeholder="Describe what you'd like to see changed..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-1"
              />
            </div>

            {feedbackType === 'correction' && (
              <div>
                <Label htmlFor="suggestion">Your suggested response</Label>
                <Textarea
                  id="suggestion"
                  placeholder="How would you prefer Lumen to respond?"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDetailedFeedback(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDetailedSubmit}
                disabled={isSubmitting || (!feedback.trim() && feedbackType === 'correction' && !suggestion.trim())}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}