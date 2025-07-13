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
import lumenLogo from '@assets/lumen-logo_1752354847791.png';
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
    isAnalyzing,
    detectEmotionFromText
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
        
        // Only auto-speak in voice mode
        if (isVoiceMode && lastMessage.content && lastMessage.conversationId === currentConversationId) {
          import('@/lib/natural-speech').then(({ naturalSpeech }) => {
            // Stop any existing speech first
            naturalSpeech.stop();
            
            console.log('Starting speech synthesis for:', lastMessage.content.substring(0, 50) + '...');
            naturalSpeech.speak(lastMessage.content, {
              onStart: () => {
                console.log('Speech actually started - triggering logo animation');
                setIsSpeaking(true);
              },
              onEnd: () => {
                console.log('Speech ended - stopping logo animation');
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
              onError: () => {
                console.log('Speech error - stopping logo animation');
                setIsSpeaking(false);
              }
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
        const textEmotion = detectEmotionFromText(content);
        const emotionContext = currentEmotion ? getEmotionBasedPrompt() : undefined;
        sendMessage({
          type: 'chat_message',
          content,
          conversationId: newConversation.id,
          emotionContext,
          textEmotion
        });
        setIsTyping(true);
        setIsProcessing(true);
      }, 100);
      return;
    }

    // Detect emotion from text and send message via WebSocket
    const textEmotion = detectEmotionFromText(content);
    const emotionContext = currentEmotion ? getEmotionBasedPrompt() : undefined;
    sendMessage({
      type: 'chat_message',
      content,
      conversationId: currentConversationId,
      emotionContext,
      textEmotion
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
    <div className="flex h-screen cosmic-bg overflow-hidden">
      {/* Voice Mode Overlay */}
      {isVoiceMode && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center cosmic-bg">
          <div className="cosmic-particles"></div>
          
          {/* Enhanced Cosmic Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating cosmic orbs */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full animate-pulse blur-xl"></div>
            <div className="absolute top-40 right-32 w-24 h-24 bg-blue-500/10 rounded-full animate-pulse blur-xl" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-32 left-40 w-40 h-40 bg-pink-500/10 rounded-full animate-pulse blur-xl" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 right-20 w-28 h-28 bg-cyan-500/10 rounded-full animate-pulse blur-xl" style={{animationDelay: '3s'}}></div>
            
            {/* Cosmic dust trails */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-blue-900/5 animate-spin-slow"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-pink-900/5 via-transparent to-cyan-900/5 animate-spin-reverse"></div>
          </div>
          
          {/* Voice Mode Lumen Logo */}
          <div className={cn(
            "w-80 h-80 transition-all duration-500 relative",
            isListening ? 'lumen-logo-listening' : 
            isSpeaking ? 'lumen-logo-speaking' : 'lumen-logo-idle'
          )}>
            {/* Actual Lumen Logo */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={lumenLogo} 
                alt="Lumen QI" 
                className="w-64 h-64 object-contain filter drop-shadow-2xl z-10"
                style={{
                  filter: `drop-shadow(0 0 ${isSpeaking ? '40px' : isListening ? '20px' : '10px'} rgba(120, 119, 198, 0.8)) drop-shadow(0 0 ${isSpeaking ? '80px' : isListening ? '40px' : '20px'} rgba(255, 119, 198, 0.6))`
                }}
              />
              
              {/* Enhanced Cosmic Glow Overlay */}
              <div className="absolute inset-0 bg-gradient-radial from-transparent via-purple-500/20 to-transparent opacity-60 animate-pulse"></div>
              
              {/* Additional glow layers for depth */}
              <div className="absolute inset-4 bg-gradient-radial from-transparent via-blue-500/15 to-transparent opacity-40 animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute inset-8 bg-gradient-radial from-transparent via-pink-500/10 to-transparent opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
              
              {/* Cosmic Swirl Background (always visible, intensifies when processing) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 400 400" className="w-full h-full absolute">
                  <defs>
                    <linearGradient id="cosmicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7877c6" />
                      <stop offset="50%" stopColor="#ff77c6" />
                      <stop offset="100%" stopColor="#77c6ff" />
                    </linearGradient>
                  </defs>
                  
                  {/* Cosmic Swirl Arms - always rotating */}
                  <g transform="translate(200,200)">
                    {/* Main spiral arms */}
                    <path d="M 0,0 Q 50,-50 100,-25 Q 150,0 125,75 Q 100,150 25,125 Q -50,100 -25,25 Q 0,-50 75,-75 Q 150,-100 175,-25 Q 200,50 125,125 Q 50,200 -25,175 Q -100,150 -125,75 Q -150,0 -75,-75" 
                          fill="none" 
                          stroke="url(#cosmicGradient)" 
                          strokeWidth={isProcessing ? "4" : "2"} 
                          opacity={isProcessing ? "0.9" : "0.3"}
                          className="animate-spin-slow"
                          style={{transition: 'all 1s ease-in-out'}}/>
                    
                    <path d="M 0,0 Q -30,30 -60,15 Q -90,0 -75,-45 Q -60,-90 -15,-75 Q 30,-60 15,-15 Q 0,30 -45,45 Q -90,60 -105,15 Q -120,-30 -75,-75 Q -30,-120 15,-105 Q 60,-90 75,-45" 
                          fill="none" 
                          stroke="url(#cosmicGradient)" 
                          strokeWidth={isProcessing ? "3" : "1.5"} 
                          opacity={isProcessing ? "0.7" : "0.2"}
                          className="animate-spin-reverse"
                          style={{transition: 'all 1s ease-in-out'}}/>
                    
                    <path d="M 0,0 Q 20,-20 40,-10 Q 60,0 50,30 Q 40,60 10,50 Q -20,40 -10,10 Q 0,-20 30,-30 Q 60,-40 70,-10 Q 80,20 50,50 Q 20,80 -10,70 Q -40,60 -50,30 Q -60,0 -30,-30" 
                          fill="none" 
                          stroke="url(#cosmicGradient)" 
                          strokeWidth={isProcessing ? "2.5" : "1"} 
                          opacity={isProcessing ? "0.5" : "0.1"}
                          className="animate-spin-slow"
                          style={{transition: 'all 1s ease-in-out'}}/>
                    
                    {/* Central core */}
                    <circle cx="0" cy="0" r={isProcessing ? "12" : "6"} fill="url(#cosmicGradient)" opacity={isProcessing ? "0.9" : "0.4"} style={{transition: 'all 1s ease-in-out'}}/>
                    
                    {/* Floating particles */}
                    <circle cx="30" cy="0" r="3" fill="#7877c6" opacity={isProcessing ? "0.8" : "0.3"} className="animate-spin-slow" style={{transition: 'all 1s ease-in-out'}}>
                      <animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" dur="3s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="-30" cy="0" r="3" fill="#ff77c6" opacity={isProcessing ? "0.8" : "0.3"} className="animate-spin-reverse" style={{transition: 'all 1s ease-in-out'}}>
                      <animateTransform attributeName="transform" type="rotate" values="0 0 0;-360 0 0" dur="4s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="0" cy="30" r="3" fill="#77c6ff" opacity={isProcessing ? "0.8" : "0.3"} className="animate-spin-slow" style={{transition: 'all 1s ease-in-out'}}>
                      <animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" dur="2.5s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="0" cy="-30" r="3" fill="#7877c6" opacity={isProcessing ? "0.8" : "0.3"} className="animate-spin-reverse" style={{transition: 'all 1s ease-in-out'}}>
                      <animateTransform attributeName="transform" type="rotate" values="0 0 0;-360 0 0" dur="3.5s" repeatCount="indefinite"/>
                    </circle>
                  </g>
                </svg>
              </div>
              
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
          
          {/* Status Text - Centered below logo */}
          <div className="text-center mt-8 space-y-4">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Voice Mode Active"}
            </h2>
            <p className="text-white/80 text-lg">
              {isSpeaking ? "Lumen is responding" : isListening ? "I'm listening, Genesis..." : "Ready for continuous conversation"}
            </p>
            
            {/* Emotion Display */}
            {currentEmotion && (
              <div className="mt-4">
                <Badge variant="outline" className="bg-white/10 text-white border-white/30 px-4 py-2">
                  {currentEmotion.emotion} ({Math.round(currentEmotion.confidence * 100)}%)
                </Badge>
              </div>
            )}
          </div>
          
          {/* Exit Voice Mode Button - Bottom */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <Button 
              onClick={handleVoiceModeToggle}
              className="bg-purple-600/80 hover:bg-purple-700/90 text-white backdrop-blur-sm border border-white/20"
            >
              Exit Voice Mode
            </Button>
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
          
          <div className="flex-1 flex flex-col overflow-hidden">
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
                
                <TabsContent value="chat" className="mt-0 flex-1 flex flex-col overflow-hidden">
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
                
                <TabsContent value="quantum" className="mt-0 flex-1 flex flex-col overflow-hidden">
                  <div className="h-full flex flex-col overflow-y-auto">
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
