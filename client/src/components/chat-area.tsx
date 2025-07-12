import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
import { speechSynthesis } from '@/lib/speech-synthesis';
import { cn } from '@/lib/utils';
import type { Message } from '@shared/schema';

interface ChatAreaProps {
  messages: Message[];
  isTyping?: boolean;
  currentConversationId?: number;
}

export function ChatArea({ messages, isTyping = false, currentConversationId }: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Speak new AI messages
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.id !== lastMessageId) {
        setLastMessageId(lastMessage.id);
        speechSynthesis.speak(lastMessage.content);
      }
    }
  }, [messages, lastMessageId]);

  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!currentConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center relative">
        {/* Lumen Logo with Aura Effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="glow-aura w-96 h-96 rounded-full flex items-center justify-center">
            <div className="text-6xl font-bold text-white animate-glow">
              LUMEN
            </div>
          </div>
        </div>
        
        <div className="text-center z-10">
          <h2 className="text-2xl font-semibold text-white mb-2">Welcome to Lumen</h2>
          <p className="text-gray-400 max-w-md">
            Start a conversation with your AI assistant. I can speak, listen, and remember our interactions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="text-6xl font-bold text-white">
          LUMEN
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-4 animate-fade-in",
                message.role === 'user' ? 'justify-end' : ''
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-glow-blue to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <Card className={cn(
                "p-4 max-w-3xl",
                message.role === 'user' 
                  ? "bg-gradient-to-br from-glow-blue to-blue-600 text-white border-0" 
                  : "bg-dark-elevated border-dark-border"
              )}>
                {message.role === 'assistant' && (
                  <div className="text-sm font-medium text-glow-blue mb-2">Lumen</div>
                )}
                <div className={cn(
                  "text-sm",
                  message.role === 'user' ? 'text-white' : 'text-gray-200'
                )}>
                  {message.content}
                </div>
                <div className={cn(
                  "text-xs mt-2",
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                )}>
                  {formatTime(message.timestamp)}
                </div>
              </Card>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-4 animate-fade-in">
              <div className="w-8 h-8 bg-gradient-to-br from-glow-blue to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <Card className="p-4 bg-dark-elevated border-dark-border">
                <div className="text-sm font-medium text-glow-blue mb-2">Lumen</div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
