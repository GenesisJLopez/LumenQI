import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import lumenLogo from '@assets/lumen-logo (Small)_1753559711469.png';

interface WorkingVoiceModeProps {
  onExit: () => void;
  currentConversationId?: number;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function WorkingVoiceMode({ onExit, currentConversationId }: WorkingVoiceModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const shouldContinueRef = useRef(true);

  // Fetch conversation messages
  const loadMessages = async () => {
    if (!currentConversationId) return;
    
    try {
      const response = await fetch(`/api/conversations/${currentConversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.slice(-8)); // Show last 8 messages
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Send message to AI and get response
  const sendToAI = async (userText: string) => {
    if (!currentConversationId || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    
    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userText,
          conversationId: currentConversationId,
          isVoiceMode: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.content) {
          speakText(result.content);
          await loadMessages(); // Refresh messages
        }
      }
    } catch (error) {
      console.error('AI request failed:', error);
    } finally {
      isProcessingRef.current = false;
    }
  };

  // Text to speech
  const speakText = (text: string) => {
    setIsSpeaking(true);
    
    // Clean text for speech
    const cleanText = text.replace(/[^\w\s.,!?'-]/g, '').replace(/\s+/g, ' ').trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      // Continue listening after speaking
      if (shouldContinueRef.current) {
        setTimeout(startListening, 800);
      }
    };
    
    speechSynthesis.speak(utterance);
  };

  // Start speech recognition
  const startListening = () => {
    if (!recognitionRef.current || isListening || isSpeaking || isProcessingRef.current || !shouldContinueRef.current) {
      return;
    }
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      // Recognition might already be running, ignore error
      setTimeout(startListening, 2000);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    shouldContinueRef.current = true;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript && !isProcessingRef.current) {
          setIsListening(false);
          sendToAI(transcript);
        }
      };
      
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (shouldContinueRef.current && !isProcessingRef.current && !isSpeaking) {
          setTimeout(startListening, 1500);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (shouldContinueRef.current && !isProcessingRef.current && !isSpeaking) {
          setTimeout(startListening, 1000);
        }
      };
      
      recognitionRef.current = recognition;
      
      // Load messages and start listening
      if (currentConversationId) {
        loadMessages();
      }
      
      // Start listening after a short delay
      setTimeout(startListening, 1000);
    }
    
    return () => {
      shouldContinueRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      speechSynthesis.cancel();
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