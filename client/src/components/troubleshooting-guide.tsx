import { useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, Zap, Settings, Database, Speaker, Mic, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  severity: 'low' | 'medium' | 'high';
  action?: () => Promise<void>;
  actionLabel?: string;
  status?: 'pending' | 'checking' | 'success' | 'error';
}

export function TroubleshootingGuide() {
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'general'>('general');
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticsResults, setDiagnosticsResults] = useState<Record<string, 'success' | 'error' | 'warning'>>({});

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    const results: Record<string, 'success' | 'error' | 'warning'> = {};

    try {
      // Check WebSocket connection
      const wsTest = await new Promise<boolean>((resolve) => {
        const ws = new WebSocket(`ws://${window.location.host}/ws`);
        const timeout = setTimeout(() => {
          resolve(false);
        }, 3000);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };
        
        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
      
      results.websocket = wsTest ? 'success' : 'error';

      // Check AI service
      const aiResponse = await fetch('/api/ai-config/status');
      results.ai = aiResponse.ok ? 'success' : 'error';

      // Check TTS service
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test',
          voice: 'nova',
          model: 'llama3-8b'
        })
      });
      results.tts = ttsResponse.ok ? 'success' : 'error';

      // Check database connection
      const dbResponse = await fetch('/api/conversations');
      results.database = dbResponse.ok ? 'success' : 'error';

      // Check browser capabilities
      results.audio = typeof Audio !== 'undefined' ? 'success' : 'error';
      results.microphone = navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? 'success' : 'warning';

    } catch (error) {
      console.error('Diagnostics error:', error);
    }

    setDiagnosticsResults(results);
    setIsRunningDiagnostics(false);
  };

  const generalSteps: TroubleshootingStep[] = [
    {
      id: 'refresh',
      title: 'Refresh the Page',
      description: 'Sometimes a simple refresh resolves connection issues.',
      icon: <RefreshCw className="h-5 w-5" />,
      severity: 'low',
      action: () => Promise.resolve(window.location.reload()),
      actionLabel: 'Refresh Now'
    },
    {
      id: 'connection',
      title: 'Check Internet Connection',
      description: 'Ensure you have a stable internet connection.',
      icon: <Wifi className="h-5 w-5" />,
      severity: 'medium'
    },
    {
      id: 'browser',
      title: 'Try Different Browser',
      description: 'Some browsers may have compatibility issues. Try Chrome, Firefox, or Safari.',
      icon: <Settings className="h-5 w-5" />,
      severity: 'medium'
    },
    {
      id: 'cache',
      title: 'Clear Browser Cache',
      description: 'Outdated cache files can cause problems. Clear your browser cache and cookies.',
      icon: <Database className="h-5 w-5" />,
      severity: 'low'
    }
  ];

  const chatSteps: TroubleshootingStep[] = [
    {
      id: 'websocket',
      title: 'WebSocket Connection',
      description: 'Check if real-time messaging is working properly.',
      icon: <Zap className="h-5 w-5" />,
      severity: 'high',
      status: diagnosticsResults.websocket === 'success' ? 'success' : 
              diagnosticsResults.websocket === 'error' ? 'error' : 'pending'
    },
    {
      id: 'ai-service',
      title: 'AI Service Status',
      description: 'Verify that the AI engine is responding correctly.',
      icon: <CheckCircle className="h-5 w-5" />,
      severity: 'high',
      status: diagnosticsResults.ai === 'success' ? 'success' : 
              diagnosticsResults.ai === 'error' ? 'error' : 'pending'
    },
    {
      id: 'new-chat',
      title: 'Start New Conversation',
      description: 'Create a fresh conversation if the current one seems stuck.',
      icon: <RefreshCw className="h-5 w-5" />,
      severity: 'medium',
      action: async () => {
        // Trigger new chat creation
        window.dispatchEvent(new CustomEvent('create-new-chat'));
      },
      actionLabel: 'New Chat'
    }
  ];

  const voiceSteps: TroubleshootingStep[] = [
    {
      id: 'microphone',
      title: 'Microphone Permission',
      description: 'Allow microphone access for voice input.',
      icon: <Mic className="h-5 w-5" />,
      severity: 'high',
      status: diagnosticsResults.microphone === 'success' ? 'success' : 
              diagnosticsResults.microphone === 'warning' ? 'error' : 'pending',
      action: async () => {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
          console.error('Microphone permission denied:', error);
        }
      },
      actionLabel: 'Request Permission'
    },
    {
      id: 'speaker',
      title: 'Speaker/Audio Output',
      description: 'Ensure your speakers or headphones are working.',
      icon: <Speaker className="h-5 w-5" />,
      severity: 'medium',
      status: diagnosticsResults.audio === 'success' ? 'success' : 
              diagnosticsResults.audio === 'error' ? 'error' : 'pending'
    },
    {
      id: 'tts-service',
      title: 'Text-to-Speech Service',
      description: 'Check if the voice synthesis system is operational.',
      icon: <Zap className="h-5 w-5" />,
      severity: 'high',
      status: diagnosticsResults.tts === 'success' ? 'success' : 
              diagnosticsResults.tts === 'error' ? 'error' : 'pending'
    },
    {
      id: 'volume',
      title: 'Check Volume Levels',
      description: 'Make sure your system volume and browser volume are turned up.',
      icon: <Speaker className="h-5 w-5" />,
      severity: 'low'
    }
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'checking': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepsForTab = () => {
    switch (activeTab) {
      case 'chat': return chatSteps;
      case 'voice': return voiceSteps;
      default: return generalSteps;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Connection Troubleshooting
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Having trouble with Lumen QI? Follow these steps to resolve common issues.
        </p>
      </div>

      {/* Quick Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Quick System Check
          </CardTitle>
          <CardDescription>
            Run a quick diagnostic to identify potential issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunningDiagnostics}
            className="w-full"
          >
            {isRunningDiagnostics ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Run System Check
              </>
            )}
          </Button>
          
          {Object.keys(diagnosticsResults).length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(diagnosticsResults).map(([key, status]) => (
                <Badge key={key} variant="outline" className={getStatusColor(status)}>
                  {key}: {status}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Troubleshooting Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'general', label: 'General' },
          { id: 'chat', label: 'Chat Issues' },
          { id: 'voice', label: 'Voice Issues' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Troubleshooting Steps */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {getStepsForTab().map((step) => (
          <Card key={step.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    step.severity === 'high' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                    step.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                    'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  }`}>
                    {step.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
                
                {step.status && (
                  <Badge variant="outline" className={getStatusColor(step.status)}>
                    {step.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            {step.action && (
              <CardContent>
                <Button
                  onClick={step.action}
                  variant="outline"
                  size="sm"
                >
                  {step.actionLabel || 'Fix This'}
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Contact Support */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Still having trouble? The troubleshooting guide covers the most common issues. 
          Try refreshing the page or restarting your browser if problems persist.
        </AlertDescription>
      </Alert>
    </div>
  );
}