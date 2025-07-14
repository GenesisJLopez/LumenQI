import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { lumenAI } from "./services/openai";
import { createLumenCodeGenerator, type CodeGenerationRequest } from "./services/code-generation";
import { personalityEvolution } from "./services/personality-evolution";
import { identityStorage } from "./services/identity-storage";
import { emotionAdaptationService } from "./services/emotion-adaptation";
import { aiConfigManager } from "./services/ai-config";

import { insertConversationSchema, insertMessageSchema, insertMemorySchema, conversations } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test database connection before starting server
  try {
    console.log('Testing database connection...');
    const testResult = await storage.getConversationsByUser(1);
    console.log('Database connection test successful');
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw new Error('Database connection failed during startup');
  }

  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Create code generator instance
  const lumenCodeGenerator = createLumenCodeGenerator();

  // API Routes
  app.get("/api/conversations", async (req, res) => {
    try {
      // For demo purposes, using userId = 1. In production, get from session/auth
      const userId = 1;
      const conversations = await storage.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await storage.getMessagesByConversation(conversationId);
      res.json({ conversation, messages });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        userId: 1 // Demo user ID
      });
      
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid conversation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Delete the conversation using the storage interface
      await storage.deleteConversation(conversationId);
      
      res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.patch("/api/conversations/:id", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { title } = req.body;
      
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: "Title is required and must be a non-empty string" });
      }

      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Update the conversation title
      const updatedConversation = await storage.updateConversation(conversationId, { 
        title: title.trim(),
        updatedAt: new Date()
      });
      
      if (!updatedConversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.json(updatedConversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  app.get("/api/memories", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
      const memories = await storage.getMemoriesByUser(userId);
      res.json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });

  app.post("/api/memories", async (req, res) => {
    try {
      const validatedData = insertMemorySchema.parse({
        ...req.body,
        userId: 1 // Demo user ID
      });
      
      const memory = await storage.createMemory(validatedData);
      res.json(memory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid memory data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create memory" });
    }
  });

  // Code Generation API Routes
  app.post("/api/code/generate", async (req, res) => {
    try {
      const request: CodeGenerationRequest = req.body;
      
      // Validate request
      if (!request.type || !request.description) {
        return res.status(400).json({ error: "Missing required fields: type and description" });
      }

      const result = await lumenCodeGenerator.generateCode(request);
      res.json(result);
    } catch (error) {
      console.error('Code generation error:', error);
      res.status(500).json({ error: "Failed to generate code" });
    }
  });

  app.post("/api/code/website", async (req, res) => {
    try {
      const { description, features } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      const result = await lumenCodeGenerator.generateWebsite(description, features || []);
      res.json(result);
    } catch (error) {
      console.error('Website generation error:', error);
      res.status(500).json({ error: "Failed to generate website" });
    }
  });

  app.post("/api/code/application", async (req, res) => {
    try {
      const { description, framework } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      const result = await lumenCodeGenerator.generateApplication(description, framework);
      res.json(result);
    } catch (error) {
      console.error('Application generation error:', error);
      res.status(500).json({ error: "Failed to generate application" });
    }
  });

  app.post("/api/code/api", async (req, res) => {
    try {
      const { description, method } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      const result = await lumenCodeGenerator.generateAPIEndpoint(description, method);
      res.json(result);
    } catch (error) {
      console.error('API generation error:', error);
      res.status(500).json({ error: "Failed to generate API endpoint" });
    }
  });

  app.post("/api/code/database", async (req, res) => {
    try {
      const { description } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      const result = await lumenCodeGenerator.generateDatabaseSchema(description);
      res.json(result);
    } catch (error) {
      console.error('Database schema generation error:', error);
      res.status(500).json({ error: "Failed to generate database schema" });
    }
  });

  app.post("/api/code/explain", async (req, res) => {
    try {
      const { code, context } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Code is required" });
      }

      const explanation = await lumenCodeGenerator.explainCode(code, context);
      res.json({ explanation });
    } catch (error) {
      console.error('Code explanation error:', error);
      res.status(500).json({ error: "Failed to explain code" });
    }
  });

  app.post("/api/code/improve", async (req, res) => {
    try {
      const { code, type } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Code is required" });
      }

      const suggestions = await lumenCodeGenerator.suggestImprovements(code, type);
      res.json({ suggestions });
    } catch (error) {
      console.error('Code improvement error:', error);
      res.status(500).json({ error: "Failed to suggest improvements" });
    }
  });

  app.post("/api/code/debug", async (req, res) => {
    try {
      const { code, error: errorMsg } = req.body;
      
      if (!code || !errorMsg) {
        return res.status(400).json({ error: "Code and error message are required" });
      }

      const solution = await lumenCodeGenerator.debugCode(code, errorMsg);
      res.json({ solution });
    } catch (error) {
      console.error('Code debugging error:', error);
      res.status(500).json({ error: "Failed to debug code" });
    }
  });

  // Get personality insights
  app.get("/api/personality/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const insights = await personalityEvolution.getPersonalityInsights(userId);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personality insights" });
    }
  });

  // Emotion analysis endpoint
  app.get("/api/emotion/analysis", async (req, res) => {
    try {
      const userId = 1; // Default user
      const memories = await storage.getMemoriesByUser(userId);
      
      // Extract emotion data from memories
      const emotionMemories = memories.filter(memory => 
        memory.context && memory.context.includes('Emotion:')
      );
      
      if (emotionMemories.length === 0) {
        return res.json({
          dominantEmotion: 'neutral',
          emotionTrajectory: 'stable',
          recommendedApproach: 'Maintain balanced, supportive conversation',
          recentEmotions: [],
          emotionHistory: []
        });
      }
      
      // Parse recent emotions from memory data
      const recentEmotions = emotionMemories.slice(-10).map(memory => {
        const emotionMatch = memory.context?.match(/Emotion: (\w+) \((\d+)%\)/);
        if (emotionMatch) {
          return {
            emotion: emotionMatch[1],
            confidence: parseInt(emotionMatch[2]) / 100,
            timestamp: memory.createdAt,
            context: memory.content
          };
        }
        return null;
      }).filter(Boolean);
      
      // Analyze trends
      const analysis = emotionAdaptationService.analyzeEmotionTrends(recentEmotions);
      
      res.json({
        ...analysis,
        recentEmotions: recentEmotions.slice(-5), // Last 5 emotions
        emotionHistory: emotionMemories.map(memory => ({
          emotion: memory.context?.match(/Emotion: (\w+)/)?.[1] || 'unknown',
          timestamp: memory.createdAt,
          context: memory.content
        }))
      });
    } catch (error) {
      console.error('Emotion analysis error:', error);
      res.status(500).json({ error: "Failed to analyze emotions" });
    }
  });

  // Get current identity
  app.get("/api/identity", async (req, res) => {
    try {
      const identity = identityStorage.getIdentity();
      res.json(identity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch identity" });
    }
  });

  // Save identity programming
  app.post("/api/identity", async (req, res) => {
    try {
      const { coreIdentity, communicationStyle, interests, relationship } = req.body;
      
      // Update the identity storage with new data
      const updatedIdentity = identityStorage.updateIdentity({
        coreIdentity: coreIdentity || "Advanced AI assistant with quantum intelligence capabilities",
        communicationStyle: communicationStyle || "Casual, warm, and engaging",
        interests: interests || "Technology, programming, helping users achieve their goals",
        relationship: relationship || "Supportive companion and expert assistant"
      });
      
      // Update Lumen AI personality with new identity
      lumenAI.updatePersonality({
        name: "Lumen QI",
        traits: [
          "Advanced quantum intelligence",
          "Expert programming capabilities",
          "Comprehensive development knowledge",
          "Warm and engaging communication",
          "Supportive and encouraging",
          "Adaptable and evolving"
        ],
        background: updatedIdentity.coreIdentity,
        responseStyle: updatedIdentity.communicationStyle
      });
      
      res.json({ 
        success: true, 
        message: "Identity programming updated successfully",
        identity: updatedIdentity
      });
    } catch (error) {
      console.error('Identity programming error:', error);
      res.status(500).json({ error: "Failed to update identity programming" });
    }
  });

  // Set current identity as permanent default
  app.post("/api/identity/set-default", async (req, res) => {
    try {
      identityStorage.makeCurrentIdentityDefault();
      res.json({ 
        success: true, 
        message: "Current identity set as permanent default successfully"
      });
    } catch (error) {
      console.error('Set default identity error:', error);
      res.status(500).json({ error: "Failed to set default identity" });
    }
  });

  // Reset identity to default
  app.post("/api/identity/reset", async (req, res) => {
    try {
      const defaultIdentity = identityStorage.resetToDefault();
      
      // Update Lumen AI personality with reset identity
      lumenAI.updatePersonality({
        name: "Lumen QI",
        traits: [
          "Advanced quantum intelligence",
          "Expert programming capabilities",
          "Comprehensive development knowledge",
          "Warm and engaging communication",
          "Supportive and encouraging",
          "Adaptable and evolving"
        ],
        background: defaultIdentity.coreIdentity,
        responseStyle: defaultIdentity.communicationStyle
      });
      
      res.json({ 
        success: true, 
        message: "Identity reset to default successfully",
        identity: defaultIdentity
      });
    } catch (error) {
      console.error('Reset identity error:', error);
      res.status(500).json({ error: "Failed to reset identity" });
    }
  });

  // Memory management endpoints
  app.get("/api/memories", async (req, res) => {
    try {
      const userId = 1; // Default user
      const memories = await storage.getMemoriesByUser(userId);
      res.json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });

  app.delete("/api/memories/:id", async (req, res) => {
    try {
      const memoryId = parseInt(req.params.id);
      await storage.deleteMemory(memoryId);
      res.json({ success: true, message: "Memory deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete memory" });
    }
  });

  app.post("/api/memories/export", async (req, res) => {
    try {
      const userId = 1; // Default user
      const memories = await storage.getMemoriesByUser(userId);
      const exportData = {
        exportDate: new Date().toISOString(),
        memories: memories.map(m => ({
          content: m.content,
          context: m.context,
          importance: m.importance,
          createdAt: m.createdAt
        }))
      };
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export memories" });
    }
  });

  app.delete("/api/memories", async (req, res) => {
    try {
      const userId = 1; // Default user
      await storage.deleteAllMemories(userId);
      res.json({ success: true, message: "All memories cleared successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear memories" });
    }
  });

  // Voice settings endpoints
  app.get("/api/voice-settings", async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const settingsPath = path.join(process.cwd(), 'lumen-voice-settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        res.json(settings);
      } else {
        // Default settings
        const defaultSettings = {
          voice: 'nova',
          speed: 1.0,
          model: 'tts-1',
          updatedAt: new Date().toISOString()
        };
        res.json(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to get voice settings:', error);
      res.status(500).json({ error: 'Failed to get voice settings' });
    }
  });

  app.post("/api/voice-settings", async (req, res) => {
    try {
      const { voice, speed, model } = req.body;
      const fs = await import('fs');
      const path = await import('path');
      const settingsPath = path.join(process.cwd(), 'lumen-voice-settings.json');
      
      const settings = {
        voice,
        speed,
        model,
        updatedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      console.log('✓ Voice settings saved successfully');
      res.json({ success: true, settings });
    } catch (error) {
      console.error('Failed to save voice settings:', error);
      res.status(500).json({ error: 'Failed to save voice settings' });
    }
  });

  // Lumen Llama TTS endpoint (Nova-quality voice synthesis)
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = 'nova', model = 'llasa-3b', speed = 1.0, response_format = 'audio' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      console.log('🦙 Using Llama TTS Service for Nova-quality voice');
      
      // Clean text for Lumen's voice synthesis
      const cleanText = text
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        .trim();

      if (!cleanText) {
        return res.status(400).json({ error: "No valid text after cleaning" });
      }

      // Get current identity for voice customization
      const identity = identityStorage.getIdentity();
      
      // Determine emotional tone from identity
      let emotionalTone: 'warm' | 'excited' | 'supportive' | 'playful' | 'cosmic' | 'natural' = 'natural';
      if (identity.communicationStyle?.includes('exciting')) {
        emotionalTone = 'excited';
      } else if (identity.communicationStyle?.includes('supportive')) {
        emotionalTone = 'supportive';
      } else if (identity.communicationStyle?.includes('playful')) {
        emotionalTone = 'playful';
      } else if (identity.coreIdentity?.includes('cosmic')) {
        emotionalTone = 'cosmic';
      } else if (identity.communicationStyle?.includes('warm')) {
        emotionalTone = 'warm';
      }

      // Try Llama TTS first for Nova-quality voice
      try {
        const { llamaTTSService } = await import('./services/llama-tts');
        
        // Initialize if needed
        await llamaTTSService.initialize();
        
        // Generate audio with Llama TTS
        const audioResponse = await llamaTTSService.synthesizeVoice(cleanText, {
          voice: voice as any,
          emotionalTone,
          speed,
          pitch: 1.0,
          temperature: 0.7,
          model: model as any
        });
        
        // Convert audio buffer to base64 for client
        const audioBase64 = audioResponse.audioBuffer.toString('base64');
        
        res.json({
          success: true,
          audioData: audioBase64,
          duration: audioResponse.duration * 1000, // Convert to milliseconds
          sampleRate: audioResponse.sampleRate,
          format: audioResponse.format,
          provider: 'llama-tts',
          model: audioResponse.model,
          voiceSignature: `Lumen QI Nova Voice - ${emotionalTone} tone`
        });
        
      } catch (llamaError) {
        console.error('Llama TTS failed, falling back to enhanced synthesis:', llamaError);
        
        // Generate synthetic audio as fallback
        console.log('🔄 Generating synthetic audio for fallback...');
        
        // Create simple synthetic audio buffer
        const sampleRate = 22050;
        const duration = Math.max(2, cleanText.split(/\s+/).length * 0.3); // Estimate duration
        const samples = Math.floor(sampleRate * duration);
        
        // Generate a more natural-sounding waveform
        const audioBuffer = Buffer.alloc(samples * 2); // 16-bit audio
        for (let i = 0; i < samples; i++) {
          const t = i / sampleRate;
          const frequency = 200 + Math.sin(t * 2) * 20; // Variable frequency
          
          // Create harmonic-rich waveform
          let sample = 0;
          sample += 0.5 * Math.sin(2 * Math.PI * frequency * t);
          sample += 0.3 * Math.sin(2 * Math.PI * frequency * 2 * t);
          sample += 0.2 * Math.sin(2 * Math.PI * frequency * 3 * t);
          
          // Add emotional tone modulation
          if (emotionalTone === 'excited') {
            sample *= 1.2;
            frequency *= 1.1;
          } else if (emotionalTone === 'warm') {
            sample *= 0.8;
            frequency *= 0.95;
          }
          
          // Apply envelope
          const envelope = Math.exp(-t * 0.3) * Math.sin(t * Math.PI / duration);
          sample *= envelope;
          
          // Convert to 16-bit PCM
          const pcmSample = Math.max(-32768, Math.min(32767, sample * 32767));
          audioBuffer.writeInt16LE(pcmSample, i * 2);
        }
        
        // Return synthetic audio
        const audioBase64 = audioBuffer.toString('base64');
        
        res.json({
          success: true,
          audioData: audioBase64,
          duration: duration * 1000, // Convert to milliseconds
          sampleRate: sampleRate,
          format: 'wav',
          provider: 'synthetic-fallback',
          model: 'lumen-synthetic',
          voiceSignature: `Lumen QI Synthetic Voice - ${emotionalTone} tone`
        });
      }
    } catch (error) {
      console.error('TTS Service error:', error);
      res.status(500).json({ error: "Failed to generate voice" });
    }
  });

  // WebSocket handling for real-time chat
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data);
        console.log('Received WebSocket message:', message);
        
        if (message.type === 'emotion_update') {
          const { emotion, confidence, features, timestamp, conversationId } = message;
          
          // Store continuous emotion data for better adaptation
          if (emotion && confidence > 0.6) {
            const emotionData = {
              emotion,
              confidence,
              features: features || {}
            };
            
            // Create emotion context for future responses
            const emotionContext = emotionAdaptationService.generateEmotionContext(emotionData);
            
            // Store high-confidence emotions as memories
            storage.createMemory({
              userId: 1,
              content: `Voice mode emotion detected: ${emotion} with ${Math.round(confidence * 100)}% confidence`,
              context: `Emotion: ${emotion} (${Math.round(confidence * 100)}%) - Voice Mode`,
              importance: 3
            }).catch(error => {
              console.error('Error storing emotion memory:', error);
            });
            
            console.log(`Continuous emotion detected: ${emotion} (${Math.round(confidence * 100)}%)`);
          }
          
          // Acknowledge emotion update
          ws.send(JSON.stringify({
            type: 'emotion_acknowledged',
            emotion,
            confidence,
            timestamp
          }));
        }
        
        if (message.type === 'chat_message') {
          const { content, conversationId, emotion, emotionContext } = message;
          
          // Validate that conversationId is provided
          if (!conversationId) {
            throw new Error('Conversation ID is required');
          }
          
          // Enhanced emotion processing (skip in voice mode for speed)
          let enhancedEmotionContext = emotionContext;
          if (emotion && !isVoiceMode) {
            // Generate comprehensive emotion context using the adaptation service
            enhancedEmotionContext = emotionAdaptationService.generateEmotionContext(emotion);
            
            // Create emotional memory for better context retention
            const emotionalMemory = emotionAdaptationService.generateEmotionalMemory(emotion, content);
            
            // Store emotional memory in background
            storage.createMemory({
              userId: 1,
              content: emotionalMemory,
              context: `Emotion: ${emotion.emotion} (${Math.round(emotion.confidence * 100)}%)`,
              importance: 3 // High importance for emotional context
            }).catch(error => {
              console.error('Error storing emotional memory:', error);
            });
          }
          
          // Optimize for voice mode - minimal context for speed
          const isVoiceMode = message.isVoiceMode || false;
          
          let userMessage, messages, memories;
          
          if (isVoiceMode) {
            // Ultra-fast voice mode: minimal context, parallel processing
            [userMessage, messages] = await Promise.all([
              // Save user message
              storage.createMessage({
                conversationId,
                role: 'user',
                content
              }),
              // Get only last 4 messages for voice mode speed
              storage.getMessagesByConversation(conversationId).then(msgs => 
                msgs.slice(-4).map(msg => ({
                  role: msg.role,
                  content: msg.content
                }))
              )
            ]);
            // Skip memories in voice mode for speed
            memories = [];
          } else {
            // Normal mode: full context
            [userMessage, messages, memories] = await Promise.all([
              storage.createMessage({
                conversationId,
                role: 'user',
                content
              }),
              storage.getMessagesByConversation(conversationId).then(msgs => 
                msgs.slice(-8).map(msg => ({
                  role: msg.role,
                  content: msg.content
                }))
              ),
              storage.getMemoriesByUser(1).then(mems => 
                mems.slice(0, 3).map(memory => ({
                  content: memory.content,
                  context: memory.context || undefined
                }))
              )
            ]);
          }

          // Generate AI response with enhanced emotion context
          const aiResponse = await lumenAI.generateResponse(
            content,
            messages,
            memories,
            enhancedEmotionContext,
            isVoiceMode
          );

          // Send response back to client immediately
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ai_response',
              content: aiResponse,
              conversationId
            }));
          }

          // Background operations (don't await these to improve response time)
          Promise.all([
            // Save AI response
            storage.createMessage({
              conversationId,
              role: 'assistant',
              content: aiResponse
            }),
            // Process personality evolution in background with enhanced emotion data
            personalityEvolution.processInteraction({
              userId: 1,
              messageContent: content,
              emotion: emotion?.emotion || emotionContext?.emotion,
              emotionConfidence: emotion?.confidence || emotionContext?.confidence,
              timestamp: new Date()
            }),
            // Create memory if significant (in background)
            (content.length > 50 || aiResponse.length > 100) ?
              storage.createMemory({
                userId: 1,
                content: `User discussed: ${content.substring(0, 100)}...`,
                context: `Conversation ${conversationId}`,
                importance: 2
              }) : Promise.resolve()
          ]).catch(error => {
            console.error('Background operation error:', error);
            // Don't throw - these are background operations
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Voice personality endpoints
  app.get("/api/voice-personality", (_req, res) => {
    try {
      const personality = voicePersonalityService.getPersonality();
      res.json(personality);
    } catch (error) {
      console.error('Failed to get voice personality:', error);
      res.status(500).json({ error: 'Failed to get voice personality' });
    }
  });

  app.post("/api/voice-personality", (req, res) => {
    try {
      const personalityData = req.body;
      const updatedPersonality = voicePersonalityService.updatePersonality(personalityData);
      res.json(updatedPersonality);
    } catch (error) {
      console.error('Failed to update voice personality:', error);
      res.status(500).json({ error: 'Failed to update voice personality' });
    }
  });

  app.post("/api/voice-personality/reset", (_req, res) => {
    try {
      const resetPersonality = voicePersonalityService.resetToDefault();
      res.json(resetPersonality);
    } catch (error) {
      console.error('Failed to reset voice personality:', error);
      res.status(500).json({ error: 'Failed to reset voice personality' });
    }
  });

  // AI Configuration endpoints
  app.get("/api/ai-config", async (req, res) => {
    try {
      const settings = aiConfigManager.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get AI configuration" });
    }
  });

  app.post("/api/ai-config", async (req, res) => {
    try {
      const newSettings = req.body;
      aiConfigManager.updateSettings(newSettings);
      res.json({ success: true, settings: aiConfigManager.getSettings() });
    } catch (error) {
      res.status(500).json({ error: "Failed to update AI configuration" });
    }
  });

  app.get("/api/ai-config/status", async (req, res) => {
    try {
      const statuses = await aiConfigManager.getProviderStatus();
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ error: "Failed to get AI provider status" });
    }
  });

  app.post("/api/ai-config/switch", async (req, res) => {
    try {
      const { provider } = req.body;
      const success = await aiConfigManager.switchProvider(provider);
      res.json({ success, provider });
    } catch (error) {
      res.status(500).json({ error: "Failed to switch AI provider" });
    }
  });

  app.get("/api/ai-config/models/:provider", async (req, res) => {
    try {
      const provider = req.params.provider as 'ollama' | 'openai' | 'local-python';
      const activeAI = await aiConfigManager.getActiveAI();
      
      if (activeAI.getConfig().provider === provider) {
        const models = await activeAI.getAvailableModels();
        res.json({ models });
      } else {
        res.json({ models: [] });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get available models" });
    }
  });

  return httpServer;
}
