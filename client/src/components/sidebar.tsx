import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Brain, UserCog, Database, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation, Memory } from '@shared/schema';

interface SidebarProps {
  currentConversationId?: number;
  onConversationSelect: (id: number) => void;
  onNewConversation: () => void;
}

export function Sidebar({ currentConversationId, onConversationSelect, onNewConversation }: SidebarProps) {
  const { toast } = useToast();
  
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({ title: "Chat deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete chat", variant: "destructive" });
    },
  });

  const handleDeleteConversation = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // If this is the current conversation, clear it
    if (currentConversationId === id) {
      onNewConversation();
    }
    
    deleteConversation.mutate(id);
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
          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Settings className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
        
        <Button 
          onClick={onNewConversation}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          New chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {conversations
            .filter(conversation => !conversation.title.startsWith('[DELETED]'))
            .map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "p-3 cursor-pointer transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group",
                currentConversationId === conversation.id ? "bg-gray-100 dark:bg-gray-800" : ""
              )}
              onClick={() => onConversationSelect(conversation.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(conversation.updatedAt)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {conversations.filter(c => !c.title.startsWith('[DELETED]')).length === 0 && (
            <div className="text-sm text-gray-500 text-center py-8">
              No conversations yet
            </div>
          )}
        </div>
      </ScrollArea>

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
          >
            <UserCog className="h-4 w-4 mr-3" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
