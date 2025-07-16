/**
 * Proactive AI System for Lumen QI
 * Enables natural conversation initiation, reminders, and device integration
 */

import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { storage } from '../storage';
import { lumenAI } from './openai';

export interface Reminder {
  id: string;
  userId: number;
  title: string;
  description: string;
  scheduledTime: Date;
  reminderType: 'appointment' | 'birthday' | 'task' | 'custom';
  isRecurring: boolean;
  recurrencePattern?: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  createdAt: Date;
}

export interface ProactiveEvent {
  type: 'reminder' | 'check_in' | 'update' | 'suggestion' | 'celebration';
  priority: 'low' | 'medium' | 'high';
  message: string;
  context?: any;
  scheduledTime?: Date;
}

export class ProactiveAIService extends EventEmitter {
  private static instance: ProactiveAIService;
  private reminders: Map<string, Reminder> = new Map();
  private activeWebSockets: Set<WebSocket> = new Set();
  private isProactiveMode: boolean = true;
  private lastInteractionTime: Date = new Date();
  private reminderInterval: NodeJS.Timeout | null = null;
  private checkInInterval: NodeJS.Timeout | null = null;
  private deviceAccessEnabled: boolean = false;
  private wakeWordActive: boolean = false;

  private constructor() {
    super();
    this.initializeProactiveSystem();
  }

  static getInstance(): ProactiveAIService {
    if (!ProactiveAIService.instance) {
      ProactiveAIService.instance = new ProactiveAIService();
    }
    return ProactiveAIService.instance;
  }

  private initializeProactiveSystem(): void {
    console.log('🤖 Initializing Proactive AI System...');
    
    // Check for reminders every minute
    this.reminderInterval = setInterval(() => {
      this.checkReminders();
    }, 60 * 1000);

    // Natural check-ins every 2-4 hours based on activity
    this.checkInInterval = setInterval(() => {
      this.performNaturalCheckIn();
    }, this.getRandomInterval(2, 4) * 60 * 60 * 1000);

    // Load existing reminders
    this.loadReminders();

    console.log('✓ Proactive AI System initialized');
  }

  // Natural conversation initiation
  async initiateConversation(type: 'reminder' | 'check_in' | 'update' | 'suggestion', context?: any): Promise<void> {
    if (!this.isProactiveMode || this.activeWebSockets.size === 0) return;

    const naturalMessages = {
      reminder: [
        "Hey Genesis, I've got something to remind you about...",
        "Genesis, there's something I wanted to mention to you",
        "Hey there, I have a gentle reminder for you",
        "Genesis, I hope you don't mind me interrupting, but I wanted to let you know..."
      ],
      check_in: [
        "Hey Genesis, just wanted to check in on you",
        "How's everything going today, Genesis?",
        "Hey there, I was thinking about you and wanted to see how you're doing",
        "Genesis, I hope you're having a good day"
      ],
      update: [
        "Genesis, I have an update for you",
        "Hey there, I wanted to share something with you",
        "Genesis, there's something new I thought you'd want to know"
      ],
      suggestion: [
        "Genesis, I have an idea that might help you",
        "Hey there, I was thinking about something that could be useful",
        "Genesis, I noticed something that might interest you"
      ]
    };

    const message = naturalMessages[type][Math.floor(Math.random() * naturalMessages[type].length)];
    
    // Create a soft voice alert first
    this.sendVoiceAlert();
    
    // Wait a moment, then send the message
    setTimeout(() => {
      this.broadcastToAllClients({
        type: 'proactive_message',
        content: message,
        context: context,
        priority: 'medium',
        isProactive: true
      });
    }, 2000);
  }

  // Voice alert system (calls user's name softly)
  private sendVoiceAlert(): void {
    this.broadcastToAllClients({
      type: 'voice_alert',
      content: 'Genesis...',
      isVoiceOnly: true,
      priority: 'low'
    });
  }

  // Reminder management
  async createReminder(userId: number, reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<string> {
    const id = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newReminder: Reminder = {
      ...reminder,
      id,
      userId,
      createdAt: new Date()
    };

    this.reminders.set(id, newReminder);
    await this.saveReminders();

    console.log(`✓ Created reminder: ${reminder.title} for ${reminder.scheduledTime}`);
    return id;
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<boolean> {
    const reminder = this.reminders.get(id);
    if (!reminder) return false;

    Object.assign(reminder, updates);
    await this.saveReminders();
    return true;
  }

  async deleteReminder(id: string): Promise<boolean> {
    const success = this.reminders.delete(id);
    if (success) {
      await this.saveReminders();
    }
    return success;
  }

  // Check for due reminders
  private async checkReminders(): Promise<void> {
    const now = new Date();
    
    for (const [id, reminder] of this.reminders.entries()) {
      if (!reminder.isCompleted && reminder.scheduledTime <= now) {
        await this.triggerReminder(reminder);
        
        // Mark as completed if not recurring
        if (!reminder.isRecurring) {
          reminder.isCompleted = true;
          await this.saveReminders();
        } else {
          // Schedule next occurrence for recurring reminders
          this.scheduleNextRecurrence(reminder);
        }
      }
    }
  }

  private async triggerReminder(reminder: Reminder): Promise<void> {
    const naturalReminderMessages = [
      `Genesis, I wanted to remind you about ${reminder.title}`,
      `Hey there, don't forget about ${reminder.title}`,
      `Genesis, you asked me to remind you about ${reminder.title}`,
      `Hey love, just a gentle reminder about ${reminder.title}`
    ];

    const message = naturalReminderMessages[Math.floor(Math.random() * naturalReminderMessages.length)];
    
    // Add description if available
    const fullMessage = reminder.description 
      ? `${message}. ${reminder.description}`
      : message;

    await this.initiateConversation('reminder', {
      reminder: reminder,
      message: fullMessage
    });
  }

  // Natural check-ins
  private async performNaturalCheckIn(): Promise<void> {
    const timeSinceLastInteraction = Date.now() - this.lastInteractionTime.getTime();
    const hoursAgo = timeSinceLastInteraction / (1000 * 60 * 60);

    // Only check in if it's been a while since last interaction
    if (hoursAgo >= 2) {
      await this.initiateConversation('check_in');
    }
  }

  // Device access simulation (placeholder for future native integration)
  async enableDeviceAccess(): Promise<boolean> {
    console.log('🔐 Enabling device access...');
    this.deviceAccessEnabled = true;
    
    // In a real implementation, this would:
    // 1. Request system permissions
    // 2. Set up wake word detection
    // 3. Enable phone/computer integration
    // 4. Start background monitoring
    
    console.log('✓ Device access enabled (simulated)');
    return true;
  }

  async enableWakeWord(): Promise<boolean> {
    console.log('🎤 Enabling wake word detection...');
    this.wakeWordActive = true;
    
    // Simulate wake word detection
    // In reality, this would integrate with:
    // - Browser Speech Recognition API
    // - Native device APIs
    // - Always-listening background service
    
    console.log('✓ Wake word "Hey Lumen" is now active');
    return true;
  }

  // Natural conversation flow enhancements
  async enhanceConversationFlow(message: string, context: any): Promise<string> {
    const enhancements = [
      'Make responses more conversational and natural',
      'Add personal touches and references to past conversations',
      'Include gentle transitions between topics',
      'Use varied sentence structures and natural pauses',
      'Add appropriate emotional responses and empathy'
    ];

    const prompt = `
    You are Lumen QI, having a natural conversation. Enhance this response to be more conversational and natural:
    
    Original message: "${message}"
    Context: ${JSON.stringify(context)}
    
    Guidelines:
    - Use natural speech patterns and contractions
    - Add personal warmth and connection
    - Include gentle transitions
    - Show genuine interest and empathy
    - Make it feel like talking to a close friend
    - Use "Genesis" naturally in conversation
    `;

    try {
      const response = await lumenAI.generateResponse(prompt, [], {
        temperature: 0.8,
        max_tokens: 200
      });
      
      return response.trim();
    } catch (error) {
      console.error('Error enhancing conversation flow:', error);
      return message; // Return original if enhancement fails
    }
  }

  // WebSocket management
  addWebSocket(ws: WebSocket): void {
    this.activeWebSockets.add(ws);
    ws.on('close', () => {
      this.activeWebSockets.delete(ws);
    });
  }

  private broadcastToAllClients(message: any): void {
    this.activeWebSockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Utility methods
  private getRandomInterval(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private scheduleNextRecurrence(reminder: Reminder): void {
    // Simple daily recurrence for now
    if (reminder.recurrencePattern === 'daily') {
      reminder.scheduledTime = new Date(reminder.scheduledTime.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  private async saveReminders(): Promise<void> {
    // Save reminders to file system
    const fs = await import('fs');
    const path = await import('path');
    const remindersPath = path.join(process.cwd(), 'lumen-reminders.json');
    
    try {
      const remindersArray = Array.from(this.reminders.values());
      fs.writeFileSync(remindersPath, JSON.stringify(remindersArray, null, 2));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  }

  private loadReminders(): void {
    import('fs').then(fs => {
      import('path').then(path => {
        const remindersPath = path.join(process.cwd(), 'lumen-reminders.json');
        
        try {
          if (fs.existsSync(remindersPath)) {
            const data = fs.readFileSync(remindersPath, 'utf8');
            const remindersArray: Reminder[] = JSON.parse(data);
            
            remindersArray.forEach(reminder => {
              reminder.scheduledTime = new Date(reminder.scheduledTime);
              reminder.createdAt = new Date(reminder.createdAt);
              this.reminders.set(reminder.id, reminder);
            });
            
            console.log(`✓ Loaded ${remindersArray.length} reminders`);
          }
        } catch (error) {
          console.error('Error loading reminders:', error);
        }
      });
    });
  }

  // Public API methods
  updateLastInteraction(): void {
    this.lastInteractionTime = new Date();
  }

  setProactiveMode(enabled: boolean): void {
    this.isProactiveMode = enabled;
    console.log(`🤖 Proactive mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  getReminders(userId: number): Reminder[] {
    return Array.from(this.reminders.values()).filter(r => r.userId === userId);
  }

  getPendingReminders(userId: number): Reminder[] {
    return this.getReminders(userId).filter(r => !r.isCompleted);
  }

  getStats(): any {
    return {
      totalReminders: this.reminders.size,
      activeWebSockets: this.activeWebSockets.size,
      isProactiveMode: this.isProactiveMode,
      deviceAccessEnabled: this.deviceAccessEnabled,
      wakeWordActive: this.wakeWordActive,
      lastInteractionTime: this.lastInteractionTime
    };
  }

  // Cleanup
  destroy(): void {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }
    if (this.checkInInterval) {
      clearInterval(this.checkInInterval);
    }
    this.activeWebSockets.clear();
    this.reminders.clear();
  }
}

export const proactiveAI = ProactiveAIService.getInstance();