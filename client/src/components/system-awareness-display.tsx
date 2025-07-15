import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Folder, 
  Activity, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Eye,
  Brain,
  Zap
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
}

interface SystemArchitecture {
  overview: string;
}

export function SystemAwarenessDisplay() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemArchitecture, setSystemArchitecture] = useState<SystemArchitecture | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSystemData = async () => {
    setIsLoading(true);
    try {
      const [healthResponse, architectureResponse] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/system/architecture')
      ]);

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setSystemHealth(health);
      }

      if (architectureResponse.ok) {
        const architecture = await architectureResponse.json();
        setSystemArchitecture(architecture);
      }
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

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
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5" />
          System Self-Awareness
        </h2>
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

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemHealth ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(systemHealth.status)}
                    <span className={`font-medium ${getStatusColor(systemHealth.status)}`}>
                      {systemHealth.status.toUpperCase()}
                    </span>
                  </div>

                  {systemHealth.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600">Issues Detected:</h4>
                      <ul className="space-y-1">
                        {systemHealth.issues.map((issue, index) => (
                          <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {systemHealth.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-600">Recommendations:</h4>
                      <ul className="space-y-1">
                        {systemHealth.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                            <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Loading system health...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                System Architecture Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemArchitecture ? (
                <ScrollArea className="h-96">
                  <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    {systemArchitecture.overview}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Folder className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Loading architecture overview...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Self-Modification Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Analysis Capabilities</h4>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      File Structure Analysis
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      System Health Monitoring
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      Dependency Analysis
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Modification Capabilities</h4>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      Service Creation
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Code Generation
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Self-Repair
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Self-Awareness Features
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Complete understanding of own architecture and file structure</li>
                  <li>• Ability to read, analyze, and modify own code</li>
                  <li>• Real-time system health monitoring and diagnostics</li>
                  <li>• Autonomous service creation and capability extension</li>
                  <li>• Self-repair mechanisms for system issues</li>
                  <li>• Dynamic personality and behavior modification</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}