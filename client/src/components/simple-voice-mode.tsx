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

export function SimpleVoiceMode({ onExit, currentConversationId }: SimpleVoiceModeProps) {
  const [isListening, setIsListening] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechIntensity, setSpeechIntensity] = useState(0);
  
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
      
      // Initialize enhanced voice recognition
      const voiceReady = await enhancedVoice.initialize();
      if (voiceReady) {
        console.log('🎤 Enhanced voice recognition ready');
        startListening();
      } else {
        console.error('❌ Voice recognition failed to initialize');
      }
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

  // Legacy speech recognition fallback (will be replaced by enhanced version)
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
        
        // Process final results
        if (finalTranscript.trim()) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            processMessage(finalTranscript.trim());
          }, 1000); // Wait 1 second after speech ends
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        // Auto-restart on error
        setTimeout(() => startListening(), 1000);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        // Auto-restart listening when not speaking
        if (!isSpeaking) {
          setTimeout(() => startListening(), 500);
        }
      };
      
      // Auto-start listening when voice mode loads
      setTimeout(() => startListening(), 1000);
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
    } catch (error) {
      console.error('❌ Failed to send voice message:', error);
    }
    
    // Restart listening after a short delay (reduced from 30ms to 10ms)
    setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
        }
      }
    }, 10);
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
      startListening();
    };
    
    utterance.onerror = (event) => {
      console.error('Browser TTS failed:', event.error);
      setIsSpeaking(false);
      setSpeechIntensity(0);
      startListening();
    };
    
    speechSynthesis.speak(utterance);
  };

  const startListening = () => {
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
          onClick={onExit}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full"
        >
          Exit Voice Mode
        </Button>
      </div>
    </div>
  );
}