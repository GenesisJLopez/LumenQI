// This is a backup - working on restoring the main file
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { ChatArea } from "@/components/chat-area";
import { VoiceControls } from "@/components/voice-controls";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech";
import { useEmotionDetection } from "@/hooks/use-emotion-detection";
import { useQuantumInterface } from "@/hooks/use-quantum-interface";
import type { Conversation, Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [speechIntensity, setSpeechIntensity] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket();

  // Handle message editing WITHOUT automatic AI response
  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      // Update the message in the database
      await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      });
      
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
    mlMetrics
  } = useQuantumInterface();

  // Get conversations and messages
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
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
      toast({ title: "Memories cleared successfully" });
    },
  });

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    console.log('Sending NEW message:', content);

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
      });
    } else {
      console.log('Sending normal mode message');
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

    // Immediately trigger a refresh after sending - this ensures we see both user and AI messages
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
    }, 100);
    
    // Also trigger another refresh after expected AI response time
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
    }, 2000);
  };

  // Process incoming WebSocket messages  
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('Received WebSocket message:', lastMessage);
    
    if (lastMessage.type === 'typing') {
      setIsTyping(lastMessage.isTyping);
      return;
    }
    
    if (lastMessage.type === 'ai_response') {
      console.log('Processing ai_response:', lastMessage.content ? lastMessage.content.substring(0, 50) + '...' : 'NO CONTENT');
      setIsTyping(false);
      
      // Force immediate UI refresh for the AI response
      console.log('Forcing UI refresh for conversation:', lastMessage.conversationId);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', lastMessage.conversationId, 'messages'] });
        
      // Auto-speak AI response in voice mode
      if (isVoiceMode && lastMessage.content) {
        console.log('Voice mode: Auto-speaking AI response:', lastMessage.content);
        
        const speakResponse = async () => {
          const cleanText = lastMessage.content.replace(/[^\w\s.,!?-]/g, '').trim();
          
          try {
            console.log('🎵 Attempting OpenAI TTS for voice response...');
            const response = await fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: cleanText,
                voice: 'nova',
                model: 'tts-1-hd',
                speed: 1.0
              })
            });

            if (response.ok) {
              const audioBlob = await response.blob();
              console.log('✓ TTS audio blob received, size:', audioBlob.size, 'bytes');
              
              if (audioBlob.size === 0) {
                throw new Error('Empty audio response from TTS service');
              }
              
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              
              audio.preload = 'auto';
              audio.volume = 0.9;
              
              // Setup audio handlers
              audio.onloadeddata = () => {
                console.log('🎵 Audio loaded, attempting autoplay...');
                setIsSpeaking(true);
                
                // Try to play immediately
                const playPromise = audio.play();
                
                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      console.log('✅ Audio started playing successfully');
                    })
                    .catch((error) => {
                      console.log('❌ Autoplay failed, using browser TTS:', error.name);
                      setIsSpeaking(false);
                      URL.revokeObjectURL(audioUrl);
                      // Only use browser TTS if audio is enabled
                      if (audioEnabled) {
                        useBrowserTTS();
                      } else {
                        console.log('Audio not enabled - user needs to click Enable Audio button');
                      }
                    });
                }
              };
              
              audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                console.log('🎵 Voice response ended, restarting listening');
                if (isSupported && isVoiceMode) {
                  setTimeout(() => startListening(), 300);
                }
              };
              
              audio.onerror = (e) => {
                console.error('❌ Audio error occurred:', e);
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                useBrowserTTS();
              };
              
              const useBrowserTTS = () => {
                console.log('🎵 Using browser TTS fallback...');
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 0.8;
                
                utterance.onstart = () => {
                  console.log('✓ Browser TTS started');
                  setIsSpeaking(true);
                };
                
                utterance.onend = () => {
                  console.log('✓ Browser TTS ended');
                  setIsSpeaking(false);
                  if (isSupported && isVoiceMode) {
                    setTimeout(() => startListening(), 300);
                  }
                };
                
                utterance.onerror = (event) => {
                  console.error('❌ Browser TTS failed:', event.error);
                  setIsSpeaking(false);
                  if (isSupported && isVoiceMode) {
                    setTimeout(() => startListening(), 300);
                  }
                };
                
                speechSynthesis.speak(utterance);
              };
              
              // Load audio - this will trigger onloadeddata
              audio.load();
              
            } else {
              console.error('❌ TTS API failed with status:', response.status);
              throw new Error(`TTS API failed: ${response.status}`);
            }
          } catch (error) {
            console.error('❌ OpenAI TTS failed:', error);
            
            // Immediate fallback to browser TTS
            console.log('🎵 Using browser TTS as primary fallback...');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            
            utterance.onstart = () => {
              console.log('✓ Fallback browser TTS started');
              setIsSpeaking(true);
            };
            
            utterance.onend = () => {
              console.log('✓ Fallback browser TTS ended');
              setIsSpeaking(false);
              if (isSupported && isVoiceMode) {
                setTimeout(() => startListening(), 300);
              }
            };
            
            utterance.onerror = (event) => {
              console.error('❌ All TTS systems failed:', event.error);
              setIsSpeaking(false);
              if (isSupported && isVoiceMode) {
                setTimeout(() => startListening(), 300);
              }
            };
            
            speechSynthesis.speak(utterance);
          }
        };

        speakResponse();
      }
      
      return;
    }
    
    if (lastMessage.type === 'error') {
      setIsTyping(false);
      toast({ title: "Error: " + lastMessage.message, variant: "destructive" });
      return;
    }
    
    // Handle flow_analysis messages (ignore them)
    if (lastMessage.type === 'flow_analysis') {
      return;
    }
  }, [lastMessage, queryClient]);

  // Enhanced speech recognition - simplified to prevent duplication
  useEffect(() => {
    if (transcript && isVoiceMode && !isTyping && !isSpeaking) {
      const trimmedTranscript = transcript.trim();
      if (trimmedTranscript && trimmedTranscript.length > 2) {
        console.log('Voice mode transcript received:', trimmedTranscript);
        
        handleSendMessage(trimmedTranscript);
        
        // Clear transcript immediately to prevent duplication
        if (typeof stopListening === 'function') {
          stopListening();
          setTimeout(() => {
            if (isVoiceMode && isSupported && !isTyping && !isSpeaking) {
              startListening();
            }
          }, 50);
        }
      }
    }
  }, [transcript, isVoiceMode, isTyping, isSpeaking]);

  const handleNewConversation = () => {
    setCurrentConversationId(null);
  };

  const handleConversationSelect = (conversationId: number) => {
    setCurrentConversationId(conversationId);
  };

  const clearMemories = () => {
    clearMemoriesMutation.mutate();
  };

  const handleVoiceModeToggle = () => {
    const newVoiceMode = !isVoiceMode;
    setIsVoiceMode(newVoiceMode);
    
    if (newVoiceMode) {
      startDetection();
      setIsListening(true);
      setAudioEnabled(false); // Reset audio permission when entering voice mode
      if (isSupported) {
        startListening();
      }
      console.log('Voice mode activated');
    } else {
      setIsListening(false);
      stopDetection();
      if (typeof stopListening === 'function') {
        stopListening();
      }
      setIsSpeaking(false);
      console.log('Voice mode deactivated');
    }
  };

  const enableAudio = async () => {
    try {
      // Play a short silent audio to enable autoplay
      const audio = new Audio('data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAA');
      await audio.play();
      setAudioEnabled(true);
      console.log('✅ Audio context enabled for voice mode');
    } catch (error) {
      console.log('Audio permission still required');
    }
  };

  if (isVoiceMode) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          {/* Your Lumen Logo with Cosmic Effects */}
          <div className="relative mb-8">
            <div className={cn(
              "w-48 h-48 mx-auto rounded-full transition-all duration-300 relative",
              isSpeaking ? "animate-pulse" : isListening ? "ring-2 ring-blue-500/50" : ""
            )}>
              <img 
                src="/attached_assets/lumen-logo (Small)_1753467027342.png" 
                alt="Lumen QI"
                className="w-full h-full object-contain rounded-full"
              />
              
              {/* Cosmic Glow Effects */}
              {isSpeaking && (
                <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-xl animate-pulse" />
              )}
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-lg animate-pulse" />
              )}
            </div>
          </div>
          
          {/* Status Text */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Voice Mode Active</h2>
            <p className="text-lg text-gray-300">
              {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Ready for voice input"}
            </p>
            
            {/* Audio Enable Button */}
            {!audioEnabled && (
              <div className="mt-4">
                <Button
                  onClick={enableAudio}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full"
                >
                  🔊 Enable Audio
                </Button>
                <p className="text-sm text-gray-400 mt-2">Click to hear Lumen's voice responses</p>
              </div>
            )}
            
            {audioEnabled && (
              <p className="text-sm text-green-400 mt-2">✅ Audio enabled - you can hear responses</p>
            )}
          </div>
          
          {/* Recent Messages in Voice Mode */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {messages.slice(-3).map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "p-3 rounded-lg",
                    message.role === 'user' 
                      ? "bg-blue-600/20 text-blue-100 ml-8" 
                      : "bg-purple-600/20 text-purple-100 mr-8"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Exit Voice Mode Button */}
          <Button
            onClick={handleVoiceModeToggle}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full"
          >
            Exit Voice Mode
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
        onClearMemories={clearMemories}
        onToggleSettings={() => setShowSettings(!showSettings)}
        showSettings={showSettings}
      />
      
      <div className="flex-1 flex flex-col">
        <ChatArea
          messages={messages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
          currentConversationId={currentConversationId}
          isVoiceMode={isVoiceMode}
        />
        
        <VoiceControls
          onSendMessage={handleSendMessage}
          isLoading={isTyping}
          connectionStatus={connectionStatus}
          onSpeakingChange={setIsSpeaking}
          onListeningChange={setIsListening}
          onVoiceModeToggle={handleVoiceModeToggle}
        />
      </div>
    </div>
  );
}