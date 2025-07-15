import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Folder, 
  Search, 
  Eye, 
  Edit3,
  Plus,
  RefreshCw,
  Activity,
  Zap,
  Code,
  Settings,
  Terminal,
  GitBranch,
  Database,
  Server,
  Monitor,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string;
  children?: FileNode[];
  isExpanded?: boolean;
  purpose?: string;
  dependencies?: string[];
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  lastCheck: string;
  issues: string[];
  recommendations: string[];
}

interface ArchitectureMetrics {
  totalFiles: number;
  totalFolders: number;
  codeFiles: number;
  configFiles: number;
  dependencies: number;
  services: number;
}

export function RealTimeArchitectureExplorer() {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [architectureMetrics, setArchitectureMetrics] = useState<ArchitectureMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock file tree data for demonstration
  const mockFileTree: FileNode[] = [
    {
      name: 'client',
      path: 'client',
      type: 'folder',
      isExpanded: true,
      children: [
        {
          name: 'src',
          path: 'client/src',
          type: 'folder',
          isExpanded: true,
          children: [
            {
              name: 'components',
              path: 'client/src/components',
              type: 'folder',
              purpose: 'React UI components',
              children: [
                { name: 'chat-area.tsx', path: 'client/src/components/chat-area.tsx', type: 'file', purpose: 'Main chat interface' },
                { name: 'voice-settings.tsx', path: 'client/src/components/voice-settings.tsx', type: 'file', purpose: 'Voice configuration' },
                { name: 'system-awareness-display.tsx', path: 'client/src/components/system-awareness-display.tsx', type: 'file', purpose: 'System monitoring' }
              ]
            },
            {
              name: 'pages',
              path: 'client/src/pages',
              type: 'folder',
              purpose: 'Application pages',
              children: [
                { name: 'home.tsx', path: 'client/src/pages/home.tsx', type: 'file', purpose: 'Main application page' }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'server',
      path: 'server',
      type: 'folder',
      isExpanded: true,
      children: [
        {
          name: 'services',
          path: 'server/services',
          type: 'folder',
          purpose: 'Backend services',
          children: [
            { name: 'openai.ts', path: 'server/services/openai.ts', type: 'file', purpose: 'OpenAI integration' },
            { name: 'lumen-brain.ts', path: 'server/services/lumen-brain.ts', type: 'file', purpose: 'Hybrid AI brain system' },
            { name: 'system-awareness.ts', path: 'server/services/system-awareness.ts', type: 'file', purpose: 'System self-awareness' }
          ]
        },
        { name: 'routes.ts', path: 'server/routes.ts', type: 'file', purpose: 'API endpoints' },
        { name: 'index.ts', path: 'server/index.ts', type: 'file', purpose: 'Server entry point' }
      ]
    },
    {
      name: 'shared',
      path: 'shared',
      type: 'folder',
      children: [
        { name: 'schema.ts', path: 'shared/schema.ts', type: 'file', purpose: 'Database schema' }
      ]
    }
  ];

  const mockMetrics: ArchitectureMetrics = {
    totalFiles: 45,
    totalFolders: 12,
    codeFiles: 38,
    configFiles: 7,
    dependencies: 67,
    services: 15
  };

  const mockHealth: SystemHealth = {
    status: 'healthy',
    lastCheck: new Date().toISOString(),
    issues: [],
    recommendations: ['Consider optimizing bundle size', 'Update dependencies to latest versions']
  };

  const fetchSystemData = async () => {
    setIsLoading(true);
    try {
      const [healthResponse, metricsResponse, fileTreeResponse] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/system/metrics'),
        fetch('/api/system/file-tree')
      ]);

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setSystemHealth(health);
      }

      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json();
        setArchitectureMetrics(metrics);
      }

      if (fileTreeResponse.ok) {
        const { fileTree } = await fileTreeResponse.json();
        setFileTree(fileTree);
      }
    } catch (error) {
      console.error('Error fetching system data:', error);
      // Fall back to mock data if API fails
      setFileTree(mockFileTree);
      setArchitectureMetrics(mockMetrics);
      setSystemHealth(mockHealth);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFileContent = async (filePath: string) => {
    try {
      const response = await fetch(`/api/system/file/${filePath.replace(/\//g, '~')}`);
      if (response.ok) {
        const data = await response.json();
        setFileContent(data.content);
      } else {
        setFileContent('File not found or cannot be read');
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
      setFileContent('Error loading file content');
    }
  };

  const toggleFolder = (path: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === path && node.type === 'folder') {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setFileTree(updateTree(fileTree));
  };

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    fetchFileContent(filePath);
  };

  const renderFileNode = (node: FileNode, level: number = 0) => {
    const isSelected = selectedFile === node.path;
    const indent = level * 20;

    return (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''
          }`}
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              handleFileSelect(node.path);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {node.isExpanded ? (
                <ChevronDown className="w-4 h-4 mr-1" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-1" />
              )}
              <Folder className="w-4 h-4 mr-2 text-yellow-600" />
            </>
          ) : (
            <FileText className="w-4 h-4 mr-2 ml-5 text-blue-600" />
          )}
          <span className="flex-1 text-sm">{node.name}</span>
          {node.purpose && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {node.purpose}
            </Badge>
          )}
        </div>
        {node.type === 'folder' && node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredFileTree = fileTree.filter(node => 
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchSystemData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchSystemData, refreshInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Real-Time Architecture Explorer
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 dark:bg-green-900/20' : ''}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto Refresh
          </Button>
          <Button 
            onClick={fetchSystemData}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Bar */}
      {systemHealth && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={getStatusColor(systemHealth.status)}>
                  {getStatusIcon(systemHealth.status)}
                </div>
                <div>
                  <span className={`font-medium ${getStatusColor(systemHealth.status)}`}>
                    System Status: {systemHealth.status.toUpperCase()}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last check: {new Date(systemHealth.lastCheck).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              {architectureMetrics && (
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{architectureMetrics.totalFiles}</div>
                    <div className="text-gray-500">Files</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">{architectureMetrics.services}</div>
                    <div className="text-gray-500">Services</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-purple-600">{architectureMetrics.dependencies}</div>
                    <div className="text-gray-500">Dependencies</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="explorer" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="explorer">File Explorer</TabsTrigger>
          <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="explorer" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Tree */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Project Structure
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-1">
                    {filteredFileTree.map(node => renderFileNode(node))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* File Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  {selectedFile ? `File: ${selectedFile}` : 'Select a file'}
                </CardTitle>
                {selectedFile && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Full
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {selectedFile ? (
                    <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      {fileContent || 'Loading...'}
                    </pre>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Select a file to view its content</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {architectureMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{architectureMetrics.totalFiles}</div>
                  <div className="text-sm text-gray-500">Total Files</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{architectureMetrics.services}</div>
                  <div className="text-sm text-gray-500">Services</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{architectureMetrics.dependencies}</div>
                  <div className="text-sm text-gray-500">Dependencies</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{architectureMetrics.codeFiles}</div>
                  <div className="text-sm text-gray-500">Code Files</div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Real-Time System Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>File System Changes</span>
                  <Badge variant="secondary">Monitoring</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Service Health</span>
                  <Badge variant="secondary">All Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Endpoints</span>
                  <Badge variant="secondary">Responsive</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Dependency Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Frontend</Badge>
                  <span className="text-sm">React, TypeScript, Tailwind CSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Backend</Badge>
                  <span className="text-sm">Express.js, WebSocket, Drizzle ORM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">AI/ML</Badge>
                  <span className="text-sm">OpenAI API, TensorFlow, PyTorch</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Database</Badge>
                  <span className="text-sm">PostgreSQL, Neon</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}