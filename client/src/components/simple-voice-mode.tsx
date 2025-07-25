import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/use-websocket';
import lumenLogo from '@/assets/lumen-logo.svg';

interface SimpleVoiceModeProps {
  onExit: () => void;
  currentConversationId?: number;
}

export function SimpleVoiceMode({ onExit, currentConversationId }: SimpleVoiceModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Ready to listen...');
  
  const { sendMessage, lastMessage } = useWebSocket();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastMessageIdRef = useRef<string>('');

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Custom grammar to better recognize "Lumen"
      if ('webkitSpeechGrammarList' in window) {
        const grammar = '#JSGF V1.0; grammar names; public <name> = lumen | Lumen | LUMEN;';
        const speechRecognitionList = new window.webkitSpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        recognition.grammars = speechRecognitionList;
      }
      
      recognition.onstart = () => {
        setIsListening(true);
        setStatus('Listening...');
      };
      
      recognition.onresult = (event) => {
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
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setStatus('Error: ' + event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (!isSpeaking) {
          setStatus('Click to start listening');
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // Process incoming AI responses
  useEffect(() => {
    if (!lastMessage || !lastMessage.content) return;
    
    // Avoid processing the same message twice
    const messageId = lastMessage.timestamp || lastMessage.content;
    if (messageId === lastMessageIdRef.current) return;
    lastMessageIdRef.current = messageId;
    
    if (lastMessage.type === 'ai_response' && lastMessage.content) {
      console.log('🎤 Voice mode: Processing AI response:', lastMessage.content.substring(0, 50) + '...');
      speakText(lastMessage.content);
    }
  }, [lastMessage]);

  const processMessage = async (message: string) => {
    if (!currentConversationId || !message.trim()) return;
    
    setStatus('Processing your message...');
    setTranscript('');
    
    // Stop listening while processing
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    console.log('🎤 Voice mode: Sending message:', message);
    
    // Send message via WebSocket
    sendMessage({
      type: 'chat_message',
      content: message,
      conversationId: currentConversationId,
      isVoiceMode: true
    });
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    setStatus('Speaking...');
    
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
              setStatus('Ready to listen...');
              URL.revokeObjectURL(audioUrl);
              startListening();
            };
            
            audio.onerror = () => {
              console.error('Audio playback failed, using browser TTS');
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
      useBrowserTTS(cleanText);
      
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      setIsSpeaking(false);
      setStatus('Ready to listen...');
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
      setStatus('Ready to listen...');
      startListening();
    };
    
    utterance.onerror = (event) => {
      console.error('Browser TTS failed:', event.error);
      setIsSpeaking(false);
      setStatus('Ready to listen...');
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

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 relative">
      {/* Logo */}
      <div className="relative z-10 mb-8">
        <img 
          src={lumenLogo} 
          alt="Lumen" 
          className={`w-48 h-48 mx-auto transition-all duration-300 ${
            isSpeaking ? 'animate-pulse' : isListening ? 'opacity-80' : 'opacity-100'
          }`}
        />
      </div>
      
      {/* Status */}
      <div className="text-center mb-8">
        <div className="text-2xl font-medium text-white mb-2">
          {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Voice Mode'}
        </div>
        <div className="text-gray-400 text-lg">
          {status}
        </div>
        {transcript && (
          <div className="text-purple-300 text-sm mt-2 max-w-md">
            "{transcript}"
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex space-x-4 mb-8">
        <Button
          onClick={handleToggleListening}
          disabled={isSpeaking}
          className={`px-6 py-3 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </Button>
      </div>
      
      {/* Exit Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
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