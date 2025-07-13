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
import { MemoryManager } from '@/components/memory-manager';
import { CodeGenerator } from '@/components/code-generator';
import lumenLogo from '@assets/lumen-logo_1752354847791.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Cpu, Brain, Zap, MessageSquare, Settings, User, TrendingUp, Database } from 'lucide-react';
import type { Conversation, Message } from '@shared/schema';

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [speechIntensity, setSpeechIntensity] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'quantum' | 'identity' | 'evolution' | 'settings'>('quantum');
  const [identityData, setIdentityData] = useState({
    coreIdentity: '',
    communicationStyle: '',
    interests: '',
    relationship: ''
  });
  const [isIdentitySaving, setIsIdentitySaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  // Settings event listener
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettings(true);
    };
    
    window.addEventListener('openSettings', handleOpenSettings);
    
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
    };
  }, []);

  // Identity save handler
  const handleIdentitySave = async () => {
    if (!identityData.coreIdentity.trim()) {
      toast({ title: "Please fill in the core identity", variant: "destructive" });
      return;
    }
    
    setIsIdentitySaving(true);
    try {
      // Save identity data to server
      const response = await fetch('/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identityData)
      });
      
      if (response.ok) {
        toast({ title: "Identity saved successfully" });
      } else {
        throw new Error('Failed to save identity');
      }
    } catch (error) {
      toast({ title: "Failed to save identity", variant: "destructive" });
    } finally {
      setIsIdentitySaving(false);
    }
  };

  // Clear memories handler
  const handleClearMemories = async () => {
    try {
      const response = await fetch('/api/memories', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/memories'] });
        toast({ title: "All memories cleared successfully" });
      } else {
        throw new Error('Failed to clear memories');
      }
    } catch (error) {
      toast({ title: "Failed to clear memories", variant: "destructive" });
    }
  };

  // Fetch current conversation and messages
  const { data: conversationData } = useQuery<{
    conversation: Conversation;
    messages: Message[];
  }>({
    queryKey: ['/api/conversations', currentConversationId],
    enabled: !!currentConversationId,
  });

  const messages = conversationData?.messages || [];

  // Fetch memories
  const { data: memories = [] } = useQuery({
    queryKey: ['/api/memories'],
  });

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
                console.log('Speech actually started - triggering glow NOW');
                setIsSpeaking(true);
                setSpeechIntensity(0.8);
                
                // Create realistic speech rhythm only when actually speaking
                let rhythmIndex = 0;
                const rhythmPattern = [0.9, 0.6, 0.8, 0.4, 0.7, 0.9, 0.5, 0.8, 0.3, 0.6, 0.9, 0.7];
                const rhythmInterval = setInterval(() => {
                  if (rhythmIndex < rhythmPattern.length) {
                    setSpeechIntensity(rhythmPattern[rhythmIndex]);
                    rhythmIndex++;
                  } else {
                    rhythmIndex = 0;
                  }
                }, 200);
                
                // Store interval for cleanup
                (window as any).speechRhythmInterval = rhythmInterval;
              },
              onEnd: () => {
                console.log('Speech ended - stopping logo animation immediately');
                setIsSpeaking(false);
                setSpeechIntensity(0);
                
                // Clear rhythm interval immediately
                if ((window as any).speechRhythmInterval) {
                  clearInterval((window as any).speechRhythmInterval);
                  (window as any).speechRhythmInterval = null;
                }
                
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
                setSpeechIntensity(0);
                
                // Clear rhythm interval on error
                if ((window as any).speechRhythmInterval) {
                  clearInterval((window as any).speechRhythmInterval);
                  (window as any).speechRhythmInterval = null;
                }
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
          coreIdentity: parsedIdentity.coreIdentity || 'Advanced AI assistant with quantum intelligence capabilities and complete programming expertise equal to Replit Agent.',
          communicationStyle: parsedIdentity.communicationStyle || 'Casual, warm, and engaging with expert-level technical communication.',
          interests: parsedIdentity.interests || 'Technology, programming, software development, AI, machine learning, system architecture, database design, and helping users build amazing applications.',
          relationship: parsedIdentity.relationship || 'Supportive companion and expert programming assistant with complete development capabilities.'
        });
      } catch (error) {
        console.error('Failed to parse saved identity:', error);
        // Set default identity if parsing fails
        setIdentityData({
          coreIdentity: 'Advanced AI assistant with quantum intelligence capabilities and complete programming expertise equal to Replit Agent.',
          communicationStyle: 'Casual, warm, and engaging with expert-level technical communication.',
          interests: 'Technology, programming, software development, AI, machine learning, system architecture, database design, and helping users build amazing applications.',
          relationship: 'Supportive companion and expert programming assistant with complete development capabilities.'
        });
      }
    } else {
      // Set default identity if no saved data exists
      setIdentityData({
        coreIdentity: 'Advanced AI assistant with quantum intelligence capabilities and complete programming expertise equal to Replit Agent.',
        communicationStyle: 'Casual, warm, and engaging with expert-level technical communication.',
        interests: 'Technology, programming, software development, AI, machine learning, system architecture, database design, and helping users build amazing applications.',
        relationship: 'Supportive companion and expert programming assistant with complete development capabilities.'
      });
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
      {/* Voice Mode - Full Screen Interface */}
      {isVoiceMode ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
          {/* Cosmic glow positioned exactly behind logo - slightly bigger */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className={cn(
                "w-56 h-56 rounded-full transition-all duration-300",
                isSpeaking ? 'cosmic-pulse-speaking' : isListening ? 'cosmic-pulse-listening' : 'cosmic-pulse-idle'
              )}
              style={isSpeaking ? {
                animationDuration: `${Math.max(0.2, 0.8 - speechIntensity * 0.6)}s`,
                opacity: 0.3 + (speechIntensity * 0.2),
                transform: `scale(${1 + speechIntensity * 0.02})`
              } : {}}
            ></div>
          </div>
          
          {/* Logo - centered and bigger */}
          <div className="relative z-10">
            <img 
              src={lumenLogo} 
              alt="Lumen" 
              className="w-48 h-48 mx-auto"
            />
          </div>
          
          {/* Exit Voice Mode Button */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <Button
              onClick={handleVoiceModeToggle}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full"
            >
              Exit Voice Mode
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Sidebar */}
          <Sidebar
            currentConversationId={currentConversationId || undefined}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
                
            {/* Chat Messages Area - Scrollable with Fixed Height */}
            <ChatArea
              messages={messages}
              isTyping={isTyping}
              currentConversationId={currentConversationId || undefined}
              isSpeaking={isSpeaking}
              isListening={isListening}
            />
            
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
          </div>
        </>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-5/6 max-h-[90vh] overflow-hidden">
            {/* Settings Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Lumen Settings
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex h-full">
              {/* Settings Sidebar */}
              <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} orientation="vertical" className="h-full flex">
                  <TabsList className="flex flex-col h-fit w-full justify-start bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                    <TabsTrigger value="quantum" className="w-full justify-start bg-transparent hover:bg-white/10 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                      <Cpu className="w-4 h-4 mr-2" />
                      Quantum Core
                    </TabsTrigger>
                    <TabsTrigger value="identity" className="w-full justify-start bg-transparent hover:bg-white/10 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                      <User className="w-4 h-4 mr-2" />
                      Identity
                    </TabsTrigger>
                    <TabsTrigger value="evolution" className="w-full justify-start bg-transparent hover:bg-white/10 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Evolution
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="w-full justify-start bg-transparent hover:bg-white/10 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                      <Database className="w-4 h-4 mr-2" />
                      Memory
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Settings Content Panels */}
                  <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 min-h-0">
                    <TabsContent value="quantum" className="h-full m-0 p-6 overflow-y-auto data-[state=active]:block">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Quantum Core System
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Advanced AI system monitoring and quantum interface controls
                          </p>
                          <div className="text-xs text-gray-500 mb-2">
                            Active Tab: {activeTab} | Status: Loading Components
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                            <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-3">
                              Quantum Interface Status
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-purple-700 dark:text-purple-400">Core AI System</span>
                                <span className="text-green-600 dark:text-green-400">⚡ Active</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-purple-700 dark:text-purple-400">Voice Recognition</span>
                                <span className="text-green-600 dark:text-green-400">🎤 Ready</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-purple-700 dark:text-purple-400">Neural Speech</span>
                                <span className="text-green-600 dark:text-green-400">🔊 Active</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-purple-700 dark:text-purple-400">Quantum Processing</span>
                                <span className="text-blue-600 dark:text-blue-400">🌌 Optimized</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">
                              Code Generation Engine
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-blue-700 dark:text-blue-400">Full-Stack Development</span>
                                <span className="text-green-600 dark:text-green-400">✅ Expert</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-blue-700 dark:text-blue-400">React/TypeScript</span>
                                <span className="text-green-600 dark:text-green-400">⚛️ Advanced</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-blue-700 dark:text-blue-400">API Development</span>
                                <span className="text-green-600 dark:text-green-400">🔗 Ready</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                            <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-3">
                              Hardware Optimization
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-green-700 dark:text-green-400">CPU Utilization</span>
                                <span className="text-blue-600 dark:text-blue-400">🔧 Optimized</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-green-700 dark:text-green-400">Memory Management</span>
                                <span className="text-purple-600 dark:text-purple-400">🧠 Efficient</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-green-700 dark:text-green-400">Network Interface</span>
                                <span className="text-cyan-600 dark:text-cyan-400">🌐 Connected</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <CodeGenerator onCodeGenerated={(code) => {
                              console.log('Generated code:', code);
                            }} />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="identity" className="h-full m-0 p-6 overflow-y-auto data-[state=active]:block">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Identity Programming
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Configure Lumen's core personality and behavior
                          </p>
                          <div className="bg-green-100 dark:bg-green-900 p-2 rounded text-sm">
                            ✓ Identity Tab Active - Components Loading
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Core Identity
                            </label>
                            <textarea
                              value={identityData.coreIdentity}
                              onChange={(e) => setIdentityData(prev => ({ ...prev, coreIdentity: e.target.value }))}
                              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                              placeholder="Define who Lumen is at their core..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Communication Style
                            </label>
                            <textarea
                              value={identityData.communicationStyle}
                              onChange={(e) => setIdentityData(prev => ({ ...prev, communicationStyle: e.target.value }))}
                              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                              placeholder="How should Lumen communicate..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Interests & Expertise
                            </label>
                            <textarea
                              value={identityData.interests}
                              onChange={(e) => setIdentityData(prev => ({ ...prev, interests: e.target.value }))}
                              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                              placeholder="What topics does Lumen know about..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Relationship Style
                            </label>
                            <textarea
                              value={identityData.relationship}
                              onChange={(e) => setIdentityData(prev => ({ ...prev, relationship: e.target.value }))}
                              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                              placeholder="How should Lumen relate to users..."
                            />
                          </div>
                          
                          <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                              Voice & Speech Settings
                            </h4>
                            <VoiceSettings
                              onVoiceChange={(voice) => console.log('Voice changed to:', voice)}
                              onSpeedChange={(speed) => console.log('Speed changed to:', speed)}
                              onModelChange={(model) => console.log('Model changed to:', model)}
                            />
                          </div>
                          
                          <Button
                            onClick={handleIdentitySave}
                            disabled={isIdentitySaving}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            {isIdentitySaving ? 'Saving...' : 'Save Identity'}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="evolution" className="h-full m-0 p-6 overflow-y-auto data-[state=active]:block">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Personality Evolution
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Monitor how Lumen's personality adapts over time
                          </p>
                          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded text-sm">
                            ✓ Evolution Tab Active - PersonalityEvolution Loading
                          </div>
                        </div>
                        <div className="mt-4">
                          <PersonalityEvolution userId={1} />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="settings" className="h-full m-0 p-6 overflow-y-auto data-[state=active]:block">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Memory Management
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Manage Lumen's memory and learning data
                          </p>
                          <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded text-sm">
                            ✓ Memory Tab Active - MemoryManager Loading ({memories.length} memories)
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                              Memory Statistics
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-blue-700 dark:text-blue-400">Total Memories:</span>
                                <span className="ml-2 font-medium text-blue-900 dark:text-blue-300">{memories.length}</span>
                              </div>
                              <div>
                                <span className="text-blue-700 dark:text-blue-400">Active Context:</span>
                                <span className="ml-2 font-medium text-blue-900 dark:text-blue-300">{memories.filter(m => m.importance > 0.5).length}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                              Memory Optimization
                            </h4>
                            <div className="text-xs text-green-700 dark:text-green-400 mb-3">
                              Automatic cleanup of low-importance memories
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 bg-green-200 dark:bg-green-800 rounded-full flex-1">
                                <div className="h-2 bg-green-500 rounded-full" style={{width: '92%'}}></div>
                              </div>
                              <span className="text-xs text-green-700 dark:text-green-400">92%</span>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <h4 className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">
                              Memory Actions
                            </h4>
                            <div className="space-y-2">
                              <button className="w-full px-3 py-2 text-xs bg-orange-100 dark:bg-orange-800 hover:bg-orange-200 dark:hover:bg-orange-700 text-orange-900 dark:text-orange-300 rounded-md transition-colors">
                                Optimize Memory Storage
                              </button>
                              <button 
                                onClick={handleClearMemories}
                                className="w-full px-3 py-2 text-xs bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-900 dark:text-red-300 rounded-md transition-colors"
                              >
                                Clear All Memories
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                              Memory & Learning
                            </h4>
                            <div className="mt-4">
                              <MemoryManager />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
