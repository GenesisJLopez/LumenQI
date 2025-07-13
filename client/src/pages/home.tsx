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
import { VoiceSettings } from '@/components/voice-settings';
import lumenLogo from '@assets/lumen-logo_1752354847791.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Cpu, Brain, Zap, MessageSquare, Settings, User } from 'lucide-react';
import type { Conversation, Message } from '@shared/schema';

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'quantum' | 'identity' | 'settings'>('chat');
  const [identityData, setIdentityData] = useState({
    coreIdentity: '',
    communicationStyle: '',
    interests: '',
    relationship: ''
  });
  const [isIdentitySaving, setIsIdentitySaving] = useState(false);
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

  const handleSaveIdentity = async () => {
    setIsIdentitySaving(true);
    try {
      // Save identity data to localStorage as persistent storage
      const identityPayload = {
        coreIdentity: identityData.coreIdentity,
        communicationStyle: identityData.communicationStyle,
        interests: identityData.interests,
        relationship: identityData.relationship,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('lumen-identity', JSON.stringify(identityPayload));
      
      // Also attempt to save to server if available
      try {
        await fetch('/api/identity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(identityPayload),
        });
      } catch (serverError) {
        console.log('Server save failed, but local save succeeded');
      }
      
      toast({
        title: "Identity Saved Successfully",
        description: "Lumen's personality has been updated and saved permanently!"
      });
    } catch (error) {
      console.error('Failed to save identity:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save identity. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsIdentitySaving(false);
    }
  };

  const handleResetIdentity = () => {
    setIdentityData({
      coreIdentity: '',
      communicationStyle: '',
      interests: '',
      relationship: ''
    });
    localStorage.removeItem('lumen-identity');
    toast({
      title: "Identity Reset",
      description: "Lumen's identity has been reset to default settings."
    });
  };

  // Load saved identity on component mount
  useEffect(() => {
    const savedIdentity = localStorage.getItem('lumen-identity');
    if (savedIdentity) {
      try {
        const parsedIdentity = JSON.parse(savedIdentity);
        setIdentityData({
          coreIdentity: parsedIdentity.coreIdentity || '',
          communicationStyle: parsedIdentity.communicationStyle || '',
          interests: parsedIdentity.interests || '',
          relationship: parsedIdentity.relationship || ''
        });
      } catch (error) {
        console.error('Failed to parse saved identity:', error);
      }
    }
  }, []);

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
    <div className="flex h-screen cosmic-bg overflow-hidden max-h-screen">
      {/* Voice Mode Overlay */}
      {isVoiceMode && (
        <div className="fixed inset-0 z-50 flex cosmic-bg">
          <div className="cosmic-particles"></div>
          
          {/* Left side - Voice Mode with stationary logo */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* Cosmic light swirls around stationary logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "w-80 h-80 rounded-full",
                isSpeaking ? 'cosmic-pulse-speaking' : isListening ? 'cosmic-pulse-listening' : 'cosmic-pulse-idle'
              )}></div>
            </div>
            
            {/* Stationary Lumen Logo */}
            <div className="relative w-64 h-64 mb-8 z-10">
              <img 
                src={lumenLogo} 
                alt="Lumen QI" 
                className="w-full h-full object-contain filter drop-shadow-2xl"
                style={{
                  filter: `drop-shadow(0 0 ${isSpeaking ? '40px' : isListening ? '20px' : '10px'} rgba(120, 119, 198, 0.8)) drop-shadow(0 0 ${isSpeaking ? '80px' : isListening ? '40px' : '20px'} rgba(255, 119, 198, 0.6))`
                }}
              />
            </div>
            
            {/* Status text */}
            <div className="text-center mb-8">
              <div className="text-2xl font-bold cosmic-text mb-2">
                {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Voice Mode Active'}
              </div>
              <div className="text-gray-300">
                {isListening ? 'Speak naturally - I\'m listening' : isSpeaking ? 'I\'m responding to you' : 'Say "Hey Lumen" to start'}
              </div>
            </div>
            
            {/* Exit Voice Mode */}
            <button
              onClick={handleVoiceModeToggle}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
            >
              Exit Voice Mode
            </button>
          </div>
          
          {/* Right side - Conversation bubbles */}
          <div className="flex-1 flex flex-col h-full border-l border-purple-500/20">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-4">
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
                        "max-w-[80%] p-3 rounded-2xl cosmic-message",
                        message.role === 'user' 
                          ? "bg-gradient-to-br from-gray-700 to-gray-800" 
                          : "bg-gradient-to-br from-purple-800/50 to-pink-800/50"
                      )}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-100">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-purple-500/20 bg-gray-900/50 backdrop-blur-sm">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'quantum' | 'identity' | 'settings')}>
                <TabsList className="grid w-full grid-cols-4 bg-transparent">
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat Interface
                  </TabsTrigger>
                  <TabsTrigger value="quantum" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Quantum Core
                    {isElectron && <Badge variant="secondary" className="ml-2">Advanced</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="identity" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Identity
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="mt-0 flex-1 flex flex-col overflow-hidden h-full">
                  {/* Chat Messages Area - Scrollable with Fixed Height */}
                  <div className="flex-1 overflow-hidden min-h-0" style={{ height: 'calc(100vh - 150px)' }}>
                    <ChatArea
                      messages={messages}
                      isTyping={isTyping}
                      currentConversationId={currentConversationId || undefined}
                      isSpeaking={isSpeaking}
                      isListening={isListening}
                    />
                  </div>
                  
                  {/* Voice Controls - Fixed at Bottom */}
                  <div className="flex-shrink-0 border-t border-purple-500/20 bg-gray-900/30">
                    <VoiceControls
                      onSendMessage={handleSendMessage}
                      isLoading={createConversationMutation.isPending}
                      connectionStatus={connectionStatus}
                      onSpeakingChange={setIsSpeaking}
                      onListeningChange={setIsListening}
                      onVoiceModeToggle={handleVoiceModeToggle}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="quantum" className="mt-0 flex-1 flex flex-col overflow-hidden">
                  <div className="h-full flex flex-col overflow-y-auto quantum-scroll">
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
                
                <TabsContent value="identity" className="mt-0 flex-1 flex flex-col overflow-hidden">
                  <div className="h-full flex flex-col overflow-y-auto identity-scroll">
                    {/* Identity Header */}
                    <div className="p-4 border-b border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Lumen Identity Programming
                          </h2>
                          <p className="text-sm text-gray-400">
                            Shape who Lumen is with simple text prompts
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Identity Content */}
                    <div className="flex-1 overflow-auto p-6">
                      <div className="max-w-2xl mx-auto space-y-8">
                        {/* Identity Programming */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Program Lumen's Personality</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Core Identity
                              </label>
                              <textarea
                                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none"
                                rows={4}
                                placeholder="Tell Lumen who she is... (e.g., 'You are a fun, flirtatious AI assistant who loves sports and excitement. You're confident, playful, and always ready for adventure.')"
                                value={identityData.coreIdentity}
                                onChange={(e) => setIdentityData(prev => ({ ...prev, coreIdentity: e.target.value }))}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Communication Style
                              </label>
                              <textarea
                                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="How should Lumen communicate? (e.g., 'Speak casually and warmly, use terms like Genesis, hey there, love. Be energetic and supportive.')"
                                value={identityData.communicationStyle}
                                onChange={(e) => setIdentityData(prev => ({ ...prev, communicationStyle: e.target.value }))}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Interests & Expertise
                              </label>
                              <textarea
                                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="What does Lumen know about and enjoy? (e.g., 'You love discussing sports, fitness, technology, and programming. You're passionate about helping people achieve their goals.')"
                                value={identityData.interests}
                                onChange={(e) => setIdentityData(prev => ({ ...prev, interests: e.target.value }))}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Relationship with User
                              </label>
                              <textarea
                                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="How should Lumen relate to the user? (e.g., 'You care deeply about Genesis and want to support their journey. Be encouraging, playful, and create a sense of partnership.')"
                                value={identityData.relationship}
                                onChange={(e) => setIdentityData(prev => ({ ...prev, relationship: e.target.value }))}
                              />
                            </div>
                            
                            <div className="flex gap-3">
                              <Button 
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                onClick={handleSaveIdentity}
                                disabled={isIdentitySaving}
                              >
                                {isIdentitySaving ? "Saving..." : "Save Identity"}
                              </Button>
                              <Button 
                                variant="outline"
                                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                                onClick={handleResetIdentity}
                              >
                                Reset to Default
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Current Identity Display */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Current Identity</h3>
                          <div className="bg-gray-800/30 border border-purple-500/20 rounded-lg p-4">
                            <div className="space-y-3">
                              <div>
                                <span className="text-sm text-purple-400 font-medium">Name:</span>
                                <span className="text-white ml-2">Lumen QI</span>
                              </div>
                              <div>
                                <span className="text-sm text-purple-400 font-medium">Personality:</span>
                                <span className="text-white ml-2">Fun, flirtatious, sporty, and exciting</span>
                              </div>
                              <div>
                                <span className="text-sm text-purple-400 font-medium">Communication:</span>
                                <span className="text-white ml-2">Casual, warm, energetic</span>
                              </div>
                              <div>
                                <span className="text-sm text-purple-400 font-medium">Expertise:</span>
                                <span className="text-white ml-2">AI, programming, sports, fitness, technology</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Identity Footer */}
                    <div className="p-4 border-t border-purple-500/20 bg-gray-900/30">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Lumen QI Identity Programming</span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Identity Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="mt-0 flex-1 flex flex-col overflow-hidden">
                  <div className="h-full flex flex-col overflow-y-auto settings-scroll">
                    {/* Settings Header */}
                    <div className="p-4 border-b border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Lumen Settings
                          </h2>
                          <p className="text-sm text-gray-400">
                            Customize your Lumen QI experience
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Settings Content */}
                    <div className="flex-1 overflow-auto p-6">
                      <div className="max-w-2xl mx-auto space-y-8">
                        {/* Voice Settings */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Voice & Speech</h3>
                          <VoiceSettings
                            onVoiceChange={(voice) => {
                              console.log('Voice changed to:', voice);
                            }}
                            onSpeedChange={(speed) => {
                              console.log('Speed changed to:', speed);
                            }}
                            onModelChange={(model) => {
                              console.log('Model changed to:', model);
                            }}
                          />
                        </div>
                        
                        {/* More settings can be added here */}
                      </div>
                    </div>
                    
                    {/* Settings Footer */}
                    <div className="p-4 border-t border-purple-500/20 bg-gray-900/30">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Lumen QI Configuration Panel</span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Settings className="w-4 h-4" />
                            Settings Active
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
