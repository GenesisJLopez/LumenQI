import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import lumenLogo from '@assets/lumen-logo (Small)_1753559711469.png';

interface FixedVoiceModeProps {
  onExit: () => void;
  currentConversationId?: number;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function FixedVoiceMode({ onExit, currentConversationId }: FixedVoiceModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [speechIntensity, setSpeechIntensity] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  // Load messages
  const fetchMessages = async () => {
    if (!currentConversationId) return;
    try {
      const response = await fetch(`/api/conversations/${currentConversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.slice(-10)); // Show last 10 messages
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // Process voice message
  const processVoiceMessage = async (text: string) => {
    if (!currentConversationId || !text.trim() || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    console.log('🎤 PROCESSING VOICE MESSAGE:', text);
    
    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          conversationId: currentConversationId,
          isVoiceMode: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ VOICE MESSAGE SUCCESS:', data.content?.substring(0, 50));
        
        // Speak response
        if (data.content) {
          speakResponse(data.content);
        }
        
        // Refresh messages
        setTimeout(fetchMessages, 500);
      }
    } catch (error) {
      console.error('❌ VOICE MESSAGE FAILED:', error);
    }
    
    isProcessingRef.current = false;
  };

  // Speak AI response
  const speakResponse = (text: string) => {
    setIsSpeaking(true);
    
    // Clean text
    const cleanText = text.replace(/[^\w\s.,!?'-]/g, '').replace(/\s+/g, ' ').trim();
    
    // Use browser TTS
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeechIntensity(0);
      // Restart listening
      setTimeout(startListening, 1000);
    };
    
    speechSynthesis.speak(utterance);
  };

  // Start speech recognition
  const startListening = () => {
    if (!recognitionRef.current || isListening || isSpeaking || isProcessingRef.current) return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      // Try again in 2 seconds
      setTimeout(startListening, 2000);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    console.log('🎤 INITIALIZING VOICE MODE');
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false; // Process one phrase at a time
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('🎤 RECOGNITION STARTED');
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        // Process final results
        if (finalTranscript.trim()) {
          // Process speech silently
          setTranscript('');
          processVoiceMessage(finalTranscript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log('🎤 RECOGNITION ENDED');
        setIsListening(false);
        
        // Auto-restart if not processing and not speaking
        if (!isProcessingRef.current && !isSpeaking) {
          setTimeout(startListening, 1000);
        }
      };
      
      // Load messages and start listening
      if (currentConversationId) {
        fetchMessages();
      }
      setTimeout(startListening, 1500);
    } else {
      console.error('Speech recognition not supported');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentConversationId]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
      {/* Cosmic glow positioned at same level as logo */}
      <div className="absolute inset-0 flex items-center justify-center mb-8">
        <div 
          className={cn(
            "w-48 h-48 rounded-full transition-all duration-300",
            isSpeaking ? 'cosmic-pulse-speaking' : 'cosmic-pulse-listening'
          )}
          style={isSpeaking ? {
            opacity: 0.3 + (speechIntensity * 0.2),
            transform: `scale(${1 + speechIntensity * 0.02})`
          } : {}}
        ></div>
      </div>
      
      {/* Logo - centered */}
      <div className="relative z-10 mb-8">
        <img 
          src={lumenLogo} 
          alt="Lumen" 
          className="w-48 h-48 mx-auto"
        />
        
        {/* Silent operation - no status messages */}
        <div className="text-center mt-4 text-white min-h-[20px]">
          {/* Voice mode operates silently like ChatGPT */}
        </div>
      </div>
      
      {/* Conversation Display */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-3/4 max-w-2xl z-20">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 max-h-60 overflow-y-auto">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-white'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center text-sm">Say something to start our conversation...</p>
          )}
        </div>
      </div>
      
      {/* Exit button */}
      <Button
        onClick={onExit}
        variant="outline"
        className="absolute bottom-8 bg-black/50 text-white border-white/20 hover:bg-white/10"
      >
        Exit Voice Mode
      </Button>
    </div>
  );
}