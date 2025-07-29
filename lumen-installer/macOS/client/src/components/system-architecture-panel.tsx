import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  Cpu, 
  Database, 
  Activity, 
  Search,
  RefreshCw,
  Code,
  Edit,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  Trash2,
  Plus,
  Settings
} from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  children?: FileNode[];
  isExpanded?: boolean;
  purpose?: string;
}

interface SystemMetrics {
  totalFiles: number;
  totalFolders: number;
  codeFiles: number;
  configFiles: number;
  dependencies: number;
  services: number;
  lastUpdated: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
}

export const SystemArchitecturePanel: React.FC = () => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'explorer' | 'metrics' | 'health' | 'create'>('explorer');

  const fetchSystemData = async () => {
    setIsLoading(true);
    try {
      const [healthRes, metricsRes, treeRes] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/system/metrics'),
        fetch('/api/system/file-tree')
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (treeRes.ok) {
        const treeData = await treeRes.json();
        setFileTree(treeData.fileTree || []);
      }
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFileContent = async (filePath: string) => {
    try {
      const response = await fetch(`/api/system/file/${filePath.replace(/\//g, '~')}`);
      if (response.ok) {
        const data = await response.json();
        setFileContent(data.content || '');
        setEditedContent(data.content || '');
      }
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch('/api/system/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: selectedFile,
          content: editedContent
        })
      });

      if (response.ok) {
        setFileContent(editedContent);
        setIsEditing(false);
        await fetchSystemData(); // Refresh system data
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const createNewService = async () => {
    const serviceName = prompt('Enter service name:');
    const purpose = prompt('Enter service purpose:');
    
    if (!serviceName || !purpose) return;
    
    const basicCode = `/**
 * ${serviceName}
 * ${purpose}
 * 
 * Created by Lumen QI Self-Modification System
 * Date: ${new Date().toISOString()}
 */

export class ${serviceName} {
  constructor() {
    // Initialize service
  }

  async initialize() {
    // Service initialization logic
  }

  async process() {
    // Main service logic
  }
}

export const ${serviceName.toLowerCase()} = new ${serviceName}();`;

    try {
      const response = await fetch('/api/system/create-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName,
          purpose,
          code: basicCode
        })
      });

      if (response.ok) {
        await fetchSystemData(); // Refresh system data
      }
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes
      .filter(node => 
        searchTerm === '' || 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.path.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(node => (
        <div key={node.path} style={{ marginLeft: `${level * 16}px` }}>
          <div
            className={`flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
              selectedFile === node.path ? 'bg-blue-100 dark:bg-blue-900' : ''
            }`}
            onClick={() => {
              if (node.type === 'file') {
                setSelectedFile(node.path);
                loadFileContent(node.path);
              } else {
                // Toggle folder expansion
                const updateTree = (tree: FileNode[]): FileNode[] => {
                  return tree.map(n => {
                    if (n.path === node.path) {
                      return { ...n, isExpanded: !n.isExpanded };
                    }
                    if (n.children) {
                      return { ...n, children: updateTree(n.children) };
                    }
                    return n;
                  });
                };
                setFileTree(updateTree(fileTree));
              }
            }}
          >
            {node.type === 'folder' ? (
              node.isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span className="text-sm">{node.name}</span>
            {node.type === 'file' && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {node.size ? `${Math.round(node.size / 1024)}KB` : ''}
              </Badge>
            )}
          </div>
          {node.type === 'folder' && node.isExpanded && node.children && (
            <div>
              {renderFileTree(node.children, level + 1)}
            </div>
          )}
        </div>
      ));
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex space-x-2">
        <Button
          variant={activeTab === 'explorer' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('explorer')}
        >
          <Folder className="w-4 h-4 mr-2" />
          Explorer
        </Button>
        <Button
          variant={activeTab === 'metrics' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('metrics')}
        >
          <Activity className="w-4 h-4 mr-2" />
          Metrics
        </Button>
        <Button
          variant={activeTab === 'health' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('health')}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Health
        </Button>
        <Button
          variant={activeTab === 'create' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSystemData}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* File Explorer Tab */}
      {activeTab === 'explorer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                File Structure
              </CardTitle>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {renderFileTree(fileTree)}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                File Editor
                {selectedFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  </Button>
                )}
              </CardTitle>
              {selectedFile && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedFile}</p>
              )}
            </CardHeader>
            <CardContent>
              {selectedFile ? (
                <div className="space-y-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="font-mono text-sm min-h-80"
                        placeholder="Edit file content..."
                      />
                      <div className="flex gap-2">
                        <Button onClick={saveFile} size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedContent(fileContent);
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {fileContent}
                      </pre>
                    </ScrollArea>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 h-96 flex items-center justify-center">
                  <div>
                    <Eye className="w-8 h-8 mx-auto mb-2" />
                    <p>Select a file to view/edit</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalFiles}</div>
                <div className="text-sm text-gray-600">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.totalFolders}</div>
                <div className="text-sm text-gray-600">Folders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.codeFiles}</div>
                <div className="text-sm text-gray-600">Code Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.configFiles}</div>
                <div className="text-sm text-gray-600">Config Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.dependencies}</div>
                <div className="text-sm text-gray-600">Dependencies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{metrics.services}</div>
                <div className="text-sm text-gray-600">Services</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Tab */}
      {activeTab === 'health' && health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={health.status === 'healthy' ? 'default' : 'destructive'}
                  className="capitalize"
                >
                  {health.status}
                </Badge>
                <span className="text-sm text-gray-600">Overall Status</span>
              </div>
              
              {health.issues.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Issues:</h4>
                  <ul className="space-y-1">
                    {health.issues.map((issue, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {health.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {health.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Self-Modification Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Create New Service</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Create a new service module with automatic integration
                </p>
                <Button onClick={createNewService}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Service
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">System Capabilities</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Real-time file system monitoring and modification</li>
                  <li>• Autonomous service creation and integration</li>
                  <li>• Self-healing system diagnostics</li>
                  <li>• Dynamic architecture adaptation</li>
                  <li>• Code generation and optimization</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};