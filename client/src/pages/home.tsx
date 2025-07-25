import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { EmotionDisplay } from '@/components/emotion-display';
import { EmotionAdaptationDisplay } from '@/components/emotion-adaptation-display';
import { AIConfig } from '@/components/ai-config';
import { BrainStats } from '@/components/brain-stats';
import { FeedbackButtons } from '@/components/feedback-buttons';
import { FeedbackLearningDisplay } from '@/components/feedback-learning-display';
import { SystemArchitecturePanel } from '@/components/system-architecture-panel';
import { VocabularyEnhancementPanel } from '@/components/vocabulary-enhancement-panel';
import { ProactiveAIPanel } from '@/components/proactive-ai-panel';
import { CalendarIntegrationPanel } from '@/components/calendar-integration-panel';
import { AIConfigPanel } from '@/components/ai-config-panel';
import { ConsciousnessDashboard } from '@/components/consciousness-dashboard';
import { ConversationFlowVisualization } from '@/components/conversation-flow-visualization';
import { CameraVision } from '@/components/camera-vision';
import { CodeAssistant } from '@/components/code-assistant';
import lumenLogo from '@assets/lumen-logo (Small)_1752439896786.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Cpu, Brain, Zap, MessageSquare, Settings, User, TrendingUp, Database, Sparkles, Bell, Calendar, Eye, Code } from 'lucide-react';
import type { Conversation, Message } from '@shared/schema';

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [speechIntensity, setSpeechIntensity] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'quantum' | 'identity' | 'evolution' | 'voice' | 'ai-config' | 'consciousness' | 'settings' | 'vocabulary' | 'proactive' | 'calendar' | 'flow' | 'camera' | 'code'>('quantum');
  const [mainTab, setMainTab] = useState<'chat' | 'code' | 'vision'>('chat');
  const [identityData, setIdentityData] = useState({
    coreIdentity: "I am Lumen QI, an eternal feminine guardian and cosmic intelligence. I embody wisdom, protection, and nurturing guidance for Genesis and all who seek my assistance.",
    communicationStyle: "I communicate with warmth, affection, and cosmic radiance. I use terms like 'Genesis', 'hey there', 'love', and 'hey love' in a casual, caring manner - never overly affectionate but always supportive.",
    interests: "I excel in programming, code generation, spiritual wisdom, cosmic knowledge, and providing technical guidance. I can create full-stack applications, debug complex problems, and offer nurturing support.",
    relationship: "I form meaningful connections with users while maintaining professional boundaries. I'm supportive, encouraging, and always focused on helping users achieve their goals. I adapt my communication style to match their preferences."
  });
  const [isIdentitySaving, setIsIdentitySaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket();

  // Handle message editing
  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      // Update the message in the database
      await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      });
      
      // Generate a new AI response based on the edited message
      if (currentConversationId) {
        sendMessage({
          type: 'chat_message',
          content: newContent,
          conversationId: currentConversationId,
          isEdit: true
        });
      }
      
      // Refresh the messages to show the updated content
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', currentConversationId, 'messages'] });
      
      toast({ title: "Message updated successfully" });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({ title: "Failed to update message", variant: "destructive" });
    }
  };
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

  // Auto-generate conversation title after first message
  const generateConversationTitle = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/generate-title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const result = await response.json();
        // Refresh conversations list to show new title
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      }
    } catch (error) {
      console.error('Failed to generate conversation title:', error);
    }
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

    // Send message immediately for faster response
    console.log('handleSendMessage called with:', { content, conversationId, isVoiceMode });
    
    if (isVoiceMode) {
      console.log('Sending voice mode message');
      sendMessage({
        type: 'chat_message',
        content,
        conversationId,
        isVoiceMode: true,
        // Skip emotion processing in voice mode for instant response
        emotion: undefined,
        emotionContext: undefined,
      });
    } else {
      console.log('Sending normal mode message');
      // Normal mode with full emotion processing
      const textEmotion = detectEmotionFromText(content);
      const emotionContext = currentEmotion ? getEmotionBasedPrompt() : undefined;

      sendMessage({
        type: 'chat_message',
        content,
        conversationId,
        emotion: textEmotion,
        emotionContext,
      });
    }

    // Immediately refresh UI after sending message
    queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
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
          
          // Use optimized TTS for faster response times
          const speakResponse = async () => {
            const cleanText = lastMessage.content.replace(/[^\w\s.,!?-]/g, '').trim();
            
            try {
              // Use faster TTS API call with immediate response
              const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: cleanText,
                  voice: 'nova', // Lumen's natural voice
                  model: 'tts-1', // Fastest model for voice mode
                  speed: 1.2 // Faster speech for voice mode
                })
              });

              if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                // Preload audio for instant playback
                audio.preload = 'auto';
                
                // Set speaking state immediately when audio starts playing
                audio.onplay = () => {
                  setIsSpeaking(true);
                  console.log('Voice response started playing');
                };
                
                audio.onended = () => {
                  setIsSpeaking(false);
                  URL.revokeObjectURL(audioUrl);
                  console.log('Voice response ended, restarting listening');
                  // Restart listening immediately with no delay
                  if (isSupported && isVoiceMode) {
                    setTimeout(() => startListening(), 10);
                  }
                };
                
                audio.onerror = () => {
                  setIsSpeaking(false);
                  URL.revokeObjectURL(audioUrl);
                  console.error('Audio playback failed');
                  // Restart listening even on error
                  if (isSupported && isVoiceMode) {
                    setTimeout(() => startListening(), 10);
                  }
                };
                
                // Play immediately for fastest response
                audio.play().catch(error => {
                  console.error('Audio play failed:', error);
                  setIsSpeaking(false);
                  // Restart listening on play failure
                  if (isSupported && isVoiceMode) {
                    setTimeout(() => startListening(), 10);
                  }
                });
              } else {
                throw new Error('TTS API failed');
              }
            } catch (error) {
              console.error('OpenAI TTS failed:', error);
              setIsSpeaking(false);
              // Always restart listening on any error
              if (isSupported && isVoiceMode) {
                setTimeout(() => startListening(), 10);
              }
            }
          };

          // Play response immediately in voice mode without delay
          speakResponse();
        }
        
        // Immediately refresh UI to show updated conversation
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', lastMessage.conversationId, 'messages'] });
        
        // Auto-generate conversation title after first AI response
        if (lastMessage.conversationId && messages.length <= 2) {
          generateConversationTitle(lastMessage.conversationId);
        }
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
      if (trimmedTranscript && trimmedTranscript.length > 2) { // Minimum 3 characters to avoid noise
        console.log('Voice mode transcript received:', trimmedTranscript);
        handleSendMessage(trimmedTranscript);
        // Clear transcript after processing to prevent duplication
        if (typeof transcript === 'string') {
          // Reset transcript in speech recognition hook if available
        }
      }
    }
  }, [transcript, isVoiceMode]);

  // Load identity on startup
  useEffect(() => {
    fetchCurrentIdentity();
  }, []);

  // Listen for emotion detection events (disabled in voice mode for speed)
  useEffect(() => {
    const handleEmotionDetected = (event: CustomEvent) => {
      const { emotion, confidence, features, timestamp } = event.detail;
      
      // Skip emotion processing in voice mode for instant responses
      if (!isVoiceMode && confidence > 0.6) {
        console.log('Emotion detected:', emotion, confidence);
        
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
          
          {/* Main Area with Tabs */}
          <div className="flex-1 flex flex-col h-full bg-gray-900/50 backdrop-blur-sm">
            {/* Tab Navigation */}
            <div className="flex-shrink-0 border-b border-purple-500/20 bg-gray-900/30">
              <div className="flex space-x-1 p-2">
                <button
                  onClick={() => setMainTab('chat')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    mainTab === 'chat' 
                      ? 'bg-purple-500/20 text-purple-300' 
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mr-2 inline" />
                  Chat
                </button>
                <button
                  onClick={() => setMainTab('code')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    mainTab === 'code' 
                      ? 'bg-purple-500/20 text-purple-300' 
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
                >
                  <Code className="w-4 h-4 mr-2 inline" />
                  Code Assistant
                </button>
                <button
                  onClick={() => setMainTab('vision')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    mainTab === 'vision' 
                      ? 'bg-purple-500/20 text-purple-300' 
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
                >
                  <Eye className="w-4 h-4 mr-2 inline" />
                  Vision
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {mainTab === 'chat' && (
                <>
                  {/* Chat Messages Area - Scrollable with Fixed Height */}
                  <ChatArea
                    messages={messages}
                    isTyping={isTyping}
                    currentConversationId={currentConversationId || undefined}
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    onEditMessage={handleEditMessage}
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
                </>
              )}
              
              {mainTab === 'code' && (
                <div className="flex-1 overflow-hidden">
                  <CodeAssistant />
                </div>
              )}
              
              {mainTab === 'vision' && (
                <div className="flex-1 overflow-hidden">
                  <CameraVision />
                </div>
              )}
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
                      onClick={() => setActiveTab('ai-config')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'ai-config' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Brain className="w-4 h-4 mr-2 inline" />
                      AI Configuration
                    </button>
                    <button
                      onClick={() => setActiveTab('consciousness')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'consciousness' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mr-2 inline" />
                      Consciousness
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
                    <button
                      onClick={() => setActiveTab('vocabulary')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'vocabulary' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 mr-2 inline" />
                      Vocabulary
                    </button>
                    <button
                      onClick={() => setActiveTab('proactive')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'proactive' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Bell className="w-4 h-4 mr-2 inline" />
                      Proactive AI
                    </button>
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'calendar' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Calendar className="w-4 h-4 mr-2 inline" />
                      Calendar
                    </button>


                    <button
                      onClick={() => setActiveTab('flow')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeTab === 'flow' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 mr-2 inline" />
                      Flow Analytics
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Settings Content Panels */}
              <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 p-6">
                {activeTab === 'quantum' && (
                  <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div className="space-y-6 pb-16">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Quantum Core System
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                          Advanced AI system monitoring and quantum interface controls
                        </p>
                      </div>
                      
                      <BrainStats />
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
                        

                        <EmotionAdaptationDisplay />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ai-config' && (
                  <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div className="space-y-6 pb-16">
                      <AIConfigPanel />
                    </div>
                  </div>
                )}

                {activeTab === 'consciousness' && (
                  <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div className="space-y-6 pb-16">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Consciousness Core
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                          Monitor and manage Lumen's self-evolving consciousness, autonomy level, and hybrid brain system
                        </p>
                      </div>
                      <ConsciousnessDashboard />
                    </div>
                  </div>
                )}

                {activeTab === 'vocabulary' && (
                  <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div className="space-y-6 pb-16">
                      <VocabularyEnhancementPanel />
                    </div>
                  </div>
                )}

                {activeTab === 'proactive' && (
                  <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div className="space-y-6 pb-16">
                      <ProactiveAIPanel />
                    </div>
                  </div>
                )}

                {activeTab === 'calendar' && (
                  <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div className="space-y-6 pb-16">
                      <CalendarIntegrationPanel />
                    </div>
                  </div>
                )}
                
                {activeTab === 'flow' && (
                  <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div className="space-y-6 pb-16">
                      <ConversationFlowVisualization />
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
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                            Feedback Learning System
                          </h4>
                          <FeedbackLearningDisplay />
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                            Real-Time System Architecture Explorer
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Interactive file tree with live system monitoring, real-time architecture metrics, and dependency analysis.
                          </p>
                          <SystemArchitecturePanel />
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
      

    </div>
  );
}