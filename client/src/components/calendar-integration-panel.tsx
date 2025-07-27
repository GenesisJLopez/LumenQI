/**
 * Calendar Integration Panel Component
 * Provides real-time calendar access and alerts management
 */

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Bell, 
  AlertCircle,
  CheckCircle,
  MapPin,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Smartphone
} from 'lucide-react';
import { format, formatDistance } from 'date-fns';

interface CalendarEvent {
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

interface CalendarAlert {
  id: string;
  eventId: string;
  alertType: 'reminder' | 'starting' | 'ending' | 'conflict';
  message: string;
  timestamp: Date;
  isRead: boolean;
  reminderTime: Date;
}

interface CalendarStats {
  totalEvents: number;
  todayEvents: number;
  upcomingEvents: number;
  overdueEvents: number;
  activeAlerts: number;
  lastSync: Date;
}

export function CalendarIntegrationPanel() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showAlerts, setShowAlerts] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    priority: 'medium' as const,
    category: 'personal',
    isAllDay: false,
    reminderMinutes: [15]
  });

  // Fetch calendar stats
  const { data: stats } =<CalendarStats>({
    queryKey: ['/api/calendar/stats'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch today's events
  const { data: todayEvents = [] } =<CalendarEvent[]>({
    queryKey: ['/api/calendar/events/today'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch upcoming events
  const { data: upcomingEvents = [] } =<CalendarEvent[]>({
    queryKey: ['/api/calendar/events/upcoming'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch calendar alerts
  const { data: alerts = [] } =<CalendarAlert[]>({
    queryKey: ['/api/calendar/alerts'],
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Enable calendar mutation
  const enableCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/calendar/enable', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to enable calendar access');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsEnabled(true);
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
    }
  });

  // Disable calendar mutation
  const disableCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/calendar/disable', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to disable calendar access');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsEnabled(false);
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
    }
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        priority: 'medium',
        category: 'personal',
        isAllDay: false,
        reminderMinutes: [15]
      });
    }
  });

  // Mark alert as read mutation
  const markAlertReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/calendar/alerts/${alertId}/read`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark alert as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/alerts'] });
    }
  });

  const handleEnableCalendar = () => {
    enableCalendarMutation.mutate();
  };

  const handleDisableCalendar = () => {
    disableCalendarMutation.mutate();
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      return;
    }

    createEventMutation.mutate({
      ...newEvent,
      startTime: new Date(newEvent.startTime),
      endTime: new Date(newEvent.endTime)
    });
  };

  const handleMarkAlertRead = (alertId: string) => {
    markAlertReadMutation.mutate(alertId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'tentative': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'starting': return <Clock className="w-4 h-4" />;
      case 'ending': return <CheckCircle className="w-4 h-4" />;
      case 'conflict': return <AlertCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNextEventTime = (events: CalendarEvent[]) => {
    if (events.length === 0) return null;
    
    const now = new Date();
    const nextEvent = events.find(event => new Date(event.startTime) > now);
    
    if (!nextEvent) return null;
    
    return formatDistance(new Date(nextEvent.startTime), now, { addSuffix: true });
  };

  // Listen for real-time calendar alerts
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'calendar_alert') {
        // Show real-time alert notification
        if (Notification.permission === 'granted') {
          new Notification(`Lumen Calendar Alert`, {
            body: data.alert.message,
            icon: '/favicon.ico'
          });
        }
        
        // Refresh alerts data
        queryClient.invalidateQueries({ queryKey: ['/api/calendar/alerts'] });
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Calendar Integration</h2>
        <p className="text-sm text-muted-foreground">
          Enable real-time calendar access for Lumen to provide proactive alerts, reminders, and schedule management.
        </p>
      </div>

      {/* Calendar Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar Access Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div>
                <p className="font-medium">
                  {isEnabled ? 'Calendar Access Enabled' : 'Calendar Access Disabled'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isEnabled 
                    ? 'Lumen can access your calendar for real-time alerts and reminders' 
                    : 'Enable calendar access to receive proactive notifications'
                  }
                </p>
              </div>
            </div>
            <div>
              {isEnabled ? (
                <Button
                  variant="outline"
                  onClick={handleDisableCalendar}
                  disabled={disableCalendarMutation.isPending}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Disable
                </Button>
              ) : (
                <Button
                  onClick={handleEnableCalendar}
                  disabled={enableCalendarMutation.isPending}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Enable Access
                </Button>
              )}
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalEvents}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.todayEvents}</div>
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.upcomingEvents}</div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.activeAlerts}</div>
                <div className="text-sm text-muted-foreground">Active Alerts</div>
              </div>
            </div>
          )}

          {stats?.lastSync && (
            <div className="text-xs text-muted-foreground">
              Last sync: {format(new Date(stats.lastSync), 'PPp')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Alerts */}
      {showAlerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Real-time Calendar Alerts ({alerts.filter(a => !a.isRead).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.isRead ? 'bg-gray-50 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.alertType)}
                    <div>
                      <p className={`font-medium ${alert.isRead ? 'text-muted-foreground' : ''}`}>
                        {alert.message}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistance(new Date(alert.timestamp), new Date(), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {!alert.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAlertRead(alert.id)}
                      disabled={markAlertReadMutation.isPending}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Schedule ({todayEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium">
                        {format(new Date(event.startTime), 'HH:mm')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.endTime), 'HH:mm')}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {event.attendees.length} attendees
                          </div>
                        )}
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`} />
                        <span className="text-xs capitalize">{event.priority}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events
            {getNextEventTime(upcomingEvents) && (
              <Badge variant="secondary" className="ml-2">
                Next: {getNextEventTime(upcomingEvents)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {format(new Date(event.startTime), 'MMM dd')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.startTime), 'HH:mm')}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`} />
                        <span className="text-xs capitalize">{event.priority}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistance(new Date(event.startTime), new Date(), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Event */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Calendar Event
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input
                id="eventTitle"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Meeting with team..."
              />
            </div>
            <div>
              <Label htmlFor="eventLocation">Location</Label>
              <Input
                id="eventLocation"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Conference room, online..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="eventDescription">Description</Label>
            <Textarea
              id="eventDescription"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Event details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={newEvent.priority}
                onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as any })}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={newEvent.isAllDay}
                onCheckedChange={(checked) => setNewEvent({ ...newEvent, isAllDay: checked })}
              />
              <Label>All Day</Label>
            </div>
          </div>

          <Button
            onClick={handleCreateEvent}
            disabled={!newEvent.title || !newEvent.startTime || !newEvent.endTime || createEventMutation.isPending}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Integration Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Real-time Alerts</h4>
                <p className="text-sm text-muted-foreground">
                  Lumen will proactively notify you about upcoming events and important reminders
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Smart Scheduling</h4>
                <p className="text-sm text-muted-foreground">
                  Intelligent conflict detection and scheduling suggestions
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Voice Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Ask Lumen about your schedule using voice commands
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Mobile Sync</h4>
                <p className="text-sm text-muted-foreground">
                  Future: Sync with iPhone Calendar app when deployed to iOS
                </p>
                <Badge variant="outline" className="mt-2">
                  Coming Soon
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}