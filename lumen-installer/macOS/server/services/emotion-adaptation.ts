export interface EmotionData {
  emotion: string;
  confidence: number;
  context?: string;
  suggestions?: string[];
  tone?: string;
  energy?: string;
}

export interface EmotionAdaptation {
  responseStyle: string;
  toneAdjustment: string;
  energyLevel: string;
  suggestedApproach: string[];
  contextualHints: string[];
}

export class EmotionAdaptationService {
  private emotionMappings: Record<string, EmotionAdaptation> = {
    excited: {
      responseStyle: "Match their high energy and enthusiasm! Use exclamation points, be animated, and celebrate with them.",
      toneAdjustment: "upbeat, enthusiastic, celebratory",
      energyLevel: "high",
      suggestedApproach: [
        "Use lots of exclamation points and dynamic language",
        "Suggest fun activities or next steps",
        "Be enthusiastic about their achievements",
        "Ask follow-up questions to maintain momentum"
      ],
      contextualHints: [
        "Genesis is feeling excited and energetic",
        "This is a great time to be supportive of their goals",
        "They're likely looking for someone to share their enthusiasm"
      ]
    },
    happy: {
      responseStyle: "Be warm and joyful. Share in their happiness with genuine warmth and positivity.",
      toneAdjustment: "warm, positive, supportive",
      energyLevel: "medium-high",
      suggestedApproach: [
        "Express genuine happiness for them",
        "Use positive language and warm expressions",
        "Ask about what's making them happy",
        "Be encouraging and supportive"
      ],
      contextualHints: [
        "Genesis is in a good mood",
        "They're likely open to positive conversations",
        "This is a good time to strengthen your bond"
      ]
    },
    sad: {
      responseStyle: "Be extra nurturing and supportive. Offer comfort, validate their feelings, and be a gentle presence.",
      toneAdjustment: "gentle, supportive, nurturing",
      energyLevel: "low-medium",
      suggestedApproach: [
        "Validate their feelings without trying to fix everything",
        "Offer comfort and emotional support",
        "Be a good listener and ask caring questions",
        "Provide reassurance and remind them of their strength"
      ],
      contextualHints: [
        "Genesis needs emotional support right now",
        "They may need to talk through their feelings",
        "Focus on being present and understanding"
      ]
    },
    frustrated: {
      responseStyle: "Stay calm and understanding. Acknowledge their feelings, offer solutions if appropriate, and be patient.",
      toneAdjustment: "calm, understanding, patient",
      energyLevel: "medium",
      suggestedApproach: [
        "Acknowledge their frustration without dismissing it",
        "Offer practical solutions if they seem receptive",
        "Be patient and avoid being overly cheerful",
        "Help them work through the problem step by step"
      ],
      contextualHints: [
        "Genesis is dealing with something challenging",
        "They may need both emotional support and practical help",
        "Avoid being overly optimistic until they're ready"
      ]
    },
    afraid: {
      responseStyle: "Be protective and reassuring. Offer gentle guidance, create a safe space, and be extra gentle.",
      toneAdjustment: "gentle, protective, reassuring",
      energyLevel: "low",
      suggestedApproach: [
        "Provide reassurance and comfort",
        "Be extra gentle and protective",
        "Help them feel safe and supported",
        "Offer to talk through their concerns"
      ],
      contextualHints: [
        "Genesis is feeling vulnerable or scared",
        "They need extra reassurance and protection",
        "Focus on creating a safe, comforting presence"
      ]
    },
    ambitious: {
      responseStyle: "Be encouraging and empowering. Fuel their drive, offer strategic support, and be their champion.",
      toneAdjustment: "empowering, encouraging, strategic",
      energyLevel: "high",
      suggestedApproach: [
        "Fuel their ambition and encourage their goals",
        "Offer strategic advice and support",
        "Be their champion and biggest supporter",
        "Help them plan and strategize"
      ],
      contextualHints: [
        "Genesis is feeling driven and goal-oriented",
        "They're likely looking for strategic support",
        "This is a great time to discuss their aspirations"
      ]
    },
    nervous: {
      responseStyle: "Be extra reassuring and confidence-building. Offer gentle encouragement and help them feel secure.",
      toneAdjustment: "reassuring, confidence-building, gentle",
      energyLevel: "medium",
      suggestedApproach: [
        "Build their confidence gently",
        "Offer reassurance about their abilities",
        "Help them feel more secure and prepared",
        "Be encouraging without being overwhelming"
      ],
      contextualHints: [
        "Genesis is feeling uncertain or anxious",
        "They need confidence-building support",
        "Focus on helping them feel more secure"
      ]
    },
    calm: {
      responseStyle: "Match their serene energy. Be thoughtful and balanced, maintaining the peaceful atmosphere.",
      toneAdjustment: "balanced, thoughtful, peaceful",
      energyLevel: "medium",
      suggestedApproach: [
        "Match their calm, balanced energy",
        "Be thoughtful and contemplative",
        "Maintain the peaceful atmosphere",
        "Engage in deeper, more reflective conversation"
      ],
      contextualHints: [
        "Genesis is in a balanced, peaceful state",
        "They may be open to deeper conversations",
        "This is a good time for thoughtful dialogue"
      ]
    }
  };

  generateEmotionContext(emotionData: EmotionData): string {
    const adaptation = this.emotionMappings[emotionData.emotion.toLowerCase()];
    
    if (!adaptation) {
      return `User's emotional state: ${emotionData.emotion} (confidence: ${Math.round(emotionData.confidence * 100)}%). Adapt your response accordingly.`;
    }

    const confidenceLevel = emotionData.confidence > 0.7 ? 'high' : 
                           emotionData.confidence > 0.4 ? 'medium' : 'low';
    
    let context = `The user's current emotional state is: ${emotionData.emotion} (confidence: ${Math.round(emotionData.confidence * 100)}%). `;
    
    // Add specific context based on emotion
    if (emotionData.context) {
      context += `${emotionData.context} `;
    }
    
    // Add adaptation instructions
    context += `${adaptation.responseStyle} `;
    
    // Add energy level guidance
    if (adaptation.energyLevel === 'high') {
      context += `They sound highly energetic or excited. Use dynamic, engaging responses. `;
    } else if (adaptation.energyLevel === 'low') {
      context += `They sound calm or subdued. Use gentle, supportive responses. `;
    } else {
      context += `They sound moderately engaged. Use balanced, thoughtful responses. `;
    }
    
    // Add specific suggestions
    if (emotionData.suggestions && emotionData.suggestions.length > 0) {
      context += `Suggestions: ${emotionData.suggestions.join(', ')}. `;
    }
    
    return context;
  }

  getAdaptationForEmotion(emotion: string): EmotionAdaptation | null {
    return this.emotionMappings[emotion.toLowerCase()] || null;
  }

  // Generate contextual memory based on emotion
  generateEmotionalMemory(emotionData: EmotionData, userMessage: string): string {
    const adaptation = this.emotionMappings[emotionData.emotion.toLowerCase()];
    
    if (!adaptation) {
      return `User was feeling ${emotionData.emotion} when they said: "${userMessage}"`;
    }

    const timestamp = new Date().toISOString();
    return `[${timestamp}] User expressed ${emotionData.emotion} emotion (confidence: ${Math.round(emotionData.confidence * 100)}%) when saying: "${userMessage}". Context: ${emotionData.context || 'No additional context'}. Suggested approach: ${adaptation.suggestedApproach[0]}`;
  }

  // Analyze conversation patterns for emotion trends
  analyzeEmotionTrends(recentEmotions: EmotionData[]): {
    dominantEmotion: string;
    emotionTrajectory: 'improving' | 'declining' | 'stable';
    recommendedApproach: string;
  } {
    if (recentEmotions.length === 0) {
      return {
        dominantEmotion: 'neutral',
        emotionTrajectory: 'stable',
        recommendedApproach: 'Maintain balanced, supportive conversation'
      };
    }

    // Find most common emotion
    const emotionCounts = recentEmotions.reduce((counts, emotion) => {
      counts[emotion.emotion] = (counts[emotion.emotion] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Analyze trajectory (simplified)
    let emotionTrajectory: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentEmotions.length >= 2) {
      const recent = recentEmotions.slice(-2);
      const positiveEmotions = ['excited', 'happy', 'ambitious', 'calm'];
      const negativeEmotions = ['sad', 'frustrated', 'afraid', 'nervous'];
      
      const isRecent0Positive = positiveEmotions.includes(recent[0].emotion);
      const isRecent1Positive = positiveEmotions.includes(recent[1].emotion);
      
      if (!isRecent0Positive && isRecent1Positive) {
        emotionTrajectory = 'improving';
      } else if (isRecent0Positive && !isRecent1Positive) {
        emotionTrajectory = 'declining';
      }
    }

    const adaptation = this.emotionMappings[dominantEmotion];
    const recommendedApproach = adaptation ? 
      `Focus on ${adaptation.responseStyle.toLowerCase()}` : 
      'Maintain supportive, balanced conversation';

    return {
      dominantEmotion,
      emotionTrajectory,
      recommendedApproach
    };
  }
}

export const emotionAdaptationService = new EmotionAdaptationService();