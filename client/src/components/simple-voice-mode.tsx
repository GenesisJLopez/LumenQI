import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useHttpCommunication } from '@/hooks/use-http-communication';
import { cn } from '@/lib/utils';
import lumenLogo from '@assets/lumen-logo (Small)_1753559711469.png';
import { deviceAccess, enhancedVoice } from '@/lib/device-access';

interface SimpleVoiceModeProps {
  onExit: () => void;
  currentConversationId?: number;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function SimpleVoiceMode({ onExit, currentConversationId }: SimpleVoiceModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechIntensity, setSpeechIntensity] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const { sendMessage, lastMessage } = useHttpCommunication();
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastMessageIdRef = useRef<string>('');

  // Initialize comprehensive device access and speech recognition
  useEffect(() => {
    const initializeDeviceAccess = async () => {
      console.log('🍎 Initializing Lumen with full device access...');
      
      // Request all device permissions for Apple app readiness
      await deviceAccess.prepareForAppleApp();
      
      // Get environment information
      const envInfo = await deviceAccess.getEnvironmentInfo();
      console.log('📱 Device Environment:', envInfo);
      
      // Start basic voice recognition
      console.log('🎤 Starting basic voice recognition');
      // Load conversation messages for display
      if (currentConversationId) {
        fetchMessages();
      }
      
      setTimeout(() => {
        if (recognitionRef.current) {
          console.log('🎤 Starting speech recognition from device access...');
          startListening();
        }
      }, 2000);
    };

    initializeDeviceAccess();
    
    return () => {
      enhancedVoice.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // Start listening function for voice mode
  // Fetch conversation messages for display
  const fetchMessages = async () => {
    if (!currentConversationId) return;
    
    try {
      const response = await fetch(`/api/conversations/${currentConversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.slice(-6)); // Show last 6 messages
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      console.error('❌ Speech recognition not available');
      return;
    }
    
    if (isListening || isSpeaking) {
      console.log('🎤 Already listening or speaking, skipping start');
      return;
    }
    
    try {
      setIsListening(true);
      recognitionRef.current.start();
      console.log('✅ Voice recognition started successfully');
    } catch (error) {
      console.error('❌ Failed to start recognition:', error);
      setIsListening(false);
    }
  };

  // Enhanced speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Custom grammar to better recognize "Lumen"
      if ('webkitSpeechGrammarList' in window) {
        const grammar = '#JSGF V1.0; grammar names; public <name> = lumen | Lumen | LUMEN;';
        const speechRecognitionList = new (window as any).webkitSpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        recognition.grammars = speechRecognitionList;
      }
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          // Replace common misrecognitions of "Lumen"
          const correctedTranscript = transcript
            .replace(/\bwoman\b/gi, 'Lumen')
            .replace(/\bwomen\b/gi, 'Lumen')
            .replace(/\blumen\b/gi, 'Lumen')
            .replace(/\bluman\b/gi, 'Lumen')
            .replace(/\bloom[ea]n?\b/gi, 'Lumen');
          
          if (event.results[i].isFinal) {
            finalTranscript += correctedTranscript;
          } else {
            interimTranscript += correctedTranscript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        // Process final results immediately
        if (finalTranscript.trim()) {
          console.log('🎤 Processing final transcript:', finalTranscript);
          clearTimeout(timeoutRef.current);
          setIsListening(false);
          // Stop recognition to prevent restart loop during processing
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          processMessage(finalTranscript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        // Don't auto-restart on errors to prevent loops
      };
      
      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        setIsListening(false);
        // Auto-restart only if not speaking and not processing a message
        if (!isSpeaking && transcript.trim() === '') {
          setTimeout(() => {
            startListening();
          }, 1000);
        }
      };
      
      // Auto-start listening when voice mode loads
      setTimeout(() => {
        console.log('🎤 Starting automatic voice recognition');
        startListening();
      }, 1500);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // Process incoming AI responses - WORKS NOW
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('🎤 Voice mode received message:', lastMessage.type, lastMessage.content?.substring(0, 50));
    
    // Process ai_response messages immediately 
    if (lastMessage.type === 'ai_response' && lastMessage.content) {
      console.log('🎤 Voice mode: Speaking AI response now');
      speakText(lastMessage.content);
      
      // Refresh messages to show new conversation
      setTimeout(() => {
        fetchMessages();
      }, 100);
    }
  }, [lastMessage]);

  const processMessage = async (message: string) => {
    if (!currentConversationId || !message.trim()) return;
    
    setTranscript('');
    
    // Stop listening while processing
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    console.log('🎤 Voice mode: Sending message:', message);
    
    try {
      // Send message via HTTP with voice mode flag
      await sendMessage({
        type: 'chat_message',
        content: message,
        conversationId: currentConversationId,
        isVoiceMode: true
      });
      console.log('✅ Voice message sent successfully');
      
      // Refresh messages immediately to show user message
      fetchMessages();
    } catch (error) {
      console.error('❌ Failed to send voice message:', error);
    }
    
    // Clear transcript to prevent re-processing
    setTranscript('');
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    
    // Simulate speech intensity for glow effect
    const intensityInterval = setInterval(() => {
      setSpeechIntensity(Math.random() * 0.8 + 0.2);
    }, 100);
    
    try {
      // Clean text for speech
      const cleanText = text
        .replace(/[^\w\s.,!?'-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Try OpenAI TTS first
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            voice: 'nova',
            speed: 1.0
          })
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          if (audioBlob.size > 0) {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.oncanplaythrough = () => {
              audio.play().catch(console.error);
            };
            
            audio.onended = () => {
              setIsSpeaking(false);
              setSpeechIntensity(0);
              clearInterval(intensityInterval);
              URL.revokeObjectURL(audioUrl);
              startListening();
            };
            
            audio.onerror = () => {
              console.error('Audio playback failed, using browser TTS');
              clearInterval(intensityInterval);
              useBrowserTTS(cleanText);
            };
            
            audio.load();
            return;
          }
        }
      } catch (error) {
        console.error('OpenAI TTS failed:', error);
      }
      
      // Fallback to browser TTS
      clearInterval(intensityInterval);
      useBrowserTTS(cleanText);
      
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      setIsSpeaking(false);
      setSpeechIntensity(0);
      clearInterval(intensityInterval);
      startListening();
    }
  };

  const useBrowserTTS = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Try to use a good quality voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Samantha') || 
      voice.name.includes('Karen') || 
      voice.name.includes('Female')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => {
      console.log('🎤 Browser TTS started');
    };
    
    utterance.onend = () => {
      console.log('🎤 Browser TTS ended');
      setIsSpeaking(false);
      setSpeechIntensity(0);
      // Restart listening after speech ends
      setTimeout(() => {
        startListening();
      }, 1000);
    };
    
    utterance.onerror = (event) => {
      console.error('Browser TTS failed:', event.error);
      setIsSpeaking(false);
      setSpeechIntensity(0);
      // Restart listening after speech error
      setTimeout(() => {
        startListening();
      }, 1000);
    };
    
    speechSynthesis.speak(utterance);
  };

  const startListeningAgain = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    clearTimeout(timeoutRef.current);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
      {/* Cosmic glow positioned exactly behind logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={cn(
            "w-56 h-56 rounded-full transition-all duration-300",
            isSpeaking ? 'cosmic-pulse-speaking' : 'cosmic-pulse-listening'
          )}
          style={isSpeaking ? {
            animationDuration: `${Math.max(0.2, 0.8 - speechIntensity * 0.6)}s`,
            opacity: 0.3 + (speechIntensity * 0.2),
            transform: `scale(${1 + speechIntensity * 0.02})`
          } : {}}
        ></div>
      </div>
      
      {/* Logo - centered and bigger */}
      <div className="relative z-10 mb-8">
        <img 
          src={lumenLogo} 
          alt="Lumen" 
          className="w-48 h-48 mx-auto"
        />
        
        {/* Status indicator - only show when actively processing */}
        <div className="text-center mt-4 text-white">
          {isSpeaking && <p className="text-blue-400">🗣️ Speaking...</p>}
          {transcript && <p className="text-yellow-400 text-sm">"{transcript}"</p>}
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
      
      {/* Exit Voice Mode Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <Button
          onClick={onExit}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full"
        >
          Exit Voice Mode
        </Button>
      </div>
    </div>
  );
}