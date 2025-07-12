import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Plus, Brain, UserCog, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation, Memory } from '@shared/schema';

interface SidebarProps {
  currentConversationId?: number;
  onConversationSelect: (id: number) => void;
  onNewConversation: () => void;
}

export function Sidebar({ currentConversationId, onConversationSelect, onNewConversation }: SidebarProps) {
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  const { data: memories = [] } = useQuery<Memory[]>({
    queryKey: ['/api/memories'],
  });

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
    <div className="w-80 bg-dark-surface border-r border-dark-border flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-white">Lumen</h1>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-dark-elevated">
            <Settings className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
        
        <Button 
          onClick={onNewConversation}
          className="w-full bg-glow-blue hover:bg-blue-600 text-white font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-400 mb-3">Recent Conversations</div>
          
          {conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className={cn(
                "p-3 cursor-pointer transition-colors hover:bg-dark-elevated/50",
                currentConversationId === conversation.id ? "bg-dark-elevated" : "bg-transparent"
              )}
              onClick={() => onConversationSelect(conversation.id)}
            >
              <div className="text-sm font-medium text-white truncate">
                {conversation.title}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {formatTimeAgo(conversation.updatedAt)}
              </div>
            </Card>
          ))}
          
          {conversations.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-8">
              No conversations yet. Start a new one!
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border">
        <div className="space-y-3">
          <Card className="p-3 bg-dark-elevated">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-glow-blue rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Memory Status</div>
                <div className="text-xs text-gray-400">
                  Active • {memories.length} memories
                </div>
              </div>
            </div>
          </Card>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-dark-elevated"
          >
            <UserCog className="h-4 w-4 mr-3" />
            Personality Settings
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-dark-elevated"
          >
            <Database className="h-4 w-4 mr-3" />
            Memory Management
          </Button>
        </div>
      </div>
    </div>
  );
}
