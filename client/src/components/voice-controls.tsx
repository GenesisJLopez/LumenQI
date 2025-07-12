import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Keyboard } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceControlsProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

export function VoiceControls({ onSendMessage, isLoading = false, connectionStatus }: VoiceControlsProps) {
  const [inputValue, setInputValue] = useState('');
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
      startListening();
      toast({
        title: "Voice recognition active",
        description: "Listening for your voice...",
      });
    }
  };

  const handleSendMessage = () => {
    const message = inputValue.trim();
    if (message) {
      onSendMessage(message);
      setInputValue('');
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

  return (
    <div className="p-6 border-t border-dark-border bg-dark-surface">
      <div className="max-w-4xl mx-auto">
        {/* Voice Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "w-16 h-16 rounded-full border-2 transition-all duration-200",
              isListening 
                ? "bg-green-500 hover:bg-green-600 border-green-400 animate-pulse" 
                : "bg-dark-elevated hover:bg-dark-elevated/80 border-dark-border"
            )}
            onClick={handleVoiceToggle}
            disabled={!isSupported}
          >
            {isListening ? (
              <Mic className="h-6 w-6 text-white" />
            ) : (
              <MicOff className="h-6 w-6 text-gray-400" />
            )}
          </Button>
          <div className="text-center">
            <div className="text-sm text-gray-400">
              {isSupported ? 'Click to speak' : 'Voice not available'}
            </div>
            <div className="text-xs text-gray-500">
              {getVoiceStatus()}
            </div>
          </div>
        </div>

        {/* Text Input */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or use voice input..."
              className="min-h-[48px] bg-dark-elevated border-dark-border text-white placeholder-gray-400 focus:ring-2 focus:ring-glow-blue focus:border-transparent resize-none pr-10"
              rows={1}
              disabled={isLoading}
            />
            <div className="absolute right-3 top-3 text-gray-500">
              <Keyboard className="h-4 w-4" />
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || connectionStatus !== 'connected'}
            className="bg-glow-blue hover:bg-blue-600 text-white h-12 px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span>{getConnectionStatus()}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Memory: Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isSupported ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span>Voice: {isSupported ? 'Ready' : 'Not Available'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
