import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Brain, UserCog, Database, Trash2, MessageSquare, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation, Memory } from '@shared/schema';

interface SidebarProps {
  currentConversationId?: number;
  onConversationSelect: (id: number) => void;
  onNewConversation: () => void;
  onClearMemories?: () => void;
  onToggleSettings?: () => void;
  showSettings?: boolean;
}

export function Sidebar({ currentConversationId, onConversationSelect, onNewConversation, onClearMemories, onToggleSettings, showSettings }: SidebarProps) {
  const { toast } = useToast();
  const [editingConversationId, setEditingConversationId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  const { data: memories = [] } = useQuery<Memory[]>({
    queryKey: ['/api/memories'],
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      return response.json();
    },
    onSuccess: (data, deletedId) => {
      // If deleted conversation was the current one, clear selection
      if (currentConversationId === deletedId) {
        onNewConversation();
      }
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({ title: "Chat deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete chat", variant: "destructive" });
    },
  });

  const updateConversationTitle = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        throw new Error('Failed to update conversation title');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setEditingConversationId(null);
      setEditingTitle('');
      toast({ title: "Chat title updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update chat title", variant: "destructive" });
    },
  });

  const handleDeleteConversation = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }
    
    deleteConversation.mutate(id);
  };

  const handleEditConversation = (id: number, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingConversationId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!editingTitle.trim()) {
      toast({ title: "Title cannot be empty", variant: "destructive" });
      return;
    }
    
    updateConversationTitle.mutate({ id, title: editingTitle.trim() });
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(id, e as any);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit(e as any);
    }
  };

  const deleteAllConversations = useMutation({
    mutationFn: async () => {
      const deletePromises = conversations.map(conversation => 
        fetch(`/api/conversations/${conversation.id}`, {
          method: 'DELETE',
        })
      );
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      onNewConversation();
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({ title: "All chats deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete all chats", variant: "destructive" });
    },
  });

  const handleDeleteAllConversations = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!window.confirm('Are you sure you want to delete ALL conversations? This action cannot be undone.')) {
      return;
    }
    
    deleteAllConversations.mutate();
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return `${Math.floor(diffInHours / 168)} weeks ago`;
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Lumen</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800" 
              title="Delete All Chats"
              onClick={handleDeleteAllConversations}
              disabled={conversations.length === 0}
            >
              <Trash2 className="h-4 w-4 text-gray-400" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800" 
              title="Settings"
              onClick={() => {
                console.log('Settings button clicked');
                onToggleSettings();
              }}
            >
              <Database className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={() => onNewConversation()}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          New chat
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-2">
          {conversations
            .filter(conversation => !conversation.title.startsWith('[DELETED]'))
            .map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "p-3 rounded-lg border-2 transition-all duration-200 group relative",
                currentConversationId === conversation.id 
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500" 
                  : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {editingConversationId === conversation.id ? (
                // Edit mode
                <div className="flex items-center gap-2">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, conversation.id)}
                    className="flex-1 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={(e) => handleSaveEdit(conversation.id, e)}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                // View mode
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1 cursor-pointer mr-3"
                    onClick={() => onConversationSelect(conversation.id)}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                      {conversation.title.length > 30 ? `${conversation.title.substring(0, 30)}...` : conversation.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(conversation.updatedAt)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditConversation(conversation.id, conversation.title, e)}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md flex items-center justify-center transition-colors"
                      title="Edit conversation"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md flex items-center justify-center transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {conversations.filter(c => !c.title.startsWith('[DELETED]')).length === 0 && (
            <div className="text-sm text-gray-500 text-center py-8">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Memory</div>
                <div className="text-xs text-gray-500">
                  {memories.length} memories stored
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => {
              // Open internal settings menu
              const event = new CustomEvent('openSettings');
              window.dispatchEvent(event);
            }}
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
