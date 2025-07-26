import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  content?: string;
  conversationId?: number;
  message?: string;
  isEdit?: boolean;
  isTyping?: boolean;
  emotion?: string;
  isVoiceMode?: boolean;
}

interface UseWebSocketReturn {
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

export function useWebSocket(): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;
        
        // Validate URL format before creating WebSocket
        if (!host || !wsUrl.match(/^wss?:\/\/[^\/]+\/ws$/)) {
          console.error('Invalid WebSocket URL format:', wsUrl);
          setConnectionStatus('disconnected');
          return;
        }
        
        setConnectionStatus('connecting');
        ws.current = new WebSocket(wsUrl);
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        setConnectionStatus('disconnected');
        return;
      }
    };

    connectWebSocket();

    if (ws.current) {
      ws.current.onopen = () => {
        setConnectionStatus('connected');
        console.log('WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        setConnectionStatus('disconnected');
        console.log('WebSocket disconnected');
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        
        // Attempt reconnection after error
        setTimeout(() => {
          if (ws.current?.readyState === WebSocket.CLOSED) {
            try {
              const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
              const host = window.location.host;
              const wsUrl = `${protocol}//${host}/ws`;
              
              if (host && wsUrl.match(/^wss?:\/\/[^\/]+\/ws$/)) {
                ws.current = new WebSocket(wsUrl);
              }
            } catch (reconnectError) {
              console.error('WebSocket reconnection failed:', reconnectError);
            }
          }
        }, 3000);
      };
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected, readyState:', ws.current?.readyState);
      // Try to reconnect if not connected
      if (ws.current?.readyState === WebSocket.CLOSED) {
        try {
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const host = window.location.host;
          const wsUrl = `${protocol}//${host}/ws`;
          
          if (host && wsUrl.match(/^wss?:\/\/[^\/]+\/ws$/)) {
            ws.current = new WebSocket(wsUrl);
          }
        } catch (reconnectError) {
          console.error('WebSocket reconnection in sendMessage failed:', reconnectError);
        }
      }
    }
  };

  return {
    sendMessage,
    lastMessage,
    connectionStatus
  };
}
