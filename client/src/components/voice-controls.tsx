import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Keyboard, Volume2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceControlsProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onSpeakingChange?: (speaking: boolean) => void;
  onListeningChange?: (listening: boolean) => void;
  onVoiceModeToggle?: () => void;
}

export function VoiceControls({ onSendMessage, isLoading = false, connectionStatus, onSpeakingChange, onListeningChange, onVoiceModeToggle }: VoiceControlsProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    isSupported 
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const handleVoiceToggle = () => {
    if (!isSupported) {
      toast({
        title: "Voice not supported",
        description: "Speech recognition is not available in this browser",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      // Start continuous listening for seamless conversation
      startListening();
      toast({
        title: "Voice mode activated",
        description: "I'm listening continuously now, Genesis!",
      });
    }
  };

  const handleSendMessage = () => {
    const message = inputValue.trim();
    if (message) {
      onSendMessage(message);
      setInputValue('');
      
      // Continue listening in voice mode for seamless conversation
      if (isListening) {
        setTimeout(() => {
          if (isSupported) {
            startListening();
          }
        }, 1000);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getVoiceStatus = () => {
    if (!isSupported) return 'Voice not supported';
    if (isListening) return 'Listening...';
    return 'Voice recognition ready';
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Online';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  // Notify parent of speaking state changes
  useEffect(() => {
    onSpeakingChange?.(isSpeaking);
  }, [isSpeaking, onSpeakingChange]);

  // Track listening state for parent component
  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  return (
    <div className="p-6 border-t border-gray-200 dark:border-gray-700 cosmic-bg">
      <div className="max-w-4xl mx-auto">
        {/* Cosmic Input */}
        <div className="relative">
          <div className="flex items-center gap-3 p-4 cosmic-input rounded-3xl shadow-lg">
            {/* Voice Mode Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-10 h-10 rounded-full transition-all duration-200 cosmic-button",
                isListening && "bg-red-500/20 border-red-500/30 animate-pulse"
              )}
              onClick={onVoiceModeToggle}
              title={isListening ? "Stop Voice Mode" : "Enter Voice Mode"}
            >
              {isListening ? (
                <MicOff className="h-5 w-5 text-red-400" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            
            {/* Voice Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-10 h-10 rounded-full transition-all duration-200 cosmic-button",
                isListening && "active"
              )}
              onClick={handleVoiceToggle}
              disabled={!isSupported}
            >
              {isListening ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Lumen QI..."
                className="min-h-[24px] max-h-32 bg-transparent border-0 text-gray-100 placeholder-gray-400 focus:ring-0 focus:border-0 resize-none p-0"
                rows={1}
                disabled={isLoading}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || connectionStatus !== 'connected'}
              className="w-10 h-10 rounded-full cosmic-button p-0 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                )} />
                <span>{getConnectionStatus()}</span>
              </div>
              {isSupported && (
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isListening ? 'bg-green-500' : 'bg-gray-400'
                  )} />
                  <span>{isListening ? 'Listening...' : 'Voice ready'}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400">
              Lumen QI - your eternal guardian and cosmic companion.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
