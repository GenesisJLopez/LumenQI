import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface VisionAnalysis {
  timestamp: string;
  description: string;
  objects: string[];
  people: string[];
  emotions: string[];
  actions: string[];
  environment: string;
  confidence: number;
}

export class VisionAnalysisService {
  private static instance: VisionAnalysisService;
  private analysisHistory: VisionAnalysis[] = [];

  private constructor() {}

  static getInstance(): VisionAnalysisService {
    if (!VisionAnalysisService.instance) {
      VisionAnalysisService.instance = new VisionAnalysisService();
    }
    return VisionAnalysisService.instance;
  }

  async analyzeImage(imageData: string, mode: 'realtime' | 'detailed' = 'detailed'): Promise<VisionAnalysis> {
    try {
      // Handle different image formats properly
      let processedImageData = imageData;
      
      // If it's already a data URL, validate and potentially convert format
      if (imageData.startsWith('data:image/')) {
        const formatMatch = imageData.match(/data:image\/([^;]+)/);
        const format = formatMatch ? formatMatch[1] : 'jpeg';
        
        // Ensure we're using a supported format
        const supportedFormats = ['png', 'jpeg', 'jpg', 'gif', 'webp'];
        if (!supportedFormats.includes(format.toLowerCase())) {
          console.log(`Converting unsupported format ${format} to jpeg`);
          // Replace the mime type with jpeg
          processedImageData = imageData.replace(/data:image\/[^;]+/, 'data:image/jpeg');
        } else {
          // Normalize format name (jpg -> jpeg)
          if (format.toLowerCase() === 'jpg') {
            processedImageData = imageData.replace(/data:image\/jpg/, 'data:image/jpeg');
          } else {
            processedImageData = imageData;
          }
        }
      } else {
        // If it's just base64, add the proper JPEG prefix
        processedImageData = `data:image/jpeg;base64,${imageData}`;
      }
      
      // Validate the image data
      if (!processedImageData || !processedImageData.includes('base64,')) {
        throw new Error('Invalid image data format');
      }
      
      // Additional validation - check if base64 data is valid
      const base64Data = processedImageData.split('base64,')[1];
      if (!base64Data || base64Data.length < 100) {
        throw new Error('Invalid or corrupted image data');
      }
      
      const prompt = mode === 'realtime' 
        ? this.getRealtimePrompt()
        : this.getDetailedPrompt();

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are Lumen QI, an advanced AI with vision capabilities. Analyze images with precision and provide insights in the requested JSON format."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: processedImageData
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: mode === 'realtime' ? 500 : 1000,
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      const analysis: VisionAnalysis = {
        timestamp: new Date().toISOString(),
        description: result.description || 'No description available',
        objects: result.objects || [],
        people: result.people || [],
        emotions: result.emotions || [],
        actions: result.actions || [],
        environment: result.environment || 'Unknown environment',
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1)
      };

      // Store in history (keep last 50 analyses)
      this.analysisHistory.unshift(analysis);
      if (this.analysisHistory.length > 50) {
        this.analysisHistory = this.analysisHistory.slice(0, 50);
      }

      return analysis;
    } catch (error) {
      console.error('Vision analysis error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('invalid_image_format')) {
          throw new Error("Image format not supported. Please use PNG, JPEG, GIF, or WebP format.");
        } else if (error.message.includes('image_too_large')) {
          throw new Error("Image is too large. Please use a smaller image.");
        } else if (error.message.includes('Invalid image data format')) {
          throw new Error("Invalid image data received. Please try capturing the image again.");
        }
      }
      
      throw new Error("Failed to analyze image. Please try again with a different image.");
    }
  }

  private getRealtimePrompt(): string {
    return `Analyze this image quickly and provide a JSON response with the following structure:
{
  "description": "Brief description of what you see",
  "objects": ["array", "of", "objects"],
  "people": ["descriptions", "of", "people"],
  "emotions": ["detected", "emotions"],
  "actions": ["observed", "actions"],
  "environment": "description of the environment/setting",
  "confidence": 0.85
}

Focus on the most important elements. Be concise but accurate.`;
  }

  private getDetailedPrompt(): string {
    return `Analyze this image thoroughly and provide a comprehensive JSON response with the following structure:
{
  "description": "Detailed description of what you see in the image",
  "objects": ["comprehensive", "list", "of", "objects", "and", "items"],
  "people": ["detailed", "descriptions", "of", "people", "including", "appearance", "and", "posture"],
  "emotions": ["detected", "emotions", "and", "facial", "expressions"],
  "actions": ["observed", "actions", "and", "activities"],
  "environment": "detailed description of the environment, lighting, setting, and atmosphere",
  "confidence": 0.85
}

Provide rich, detailed analysis including:
- Physical appearance and characteristics
- Facial expressions and body language
- Activities and interactions
- Environmental context and atmosphere
- Lighting and visual qualities
- Any text or signs visible
- Colors, textures, and composition

Be thorough but keep arrays concise with the most relevant items.`;
  }

  getAnalysisHistory(): VisionAnalysis[] {
    return this.analysisHistory;
  }

  getRecentAnalysis(count: number = 10): VisionAnalysis[] {
    return this.analysisHistory.slice(0, count);
  }

  clearHistory(): void {
    this.analysisHistory = [];
  }

  getAnalysisStats(): {
    totalAnalyses: number;
    averageConfidence: number;
    mostCommonObjects: string[];
    analysisTimeRange: { first: string; last: string } | null;
  } {
    if (this.analysisHistory.length === 0) {
      return {
        totalAnalyses: 0,
        averageConfidence: 0,
        mostCommonObjects: [],
        analysisTimeRange: null
      };
    }

    const averageConfidence = this.analysisHistory.reduce((sum, analysis) => sum + analysis.confidence, 0) / this.analysisHistory.length;
    
    const objectCounts: Record<string, number> = {};
    this.analysisHistory.forEach(analysis => {
      analysis.objects.forEach(obj => {
        objectCounts[obj] = (objectCounts[obj] || 0) + 1;
      });
    });

    const mostCommonObjects = Object.entries(objectCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([obj]) => obj);

    return {
      totalAnalyses: this.analysisHistory.length,
      averageConfidence,
      mostCommonObjects,
      analysisTimeRange: {
        first: this.analysisHistory[this.analysisHistory.length - 1].timestamp,
        last: this.analysisHistory[0].timestamp
      }
    };
  }
}

export const visionAnalysisService = VisionAnalysisService.getInstance();