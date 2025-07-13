import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeGenerator } from '@/components/code-generator';
import { EmotionDisplay } from '@/components/emotion-display';
import { Activity, Brain, Cpu, HardDrive, Zap, Mic, Volume2, Code, Globe, Database } from 'lucide-react';

interface HardwareInfo {
  cpuCores: number;
  totalMemory: number;
  availableMemory: number;
  platform: string;
  currentUsage: {
    cpu: any;
    memory: any;
    uptime: number;
  };
}

interface MLMetrics {
  accuracy: number;
  loss: number;
  iterations: number;
  adaptationHistory: Array<{
    timestamp: number;
    loss: number;
    inputSize: number;
  }>;
}

interface QuantumInterfaceProps {
  onTTSRequest: (text: string, provider: 'wavenet' | 'polly') => void;
  onMLAdapt: (inputData: number[], feedback: number) => void;
  isElectron: boolean;
}

export function QuantumInterface({ onTTSRequest, onMLAdapt, isElectron }: QuantumInterfaceProps) {
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [mlMetrics, setMLMetrics] = useState<MLMetrics | null>(null);
  const [evolutionStatus, setEvolutionStatus] = useState('initializing');
  const [adaptationProgress, setAdaptationProgress] = useState(0);
  const [selectedTTSProvider, setSelectedTTSProvider] = useState<'wavenet' | 'polly'>('wavenet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [testInput, setTestInput] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isElectron && window.require) {
      const { ipcRenderer } = window.require('electron');
      
      // Get hardware information
      ipcRenderer.invoke('get-hardware-info').then((info: HardwareInfo) => {
        setHardwareInfo(info);
      });
      
      // Get ML metrics
      ipcRenderer.invoke('get-ml-metrics').then((metrics: MLMetrics) => {
        setMLMetrics(metrics);
      });
      
      // Set up hardware monitoring
      const interval = setInterval(() => {
        ipcRenderer.invoke('get-hardware-info').then(setHardwareInfo);
        ipcRenderer.invoke('get-ml-metrics').then(setMLMetrics);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isElectron]);

  useEffect(() => {
    if (canvasRef.current) {
      drawQuantumVisualization();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mlMetrics, hardwareInfo]);

  const drawQuantumVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw quantum field background
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.1)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw neural network nodes
    const nodeCount = 12;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Node connections
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `rgba(147, 51, 234, ${0.3 + (mlMetrics?.accuracy || 0) * 0.7})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Nodes
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${0.5 + (mlMetrics?.accuracy || 0) * 0.5})`;
      ctx.fill();
      
      // Pulsing effect
      const pulseSize = 4 + Math.sin(Date.now() * 0.005 + i) * 2;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(147, 51, 234, 0.3)';
      ctx.fill();
    }
    
    // Central quantum core
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(147, 51, 234, 0.8)';
    ctx.fill();
    
    // Animate
    animationRef.current = requestAnimationFrame(drawQuantumVisualization);
  };

  const handleTTSTest = async () => {
    if (!testInput.trim()) return;
    
    setIsProcessing(true);
    try {
      await onTTSRequest(testInput, selectedTTSProvider);
      setEvolutionStatus('evolving');
      setAdaptationProgress(prev => Math.min(prev + 10, 100));
    } catch (error) {
      console.error('TTS test failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMLAdaptation = async () => {
    const inputData = Array.from({ length: 100 }, () => Math.random());
    const feedback = Math.random();
    
    setIsProcessing(true);
    try {
      await onMLAdapt(inputData, feedback);
      setEvolutionStatus('adapting');
      setAdaptationProgress(prev => Math.min(prev + 15, 100));
    } catch (error) {
      console.error('ML adaptation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initializing': return 'bg-yellow-500';
      case 'evolving': return 'bg-blue-500';
      case 'adapting': return 'bg-purple-500';
      case 'optimized': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 rounded-xl border border-purple-500/20 overflow-y-auto h-full quantum-scroll">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Quantum Intelligence Core
        </h2>
        <p className="text-sm text-gray-400 mt-2">Advanced Self-Evolution & Hardware Optimization</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="evolution">Evolution</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="code">Code Gen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Neural Network Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Evolution Status:</span>
                    <Badge className={getStatusColor(evolutionStatus)}>
                      {evolutionStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Adaptation Progress:</span>
                    <span>{adaptationProgress}%</span>
                  </div>
                  <Progress value={adaptationProgress} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Quantum Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={200}
                  className="w-full h-auto border border-purple-500/20 rounded-lg"
                />
              </CardContent>
            </Card>
          </div>

          {mlMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Machine Learning Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {(mlMetrics.accuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {mlMetrics.loss.toFixed(4)}
                    </div>
                    <div className="text-sm text-gray-400">Loss</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {mlMetrics.iterations}
                    </div>
                    <div className="text-sm text-gray-400">Iterations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {mlMetrics.adaptationHistory.length}
                    </div>
                    <div className="text-sm text-gray-400">Adaptations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hardware" className="space-y-4">
          {hardwareInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    System Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 rounded-lg border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">CPU Cores</span>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{hardwareInfo.cpuCores}</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-3 rounded-lg border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Total Memory</span>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{formatBytes(hardwareInfo.totalMemory)}</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-3 rounded-lg border border-yellow-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Available Memory</span>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{formatBytes(hardwareInfo.availableMemory)}</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3 rounded-lg border border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Platform</span>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{hardwareInfo.platform}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 p-3 rounded-lg border border-red-500/20">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Memory Usage</span>
                        </div>
                        <span className="text-sm text-red-400 font-bold">
                          {((hardwareInfo.totalMemory - hardwareInfo.availableMemory) / hardwareInfo.totalMemory * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={(hardwareInfo.totalMemory - hardwareInfo.availableMemory) / hardwareInfo.totalMemory * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-3 rounded-lg border border-cyan-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">System Uptime</span>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {Math.floor(hardwareInfo.currentUsage.uptime / 3600)}h
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-3 rounded-lg border border-indigo-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Optimization Level</span>
                        </div>
                        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                          {adaptationProgress > 80 ? 'Optimal' : adaptationProgress > 50 ? 'Good' : 'Initializing'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Self-Evolution Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={handleMLAdaptation}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Adapting...' : 'Trigger ML Adaptation'}
                </Button>
                
                <div className="text-sm text-gray-400">
                  This will feed random data to the neural network and adapt based on feedback.
                  The system will automatically optimize hardware usage and learning parameters.
                </div>
                
                {mlMetrics && mlMetrics.adaptationHistory.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Recent Adaptations:</h4>
                    <div className="space-y-1">
                      {mlMetrics.adaptationHistory.slice(-3).map((adaptation, idx) => (
                        <div key={idx} className="text-sm flex justify-between">
                          <span>Loss: {adaptation.loss.toFixed(4)}</span>
                          <span>Input Size: {adaptation.inputSize}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <EmotionDisplay onEmotionChange={(emotion, adaptation) => {
            console.log('Emotion detected:', emotion, adaptation);
          }} />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Advanced Text-to-Speech
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={selectedTTSProvider === 'wavenet' ? 'default' : 'outline'}
                    onClick={() => setSelectedTTSProvider('wavenet')}
                  >
                    Google WaveNet
                  </Button>
                  <Button
                    variant={selectedTTSProvider === 'polly' ? 'default' : 'outline'}
                    onClick={() => setSelectedTTSProvider('polly')}
                  >
                    Amazon Polly
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Input:</label>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Enter text to synthesize with advanced TTS..."
                    className="w-full h-20 p-3 border border-purple-500/20 rounded-lg bg-gray-900 text-white"
                  />
                </div>
                
                <Button
                  onClick={handleTTSTest}
                  disabled={isProcessing || !testInput.trim()}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : `Test ${selectedTTSProvider === 'wavenet' ? 'WaveNet' : 'Polly'} TTS`}
                </Button>
                
                <div className="text-sm text-gray-400">
                  {selectedTTSProvider === 'wavenet' 
                    ? 'Using Google Cloud WaveNet for natural, human-like speech synthesis'
                    : 'Using Amazon Polly Neural voices for high-quality speech generation'
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Quantum Code Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-400 mb-4">
                Harness Lumen QI's advanced programming capabilities to generate applications, 
                websites, and systems with the same expertise as top developers.
              </div>
              <CodeGenerator 
                onCodeGenerated={(code) => {
                  console.log('Code generated:', code);
                  // Handle generated code (could save to files, preview, etc.)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}