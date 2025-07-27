/**
 * Conversation Flow Visualization Component
 * Provides interactive visualization of conversation patterns and AI decision-making
 */

import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {ContentTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Brain, 
  Network, 
  Clock, 
  Target,
  TrendingUp,
  Zap,
  Eye,
  Settings,
  Play,
  Pause,
  Download,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';

interface FlowVisualizationData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  clusters: FlowCluster[];
  timeline: FlowTimelineEntry[];
  heatmap: FlowHeatmapData;
}

interface FlowNode {
  id: string;
  type: 'user' | 'ai' | 'system' | 'emotion' | 'topic';
  label: string;
  size: number;
  color: string;
  position: { x: number; y: number };
  metadata: any;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: 'response' | 'continuation' | 'topic_shift' | 'emotional_transition';
  color: string;
  animated: boolean;
}

interface FlowCluster {
  id: string;
  label: string;
  nodes: string[];
  color: string;
  strength: number;
}

interface FlowTimelineEntry {
  timestamp: Date;
  event: string;
  type: 'message' | 'emotion' | 'topic' | 'provider_switch';
  intensity: number;
  duration: number;
}

interface FlowHeatmapData {
  timeSlots: string[];
  topics: string[];
  values: number[][];
  maxValue: number;
}

interface ConversationMetrics {
  totalFlows: number;
  averageResponseTime: number;
  mostCommonPatterns: any[];
  aiProviderUsage: { [key: string]: number };
  emotionalDistribution: { [key: string]: number };
  topicDistribution: { [key: string]: number };
  engagementScore: number;
  flowEfficiency: number;
}

export function ConversationFlowVisualization() {
  const [isRealtime, setIsRealtime] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<'network' | 'timeline' | 'heatmap' | 'metrics'>('network');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showClusters, setShowClusters] = useState(true);
  const [showEmotions, setShowEmotions] = useState(true);
  const [showTopics, setShowTopics] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Fetch flow visualization data
  const { data: visualizationData, isLoading } =<FlowVisualizationData>({
    queryKey: ['/api/flow/visualization', selectedConversation],
    refetchInterval: isRealtime ? 5000 : false
  });

  // Fetch conversation metrics
  const { data: metrics } =<ConversationMetrics>({
    queryKey: ['/api/flow/metrics', selectedConversation],
    refetchInterval: isRealtime ? 10000 : false
  });

  // Fetch conversations list
  const { data: conversations = [] } =<any[]>({
    queryKey: ['/api/conversations']
  });

  // Canvas animation effect
  useEffect(() => {
    if (!canvasRef.current || !visualizationData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationTime = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (visualizationMode === 'network') {
        drawNetworkVisualization(ctx, visualizationData, animationTime);
      } else if (visualizationMode === 'timeline') {
        drawTimelineVisualization(ctx, visualizationData, animationTime);
      } else if (visualizationMode === 'heatmap') {
        drawHeatmapVisualization(ctx, visualizationData);
      }

      animationTime += animationSpeed;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [visualizationData, visualizationMode, animationSpeed, showClusters, showEmotions, showTopics]);

  const drawNetworkVisualization = (ctx: CanvasRenderingContext2D, data: FlowVisualizationData, time: number) => {
    const { nodes, edges, clusters } = data;
    
    // Draw clusters first (background)
    if (showClusters) {
      clusters.forEach(cluster => {
        const clusterNodes = nodes.filter(node => cluster.nodes.includes(node.id));
        if (clusterNodes.length > 0) {
          const avgX = clusterNodes.reduce((sum, node) => sum + node.position.x, 0) / clusterNodes.length;
          const avgY = clusterNodes.reduce((sum, node) => sum + node.position.y, 0) / clusterNodes.length;
          const radius = Math.max(50, clusterNodes.length * 20);
          
          ctx.beginPath();
          ctx.arc(avgX, avgY, radius, 0, 2 * Math.PI);
          ctx.fillStyle = cluster.color + '20';
          ctx.fill();
          ctx.strokeStyle = cluster.color + '60';
          ctx.stroke();
          
          // Cluster label
          ctx.fillStyle = cluster.color;
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(cluster.label, avgX, avgY - radius - 10);
        }
      });
    }

    // Draw edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.position.x, sourceNode.position.y);
        ctx.lineTo(targetNode.position.x, targetNode.position.y);
        ctx.strokeStyle = edge.color + (edge.animated ? Math.sin(time * 0.01).toString(16).substr(2, 2) : '80');
        ctx.lineWidth = edge.weight * 3;
        ctx.stroke();
        
        // Draw arrow
        const angle = Math.atan2(targetNode.position.y - sourceNode.position.y, targetNode.position.x - sourceNode.position.x);
        const arrowLength = 10;
        ctx.beginPath();
        ctx.moveTo(targetNode.position.x, targetNode.position.y);
        ctx.lineTo(
          targetNode.position.x - arrowLength * Math.cos(angle - Math.PI / 6),
          targetNode.position.y - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          targetNode.position.x - arrowLength * Math.cos(angle + Math.PI / 6),
          targetNode.position.y - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = edge.color;
        ctx.fill();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      if (node.type === 'emotion' && !showEmotions) return;
      if (node.type === 'topic' && !showTopics) return;
      
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, node.size, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Node label
      ctx.fillStyle = '#000000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.position.x, node.position.y + node.size + 15);
      
      // Pulsing animation for active nodes
      if (node.type === 'ai' || node.type === 'user') {
        const pulse = Math.sin(time * 0.02) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(node.position.x, node.position.y, node.size * pulse, 0, 2 * Math.PI);
        ctx.strokeStyle = node.color + '40';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  };

  const drawTimelineVisualization = (ctx: CanvasRenderingContext2D, data: FlowVisualizationData, time: number) => {
    const { timeline } = data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 50;
    const timelineHeight = height - 2 * padding;
    
    if (timeline.length === 0) return;
    
    // Draw timeline axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Calculate time range
    const minTime = Math.min(...timeline.map(entry => entry.timestamp.getTime()));
    const maxTime = Math.max(...timeline.map(entry => entry.timestamp.getTime()));
    const timeRange = maxTime - minTime;
    
    // Draw timeline entries
    timeline.forEach((entry, index) => {
      const x = padding + ((entry.timestamp.getTime() - minTime) / timeRange) * (width - 2 * padding);
      const y = height - padding - (entry.intensity * timelineHeight);
      
      // Draw entry point
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = getTimelineColor(entry.type);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw duration bar
      if (entry.duration > 0) {
        const barWidth = (entry.duration / 5000) * 50; // Scale duration to pixels
        ctx.fillStyle = getTimelineColor(entry.type) + '60';
        ctx.fillRect(x - barWidth / 2, y - 3, barWidth, 6);
      }
      
      // Draw event label
      ctx.fillStyle = '#000000';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(entry.event, x, y - 15);
    });
    
    // Draw time labels
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const timePoint = minTime + (timeRange * i / 5);
      const x = padding + (i / 5) * (width - 2 * padding);
      ctx.fillText(format(new Date(timePoint), 'HH:mm'), x, height - padding + 20);
    }
  };

  const drawHeatmapVisualization = (ctx: CanvasRenderingContext2D, data: FlowVisualizationData) => {
    const { heatmap } = data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 60;
    const cellWidth = (width - 2 * padding) / heatmap.timeSlots.length;
    const cellHeight = (height - 2 * padding) / heatmap.topics.length;
    
    // Draw heatmap cells
    heatmap.values.forEach((row, timeIndex) => {
      row.forEach((value, topicIndex) => {
        const x = padding + timeIndex * cellWidth;
        const y = padding + topicIndex * cellHeight;
        const intensity = value / heatmap.maxValue;
        
        ctx.fillStyle = `rgba(59, 130, 246, ${intensity})`;
        ctx.fillRect(x, y, cellWidth, cellHeight);
        
        // Draw cell border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
        
        // Draw value text
        if (value > 0) {
          ctx.fillStyle = intensity > 0.5 ? '#ffffff' : '#000000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(value.toString(), x + cellWidth / 2, y + cellHeight / 2 + 4);
        }
      });
    });
    
    // Draw axis labels
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Time slots (x-axis)
    heatmap.timeSlots.forEach((slot, index) => {
      const x = padding + index * cellWidth + cellWidth / 2;
      ctx.fillText(slot, x, padding - 10);
    });
    
    // Topics (y-axis)
    ctx.textAlign = 'right';
    heatmap.topics.forEach((topic, index) => {
      const y = padding + index * cellHeight + cellHeight / 2;
      ctx.fillText(topic, padding - 10, y + 4);
    });
  };

  const getTimelineColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'message': '#3B82F6',
      'emotion': '#10B981',
      'topic': '#F59E0B',
      'provider_switch': '#EF4444'
    };
    return colors[type] || '#6B7280';
  };

  const handleExportData = () => {
    if (!visualizationData) return;
    
    const dataStr = JSON.stringify(visualizationData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `conversation-flow-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleShare = () => {
    if (navigator.share && visualizationData) {
      navigator.share({
        title: 'Conversation Flow Visualization',
        text: `Flow analysis with ${visualizationData.nodes.length} nodes and ${visualizationData.edges.length} connections`,
        url: window.location.href
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Conversation Flow Visualization</h2>
        <p className="text-sm text-muted-foreground">
          Interactive visualization of conversation patterns, AI decision-making processes, and real-time analytics.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Visualization Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Conversation</label>
              <select
                value={selectedConversation || 'all'}
                onChange={(e) => setSelectedConversation(e.target.value === 'all' ? null : parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Conversations</option>
                {conversations.map((conv) => (
                  <option key={conv.id} value={conv.id}>
                    {conv.title || `Conversation ${conv.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Visualization Mode</label>
              <select
                value={visualizationMode}
                onChange={(e) => setVisualizationMode(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="network">Network Graph</option>
                <option value="timeline">Timeline View</option>
                <option value="heatmap">Heatmap</option>
                <option value="metrics">Metrics Dashboard</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Animation Speed</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isRealtime}
                  onCheckedChange={setIsRealtime}
                />
                <label className="text-sm">Real-time Updates</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showClusters}
                  onCheckedChange={setShowClusters}
                />
                <label className="text-sm">Show Clusters</label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={showEmotions}
                onCheckedChange={setShowEmotions}
              />
              <label className="text-sm">Show Emotions</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={showTopics}
                onCheckedChange={setShowTopics}
              />
              <label className="text-sm">Show Topics</label>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualization Canvas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {visualizationMode === 'network' && 'Network Graph'}
            {visualizationMode === 'timeline' && 'Timeline View'}
            {visualizationMode === 'heatmap' && 'Activity Heatmap'}
            {visualizationMode === 'metrics' && 'Metrics Dashboard'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visualizationMode !== 'metrics' ? (
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-96 border rounded-lg bg-gray-50 dark:bg-gray-900"
                style={{ maxHeight: '600px' }}
              />
              
              {/* Legend */}
              <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
                <h4 className="font-medium mb-2">Legend</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>AI Response</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>User Message</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Topic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Emotion</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Metrics Dashboard
            <div className="space-y-6">
              {metrics && (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{metrics.totalFlows}</div>
                      <div className="text-sm text-muted-foreground">Total Flows</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{metrics.averageResponseTime.toFixed(0)}ms</div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{(metrics.engagementScore * 100).toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Engagement Score</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{(metrics.flowEfficiency * 100).toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Flow Efficiency</div>
                    </div>
                  </div>

                  {/* AI Provider Usage */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">AI Provider Usage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(metrics.aiProviderUsage).map(([provider, count]) => (
                            <div key={provider} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  provider === 'online' ? 'bg-blue-500' : 
                                  provider === 'offline' ? 'bg-green-500' : 
                                  'bg-red-500'
                                }`}></div>
                                <span className="capitalize">{provider}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${(count / metrics.totalFlows) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Emotional Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(metrics.emotionalDistribution).map(([emotion, count]) => (
                            <div key={emotion} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  emotion === 'positive' ? 'bg-green-500' : 
                                  emotion === 'negative' ? 'bg-red-500' : 
                                  'bg-gray-500'
                                }`}></div>
                                <span className="capitalize">{emotion}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500 transition-all duration-500"
                                    style={{ width: `${(count / metrics.totalFlows) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Common Patterns */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Most Common Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {metrics.mostCommonPatterns.slice(0, 3).map((pattern, index) => (
                          <div key={pattern.patternId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <div className="font-medium capitalize">{pattern.patternType.replace('_', ' ')}</div>
                              <div className="text-sm text-muted-foreground">
                                Avg Length: {pattern.averageLength} • Success Rate: {(pattern.successRate * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{pattern.frequency}</div>
                              <div className="text-sm text-muted-foreground">occurrences</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Real-time Analysis Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isRealtime ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div>
                <p className="font-medium">
                  {isRealtime ? 'Real-time Analysis Active' : 'Real-time Analysis Paused'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRealtime 
                    ? 'Continuously analyzing conversation patterns and updating visualizations' 
                    : 'Analysis paused - enable real-time updates to see live data'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isRealtime ? "default" : "secondary"}>
                {isRealtime ? 'Live' : 'Paused'}
              </Badge>
              {visualizationData && (
                <Badge variant="outline">
                  {visualizationData.nodes.length} nodes • {visualizationData.edges.length} edges
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}