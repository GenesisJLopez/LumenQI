import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Message, Conversation } from '@shared/schema';

interface FlowNode {
  id: string;
  x: number;
  y: number;
  type: 'user' | 'assistant' | 'topic' | 'emotion';
  content: string;
  timestamp: Date;
  connections: string[];
  emotion?: string;
  topic?: string;
  intensity?: number;
}

interface FlowEdge {
  from: string;
  to: string;
  type: 'response' | 'topic-shift' | 'emotion-change' | 'continuation';
  strength: number;
}

interface ConversationFlowVisualizationProps {
  conversationId?: number;
  messages: Message[];
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export function ConversationFlowVisualization({ 
  conversationId, 
  messages, 
  isExpanded = false,
  onToggleExpanded 
}: ConversationFlowVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState<'timeline' | 'network' | 'emotion'>('timeline');

  // Fetch emotion analysis for enhanced visualization
  const { data: emotionData } = useQuery({
    queryKey: ['/api/emotion/analysis'],
    enabled: !!conversationId
  });

  // Generate nodes and edges from messages
  useEffect(() => {
    if (!messages.length) return;

    const newNodes: FlowNode[] = [];
    const newEdges: FlowEdge[] = [];

    messages.forEach((message, index) => {
      // Create message node
      const messageNode: FlowNode = {
        id: `msg-${message.id}`,
        x: 0,
        y: 0,
        type: message.role as 'user' | 'assistant',
        content: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
        timestamp: new Date(message.timestamp),
        connections: [],
        emotion: extractEmotion(message.content),
        topic: extractTopic(message.content),
        intensity: calculateIntensity(message.content)
      };

      newNodes.push(messageNode);

      // Create edge to previous message
      if (index > 0) {
        const prevMessage = messages[index - 1];
        const edgeType = determineEdgeType(prevMessage, message);
        
        newEdges.push({
          from: `msg-${prevMessage.id}`,
          to: `msg-${message.id}`,
          type: edgeType,
          strength: calculateEdgeStrength(prevMessage, message)
        });
      }
    });

    // Position nodes based on visualization mode
    positionNodes(newNodes, visualizationMode);
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [messages, visualizationMode]);

  // Position nodes based on selected mode
  const positionNodes = (nodes: FlowNode[], mode: string) => {
    const centerX = 400;
    const centerY = 300;
    
    switch (mode) {
      case 'timeline':
        nodes.forEach((node, index) => {
          node.x = 50 + (index * 120);
          node.y = centerY + (node.type === 'user' ? -50 : 50);
        });
        break;
        
      case 'network':
        // Circular layout
        nodes.forEach((node, index) => {
          const angle = (index / nodes.length) * 2 * Math.PI;
          const radius = 150;
          node.x = centerX + Math.cos(angle) * radius;
          node.y = centerY + Math.sin(angle) * radius;
        });
        break;
        
      case 'emotion':
        // Position by emotional intensity
        nodes.forEach((node, index) => {
          node.x = 50 + (index * 100);
          node.y = centerY - ((node.intensity || 0) * 100);
        });
        break;
    }
  };

  // Extract emotion from message content
  const extractEmotion = (content: string): string => {
    const emotions = ['happy', 'sad', 'excited', 'calm', 'frustrated', 'curious', 'confident'];
    const lowerContent = content.toLowerCase();
    
    for (const emotion of emotions) {
      if (lowerContent.includes(emotion) || 
          lowerContent.includes(emotion + '!') ||
          lowerContent.includes('feel ' + emotion)) {
        return emotion;
      }
    }
    
    // Use emotion detection data if available
    if (emotionData?.dominantEmotion) {
      return emotionData.dominantEmotion;
    }
    
    return 'neutral';
  };

  // Extract topic from message content
  const extractTopic = (content: string): string => {
    const topics = ['weather', 'code', 'tech', 'help', 'question', 'greeting', 'thanks'];
    const lowerContent = content.toLowerCase();
    
    for (const topic of topics) {
      if (lowerContent.includes(topic)) {
        return topic;
      }
    }
    
    return 'general';
  };

  // Calculate message intensity
  const calculateIntensity = (content: string): number => {
    let intensity = 0.5;
    
    // Punctuation increases intensity
    const exclamations = (content.match(/!/g) || []).length;
    const questions = (content.match(/\?/g) || []).length;
    const caps = (content.match(/[A-Z]/g) || []).length;
    
    intensity += exclamations * 0.1;
    intensity += questions * 0.05;
    intensity += caps * 0.005;
    
    return Math.min(intensity, 1);
  };

  // Determine edge type between messages
  const determineEdgeType = (prev: Message, current: Message): FlowEdge['type'] => {
    if (prev.role !== current.role) return 'response';
    
    const prevTopic = extractTopic(prev.content);
    const currentTopic = extractTopic(current.content);
    
    if (prevTopic !== currentTopic) return 'topic-shift';
    
    const prevEmotion = extractEmotion(prev.content);
    const currentEmotion = extractEmotion(current.content);
    
    if (prevEmotion !== currentEmotion) return 'emotion-change';
    
    return 'continuation';
  };

  // Calculate edge strength
  const calculateEdgeStrength = (prev: Message, current: Message): number => {
    const timeDiff = new Date(current.timestamp).getTime() - new Date(prev.timestamp).getTime();
    const timeScore = Math.max(0, 1 - (timeDiff / 60000)); // Decay over 1 minute
    
    const contentSimilarity = calculateContentSimilarity(prev.content, current.content);
    
    return (timeScore + contentSimilarity) / 2;
  };

  // Calculate content similarity
  const calculateContentSimilarity = (content1: string, content2: string): number => {
    const words1 = content1.toLowerCase().split(/\s+/);
    const words2 = content2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  };

  // Draw the visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      
      // Style by edge type
      switch (edge.type) {
        case 'response':
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          break;
        case 'topic-shift':
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          break;
        case 'emotion-change':
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          break;
        case 'continuation':
          ctx.strokeStyle = '#6b7280';
          ctx.lineWidth = 1;
          break;
      }
      
      ctx.globalAlpha = edge.strength;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      
      // Style by node type
      switch (node.type) {
        case 'user':
          ctx.fillStyle = '#10b981';
          break;
        case 'assistant':
          ctx.fillStyle = '#8b5cf6';
          break;
        default:
          ctx.fillStyle = '#6b7280';
      }
      
      ctx.fill();
      
      // Add emotion ring
      if (node.emotion && node.emotion !== 'neutral') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
        ctx.strokeStyle = getEmotionColor(node.emotion);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Add text label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.content.substring(0, 20), node.x, node.y - 35);
    });

    // Animate if enabled
    if (isAnimating) {
      requestAnimationFrame(() => {
        // Add subtle animation effects
        nodes.forEach(node => {
          node.y += Math.sin(Date.now() * 0.001 + node.x * 0.01) * 0.5;
        });
      });
    }
  }, [nodes, edges, isAnimating]);

  // Get emotion color
  const getEmotionColor = (emotion: string): string => {
    const colors: { [key: string]: string } = {
      happy: '#fbbf24',
      sad: '#3b82f6',
      excited: '#f59e0b',
      calm: '#10b981',
      frustrated: '#ef4444',
      curious: '#8b5cf6',
      confident: '#059669'
    };
    return colors[emotion] || '#6b7280';
  };

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 20;
    });

    setSelectedNode(clickedNode || null);
  };

  return (
    <Card className="w-full bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 border-purple-500/20">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Conversation Flow</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAnimating(!isAnimating)}
              className="text-white hover:bg-purple-600/20"
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:bg-purple-600/20"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNodes([]);
                setEdges([]);
                setSelectedNode(null);
              }}
              className="text-white hover:bg-purple-600/20"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            {onToggleExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="text-white hover:bg-purple-600/20"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {showSettings && (
          <div className="mb-4 p-3 bg-black/30 rounded-lg border border-purple-500/20">
            <div className="flex gap-2 mb-2">
              <Button
                variant={visualizationMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVisualizationMode('timeline')}
                className="text-white"
              >
                Timeline
              </Button>
              <Button
                variant={visualizationMode === 'network' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVisualizationMode('network')}
                className="text-white"
              >
                Network
              </Button>
              <Button
                variant={visualizationMode === 'emotion' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVisualizationMode('emotion')}
                className="text-white"
              >
                Emotion
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={isExpanded ? 600 : 400}
            onClick={handleCanvasClick}
            className="w-full border border-purple-500/20 rounded-lg bg-black/20 cursor-pointer"
            style={{ maxWidth: '100%' }}
          />
          
          {selectedNode && (
            <div className="absolute top-2 right-2 p-3 bg-black/80 rounded-lg border border-purple-500/20 max-w-xs">
              <div className="text-white">
                <div className="font-semibold mb-1">
                  {selectedNode.type === 'user' ? 'You' : 'Lumen QI'}
                </div>
                <div className="text-sm mb-2">{selectedNode.content}</div>
                <div className="text-xs text-gray-400">
                  {selectedNode.emotion && (
                    <span className="mr-2">Emotion: {selectedNode.emotion}</span>
                  )}
                  {selectedNode.topic && (
                    <span>Topic: {selectedNode.topic}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
          <div>
            Messages: {nodes.length} | Connections: {edges.length}
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>User</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-yellow-500 rounded-full"></div>
              <span>Emotion</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}