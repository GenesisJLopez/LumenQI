import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { lumenAI } from "./services/openai";
import { createLumenCodeGenerator, type CodeGenerationRequest } from "./services/code-generation";
import { webSearchService } from "./services/web-search";
import { systemAwarenessService } from "./services/system-awareness";
import { personalityEvolution } from "./services/personality-evolution";
import { identityStorage } from "./services/identity-storage";
import { emotionAdaptationService } from "./services/emotion-adaptation";
import { aiConfigManager } from "./services/ai-config";
import { lumenBrain } from "./services/lumen-brain";
import { backupSystem } from "./services/backup-system";

import { insertConversationSchema, insertMessageSchema, insertMemorySchema, insertFeedbackSchema, conversations } from "@shared/schema";
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

  // Generate conversation title endpoint
  app.post("/api/conversations/:id/generate-title", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      
      if (messages.length === 0) {
        return res.json({ title: "New Chat" });
      }
      
      // Get first user message for title generation
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      if (!firstUserMessage) {
        return res.json({ title: "New Chat" });
      }
      
      // Generate a short, descriptive title (max 4-5 words)
      const titlePrompt = `Generate a very short, descriptive title (maximum 4-5 words) for this conversation based on the first message. Be concise and clear.

First message: "${firstUserMessage.content}"

Respond with only the title, no quotes or additional text.`;
      
      const titleResponse = await lumenAI.generateResponse(titlePrompt, [], [], undefined, false);
      const title = titleResponse.substring(0, 50).trim(); // Limit to 50 characters
      
      // Update conversation title
      await storage.updateConversation(conversationId, { title });
      
      res.json({ title });
    } catch (error) {
      console.error('Title generation error:', error);
      res.status(500).json({ error: "Failed to generate title" });
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

  // Feedback API endpoints
  app.post("/api/feedback", async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        userId: 1 // Demo user ID
      });
      const feedback = await storage.createFeedback(feedbackData);
      res.json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid feedback data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create feedback" });
    }
  });

  app.get("/api/feedback/message/:messageId", async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const feedbacks = await storage.getFeedbacksByMessage(messageId);
      res.json(feedbacks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  app.get("/api/feedback/unprocessed", async (req, res) => {
    try {
      const feedbacks = await storage.getUnprocessedFeedbacks();
      res.json(feedbacks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unprocessed feedback" });
    }
  });

  // System awareness endpoints
  app.get("/api/system/architecture", async (req, res) => {
    try {
      const overview = await systemAwarenessService.getSystemOverview();
      res.json({ overview });
    } catch (error) {
      console.error('System architecture error:', error);
      res.status(500).json({ error: "Failed to get system architecture" });
    }
  });

  app.get("/api/system/health", async (req, res) => {
    try {
      const health = await systemAwarenessService.analyzeSystemHealth();
      res.json(health);
    } catch (error) {
      console.error('System health error:', error);
      res.status(500).json({ error: "Failed to analyze system health" });
    }
  });

  app.get("/api/system/file/:filePath", async (req, res) => {
    try {
      const filePath = req.params.filePath.replace(/~/g, '/');
      const content = await systemAwarenessService.getFileContent(filePath);
      if (content) {
        res.json({ content });
      } else {
        res.status(404).json({ error: "File not found" });
      }
    } catch (error) {
      console.error('File read error:', error);
      res.status(500).json({ error: "Failed to read file" });
    }
  });

  app.post("/api/system/modify", async (req, res) => {
    try {
      const { filePath, content } = req.body;
      
      if (!filePath || !content) {
        return res.status(400).json({ error: "File path and content are required" });
      }

      const success = await systemAwarenessService.modifyFile(filePath, content);
      if (success) {
        res.json({ success: true, message: "File modified successfully" });
      } else {
        res.status(500).json({ error: "Failed to modify file" });
      }
    } catch (error) {
      console.error('File modification error:', error);
      res.status(500).json({ error: "Failed to modify file" });
    }
  });

  app.post("/api/system/create-service", async (req, res) => {
    try {
      const { serviceName, purpose, code } = req.body;
      
      if (!serviceName || !purpose || !code) {
        return res.status(400).json({ error: "Service name, purpose, and code are required" });
      }

      const success = await systemAwarenessService.createNewService(serviceName, purpose, code);
      if (success) {
        res.json({ success: true, message: "Service created successfully" });
      } else {
        res.status(500).json({ error: "Failed to create service" });
      }
    } catch (error) {
      console.error('Service creation error:', error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });

  app.get("/api/system/file-tree", async (req, res) => {
    try {
      const fileTree = await systemAwarenessService.getFileTreeStructure();
      res.json({ fileTree });
    } catch (error) {
      console.error('File tree error:', error);
      res.status(500).json({ error: "Failed to get file tree structure", fileTree: [] });
    }
  });

  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await systemAwarenessService.getArchitectureMetrics();
      res.json(metrics || {
        totalFiles: 0,
        totalFolders: 0,
        codeFiles: 0,
        configFiles: 0,
        dependencies: 0,
        services: 0,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Architecture metrics error:', error);
      res.status(500).json({ error: "Failed to get architecture metrics" });
    }
  });

  app.get("/api/system/dependencies", async (req, res) => {
    try {
      const dependencies = await systemAwarenessService.getDependencyAnalysis();
      res.json(dependencies);
    } catch (error) {
      console.error('Dependencies error:', error);
      res.status(500).json({ error: "Failed to get dependency analysis" });
    }
  });

  // Web search endpoints
  app.post("/api/search", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query is required" });
      }

      const result = await webSearchService.smartSearch(query);
      res.json({ result });
    } catch (error) {
      console.error('Web search error:', error);
      res.status(500).json({ error: "Failed to perform web search" });
    }
  });

  app.get("/api/weather/:location", async (req, res) => {
    try {
      const { location } = req.params;
      const weather = await webSearchService.getWeather(location);
      
      if (weather) {
        res.json(weather);
      } else {
        res.status(404).json({ error: "Weather information not found" });
      }
    } catch (error) {
      console.error('Weather API error:', error);
      res.status(500).json({ error: "Failed to get weather information" });
    }
  });

  app.get("/api/traffic", async (req, res) => {
    try {
      const { from, to } = req.query;
      
      if (!from || !to) {
        return res.status(400).json({ error: "Both 'from' and 'to' parameters are required" });
      }

      const traffic = await webSearchService.getTraffic(from as string, to as string);
      
      if (traffic) {
        res.json(traffic);
      } else {
        res.status(404).json({ error: "Traffic information not found" });
      }
    } catch (error) {
      console.error('Traffic API error:', error);
      res.status(500).json({ error: "Failed to get traffic information" });
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
      const fs = await import('fs');
      const path = await import('path');
      const settingsPath = path.join(process.cwd(), 'lumen-voice-settings.json');
      
      const settings = {
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      res.json({ success: true, message: 'Voice settings saved successfully' });
    } catch (error) {
      console.error('Failed to save voice settings:', error);
      res.status(500).json({ error: 'Failed to save voice settings' });
    }
  });

  app.post("/api/voice-settings", async (req, res) => {
    try {
      const { voice, speed, model } = req.body;
      const fs = require('fs');
      const path = require('path');
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

  // Optimized OpenAI TTS endpoint for voice mode
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = 'nova', model = 'tts-1', speed = 1.0, response_format = 'mp3' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Minimal text cleaning for faster processing
      const cleanText = text
        .replace(/[^\w\s.,!?'-]/g, '') // Only keep essential characters
        .trim();

      if (!cleanText) {
        return res.status(400).json({ error: "No valid text after cleaning" });
      }

      // Use faster TTS-1 model for voice mode with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1', // Always use faster model for voice mode
          input: cleanText,
          voice,
          speed,
          response_format
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI TTS API error:', {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          body: errorText,
          request: { model: 'tts-1', input: cleanText, voice, speed, response_format }
        });
        throw new Error(`OpenAI TTS API error: ${openaiResponse.status} - ${errorText}`);
      }

      // Stream the audio response directly
      const audioBuffer = await openaiResponse.arrayBuffer();
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache', // Prevent caching for real-time use
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
          
          // Optimize for voice mode - minimal context for speed
          const isVoiceMode = message.isVoiceMode || false;
          
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

          // Use AI config manager to get active AI with auto-switching
          const activeAI = await aiConfigManager.getActiveAI();
          
          // Initialize brain offline AI if not already done
          await lumenBrain.initializeOfflineAI();
          
          // Generate AI response using brain system (hybrid online/offline)
          const { response: aiResponse, source: aiSource } = await lumenBrain.generateResponse(
            content,
            messages,
            enhancedEmotionContext
          );

          // Send response back to client immediately with provider info
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ai_response',
              content: aiResponse,
              conversationId,
              provider: activeAI.provider,
              model: activeAI.model || 'Unknown',
              source: aiSource // Include brain source (online/offline/hybrid)
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

  app.post("/api/ai-config/switch/:provider", async (req, res) => {
    try {
      const { provider } = req.params;
      const success = await aiConfigManager.switchProvider(provider as 'ollama' | 'openai' | 'local-python');
      
      if (success) {
        res.json({ success: true, message: `Switched to ${provider}` });
      } else {
        res.status(400).json({ success: false, message: `Failed to switch to ${provider}` });
      }
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

  // Brain API endpoints
  app.get("/api/brain/stats", async (req, res) => {
    try {
      const stats = lumenBrain.getBrainStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get brain statistics" });
    }
  });

  app.post("/api/brain/evolve", async (req, res) => {
    try {
      await lumenBrain.forceEvolution();
      res.json({ success: true, message: "Evolution cycle completed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to trigger evolution" });
    }
  });

  app.get("/api/brain/export", async (req, res) => {
    try {
      const brainData = lumenBrain.exportBrainData();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="lumen-brain-export.json"');
      res.send(brainData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export brain data" });
    }
  });

  // Backup System API endpoints
  app.get("/api/backup/list", async (req, res) => {
    try {
      const backups = backupSystem.getBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ error: "Failed to get backups" });
    }
  });

  app.post("/api/backup/create", async (req, res) => {
    try {
      const { name, description, isDefault } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Backup name is required" });
      }

      const backupId = await backupSystem.createBackup(name, description || '', isDefault || false);
      res.json({ success: true, backupId, message: "Backup created successfully" });
    } catch (error) {
      console.error('Backup creation error:', error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  app.post("/api/backup/restore/:backupId", async (req, res) => {
    try {
      const { backupId } = req.params;
      const success = await backupSystem.restoreBackup(backupId);
      
      if (success) {
        res.json({ success: true, message: "Backup restored successfully" });
      } else {
        res.status(500).json({ error: "Failed to restore backup" });
      }
    } catch (error) {
      console.error('Backup restore error:', error);
      res.status(500).json({ error: "Failed to restore backup" });
    }
  });

  app.post("/api/backup/restore-default", async (req, res) => {
    try {
      const success = await backupSystem.restoreDefaultBackup();
      
      if (success) {
        res.json({ success: true, message: "Default backup restored successfully" });
      } else {
        res.status(500).json({ error: "Failed to restore default backup" });
      }
    } catch (error) {
      console.error('Default backup restore error:', error);
      res.status(500).json({ error: "Failed to restore default backup" });
    }
  });

  app.delete("/api/backup/:backupId", async (req, res) => {
    try {
      const { backupId } = req.params;
      const success = await backupSystem.deleteBackup(backupId);
      
      if (success) {
        res.json({ success: true, message: "Backup deleted successfully" });
      } else {
        res.status(404).json({ error: "Backup not found" });
      }
    } catch (error) {
      console.error('Backup deletion error:', error);
      res.status(500).json({ error: "Failed to delete backup" });
    }
  });

  app.post("/api/backup/set-default/:backupId", async (req, res) => {
    try {
      const { backupId } = req.params;
      const success = await backupSystem.setAsDefault(backupId);
      
      if (success) {
        res.json({ success: true, message: "Default backup set successfully" });
      } else {
        res.status(500).json({ error: "Failed to set default backup" });
      }
    } catch (error) {
      console.error('Set default backup error:', error);
      res.status(500).json({ error: "Failed to set default backup" });
    }
  });

  return httpServer;
}
