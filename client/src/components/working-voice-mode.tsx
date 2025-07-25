import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface WorkingVoiceModeProps {
  currentConversationId: number | null;
  sendMessage: (message: any) => void;
  lastMessage: any;
  onExit: () => void;
}

export default function WorkingVoiceMode({ 
  currentConversationId, 
  sendMessage, 
  lastMessage,
  onExit 
}: WorkingVoiceModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Initializing...');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastMessageRef = useRef<string>('');

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setStatus('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Listening...');
      console.log('🎤 Voice recognition started');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);

      if (finalTranscript.trim()) {
        console.log('🎤 Final transcript:', finalTranscript);
        processVoiceMessage(finalTranscript.trim());
        setTranscript('');
      }
    };

    recognition.onerror = (event) => {
      console.error('🎤 Speech recognition error:', event.error);
      setIsListening(false);
      setStatus('Error occurred, restarting...');
      setTimeout(() => startListening(), 1000);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!isSpeaking) {
        setTimeout(() => startListening(), 500);
      }
    };

    recognitionRef.current = recognition;
    
    // Start listening after initialization
    setTimeout(() => startListening(), 1000);

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  // Process AI responses
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'ai_response' || !lastMessage.content) {
      return;
    }

    // Avoid processing the same message twice
    const messageKey = `${lastMessage.conversationId}-${lastMessage.content.substring(0, 20)}`;
    if (messageKey === lastMessageRef.current) {
      return;
    }
    lastMessageRef.current = messageKey;

    console.log('🎤 Processing AI response for speech:', lastMessage.content.substring(0, 50));
    speakResponse(lastMessage.content);
  }, [lastMessage]);

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const processVoiceMessage = (message: string) => {
    if (!currentConversationId || !message.trim()) return;

    setStatus('Processing...');
    
    // Stop listening while processing
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    console.log('🎤 Sending voice message:', message);
    
    sendMessage({
      type: 'chat_message',
      content: message,
      conversationId: currentConversationId,
      isVoiceMode: true
    });
  };

  const speakResponse = (text: string) => {
    console.log('🎤 Starting speech for:', text.substring(0, 50));
    setIsSpeaking(true);
    setStatus('Speaking...');

    // Clean text for speech
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[^\w\s.,!?'-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Use best available voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Samantha') || 
      voice.name.includes('Karen') || 
      voice.name.includes('Alex') ||
      voice.name.includes('Zira')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      console.log('🎤 Speech started');
      setIsSpeaking(true);
      setStatus('Speaking...');
    };

    utterance.onend = () => {
      console.log('🎤 Speech finished');
      setIsSpeaking(false);
      setStatus('Listening...');
      
      // Resume listening after speech
      setTimeout(() => {
        startListening();
      }, 500);
    };

    utterance.onerror = (error) => {
      console.error('🎤 Speech error:', error);
      setIsSpeaking(false);
      setStatus('Speech error, resuming listening...');
      setTimeout(() => {
        startListening();
      }, 1000);
    };

    // Start speech
    if (voices.length === 0) {
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.speak(utterance);
      };
    } else {
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      {/* Cosmic background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black animate-pulse" />
        {/* Floating particles */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Lumen logo with glow effect */}
        <div className="relative mb-8">
          <div className={`absolute inset-0 bg-gradient-radial from-purple-400/30 to-transparent rounded-full transition-all duration-300 ${
            isSpeaking ? 'w-64 h-64 animate-pulse' : isListening ? 'w-48 h-48' : 'w-32 h-32'
          }`} />
          <img 
            src="/attached_assets/lumen-logo%20(Small)_1753450894008.png" 
            alt="Lumen" 
            className="relative w-32 h-32 object-contain filter brightness-110"
          />
        </div>

        {/* Status text */}
        <div className="text-white text-xl mb-4 text-center">
          {status}
        </div>

        {/* Transcript display */}
        {transcript && (
          <div className="text-purple-300 text-lg mb-4 text-center max-w-md">
            "{transcript}"
          </div>
        )}

        {/* Voice indicators */}
        <div className="flex items-center space-x-4 mb-8">
          <div className={`w-4 h-4 rounded-full transition-colors ${
            isListening ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
          }`} />
          <span className="text-white text-sm">
            {isListening ? 'Listening' : 'Not listening'}
          </span>
          
          <div className={`w-4 h-4 rounded-full transition-colors ${
            isSpeaking ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'
          }`} />
          <span className="text-white text-sm">
            {isSpeaking ? 'Speaking' : 'Silent'}
          </span>
        </div>
      </div>

      {/* Exit button */}
      <button
        onClick={onExit}
        className="absolute bottom-8 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full transition-colors"
      >
        <X size={24} />
      </button>
    </div>
  );
}