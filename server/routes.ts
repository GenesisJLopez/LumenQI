import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { lumenAI } from "./services/openai";
import { createLumenCodeGenerator, type CodeGenerationRequest } from "./services/code-generation";
import { personalityEvolution } from "./services/personality-evolution";
import { identityStorage } from "./services/identity-storage";
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

  // OpenAI TTS endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = 'nova', model = 'tts-1', speed = 1.2, response_format = 'mp3' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Clean text: remove emojis and problematic Unicode characters
      const cleanText = text
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        .replace(/[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu, '')
        .replace(/[^\x00-\x7F]/g, '')
        .trim();

      if (!cleanText) {
        return res.status(400).json({ error: "No valid text after cleaning" });
      }

      const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: cleanText,
          voice,
          speed,
          response_format
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI TTS API error:', {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          body: errorText,
          request: { model, input: cleanText, voice, speed, response_format }
        });
        throw new Error(`OpenAI TTS API error: ${openaiResponse.status} - ${errorText}`);
      }

      // Stream the audio response
      const audioBuffer = await openaiResponse.arrayBuffer();
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      });
      
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error('TTS error:', error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // WebSocket handling for real-time chat
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data);
        console.log('Received WebSocket message:', message);
        
        if (message.type === 'chat_message') {
          const { content, conversationId, emotionContext } = message;
          
          // Validate that conversationId is provided
          if (!conversationId) {
            throw new Error('Conversation ID is required');
          }
          
          // Parallel operations for better performance
          const [userMessage, messages, memories] = await Promise.all([
            // Save user message
            storage.createMessage({
              conversationId,
              role: 'user',
              content
            }),
            // Get conversation context (limit to last 8 messages for faster processing)
            storage.getMessagesByConversation(conversationId).then(msgs => 
              msgs.slice(-8).map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            ),
            // Get only 3 most recent memories for faster processing
            storage.getMemoriesByUser(1).then(mems => 
              mems.slice(0, 3).map(memory => ({
                content: memory.content,
                context: memory.context || undefined
              }))
            )
          ]);

          // Generate AI response with emotion context (this is the main bottleneck)
          const aiResponse = await lumenAI.generateResponse(
            content,
            messages,
            memories,
            emotionContext
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
            // Process personality evolution in background
            personalityEvolution.processInteraction({
              userId: 1,
              messageContent: content,
              emotion: emotionContext?.emotion,
              emotionConfidence: emotionContext?.confidence,
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

  return httpServer;
}
