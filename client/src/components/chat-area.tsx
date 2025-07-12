import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speechSynthesis } from '@/lib/speech-synthesis';
import { cn } from '@/lib/utils';
import type { Message } from '@shared/schema';

interface ChatAreaProps {
  messages: Message[];
  isTyping?: boolean;
  currentConversationId?: number;
  isSpeaking?: boolean;
  isListening?: boolean;
}

export function ChatArea({ messages, isTyping = false, currentConversationId, isSpeaking = false, isListening = false }: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [isSpeakingMessage, setIsSpeakingMessage] = useState<number | null>(null);

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
        speechSynthesis.speak(lastMessage.content, {
          onStart: () => {
            // Speaking state will be handled by parent component
          },
          onEnd: () => {
            // Speaking state will be handled by parent component
          }
        });
      }
    }
  }, [messages, lastMessageId]);

  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const copyToClipboard = (text: string, messageId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const toggleSpeakMessage = (text: string, messageId: number) => {
    if (isSpeakingMessage === messageId) {
      speechSynthesis.stop();
      setIsSpeakingMessage(null);
    } else {
      speechSynthesis.stop();
      setIsSpeakingMessage(messageId);
      speechSynthesis.speak(text, {
        onEnd: () => setIsSpeakingMessage(null),
        onError: () => setIsSpeakingMessage(null)
      });
    }
  };

  if (!currentConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Lumen Logo with Dynamic Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={cn(
            "relative w-80 h-80 rounded-full flex items-center justify-center transition-all duration-300",
            isSpeaking ? "animate-pulse-glow" : isListening ? "animate-listening-glow" : "animate-idle-glow"
          )}>
            {/* Outer glow rings */}
            <div className={cn(
              "absolute inset-0 rounded-full transition-all duration-500",
              isSpeaking ? "bg-gradient-radial from-blue-400/30 via-purple-400/20 to-transparent animate-spin-slow" :
              isListening ? "bg-gradient-radial from-green-400/30 via-blue-400/20 to-transparent" :
              "bg-gradient-radial from-white/20 via-blue-400/10 to-transparent"
            )} />
            
            {/* Middle glow ring */}
            <div className={cn(
              "absolute inset-8 rounded-full transition-all duration-700",
              isSpeaking ? "bg-gradient-radial from-blue-300/40 via-purple-300/30 to-transparent animate-ping" :
              isListening ? "bg-gradient-radial from-green-300/40 via-blue-300/30 to-transparent animate-pulse" :
              "bg-gradient-radial from-white/30 via-blue-300/20 to-transparent"
            )} />
            
            {/* Inner core */}
            <div className={cn(
              "absolute inset-16 rounded-full transition-all duration-300",
              isSpeaking ? "bg-gradient-radial from-blue-200/60 via-purple-200/50 to-transparent animate-bounce" :
              isListening ? "bg-gradient-radial from-green-200/60 via-blue-200/50 to-transparent" :
              "bg-gradient-radial from-white/50 via-blue-200/40 to-transparent"
            )} />
            
            {/* Logo text */}
            <div className={cn(
              "text-7xl font-bold transition-all duration-300",
              isSpeaking ? "text-blue-100 animate-text-glow" :
              isListening ? "text-green-100 animate-text-pulse" :
              "text-white animate-text-breathe"
            )}>
              LUMEN
            </div>
          </div>
        </div>
        
        <div className="text-center z-10 mt-96">
          <h2 className="text-3xl font-semibold text-white mb-4">How can I help you today?</h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            I'm Lumen, your AI assistant. I can speak, listen, and remember our conversations. 
            Start by typing a message or clicking the microphone to speak.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative bg-white dark:bg-gray-900">
      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "group flex items-start gap-4 animate-fade-in",
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === 'assistant' 
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg" 
                  : "bg-gradient-to-br from-gray-600 to-gray-700"
              )}>
                {message.role === 'assistant' ? (
                  <div className="text-white font-bold text-lg">L</div>
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              
              {/* Message Content */}
              <div className={cn(
                "flex-1 max-w-3xl",
                message.role === 'user' ? 'text-right' : ''
              )}>
                <div className={cn(
                  "inline-block p-4 rounded-2xl shadow-sm",
                  message.role === 'user' 
                    ? "bg-blue-500 text-white ml-auto" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                )}>
                  {message.role === 'assistant' && (
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Lumen</div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
                
                {/* Message Actions */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSpeakMessage(message.content, message.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {isSpeakingMessage === message.id ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    {copiedMessageId === message.id && (
                      <span className="text-xs text-green-600 ml-2">Copied!</span>
                    )}
                  </div>
                )}
                
                {/* Timestamp */}
                <div className={cn(
                  "text-xs text-gray-500 mt-1",
                  message.role === 'user' ? 'text-right' : ''
                )}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-4 animate-fade-in">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <div className="text-white font-bold text-lg">L</div>
              </div>
              <div className="flex-1">
                <div className="inline-block p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-sm">
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Lumen</div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
