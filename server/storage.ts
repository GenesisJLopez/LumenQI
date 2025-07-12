import { 
  users, conversations, messages, memories,
  type User, type InsertUser,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Memory, type InsertMemory
} from "@shared/schema";
import { db } from './db';
import { eq, desc } from 'drizzle-orm';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUser(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  
  // Message operations
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Memory operations
  getMemoriesByUser(userId: number): Promise<Memory[]>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  searchMemories(userId: number, query: string): Promise<Memory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private memories: Map<number, Memory>;
  private currentUserId: number;
  private currentConversationId: number;
  private currentMessageId: number;
  private currentMemoryId: number;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.memories = new Map();
    this.currentUserId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
    this.currentMemoryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByUser(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const now = new Date();
    const conversation: Conversation = {
      title: insertConversation.title,
      userId: insertConversation.userId || null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updated = { ...conversation, ...updates, updatedAt: new Date() };
    this.conversations.set(id, updated);
    return updated;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    
    // Update conversation timestamp
    const conversation = this.conversations.get(insertMessage.conversationId);
    if (conversation) {
      await this.updateConversation(conversation.id, { updatedAt: new Date() });
    }
    
    return message;
  }

  async getMemoriesByUser(userId: number): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(memory => memory.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const id = this.currentMemoryId++;
    const memory: Memory = {
      content: insertMemory.content,
      userId: insertMemory.userId || null,
      context: insertMemory.context || null,
      importance: insertMemory.importance || null,
      metadata: insertMemory.metadata || null,
      id,
      createdAt: new Date(),
    };
    this.memories.set(id, memory);
    return memory;
  }

  async searchMemories(userId: number, query: string): Promise<Memory[]> {
    const userMemories = await this.getMemoriesByUser(userId);
    return userMemories.filter(memory => 
      memory.content.toLowerCase().includes(query.toLowerCase()) ||
      (memory.context && memory.context.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationsByUser(userId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMemoriesByUser(userId: number): Promise<Memory[]> {
    return await db
      .select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(desc(memories.createdAt));
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    try {
      const [memory] = await db
        .insert(memories)
        .values(insertMemory)
        .returning();
      return memory;
    } catch (error) {
      console.error('Error creating memory:', error);
      // Return a default memory if database fails
      return {
        id: Date.now(),
        userId: insertMemory.userId,
        content: insertMemory.content,
        context: insertMemory.context || null,
        importance: insertMemory.importance,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  async searchMemories(userId: number, query: string): Promise<Memory[]> {
    // For now, we'll do a simple text search. In production, you might want to use full-text search
    const userMemories = await this.getMemoriesByUser(userId);
    return userMemories.filter(memory => 
      memory.content.toLowerCase().includes(query.toLowerCase()) ||
      (memory.context && memory.context.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

export const storage = new DatabaseStorage();
