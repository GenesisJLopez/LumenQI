import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { lumenAI } from "./services/openai";
import { lumenCodeGenerator, type CodeGenerationRequest } from "./services/code-generation";
import { insertConversationSchema, insertMessageSchema, insertMemorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

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

      // Delete all messages in the conversation first
      const messages = await storage.getMessagesByConversation(conversationId);
      // Note: In a real implementation, you'd have a deleteMessage method
      // For now, we'll just mark the conversation as deleted
      
      await storage.updateConversation(conversationId, { 
        title: `[DELETED] ${conversation.title}`,
        updatedAt: new Date()
      });
      
      res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete conversation" });
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

  // WebSocket handling for real-time chat
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'chat_message') {
          const { content, conversationId, emotionContext } = message;
          
          // Save user message
          await storage.createMessage({
            conversationId,
            role: 'user',
            content
          });

          // Get conversation context
          const messages = await storage.getMessagesByConversation(conversationId);
          const conversationContext = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          // Get relevant memories
          const memories = await storage.getMemoriesByUser(1); // Demo user ID
          const relevantMemories = memories.slice(0, 5).map(memory => ({
            content: memory.content,
            context: memory.context || undefined
          })); // Use recent memories

          // Generate AI response with emotion context
          const aiResponse = await lumenAI.generateResponse(
            content,
            conversationContext,
            relevantMemories,
            emotionContext
          );

          // Save AI response
          await storage.createMessage({
            conversationId,
            role: 'assistant',
            content: aiResponse
          });

          // Send response back to client
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ai_response',
              content: aiResponse,
              conversationId
            }));
          }

          // Create memory if the conversation seems significant
          if (content.length > 50 || aiResponse.length > 100) {
            await storage.createMemory({
              userId: 1,
              content: `User discussed: ${content.substring(0, 100)}...`,
              context: `Conversation ${conversationId}`,
              importance: 2
            });
          }
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
