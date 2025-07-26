import { useEffect, useRef, useState, useCallback } from 'react';

interface MessageData {
  type: string;
  content?: string;
  conversationId?: number;
  message?: string;
  isEdit?: boolean;
  isTyping?: boolean;
  emotion?: string;
  isVoiceMode?: boolean;
}

interface UseHttpCommunicationReturn {
  sendMessage: (message: MessageData) => Promise<void>;
  lastMessage: MessageData | null;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  isLoading: boolean;
}

export function useHttpCommunication(): UseHttpCommunicationReturn {
  const [lastMessage, setLastMessage] = useState<MessageData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Health check to verify server connectivity
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/identity', { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setConnectionStatus('error');
      }
    };

    checkHealth();
    const healthInterval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(healthInterval);
  }, []);

  const sendMessage = useCallback(async (message: MessageData): Promise<void> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Set the AI response as the last message
      if (responseData.content) {
        const aiResponse = {
          type: 'ai_response' as const,
          content: responseData.content,
          conversationId: message.conversationId
        };
        setLastMessage(aiResponse);
        console.log('✅ HTTP: AI response received:', responseData.content.substring(0, 50) + '...');
        
        // Clear loading state 
        setIsLoading(false);
      }

      setConnectionStatus('connected');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Failed to send message:', error);
      setConnectionStatus('error');
      
      // Set error message
      setLastMessage({
        type: 'error',
        content: 'Failed to send message. Please try again.',
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    sendMessage,
    lastMessage,
    connectionStatus,
    isLoading,
  };
}