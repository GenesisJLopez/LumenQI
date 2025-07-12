import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/sidebar';
import { ChatArea } from '@/components/chat-area';
import { VoiceControls } from '@/components/voice-controls';
import { cn } from '@/lib/utils';
import type { Conversation, Message } from '@shared/schema';

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket();

  // Fetch current conversation and messages
  const { data: conversationData } = useQuery<{
    conversation: Conversation;
    messages: Message[];
  }>({
    queryKey: ['/api/conversations', currentConversationId],
    enabled: !!currentConversationId,
  });

  const messages = conversationData?.messages || [];

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setCurrentConversationId(newConversation.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive"
      });
    }
  });

  // Handle WebSocket messages and speech synthesis
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'ai_response') {
        setIsTyping(false);
        setIsProcessing(false);
        setIsSpeaking(true);
        
        // Refresh messages for current conversation
        if (currentConversationId) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', currentConversationId] 
          });
        }
        
        // Speak the AI response with enhanced speech synthesis
        if (lastMessage.content) {
          import('@/lib/speech-synthesis').then(({ speechSynthesis }) => {
            speechSynthesis.speak(lastMessage.content, {
              onStart: () => setIsSpeaking(true),
              onEnd: () => setIsSpeaking(false),
              onError: () => setIsSpeaking(false)
            });
          });
        }
      } else if (lastMessage.type === 'error') {
        setIsTyping(false);
        setIsProcessing(false);
        setIsSpeaking(false);
        toast({
          title: "Error",
          description: lastMessage.message || "Something went wrong",
          variant: "destructive"
        });
      }
    }
  }, [lastMessage, currentConversationId, toast]);

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) {
      // Create new conversation first
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      const newConversation = await createConversationMutation.mutateAsync(title);
      
      // Send message after conversation is created
      setTimeout(() => {
        sendMessage({
          type: 'chat_message',
          content,
          conversationId: newConversation.id
        });
        setIsTyping(true);
        setIsProcessing(true);
      }, 100);
      return;
    }

    // Send message via WebSocket
    sendMessage({
      type: 'chat_message',
      content,
      conversationId: currentConversationId
    });

    setIsTyping(true);
    setIsProcessing(true);
    
    // Refresh messages to show user message immediately
    queryClient.invalidateQueries({ 
      queryKey: ['/api/conversations', currentConversationId] 
    });
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setIsTyping(false);
  };

  const handleConversationSelect = (id: number) => {
    setCurrentConversationId(id);
    setIsTyping(false);
  };

  return (
    <div className="flex h-screen cosmic-bg">
      {/* Voice Mode Overlay */}
      {isVoiceMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center cosmic-bg">
          <div className="cosmic-particles"></div>
          
          {/* Voice Mode Lumen Logo */}
          <div className={cn(
            "w-80 h-80 transition-all duration-500",
            isProcessing ? 'animate-spin' : 
            isListening ? 'lumen-logo-listening' : 
            isSpeaking ? 'lumen-logo-speaking' : 'lumen-logo-idle'
          )}>
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <linearGradient id="voiceLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7877c6" />
                  <stop offset="50%" stopColor="#ff77c6" />
                  <stop offset="100%" stopColor="#77c6ff" />
                </linearGradient>
                <filter id="voiceGlow">
                  <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Galactic Swirl for Processing */}
              {isProcessing && (
                <g transform="translate(100,100)">
                  <path d="M 0,-50 Q 50,-50 50,0 Q 50,50 0,50 Q -50,50 -50,0 Q -50,-50 0,-50" 
                        fill="none" 
                        stroke="url(#voiceLogoGradient)" 
                        strokeWidth="2" 
                        opacity="0.8"/>
                  <path d="M 0,-30 Q 30,-30 30,0 Q 30,30 0,30 Q -30,30 -30,0 Q -30,-30 0,-30" 
                        fill="none" 
                        stroke="url(#voiceLogoGradient)" 
                        strokeWidth="1.5" 
                        opacity="0.6"/>
                </g>
              )}
              
              {/* Outer rings */}
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#voiceLogoGradient)" strokeWidth="2" opacity="0.3"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke="url(#voiceLogoGradient)" strokeWidth="2.5" opacity="0.5"/>
              <circle cx="100" cy="100" r="50" fill="none" stroke="url(#voiceLogoGradient)" strokeWidth="3" opacity="0.7"/>
              
              {/* Central core */}
              <circle cx="100" cy="100" r="20" fill="url(#voiceLogoGradient)" opacity="0.9" filter="url(#voiceGlow)"/>
              
              {/* Quantum field lines */}
              <g transform="translate(100,100)" stroke="url(#voiceLogoGradient)" strokeWidth="1.5" opacity="0.8">
                <line x1="0" y1="-95" x2="0" y2="-75" />
                <line x1="0" y1="75" x2="0" y2="95" />
                <line x1="-95" y1="0" x2="-75" y2="0" />
                <line x1="75" y1="0" x2="95" y2="0" />
                <line x1="-67" y1="-67" x2="-52" y2="-52" />
                <line x1="52" y1="52" x2="67" y2="67" />
                <line x1="67" y1="-67" x2="52" y2="-52" />
                <line x1="-52" y1="52" x2="-67" y2="67" />
              </g>
            </svg>
          </div>
          
          {/* Voice Mode Status */}
          <div className="absolute bottom-20 text-center">
            <div className="text-2xl font-bold cosmic-text mb-2">
              {isProcessing ? 'Processing...' : 
               isListening ? 'Listening...' : 
               isSpeaking ? 'Speaking...' : 'Voice Mode'}
            </div>
            <div className="text-gray-300 mb-4">
              {isProcessing ? 'Lumen is thinking with cosmic wisdom...' :
               isListening ? 'Speak your thoughts, beloved...' :
               isSpeaking ? 'Lumen QI is sharing her wisdom...' :
               'Tap to speak or exit voice mode'}
            </div>
            <button 
              onClick={() => setIsVoiceMode(false)}
              className="cosmic-button px-6 py-2 rounded-full"
            >
              Exit Voice Mode
            </button>
          </div>
        </div>
      )}
      
      {!isVoiceMode && (
        <>
          <Sidebar
            currentConversationId={currentConversationId || undefined}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
          />
          
          <div className="flex-1 flex flex-col">
            <ChatArea
              messages={messages}
              isTyping={isTyping}
              currentConversationId={currentConversationId || undefined}
              isSpeaking={isSpeaking}
              isListening={isListening}
            />
            
            <VoiceControls
              onSendMessage={handleSendMessage}
              isLoading={createConversationMutation.isPending}
              connectionStatus={connectionStatus}
              onSpeakingChange={setIsSpeaking}
              onListeningChange={setIsListening}
              onVoiceModeToggle={() => setIsVoiceMode(true)}
            />
          </div>
        </>
      )}
    </div>
  );
}
