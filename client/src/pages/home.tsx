import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/use-speech';
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
  const { 
    isListening: speechIsListening, 
    transcript, 
    startListening, 
    stopListening, 
    isSupported 
  } = useSpeechRecognition();

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

  // Handle speech recognition in voice mode
  useEffect(() => {
    if (isVoiceMode && transcript && transcript.trim()) {
      // Stop listening after getting transcript
      stopListening();
      setIsListening(false);
      
      // Send the transcript as a message
      handleSendMessage(transcript);
    }
  }, [transcript, isVoiceMode]);

  useEffect(() => {
    setIsListening(speechIsListening);
  }, [speechIsListening]);

  const handleVoiceModeToggle = () => {
    if (isVoiceMode) {
      stopListening();
      setIsListening(false);
    }
    setIsVoiceMode(!isVoiceMode);
  };

  const handleVoiceListenToggle = () => {
    if (!isSupported) {
      toast({
        title: "Voice not supported",
        description: "Speech recognition is not available in this browser",
        variant: "destructive"
      });
      return;
    }

    if (speechIsListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex h-screen cosmic-bg">
      {/* Voice Mode Overlay */}
      {isVoiceMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center cosmic-bg">
          <div className="cosmic-particles"></div>
          
          {/* Voice Mode Lumen Logo */}
          <div className={cn(
            "w-80 h-80 transition-all duration-500 relative",
            isProcessing ? 'animate-spin' : 
            isListening ? 'lumen-logo-listening' : 
            isSpeaking ? 'lumen-logo-speaking' : 'lumen-logo-idle'
          )}>
            {/* Actual Lumen Logo */}
            <div className="relative w-full h-full">
              <img 
                src="/attached_assets/lumen-logo_1752354847791.png" 
                alt="Lumen QI" 
                className="w-full h-full object-contain filter drop-shadow-2xl"
                style={{
                  filter: `drop-shadow(0 0 ${isSpeaking ? '40px' : isListening ? '20px' : '10px'} rgba(120, 119, 198, 0.8)) drop-shadow(0 0 ${isSpeaking ? '80px' : isListening ? '40px' : '20px'} rgba(255, 119, 198, 0.6))`
                }}
              />
              
              {/* Cosmic Glow Overlay */}
              <div className="absolute inset-0 bg-gradient-radial from-transparent via-purple-500/10 to-transparent opacity-60 animate-pulse"></div>
              
              {/* Galactic Swirl for Processing */}
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full absolute animate-spin">
                    <defs>
                      <linearGradient id="processingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7877c6" />
                        <stop offset="50%" stopColor="#ff77c6" />
                        <stop offset="100%" stopColor="#77c6ff" />
                      </linearGradient>
                    </defs>
                    
                    {/* Galactic Swirl */}
                    <g transform="translate(100,100)">
                      <path d="M 0,-70 Q 70,-70 70,0 Q 70,70 0,70 Q -70,70 -70,0 Q -70,-70 0,-70" 
                            fill="none" 
                            stroke="url(#processingGradient)" 
                            strokeWidth="2" 
                            opacity="0.8"/>
                      <path d="M 0,-50 Q 50,-50 50,0 Q 50,50 0,50 Q -50,50 -50,0 Q -50,-50 0,-50" 
                            fill="none" 
                            stroke="url(#processingGradient)" 
                            strokeWidth="1.5" 
                            opacity="0.6"/>
                      <path d="M 0,-30 Q 30,-30 30,0 Q 30,30 0,30 Q -30,30 -30,0 Q -30,-30 0,-30" 
                            fill="none" 
                            stroke="url(#processingGradient)" 
                            strokeWidth="1" 
                            opacity="0.4"/>
                    </g>
                  </svg>
                </div>
              )}
              
              {/* Pulsing Rings for Listening */}
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full absolute">
                    <defs>
                      <linearGradient id="listeningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#77c6ff" />
                        <stop offset="100%" stopColor="#7877c6" />
                      </linearGradient>
                    </defs>
                    
                    {/* Pulsing rings */}
                    <circle cx="100" cy="100" r="60" fill="none" stroke="url(#listeningGradient)" strokeWidth="2" opacity="0.6" className="animate-ping"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="url(#listeningGradient)" strokeWidth="1.5" opacity="0.4" className="animate-ping" style={{animationDelay: '0.2s'}}/>
                    <circle cx="100" cy="100" r="100" fill="none" stroke="url(#listeningGradient)" strokeWidth="1" opacity="0.2" className="animate-ping" style={{animationDelay: '0.4s'}}/>
                  </svg>
                </div>
              )}
              
              {/* Rhythmic Glow for Speaking */}
              {isSpeaking && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full absolute">
                    <defs>
                      <linearGradient id="speakingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff77c6" />
                        <stop offset="100%" stopColor="#7877c6" />
                      </linearGradient>
                    </defs>
                    
                    {/* Rhythmic glow */}
                    <circle cx="100" cy="100" r="70" fill="none" stroke="url(#speakingGradient)" strokeWidth="3" opacity="0.8" className="animate-pulse"/>
                    <circle cx="100" cy="100" r="90" fill="none" stroke="url(#speakingGradient)" strokeWidth="2" opacity="0.6" className="animate-pulse" style={{animationDelay: '0.1s'}}/>
                  </svg>
                </div>
              )}
            </div>
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
               isListening ? 'Speak your thoughts, Genesis...' :
               isSpeaking ? 'Lumen QI is sharing her wisdom...' :
               'Tap to speak or exit voice mode'}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleVoiceListenToggle}
                className={cn(
                  "cosmic-button px-6 py-2 rounded-full",
                  isListening && "active"
                )}
                disabled={!isSupported}
              >
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </button>
              <button 
                onClick={handleVoiceModeToggle}
                className="cosmic-button px-6 py-2 rounded-full"
              >
                Exit Voice Mode
              </button>
            </div>
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
              onVoiceModeToggle={handleVoiceModeToggle}
            />
          </div>
        </>
      )}
    </div>
  );
}
