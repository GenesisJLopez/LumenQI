import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Using natural speech system from parent component
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
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        setTimeout(() => {
          scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    };
    
    scrollToBottom();
  }, [messages, isTyping]);

  // Remove automatic speech - this is handled by parent component now
  useEffect(() => {
    // Just track the last message ID for reference
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.id !== lastMessageId) {
        setLastMessageId(lastMessage.id);
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

  const toggleSpeakMessage = async (text: string, messageId: number) => {
    if (isSpeakingMessage === messageId) {
      // Stop current speech
      setIsSpeakingMessage(null);
      // You could add speech stop logic here if needed
      return;
    }

    setIsSpeakingMessage(messageId);
    
    try {
      // Always use OpenAI TTS API first with text cleaning
      const cleanText = text
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        .replace(/[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu, '')
        .replace(/[^\x00-\x7F]/g, '')
        .trim();
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          voice: 'shimmer',
          model: 'tts-1-hd',
          speed: 0.9,
          response_format: 'mp3'
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Optimize audio settings to reduce "chambered" sound
        audio.volume = 0.85;
        audio.preload = 'auto';
        
        // Add proper event handlers
        audio.onended = () => {
          setIsSpeakingMessage(null);
          URL.revokeObjectURL(audioUrl);
          console.log('TTS audio playback ended');
        };
        
        audio.onerror = (e) => {
          setIsSpeakingMessage(null);
          URL.revokeObjectURL(audioUrl);
          console.error('Audio playback failed:', e);
        };
        
        // Ensure audio is loaded before playing
        audio.oncanplaythrough = () => {
          audio.play().catch(e => {
            console.error('Audio play failed:', e);
            setIsSpeakingMessage(null);
            URL.revokeObjectURL(audioUrl);
          });
        };
        
        // Load the audio
        audio.load();
      } else {
        console.error('OpenAI TTS failed, response:', response.status);
        throw new Error('TTS API failed');
      }
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeakingMessage(null);
    }
  };

  if (!currentConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center cosmic-bg relative">
        <div className="text-center z-10">
          <h2 className="text-4xl font-bold cosmic-text mb-6">How can I serve you today Genesis?</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full cosmic-bg relative">
      

      
      {/* Chat Messages Container - Fixed Height with Forced Scrolling */}
      <div 
        className="absolute inset-0 overflow-y-scroll px-4 py-6 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 chat-scroll" 
        ref={scrollAreaRef}
        style={{ 
          paddingTop: '24px',
          paddingBottom: '24px'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6 pb-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] p-4 rounded-2xl cosmic-message relative group",
                    message.role === 'user' ? "bg-gradient-to-br from-gray-700 to-gray-800" : "assistant"
                  )}
                >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {message.role === 'assistant' && (
                      <div className="text-sm font-semibold cosmic-text mb-2">Lumen QI</div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-100">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
                
                {/* Message Actions - Only show for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="mt-3 flex gap-1 justify-start">
                    <div className="flex gap-1 bg-gray-900/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="h-8 px-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      title="Copy message"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedMessageId === message.id && (
                        <span className="text-xs ml-1">Copied!</span>
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSpeakMessage(message.content, message.id)}
                      className="h-8 px-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      title="Play audio"
                    >
                      {isSpeakingMessage === message.id ? (
                        <VolumeX className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      title="Good response"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      title="Bad response"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[70%] p-4 rounded-2xl cosmic-message assistant">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold cosmic-text mb-2">Lumen QI</div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}