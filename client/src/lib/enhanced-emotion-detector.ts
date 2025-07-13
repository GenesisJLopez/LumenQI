// Enhanced Emotion Detection with Text Analysis
// Includes sad, afraid, and ambitious emotion detection

export interface EmotionData {
  emotion: string;
  confidence: number;
  context: string;
  suggestions: string[];
  tone: string;
  energy: string;
}

export class EnhancedEmotionDetector {
  detectEmotionFromText(text: string): EmotionData {
    const lowercaseText = text.toLowerCase();
    
    // Enhanced emotion patterns with more comprehensive detection
    const emotionPatterns = {
      excited: {
        keywords: ['amazing', 'awesome', 'fantastic', 'great', 'love', 'incredible', 'wonderful', 'brilliant', 'perfect', 'excellent', 'outstanding', 'superb', 'fabulous', 'marvelous', 'spectacular', 'phenomenal', 'extraordinary', 'magnificent', 'terrific', 'splendid'],
        toneIndicators: ['!', '!!!', 'wow', 'omg', 'yes!', 'yay', 'woohoo', 'sweet', 'cool', 'rad'],
        weight: 0.8,
        tone: 'enthusiastic',
        energy: 'high'
      },
      happy: {
        keywords: ['good', 'nice', 'pleasant', 'fun', 'enjoy', 'like', 'glad', 'pleased', 'satisfied', 'content', 'cheerful', 'delighted', 'joyful', 'upbeat', 'positive', 'optimistic', 'bright', 'sunny', 'smile', 'laugh'],
        toneIndicators: [':)', '😊', '😄', '😃', '😁', '😆', '😂', '🙂', '😉', 'haha', 'lol', 'lmao'],
        weight: 0.7,
        tone: 'positive',
        energy: 'medium'
      },
      frustrated: {
        keywords: ['annoying', 'frustrated', 'irritated', 'annoyed', 'angry', 'mad', 'upset', 'bothered', 'aggravated', 'exasperated', 'infuriated', 'irritating', 'maddening', 'vexing', 'irksome', 'troublesome', 'difficult', 'challenging', 'problematic'],
        toneIndicators: ['ugh', 'argh', 'grrr', 'dammit', 'damn', 'shit', 'fuck', 'wtf', 'seriously', 'come on'],
        weight: 0.9,
        tone: 'tense',
        energy: 'high'
      },
      sad: {
        keywords: ['sad', 'depressed', 'down', 'blue', 'unhappy', 'disappointed', 'heartbroken', 'devastated', 'miserable', 'sorrowful', 'melancholy', 'gloomy', 'dejected', 'despondent', 'disheartened', 'crestfallen', 'downcast', 'forlorn', 'mournful', 'grief', 'crying', 'tears', 'hurt', 'pain', 'ache', 'broken'],
        toneIndicators: [':(', '😢', '😭', '😞', '😔', '😟', '😦', '😧', '💔', 'sigh', 'sob', 'cry', 'boo', 'wah'],
        weight: 0.8,
        tone: 'melancholic',
        energy: 'low'
      },
      afraid: {
        keywords: ['afraid', 'scared', 'frightened', 'terrified', 'fearful', 'panicked', 'horrified', 'petrified', 'trembling', 'shaking', 'nightmare', 'terror', 'phobia', 'spooked', 'startled', 'alarmed', 'threatened', 'intimidated', 'vulnerable', 'helpless', 'paranoid', 'dread', 'apprehensive'],
        toneIndicators: ['😨', '😰', '😱', '😖', '😣', 'ahhh', 'eek', 'yikes', 'oh no', 'help me', 'scary', 'gulp'],
        weight: 0.85,
        tone: 'fearful',
        energy: 'high'
      },
      ambitious: {
        keywords: ['ambitious', 'determined', 'driven', 'motivated', 'goal', 'achieve', 'succeed', 'accomplish', 'strive', 'aspire', 'pursue', 'challenge', 'opportunity', 'growth', 'progress', 'advance', 'improve', 'excel', 'compete', 'win', 'conquer', 'overcome', 'push', 'hustle', 'grind', 'focus', 'dedicated', 'committed', 'persistent', 'relentless'],
        toneIndicators: ['let\'s go', 'let\'s do this', 'bring it on', 'game on', 'ready', 'focused', 'determined', 'motivated', 'pumped', 'charged'],
        weight: 0.8,
        tone: 'assertive',
        energy: 'high'
      },
      nervous: {
        keywords: ['nervous', 'anxious', 'worried', 'stressed', 'tense', 'uneasy', 'apprehensive', 'concerned', 'troubled', 'disturbed', 'agitated', 'restless', 'jittery', 'edgy', 'uptight', 'overwhelmed', 'uncertain', 'doubtful', 'hesitant', 'insecure'],
        toneIndicators: ['um', 'uh', 'err', 'hmm', '...', 'gulp', 'yikes', 'oh no', 'help', 'idk', 'maybe', 'i think'],
        weight: 0.7,
        tone: 'uncertain',
        energy: 'medium'
      },
      calm: {
        keywords: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'composed', 'collected', 'cool', 'level-headed', 'balanced', 'centered', 'steady', 'stable', 'even-tempered', 'unruffled', 'placid', 'mild', 'gentle', 'quiet', 'still'],
        toneIndicators: ['okay', 'alright', 'fine', 'sure', 'yeah', 'mhm', 'mmm', 'I see', 'understood', 'got it'],
        weight: 0.6,
        tone: 'balanced',
        energy: 'low'
      }
    };

    // Calculate emotion scores
    const emotionScores: { [key: string]: number } = {};
    
    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      let score = 0;
      
      // Check keywords
      for (const keyword of pattern.keywords) {
        if (lowercaseText.includes(keyword)) {
          score += pattern.weight;
        }
      }
      
      // Check tone indicators
      for (const indicator of pattern.toneIndicators) {
        if (lowercaseText.includes(indicator)) {
          score += pattern.weight * 0.8;
        }
      }
      
      emotionScores[emotion] = score;
    }

    // Find the dominant emotion
    const dominantEmotion = Object.entries(emotionScores)
      .reduce((a, b) => emotionScores[a[0]] > emotionScores[b[0]] ? a : b)[0];

    const confidence = Math.min(emotionScores[dominantEmotion] || 0, 1.0);
    const pattern = emotionPatterns[dominantEmotion as keyof typeof emotionPatterns];

    // Generate contextual suggestions based on emotion
    const suggestions = this.generateSuggestions(dominantEmotion, confidence);

    return {
      emotion: dominantEmotion,
      confidence,
      context: this.generateContext(dominantEmotion, confidence),
      suggestions,
      tone: pattern?.tone || 'neutral',
      energy: pattern?.energy || 'medium'
    };
  }

  private generateSuggestions(emotion: string, confidence: number): string[] {
    const suggestionMap: { [key: string]: string[] } = {
      excited: [
        'Match the energy and enthusiasm',
        'Use exclamation points and vibrant language',
        'Share in the excitement'
      ],
      happy: [
        'Maintain positive and upbeat tone',
        'Use encouraging language',
        'Keep the mood light and pleasant'
      ],
      frustrated: [
        'Acknowledge the frustration',
        'Offer practical solutions',
        'Use calm and patient tone'
      ],
      sad: [
        'Show empathy and understanding',
        'Use gentle, comforting language',
        'Avoid being overly cheerful'
      ],
      afraid: [
        'Provide reassurance and comfort',
        'Use calming, protective language',
        'Offer support and understanding'
      ],
      ambitious: [
        'Match the drive and energy',
        'Focus on actionable steps',
        'Encourage goal achievement'
      ],
      nervous: [
        'Provide reassurance',
        'Use clear, simple language',
        'Offer step-by-step guidance'
      ],
      calm: [
        'Maintain steady, balanced tone',
        'Provide thoughtful responses',
        'Keep interactions peaceful'
      ]
    };

    return suggestionMap[emotion] || [
      'Adapt response to user\'s emotional state',
      'Use appropriate tone and energy',
      'Provide relevant support'
    ];
  }

  private generateContext(emotion: string, confidence: number): string {
    const contextMap: { [key: string]: string } = {
      excited: 'User is highly energetic and enthusiastic',
      happy: 'User is in a positive, pleasant mood',
      frustrated: 'User is experiencing irritation or anger',
      sad: 'User is feeling down or disappointed',
      afraid: 'User is experiencing fear or anxiety',
      ambitious: 'User is motivated and goal-oriented',
      nervous: 'User is feeling anxious or uncertain',
      calm: 'User is in a balanced, peaceful state'
    };

    const confidenceLevel = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';
    
    return `${contextMap[emotion] || 'User emotion unclear'} (confidence: ${confidenceLevel})`;
  }
}

export const enhancedEmotionDetector = new EnhancedEmotionDetector();