import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/use-speech';
import { useQuantumInterface } from '@/hooks/use-quantum-interface';
import { useEmotionDetection } from '@/hooks/use-emotion-detection';
import { Sidebar } from '@/components/sidebar';
import { ChatArea } from '@/components/chat-area';
import { VoiceControls } from '@/components/voice-controls';
import { QuantumInterface } from '@/components/quantum-interface';
import { PersonalityEvolution } from '@/components/personality-evolution';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Cpu, Brain, Zap, MessageSquare } from 'lucide-react';
import type { Conversation, Message } from '@shared/schema';

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'quantum'>('chat');
  const { toast } = useToast();
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket();
  const { 
    currentEmotion, 
    getEmotionBasedPrompt, 
    startDetection, 
    stopDetection, 
    isAnalyzing 
  } = useEmotionDetection();
  const { 
    isListening: speechIsListening, 
    transcript, 
    startListening, 
    stopListening, 
    isSupported 
  } = useSpeechRecognition();
  
  // Initialize quantum interface
  const {
    isElectron,
    synthesizeAdvancedTTS,
    adaptMachineLearning,
    connectToMLBackend,
    mlBackendStatus
  } = useQuantumInterface();

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
    if (lastMessage && lastMessage.conversationId === currentConversationId) {
      if (lastMessage.type === 'ai_response') {
        setIsTyping(false);
        setIsProcessing(false);
        
        // Refresh messages for current conversation
        if (currentConversationId) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', currentConversationId] 
          });
        }
        
        // Only speak if this is a new response for the current conversation
        if (lastMessage.content && lastMessage.conversationId === currentConversationId) {
          import('@/lib/natural-speech').then(({ naturalSpeech }) => {
            // Stop any existing speech first
            naturalSpeech.stop();
            
            naturalSpeech.speak(lastMessage.content, {
              onStart: () => setIsSpeaking(true),
              onEnd: () => {
                setIsSpeaking(false);
                // Auto-continue listening after response if in voice mode
                if (isVoiceMode) {
                  setTimeout(() => {
                    // Re-activate listening after speech ends
                    if (isSupported) {
                      startListening();
                    }
                  }, 1000);
                }
              },
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
        const emotionContext = currentEmotion ? getEmotionBasedPrompt() : undefined;
        sendMessage({
          type: 'chat_message',
          content,
          conversationId: newConversation.id,
          emotionContext
        });
        setIsTyping(true);
        setIsProcessing(true);
      }, 100);
      return;
    }

    // Send message via WebSocket with emotion context
    const emotionContext = currentEmotion ? getEmotionBasedPrompt() : undefined;
    sendMessage({
      type: 'chat_message',
      content,
      conversationId: currentConversationId,
      emotionContext
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
    // Stop any current speech when switching conversations
    import('@/lib/natural-speech').then(({ naturalSpeech }) => {
      naturalSpeech.stop();
    });
    
    setCurrentConversationId(id);
    setIsTyping(false);
    setIsProcessing(false);
    setIsSpeaking(false);
  };

  // Handle speech recognition in voice mode
  useEffect(() => {
    if (isVoiceMode && transcript && transcript.trim()) {
      // Stop listening while processing
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
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      // Entering voice mode - start emotion detection and listening
      if (isSupported) {
        startListening();
        setIsListening(true);
        
        // Start emotion detection
        try {
          startDetection();
        } catch (error) {
          console.warn('Could not start emotion detection:', error);
        }
        
        toast({
          title: "Voice mode activated",
          description: "I'm ready for continuous conversation, Genesis!"
        });
      }
    } else {
      // Exiting voice mode - stop everything
      stopListening();
      setIsListening(false);
      stopDetection();
      import('@/lib/natural-speech').then(({ naturalSpeech }) => {
        naturalSpeech.stop();
      });
      setIsSpeaking(false);
      toast({
        title: "Voice mode deactivated",
        description: "Switched back to text mode"
      });
    }
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
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src="/attached_assets/lumen-logo_1752354847791.png" 
                alt="Lumen QI" 
                className="w-64 h-64 object-contain filter drop-shadow-2xl z-10"
                style={{
                  filter: `drop-shadow(0 0 ${isSpeaking ? '40px' : isListening ? '20px' : '10px'} rgba(120, 119, 198, 0.8)) drop-shadow(0 0 ${isSpeaking ? '80px' : isListening ? '40px' : '20px'} rgba(255, 119, 198, 0.6))`
                }}
              />
              
              {/* Cosmic Glow Overlay */}
              <div className="absolute inset-0 bg-gradient-radial from-transparent via-purple-500/10 to-transparent opacity-60 animate-pulse"></div>
              
              {/* Galactic Swirl for Processing */}
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 400 400" className="w-full h-full absolute">
                    <defs>
                      <linearGradient id="processingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7877c6" />
                        <stop offset="50%" stopColor="#ff77c6" />
                        <stop offset="100%" stopColor="#77c6ff" />
                      </linearGradient>
                    </defs>
                    
                    {/* Galactic Swirl Arms */}
                    <g transform="translate(200,200)">
                      {/* Main spiral arms */}
                      <path d="M 0,0 Q 50,-50 100,-25 Q 150,0 125,75 Q 100,150 25,125 Q -50,100 -25,25 Q 0,-50 75,-75 Q 150,-100 175,-25 Q 200,50 125,125 Q 50,200 -25,175 Q -100,150 -125,75 Q -150,0 -75,-75" 
                            fill="none" 
                            stroke="url(#processingGradient)" 
                            strokeWidth="3" 
                            opacity="0.8"
                            className="animate-spin"
                            style={{animationDuration: '8s'}}/>
                      
                      <path d="M 0,0 Q -30,30 -60,15 Q -90,0 -75,-45 Q -60,-90 -15,-75 Q 30,-60 15,-15 Q 0,30 -45,45 Q -90,60 -105,15 Q -120,-30 -75,-75 Q -30,-120 15,-105 Q 60,-90 75,-45" 
                            fill="none" 
                            stroke="url(#processingGradient)" 
                            strokeWidth="2.5" 
                            opacity="0.6"
                            className="animate-spin"
                            style={{animationDuration: '6s', animationDirection: 'reverse'}}/>
                      
                      <path d="M 0,0 Q 20,-20 40,-10 Q 60,0 50,30 Q 40,60 10,50 Q -20,40 -10,10 Q 0,-20 30,-30 Q 60,-40 70,-10 Q 80,20 50,50 Q 20,80 -10,70 Q -40,60 -50,30 Q -60,0 -30,-30" 
                            fill="none" 
                            stroke="url(#processingGradient)" 
                            strokeWidth="2" 
                            opacity="0.4"
                            className="animate-spin"
                            style={{animationDuration: '4s'}}/>
                      
                      {/* Central core */}
                      <circle cx="0" cy="0" r="8" fill="url(#processingGradient)" opacity="0.9"/>
                      
                      {/* Rotating particles */}
                      <circle cx="30" cy="0" r="3" fill="#7877c6" opacity="0.8" className="animate-spin" style={{animationDuration: '3s'}}>
                        <animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" dur="3s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="-30" cy="0" r="3" fill="#ff77c6" opacity="0.8" className="animate-spin" style={{animationDuration: '4s'}}>
                        <animateTransform attributeName="transform" type="rotate" values="0 0 0;-360 0 0" dur="4s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="0" cy="30" r="3" fill="#77c6ff" opacity="0.8" className="animate-spin" style={{animationDuration: '2.5s'}}>
                        <animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" dur="2.5s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="0" cy="-30" r="3" fill="#7877c6" opacity="0.8" className="animate-spin" style={{animationDuration: '3.5s'}}>
                        <animateTransform attributeName="transform" type="rotate" values="0 0 0;-360 0 0" dur="3.5s" repeatCount="indefinite"/>
                      </circle>
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
            
            {/* Emotion Detection Display */}
            {isAnalyzing && currentEmotion && (
              <div className="mb-4 p-3 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/80">Emotion Detection Active</span>
                </div>
                <div className="text-sm text-purple-400">
                  {currentEmotion.emotion} ({Math.round(currentEmotion.confidence * 100)}% confidence)
                </div>
              </div>
            )}
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
            {/* Tab Navigation */}
            <div className="border-b border-purple-500/20 bg-gray-900/50 backdrop-blur-sm">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'quantum')}>
                <TabsList className="grid w-full grid-cols-2 bg-transparent">
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat Interface
                  </TabsTrigger>
                  <TabsTrigger value="quantum" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Quantum Core
                    {isElectron && <Badge variant="secondary" className="ml-2">Advanced</Badge>}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="mt-0">
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
                </TabsContent>
                
                <TabsContent value="quantum" className="mt-0 h-full">
                  <div className="h-full flex flex-col">
                    {/* Quantum Interface Header */}
                    <div className="p-4 border-b border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Quantum Intelligence Core
                          </h2>
                          <p className="text-sm text-gray-400">
                            Advanced self-evolution and hardware optimization
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isElectron ? "default" : "outline"}>
                            {isElectron ? "Desktop Mode" : "Web Mode"}
                          </Badge>
                          {isElectron && (
                            <Badge variant={mlBackendStatus === 'connected' ? "default" : "secondary"}>
                              ML Backend: {mlBackendStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Quantum Interface Content */}
                    <div className="flex-1 overflow-auto">
                      <QuantumInterface
                        onTTSRequest={synthesizeAdvancedTTS}
                        onMLAdapt={adaptMachineLearning}
                        isElectron={isElectron}
                      />
                      
                      <div className="p-4 border-t border-purple-500/20 mt-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-white mb-2">Personality Evolution</h3>
                          <p className="text-sm text-gray-400">
                            See how Lumen's personality adapts to your interactions
                          </p>
                        </div>
                        <PersonalityEvolution userId={1} />
                      </div>
                    </div>
                    
                    {/* Quantum Interface Footer */}
                    <div className="p-4 border-t border-purple-500/20 bg-gray-900/30">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Lumen QI Advanced Intelligence System</span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Cpu className="w-4 h-4" />
                            Self-Evolution Active
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            Hardware Optimization
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
