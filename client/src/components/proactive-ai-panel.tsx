/**
 * Proactive AI Panel Component
 * Manages reminders, wake word activation, and device access
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Smartphone, 
  Monitor, 
  Mic, 
  Settings,
  AlertCircle,
  CheckCircle,
  Radio
} from 'lucide-react';
import { format } from 'date-fns';

interface Reminder {
  id: string;
  title: string;
  description: string;
  scheduledTime: Date;
  reminderType: 'appointment' | 'birthday' | 'task' | 'custom';
  isRecurring: boolean;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  createdAt: Date;
}

interface ProactiveStats {
  totalReminders: number;
  activeWebSockets: number;
  isProactiveMode: boolean;
  deviceAccessEnabled: boolean;
  wakeWordActive: boolean;
  lastInteractionTime: Date;
}

export function ProactiveAIPanel() {
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    reminderType: 'custom' as const,
    isRecurring: false,
    priority: 'medium' as const
  });

  const [proactiveMode, setProactiveMode] = useState(true);
  const [deviceAccess, setDeviceAccess] = useState(false);
  const [wakeWord, setWakeWord] = useState(false);

  // Fetch reminders
  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ['/api/proactive/reminders'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch proactive stats
  const { data: stats } = useQuery<ProactiveStats>({
    queryKey: ['/api/proactive/stats'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: async (reminder: typeof newReminder) => {
      const response = await fetch('/api/proactive/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminder)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create reminder');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proactive/reminders'] });
      setNewReminder({
        title: '',
        description: '',
        scheduledTime: '',
        reminderType: 'custom',
        isRecurring: false,
        priority: 'medium'
      });
    }
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/proactive/reminder/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete reminder');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proactive/reminders'] });
    }
  });

  // Toggle proactive mode
  const toggleProactiveMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/proactive/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle proactive mode');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proactive/stats'] });
    }
  });

  // Enable device access
  const enableDeviceAccessMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/proactive/enable-device-access', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to enable device access');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setDeviceAccess(true);
      queryClient.invalidateQueries({ queryKey: ['/api/proactive/stats'] });
    }
  });

  // Enable wake word
  const enableWakeWordMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/proactive/enable-wake-word', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to enable wake word');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setWakeWord(true);
      queryClient.invalidateQueries({ queryKey: ['/api/proactive/stats'] });
    }
  });

  const handleCreateReminder = () => {
    if (!newReminder.title || !newReminder.scheduledTime) {
      return;
    }

    createReminderMutation.mutate(newReminder);
  };

  const handleDeleteReminder = (id: string) => {
    deleteReminderMutation.mutate(id);
  };

  const handleToggleProactive = (enabled: boolean) => {
    setProactiveMode(enabled);
    toggleProactiveMutation.mutate(enabled);
  };

  const handleEnableDeviceAccess = () => {
    enableDeviceAccessMutation.mutate();
  };

  const handleEnableWakeWord = () => {
    enableWakeWordMutation.mutate();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'birthday': return <Bell className="w-4 h-4" />;
      case 'task': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Update local state when stats change
  useEffect(() => {
    if (stats) {
      setProactiveMode(stats.isProactiveMode);
      setDeviceAccess(stats.deviceAccessEnabled);
      setWakeWord(stats.wakeWordActive);
    }
  }, [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Proactive AI Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Transform Lumen into a proactive AI companion that initiates conversations, provides reminders, 
          and can access your devices with wake word activation.
        </p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Proactive Mode</Label>
              <Switch 
                checked={proactiveMode}
                onCheckedChange={handleToggleProactive}
                disabled={toggleProactiveMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Device Access</Label>
              <div className="flex items-center gap-2">
                {deviceAccess ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Button 
                    size="sm" 
                    onClick={handleEnableDeviceAccess}
                    disabled={enableDeviceAccessMutation.isPending}
                  >
                    <Monitor className="w-4 h-4 mr-1" />
                    Enable
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Wake Word ("Hey Lumen")</Label>
              <div className="flex items-center gap-2">
                {wakeWord ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Button 
                    size="sm" 
                    onClick={handleEnableWakeWord}
                    disabled={enableWakeWordMutation.isPending}
                  >
                    <Mic className="w-4 h-4 mr-1" />
                    Enable
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active Connections</Label>
              <Badge variant="secondary">
                {stats?.activeWebSockets || 0}
              </Badge>
            </div>
          </div>

          {stats?.lastInteractionTime && (
            <div className="pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                Last interaction: {format(new Date(stats.lastInteractionTime), 'PPp')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Reminder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Reminder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                placeholder="Reminder title..."
              />
            </div>
            <div>
              <Label htmlFor="scheduledTime">Scheduled Time</Label>
              <Input
                id="scheduledTime"
                type="datetime-local"
                value={newReminder.scheduledTime}
                onChange={(e) => setNewReminder({ ...newReminder, scheduledTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newReminder.description}
              onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={newReminder.reminderType}
                onChange={(e) => setNewReminder({ ...newReminder, reminderType: e.target.value as any })}
                className="w-full p-2 border rounded-md"
              >
                <option value="custom">Custom</option>
                <option value="appointment">Appointment</option>
                <option value="birthday">Birthday</option>
                <option value="task">Task</option>
              </select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={newReminder.priority}
                onChange={(e) => setNewReminder({ ...newReminder, priority: e.target.value as any })}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={newReminder.isRecurring}
                onCheckedChange={(checked) => setNewReminder({ ...newReminder, isRecurring: checked })}
              />
              <Label>Recurring</Label>
            </div>
          </div>

          <Button
            onClick={handleCreateReminder}
            disabled={!newReminder.title || !newReminder.scheduledTime || createReminderMutation.isPending}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Reminder
          </Button>
        </CardContent>
      </Card>

      {/* Reminders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Active Reminders ({reminders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading reminders...</div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No active reminders. Create one above to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(reminder.reminderType)}
                    <div>
                      <h4 className="font-medium">{reminder.title}</h4>
                      {reminder.description && (
                        <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reminder.scheduledTime), 'PPp')}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(reminder.priority)}`} />
                        <span className="text-xs capitalize">{reminder.priority}</span>
                        {reminder.isRecurring && (
                          <Badge variant="outline" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReminder(reminder.id)}
                    disabled={deleteReminderMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Device Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5" />
                <div>
                  <h4 className="font-medium">Computer Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Full system access for proactive notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {deviceAccess ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="text-sm">
                  {deviceAccess ? 'Connected' : 'Simulated'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5" />
                <div>
                  <h4 className="font-medium">Mobile Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Cross-device synchronization and notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm">Coming Soon</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5" />
                <div>
                  <h4 className="font-medium">Wake Word Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    "Hey Lumen" activation from anywhere
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {wakeWord ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="text-sm">
                  {wakeWord ? 'Active' : 'Simulated'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Natural Conversation Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Natural Conversation Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Proactive Check-ins</h4>
                <p className="text-sm text-muted-foreground">
                  Lumen will naturally check in on you every 2-4 hours
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Soft Voice Alerts</h4>
                <p className="text-sm text-muted-foreground">
                  Gentle name calling when Lumen wants to share something
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Natural Reminders</h4>
                <p className="text-sm text-muted-foreground">
                  Human-like reminder delivery, not robotic notifications
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Contextual Responses</h4>
                <p className="text-sm text-muted-foreground">
                  Enhanced conversation flow with personal touches
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}