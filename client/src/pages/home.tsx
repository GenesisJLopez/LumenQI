// Clean working version of home.tsx with voice mode audio fixed
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
    startDetection, 
    stopDetection 
  } = useEmotionDetection();

  const { 
    transcript, 
    isListening: speechListening, 
    isSupported, 
    startListening, 
    stopListening 
  } = useSpeechRecognition();

  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/conversations'],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['/api/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
  });

  const clearMemoriesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/memories', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to clear memories');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Memories cleared successfully" });
    },
    onError: () => {
      toast({ title: "Failed to clear memories", variant: "destructive" });
    }
  });

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    console.log('handleSendMessage called with:', { content, conversationId: currentConversationId, isVoiceMode });
    
    try {
      setIsTyping(true);
      
      if (isVoiceMode) {
        console.log('Sending voice mode message');
      }
      
      // Send the message via WebSocket with emotion data if available
      const messageData = {
        type: 'chat_message',
        content: content.trim(),
        conversationId: currentConversationId,
        isVoiceMode,
        ...(currentEmotion && { emotion: currentEmotion })
      };
      
      sendMessage(messageData);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      toast({ 
        title: "Failed to send message", 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive" 
      });
    }
  }, [currentConversationId, isVoiceMode, currentEmotion, sendMessage, toast]);

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
        
      // Auto-speak AI response in voice mode - use browser TTS for reliability
      if (isVoiceMode && lastMessage.content) {
        console.log('Voice mode: Auto-speaking AI response:', lastMessage.content);
        
        const cleanText = lastMessage.content.replace(/[^\w\s.,!?-]/g, '').trim();
        console.log('🎵 Using browser TTS for immediate voice response');
        
        // Cancel any existing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        // Get available voices and use the best female voice
        const voices = speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.name.includes('Samantha') || 
          voice.name.includes('Karen') ||
          voice.name.includes('Zira') ||
          voice.name.includes('Female') ||
          voice.name.includes('Google US English') ||
          voice.lang.includes('en-US')
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
          console.log('Using voice:', femaleVoice.name);
        }
        
        utterance.onstart = () => {
          console.log('✅ Voice response started - Lumen is speaking');
          setIsSpeaking(true);
        };
        
        utterance.onend = () => {
          console.log('✅ Voice response completed - restarting listening');
          setIsSpeaking(false);
          if (isSupported && isVoiceMode) {
            setTimeout(() => startListening(), 500);
          }
        };
        
        utterance.onerror = (event) => {
          console.error('❌ Voice synthesis error:', event.error);
          setIsSpeaking(false);
          if (isSupported && isVoiceMode) {
            setTimeout(() => startListening(), 500);
          }
        };
        
        // Speak immediately
        setTimeout(() => {
          speechSynthesis.speak(utterance);
          console.log('🎵 Voice response queued for playback');
        }, 100);
      }
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
  }, [lastMessage, queryClient, isVoiceMode, isSupported, startListening, toast]);

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
  }, [transcript, isVoiceMode, isTyping, isSpeaking, handleSendMessage, stopListening, startListening, isSupported]);

  // Update conversation id when new conversation is created
  useEffect(() => {
    if (lastMessage?.type === 'ai_response' && lastMessage.conversationId && !currentConversationId) {
      setCurrentConversationId(lastMessage.conversationId);
    }
  }, [lastMessage, currentConversationId]);

  const handleNewConversation = () => {
    setCurrentConversationId(null);
  };

  const handleConversationSelect = (conversationId: number) => {
    setCurrentConversationId(conversationId);
  };

  const clearMemories = () => {
    clearMemoriesMutation.mutate();
  };

  const handleVoiceModeToggle = async () => {
    const newVoiceMode = !isVoiceMode;
    setIsVoiceMode(newVoiceMode);
    
    if (newVoiceMode) {
      // Enable audio context immediately when entering voice mode
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+XzzGEaB');
        await audio.play();
        setAudioEnabled(true);
        console.log('✅ Audio context enabled automatically');
      } catch (error) {
        console.log('Audio autoplay blocked, will try with first TTS response');
        setAudioEnabled(false);
      }
      
      startDetection();
      setIsListening(true);
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
      setAudioEnabled(false);
      console.log('Voice mode deactivated');
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