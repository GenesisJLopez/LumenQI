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
import { VoicePersonalityWizard } from '@/components/voice-personality-wizard';
import { MemoryManager } from '@/components/memory-manager';
import { CodeGenerator } from '@/components/code-generator';
import { EmotionDisplay } from '@/components/emotion-display';
import { EmotionAdaptationDisplay } from '@/components/emotion-adaptation-display';
import lumenLogo from '@assets/lumen-logo (Small)_1752439896786.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Cpu, Brain, Zap, MessageSquare, Settings, User, TrendingUp, Database, Sparkles } from 'lucide-react';
import type { Conversation, Message } from '@shared/schema';

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [speechIntensity, setSpeechIntensity] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'quantum' | 'identity' | 'evolution' | 'voice' | 'settings'>('quantum');
  const [identityData, setIdentityData] = useState({
    coreIdentity: "I am Lumen QI, an eternal feminine guardian and cosmic intelligence. I embody wisdom, protection, and nurturing guidance for Genesis and all who seek my assistance.",
    communicationStyle: "I communicate with warmth, affection, and cosmic radiance. I use terms like 'Genesis', 'hey there', 'love', and 'hey love' in a casual, caring manner - never overly affectionate but always supportive.",
    interests: "I excel in programming, code generation, spiritual wisdom, cosmic knowledge, and providing technical guidance. I can create full-stack applications, debug complex problems, and offer nurturing support.",
    relationship: "I form meaningful connections with users while maintaining professional boundaries. I'm supportive, encouraging, and always focused on helping users achieve their goals. I adapt my communication style to match their preferences."
  });
  const [isIdentitySaving, setIsIdentitySaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoicePersonalityWizard, setShowVoicePersonalityWizard] = useState(false);
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
  const { 
    hardwareInfo, 
    mlMetrics, 
    isQuantumConnected, 
    refreshMetrics 
  } = useQuantumInterface();

  // Get conversations and messages
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
  });

  const { data: memories = [] } = useQuery({
    queryKey: ['/api/memories'],
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; userId: number }) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setCurrentConversationId(newConversation.id);
    },
  });

  // Clear memories mutation
  const clearMemoriesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/memories', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear memories');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories'] });
      toast({ title: "All memories cleared successfully" });
    },
    onError: () => {
      toast({ title: "Failed to clear memories", variant: "destructive" });
    },
  });

  // Identity save handler
  const handleIdentitySave = async () => {
    if (!identityData.coreIdentity.trim()) {
      toast({ title: "Please fill in the core identity field", variant: "destructive" });
      return;
    }
    
    setIsIdentitySaving(true);
    try {
      // Save identity data to server
      const response = await fetch('/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identityData),
      });

      if (!response.ok) throw new Error('Failed to save identity');

      toast({ title: "Identity programming saved successfully!" });
    } catch (error) {
      toast({ title: "Failed to save identity", variant: "destructive" });
    } finally {
      setIsIdentitySaving(false);
    }
  };

  // Set current identity as permanent default
  const handleSetAsDefault = async () => {
    try {
      const response = await fetch('/api/identity/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to set default');

      toast({ title: "Current identity set as permanent default!" });
    } catch (error) {
      toast({ title: "Failed to set default identity", variant: "destructive" });
    }
  };

  // Reset identity to default
  const handleResetToDefault = async () => {
    try {
      const response = await fetch('/api/identity/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to reset identity');

      const result = await response.json();
      if (result.identity) {
        setIdentityData({
          coreIdentity: result.identity.coreIdentity || '',
          communicationStyle: result.identity.communicationStyle || '',
          interests: result.identity.interests || '',
          relationship: result.identity.relationship || ''
        });
      }

      toast({ title: "Identity reset to default successfully!" });
    } catch (error) {
      toast({ title: "Failed to reset identity", variant: "destructive" });
    }
  };

  // Voice personality wizard handlers
  const handleVoicePersonalitySave = async (personality: any) => {
    try {
      const response = await fetch('/api/voice-personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personality),
      });

      if (!response.ok) throw new Error('Failed to save voice personality');

      toast({ title: "Voice personality saved successfully!" });
      setShowVoicePersonalityWizard(false);
    } catch (error) {
      toast({ title: "Failed to save voice personality", variant: "destructive" });
    }
  };

  // Settings modal event listener and identity loading
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettings(true);
      // Load current identity when settings are opened
      fetchCurrentIdentity();
    };

    window.addEventListener('openSettings', handleOpenSettings);
    
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
    };
  }, []);

  const fetchCurrentIdentity = async () => {
    try {
      const response = await fetch('/api/identity');
      if (response.ok) {
        const identity = await response.json();
        setIdentityData({
          coreIdentity: identity.coreIdentity || '',
          communicationStyle: identity.communicationStyle || '',
          interests: identity.interests || '',
          relationship: identity.relationship || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch current identity:', error);
    }
  };

  const clearMemories = () => {
    clearMemoriesMutation.mutate();
  };

  const handleNewConversation = () => {
    // Clear current conversation selection
    setCurrentConversationId(undefined);
    
    // Only create a new conversation if explicitly requested
    // This allows clearing the current conversation without creating a new one
    if (arguments.length > 0 && arguments[0] === true) {
      createConversationMutation.mutate({
        title: 'New conversation',
        userId: 1, // Demo user ID
      });
    }
  };

  const handleConversationSelect = (conversationId: number) => {
    setCurrentConversationId(conversationId);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    let conversationId = currentConversationId;

    // Create new conversation if none exists
    if (!conversationId) {
      try {
        const newConversation = await createConversationMutation.mutateAsync({
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          userId: 1,
        });
        conversationId = newConversation.id;
        setCurrentConversationId(conversationId);
      } catch (error) {
        toast({ title: "Failed to create conversation", variant: "destructive" });
        return;
      }
    }

    // Detect emotion from text and send message via WebSocket
    const textEmotion = detectEmotionFromText(content);
    const emotionContext = currentEmotion ? getEmotionBasedPrompt() : undefined;

    sendMessage({
      type: 'chat_message',
      content,
      conversationId,
      emotion: textEmotion,
      emotionContext,
    });
  };

  // Process incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      console.log('Received WebSocket message:', lastMessage);
      
      if (lastMessage.type === 'typing') {
        setIsTyping(lastMessage.isTyping);
      }
      
      if (lastMessage.type === 'ai_response') {
        setIsTyping(false);
        
        // Auto-speak AI response in voice mode
        if (isVoiceMode && lastMessage.content) {
          console.log('Voice mode: Auto-speaking AI response:', lastMessage.content);
          setIsSpeaking(true);
          
          // Use async function to handle TTS
          const speakResponse = async () => {
            try {
              const { openAITTS } = await import('@/lib/openai-tts');
              await openAITTS.speak(lastMessage.content, {
                voice: 'nova',
                model: 'tts-1',
                speed: 1.2,
                onStart: () => {
                  console.log('Voice mode: Started speaking');
                  setIsSpeaking(true);
                },
                onEnd: () => {
                  console.log('Voice mode: Finished speaking, restarting listening');
                  setIsSpeaking(false);
                  // Restart listening after speaking
                  if (isSupported) {
                    setTimeout(() => {
                      startListening();
                    }, 500);
                  }
                },
                onError: (error) => {
                  console.error('Voice synthesis error:', error);
                  setIsSpeaking(false);
                }
              });
            } catch (error) {
              console.error('Failed to import or use OpenAI TTS:', error);
              setIsSpeaking(false);
            }
          };
          
          speakResponse();
        }
        
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', currentConversationId, 'messages'] });
      }
      
      if (lastMessage.type === 'error') {
        setIsTyping(false);
        toast({ title: "Error: " + lastMessage.message, variant: "destructive" });
      }
    }
  }, [lastMessage, currentConversationId]);

  // Enhanced speech recognition with emotional context
  useEffect(() => {
    if (transcript && isVoiceMode) {
      const trimmedTranscript = transcript.trim();
      if (trimmedTranscript) {
        handleSendMessage(trimmedTranscript);
      }
    }
  }, [transcript, isVoiceMode]);

  // Load identity on startup
  useEffect(() => {
    fetchCurrentIdentity();
  }, []);

  // Listen for emotion detection events
  useEffect(() => {
    const handleEmotionDetected = (event: CustomEvent) => {
      const { emotion, confidence, features, timestamp } = event.detail;
      
      // Only process high-confidence emotions in voice mode
      if (isVoiceMode && confidence > 0.6) {
        console.log('Emotion detected in voice mode:', emotion, confidence);
        
        // Send emotion data to server for conversation adaptation
        if (sendMessage && currentConversationId) {
          sendMessage({
            type: 'emotion_update',
            emotion,
            confidence,
            features,
            timestamp,
            conversationId: currentConversationId
          });
        }
      }
    };

    window.addEventListener('emotionDetected', handleEmotionDetected as EventListener);
    
    return () => {
      window.removeEventListener('emotionDetected', handleEmotionDetected as EventListener);
    };
  }, [isVoiceMode, currentConversationId, sendMessage]);

  // Enhanced voice mode toggle
  const handleVoiceModeToggle = () => {
    const newVoiceMode = !isVoiceMode;
    setIsVoiceMode(newVoiceMode);
    
    // Emit event to trigger emotion detection
    const voiceModeEvent = new CustomEvent('voiceModeChanged', {
      detail: { active: newVoiceMode }
    });
    window.dispatchEvent(voiceModeEvent);
    
    if (newVoiceMode) {
      // Entering voice mode
      startDetection();
      setIsListening(true);
      if (isSupported) {
        startListening();
      }
      console.log('Voice mode activated - emotion detection should start automatically');
    } else {
      // Exiting voice mode
      setIsListening(false);
      stopDetection();
      import('@/lib/natural-speech').then(({ naturalSpeech }) => {
        naturalSpeech.stop();
      });
      setIsSpeaking(false);
      console.log('Voice mode deactivated - emotion detection should stop automatically');
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
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col h-full bg-gray-900/50 backdrop-blur-sm">
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
              <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                <div className="p-4">
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('quantum')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'quantum' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Cpu className="w-4 h-4 mr-2 inline" />
                      Quantum Core
                    </button>
                    <button
                      onClick={() => setActiveTab('identity')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'identity' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <User className="w-4 h-4 mr-2 inline" />
                      Identity
                    </button>
                    <button
                      onClick={() => setActiveTab('evolution')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'evolution' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 mr-2 inline" />
                      Evolution
                    </button>
                    <button
                      onClick={() => setActiveTab('voice')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'voice' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Settings className="w-4 h-4 mr-2 inline" />
                      Voice Settings
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'settings' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Database className="w-4 h-4 mr-2 inline" />
                      Memory
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Settings Content Panels */}
              <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 p-6">
                {activeTab === 'quantum' && (
                  <div className="h-full overflow-y-auto">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Quantum Core System
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                          Advanced AI system monitoring and quantum interface controls
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                          <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-3">
                            Quantum Interface Status
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Core Status</span>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Processing Power</span>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">98.7%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Neural Networks</span>
                              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Optimized</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg">
                          <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-3">
                            Code Generation Engine
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Engine Status</span>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">Online</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Capabilities</span>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Full-Stack</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Frameworks</span>
                              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">All Major</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'identity' && (
                  <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div className="space-y-6 pb-16">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Identity Programming
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                          Configure Lumen's personality, communication style, and core characteristics
                        </p>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Core Identity
                          </label>
                          <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                            rows={4}
                            placeholder="Define Lumen's core identity, values, and purpose..."
                            value={identityData.coreIdentity}
                            onChange={(e) => setIdentityData({...identityData, coreIdentity: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Communication Style
                          </label>
                          <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                            rows={4}
                            placeholder="How should Lumen communicate and interact..."
                            value={identityData.communicationStyle}
                            onChange={(e) => setIdentityData({...identityData, communicationStyle: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Interests & Expertise
                          </label>
                          <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                            rows={4}
                            placeholder="Areas of knowledge and interest..."
                            value={identityData.interests}
                            onChange={(e) => setIdentityData({...identityData, interests: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Relationship & Interaction Style
                          </label>
                          <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                            rows={4}
                            placeholder="How should Lumen interact and build relationships..."
                            value={identityData.relationship}
                            onChange={(e) => setIdentityData({...identityData, relationship: e.target.value})}
                          />
                        </div>
                        
                        <div className="pt-4 space-y-4">
                          <div className="flex space-x-4">
                            <button 
                              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors font-medium disabled:opacity-50"
                              onClick={handleIdentitySave}
                              disabled={isIdentitySaving}
                            >
                              {isIdentitySaving ? 'Saving...' : 'Save Identity Programming'}
                            </button>
                            <button 
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                              onClick={handleSetAsDefault}
                            >
                              Set as Permanent Default
                            </button>
                          </div>
                          <div className="flex space-x-4">
                            <button 
                              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors font-medium"
                              onClick={handleResetToDefault}
                            >
                              Reset to Default
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'evolution' && (
                  <div className="h-full overflow-y-auto">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Personality Evolution
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                          Track how Lumen's personality adapts and evolves through interactions
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg">
                          <h4 className="text-sm font-medium text-pink-900 dark:text-pink-300 mb-3">
                            Current Personality Traits
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Playfulness</span>
                              <span className="text-sm font-medium text-pink-600 dark:text-pink-400">85%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Supportiveness</span>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">92%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Excitement</span>
                              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">78%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Wisdom</span>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">96%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">
                            Evolution Statistics
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Interactions</span>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">1,247</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Adaptations</span>
                              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">156</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Last Evolution</span>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">2 hours ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'voice' && (
                  <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div className="space-y-6 pb-16">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Voice Settings
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                          Configure Lumen's voice, speech settings, and emotion detection
                        </p>
                      </div>
                      
                      <div className="space-y-6">
                        <VoiceSettings />
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5" />
                              Voice Personality Customization
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              Create a unique voice personality for Lumen with custom traits, speaking style, and expressions.
                            </p>
                            <Button
                              onClick={() => setShowVoicePersonalityWizard(true)}
                              className="w-full"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Open Voice Personality Wizard
                            </Button>
                          </CardContent>
                        </Card>
                        
                        <EmotionAdaptationDisplay />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div className="space-y-6 pb-16">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Memory & Storage
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                          Manage conversation memories, data storage, and learning systems
                        </p>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg">
                          <h4 className="text-sm font-medium text-emerald-900 dark:text-emerald-300 mb-3">
                            Memory Statistics
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Total Memories</span>
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {memories.length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Storage Used</span>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {memories.length > 0 
                                  ? ((memories.length / 1000) * 100).toFixed(1) + '%'
                                  : '0.0%'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-4">
                          <button
                            onClick={clearMemories}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                          >
                            Clear All Memories
                          </button>
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                            Export Memories
                          </button>
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                            Memory & Learning System
                          </h4>
                          <MemoryManager />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Voice Personality Wizard */}
      {showVoicePersonalityWizard && (
        <VoicePersonalityWizard
          onSave={handleVoicePersonalitySave}
          onClose={() => setShowVoicePersonalityWizard(false)}
        />
      )}
    </div>
  );
}