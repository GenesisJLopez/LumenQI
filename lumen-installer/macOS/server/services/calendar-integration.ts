/**
 * Calendar Integration Service
 * Provides real-time calendar access and alerts for Lumen QI
 */

import { EventEmitter } from 'events';
import { storage } from '../storage';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminderMinutes?: number[];
  status: 'tentative' | 'confirmed' | 'cancelled';
  organizer?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  url?: string;
}

export interface CalendarAlert {
  id: string;
  eventId: string;
  alertType: 'reminder' | 'starting' | 'ending' | 'conflict';
  message: string;
  timestamp: Date;
  isRead: boolean;
  reminderTime: Date;
}

export interface CalendarStats {
  totalEvents: number;
  todayEvents: number;
  upcomingEvents: number;
  overdueEvents: number;
  activeAlerts: number;
  lastSync: Date;
}

class CalendarIntegrationService extends EventEmitter {
  private events: Map<string, CalendarEvent> = new Map();
  private alerts: Map<string, CalendarAlert> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private isEnabled: boolean = false;
  private lastSync: Date = new Date();
  private alertCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeCalendarSystem();
  }

  private async initializeCalendarSystem(): Promise<void> {
    console.log('📅 Initializing Calendar Integration System...');
    
    try {
      // Load saved calendar data
      await this.loadCalendarData();
      
      // Start real-time alert checking
      this.startAlertMonitoring();
      
      // Start periodic sync (every 5 minutes)
      this.startPeriodicSync();
      
      console.log('✓ Calendar integration system initialized successfully');
    } catch (error) {
      console.error('❌ Calendar integration initialization failed:', error);
    }
  }

  public async enableCalendarAccess(): Promise<boolean> {
    try {
      // In a real implementation, this would request calendar permissions
      // For now, we'll simulate calendar access with sample data
      console.log('📅 Enabling calendar access...');
      
      this.isEnabled = true;
      
      // Create sample calendar events for demonstration
      await this.createSampleEvents();
      
      // Start monitoring for real-time alerts
      this.startAlertMonitoring();
      
      this.emit('calendarEnabled');
      return true;
    } catch (error) {
      console.error('Error enabling calendar access:', error);
      return false;
    }
  }

  public async disableCalendarAccess(): Promise<void> {
    this.isEnabled = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }
    
    this.emit('calendarDisabled');
  }

  private async createSampleEvents(): Promise<void> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const sampleEvents: CalendarEvent[] = [
      {
        id: 'event-1',
        title: 'Team Meeting',
        description: 'Weekly team sync and project updates',
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
        location: 'Conference Room A',
        attendees: ['john@company.com', 'jane@company.com'],
        isAllDay: false,
        reminderMinutes: [15, 5],
        status: 'confirmed',
        organizer: 'manager@company.com',
        priority: 'high',
        category: 'work'
      },
      {
        id: 'event-2',
        title: 'Lunch with Sarah',
        description: 'Catch up over lunch',
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        location: 'Downtown Café',
        isAllDay: false,
        reminderMinutes: [30],
        status: 'confirmed',
        priority: 'medium',
        category: 'personal'
      },
      {
        id: 'event-3',
        title: 'Doctor Appointment',
        description: 'Annual checkup',
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 30 * 60 * 1000),
        location: 'Medical Center',
        isAllDay: false,
        reminderMinutes: [60, 15],
        status: 'confirmed',
        priority: 'high',
        category: 'health'
      }
    ];

    sampleEvents.forEach(event => {
      this.events.set(event.id, event);
    });

    console.log(`✓ Created ${sampleEvents.length} sample calendar events`);
  }

  private startAlertMonitoring(): void {
    // Check for alerts every minute
    this.alertCheckInterval = setInterval(() => {
      this.checkForAlerts();
    }, 60000);

    // Initial check
    this.checkForAlerts();
  }

  private async checkForAlerts(): Promise<void> {
    if (!this.isEnabled) return;

    const now = new Date();
    const events = Array.from(this.events.values());

    for (const event of events) {
      // Check for reminder alerts
      if (event.reminderMinutes) {
        for (const reminderMinutes of event.reminderMinutes) {
          const reminderTime = new Date(event.startTime.getTime() - reminderMinutes * 60 * 1000);
          
          if (now >= reminderTime && now < event.startTime) {
            const alertId = `reminder-${event.id}-${reminderMinutes}`;
            
            if (!this.alerts.has(alertId)) {
              await this.createAlert({
                id: alertId,
                eventId: event.id,
                alertType: 'reminder',
                message: `Reminder: "${event.title}" starts in ${reminderMinutes} minutes`,
                timestamp: now,
                isRead: false,
                reminderTime
              });
            }
          }
        }
      }

      // Check for starting events
      const startBuffer = 2 * 60 * 1000; // 2 minutes buffer
      if (now >= event.startTime && now <= new Date(event.startTime.getTime() + startBuffer)) {
        const alertId = `starting-${event.id}`;
        
        if (!this.alerts.has(alertId)) {
          await this.createAlert({
            id: alertId,
            eventId: event.id,
            alertType: 'starting',
            message: `"${event.title}" is starting now${event.location ? ` at ${event.location}` : ''}`,
            timestamp: now,
            isRead: false,
            reminderTime: event.startTime
          });
        }
      }

      // Check for ending events
      const endBuffer = 5 * 60 * 1000; // 5 minutes buffer
      if (now >= event.endTime && now <= new Date(event.endTime.getTime() + endBuffer)) {
        const alertId = `ending-${event.id}`;
        
        if (!this.alerts.has(alertId)) {
          await this.createAlert({
            id: alertId,
            eventId: event.id,
            alertType: 'ending',
            message: `"${event.title}" has ended`,
            timestamp: now,
            isRead: false,
            reminderTime: event.endTime
          });
        }
      }
    }
  }

  private async createAlert(alert: CalendarAlert): Promise<void> {
    this.alerts.set(alert.id, alert);
    
    // Store alert in memory for user
    await storage.createMemory({
      userId: 1,
      content: `Calendar Alert: ${alert.message}`,
      context: `Alert Type: ${alert.alertType}, Event ID: ${alert.eventId}`,
      importance: alert.alertType === 'reminder' ? 4 : 3
    });

    // Emit real-time alert
    this.emit('calendarAlert', alert);
    
    console.log(`📅 Calendar Alert: ${alert.message}`);
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.syncCalendar();
    }, 5 * 60 * 1000);
  }

  private async syncCalendar(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      console.log('📅 Syncing calendar...');
      
      // In a real implementation, this would sync with actual calendar APIs
      // For now, we'll update the last sync time
      this.lastSync = new Date();
      
      this.emit('calendarSynced', { lastSync: this.lastSync });
      
      console.log('✓ Calendar sync completed');
    } catch (error) {
      console.error('Calendar sync failed:', error);
    }
  }

  public getEvents(filter?: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    priority?: string;
  }): CalendarEvent[] {
    let events = Array.from(this.events.values());

    if (filter) {
      if (filter.startDate) {
        events = events.filter(event => event.startTime >= filter.startDate!);
      }
      if (filter.endDate) {
        events = events.filter(event => event.endTime <= filter.endDate!);
      }
      if (filter.category) {
        events = events.filter(event => event.category === filter.category);
      }
      if (filter.priority) {
        events = events.filter(event => event.priority === filter.priority);
      }
    }

    return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  public getTodaysEvents(): CalendarEvent[] {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return this.getEvents({
      startDate: startOfDay,
      endDate: endOfDay
    });
  }

  public getUpcomingEvents(days: number = 7): CalendarEvent[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.getEvents({
      startDate: now,
      endDate: futureDate
    });
  }

  public getAlerts(unreadOnly: boolean = false): CalendarAlert[] {
    let alerts = Array.from(this.alerts.values());

    if (unreadOnly) {
      alerts = alerts.filter(alert => !alert.isRead);
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async markAlertAsRead(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.isRead = true;
      this.alerts.set(alertId, alert);
      return true;
    }
    return false;
  }

  public getStats(): CalendarStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const allEvents = Array.from(this.events.values());
    const todayEvents = allEvents.filter(event => 
      event.startTime >= today && event.startTime < tomorrow
    );
    const upcomingEvents = allEvents.filter(event => event.startTime > now);
    const overdueEvents = allEvents.filter(event => 
      event.endTime < now && event.status !== 'cancelled'
    );
    const activeAlerts = this.getAlerts(true);

    return {
      totalEvents: allEvents.length,
      todayEvents: todayEvents.length,
      upcomingEvents: upcomingEvents.length,
      overdueEvents: overdueEvents.length,
      activeAlerts: activeAlerts.length,
      lastSync: this.lastSync
    };
  }

  public async addEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.events.set(newEvent.id, newEvent);
    await this.saveCalendarData();
    
    this.emit('eventAdded', newEvent);
    return newEvent;
  }

  public async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const event = this.events.get(id);
    if (!event) return null;

    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    await this.saveCalendarData();
    
    this.emit('eventUpdated', updatedEvent);
    return updatedEvent;
  }

  public async deleteEvent(id: string): Promise<boolean> {
    const deleted = this.events.delete(id);
    if (deleted) {
      await this.saveCalendarData();
      this.emit('eventDeleted', id);
    }
    return deleted;
  }

  public isCalendarEnabled(): boolean {
    return this.isEnabled;
  }

  private async saveCalendarData(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const calendarPath = path.join(process.cwd(), 'lumen-calendar.json');
      
      const data = {
        events: Array.from(this.events.entries()),
        alerts: Array.from(this.alerts.entries()),
        lastSync: this.lastSync,
        isEnabled: this.isEnabled
      };
      
      fs.writeFileSync(calendarPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving calendar data:', error);
    }
  }

  private async loadCalendarData(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const calendarPath = path.join(process.cwd(), 'lumen-calendar.json');
      
      if (fs.existsSync(calendarPath)) {
        const data = JSON.parse(fs.readFileSync(calendarPath, 'utf8'));
        
        // Restore events
        if (data.events) {
          this.events = new Map(data.events.map(([id, event]: [string, any]) => [
            id,
            {
              ...event,
              startTime: new Date(event.startTime),
              endTime: new Date(event.endTime)
            }
          ]));
        }
        
        // Restore alerts
        if (data.alerts) {
          this.alerts = new Map(data.alerts.map(([id, alert]: [string, any]) => [
            id,
            {
              ...alert,
              timestamp: new Date(alert.timestamp),
              reminderTime: new Date(alert.reminderTime)
            }
          ]));
        }
        
        this.lastSync = data.lastSync ? new Date(data.lastSync) : new Date();
        this.isEnabled = data.isEnabled || false;
        
        console.log(`✓ Loaded ${this.events.size} calendar events and ${this.alerts.size} alerts`);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  }
}

// Export singleton instance
export const calendarIntegration = new CalendarIntegrationService();