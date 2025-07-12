import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/sidebar';
import { ChatArea } from '@/components/chat-area';
import { VoiceControls } from '@/components/voice-controls';
import type { Conversation, Message } from '@shared/schema';

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket();

  // Fetch current conversation and messages
  const { data: conversationData } = useQuery<{
    conversation: Conversation;
    messages: Message[];
  }>({
    queryKey: ['/api/conversations', currentConversationId],
    enabled: !!currentConversationId,
  });

  const messages = conversationData?.messages || [];

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setCurrentConversationId(newConversation.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive"
      });
    }
  });

  // Handle WebSocket messages and speech synthesis
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'ai_response') {
        setIsTyping(false);
        setIsSpeaking(true);
        
        // Refresh messages for current conversation
        if (currentConversationId) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', currentConversationId] 
          });
        }
        
        // Speak the AI response with enhanced speech synthesis
        if (lastMessage.content) {
          import('@/lib/speech-synthesis').then(({ speechSynthesis }) => {
            speechSynthesis.speak(lastMessage.content, {
              onStart: () => setIsSpeaking(true),
              onEnd: () => setIsSpeaking(false),
              onError: () => setIsSpeaking(false)
            });
          });
        }
      } else if (lastMessage.type === 'error') {
        setIsTyping(false);
        setIsSpeaking(false);
        toast({
          title: "Error",
          description: lastMessage.message || "Something went wrong",
          variant: "destructive"
        });
      }
    }
  }, [lastMessage, currentConversationId, toast]);

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) {
      // Create new conversation first
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      await createConversationMutation.mutateAsync(title);
      return;
    }

    // Send message via WebSocket
    sendMessage({
      type: 'chat_message',
      content,
      conversationId: currentConversationId
    });

    setIsTyping(true);
    
    // Refresh messages to show user message immediately
    queryClient.invalidateQueries({ 
      queryKey: ['/api/conversations', currentConversationId] 
    });
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setIsTyping(false);
  };

  const handleConversationSelect = (id: number) => {
    setCurrentConversationId(id);
    setIsTyping(false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar
        currentConversationId={currentConversationId || undefined}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />
      
      <div className="flex-1 flex flex-col">
        <ChatArea
          messages={messages}
          isTyping={isTyping}
          currentConversationId={currentConversationId || undefined}
          isSpeaking={isSpeaking}
          isListening={isListening}
        />
        
        <VoiceControls
          onSendMessage={handleSendMessage}
          isLoading={createConversationMutation.isPending}
          connectionStatus={connectionStatus}
          onSpeakingChange={setIsSpeaking}
          onListeningChange={setIsListening}
        />
      </div>
    </div>
  );
}
