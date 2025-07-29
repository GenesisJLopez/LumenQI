import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Copy, Download, Eye, Code, Globe, Database, Zap } from 'lucide-react';

interface GeneratedCode {
  files: Array<{
    path: string;
    content: string;
    type: 'component' | 'style' | 'config' | 'script' | 'markup';
  }>;
  instructions: string[];
  dependencies: string[];
  deploymentNotes: string;
}

interface CodeGeneratorProps {
  onCodeGenerated?: (code: GeneratedCode) => void;
}

export function CodeGenerator({ onCodeGenerated }: CodeGeneratorProps) {
  const [projectType, setProjectType] = useState<'website' | 'application' | 'api' | 'database'>('website');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('React');
  const [features, setFeatures] = useState('');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [activeFile, setActiveFile] = useState(0);
  const { toast } = useToast();

  const generateCodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = `/api/code/${projectType}`;
      return apiRequest(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: (result) => {
      setGeneratedCode(result);
      setActiveFile(0);
      onCodeGenerated?.(result);
      toast({
        title: "Code Generated Successfully! 🌟",
        description: "Lumen QI has crafted your code with cosmic precision.",
      });
    },
    onError: (error) => {
      console.error('Code generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Lumen QI encountered an issue while generating your code.",
        variant: "destructive"
      });
    }
  });

  const handleGenerate = () => {
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe what you'd like Lumen QI to create.",
        variant: "destructive"
      });
      return;
    }

    const featuresList = features ? features.split(',').map(f => f.trim()).filter(Boolean) : [];
    
    generateCodeMutation.mutate({
      description,
      framework,
      features: featuresList
    });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard.",
    });
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'component': return <Code className="w-4 h-4" />;
      case 'style': return <Eye className="w-4 h-4" />;
      case 'config': return <Database className="w-4 h-4" />;
      case 'markup': return <Globe className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Lumen QI Code Generator
          </CardTitle>
          <CardDescription className="text-gray-300">
            Harness the power of quantum intelligence to create applications, websites, and systems
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Project Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project-type">Project Type</Label>
              <Select value={projectType} onValueChange={(value: any) => setProjectType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="application">Application</SelectItem>
                  <SelectItem value="api">API Endpoint</SelectItem>
                  <SelectItem value="database">Database Schema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="framework">Framework</Label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="React">React</SelectItem>
                  <SelectItem value="Next.js">Next.js</SelectItem>
                  <SelectItem value="Vue.js">Vue.js</SelectItem>
                  <SelectItem value="Angular">Angular</SelectItem>
                  <SelectItem value="Svelte">Svelte</SelectItem>
                  <SelectItem value="Express.js">Express.js</SelectItem>
                  <SelectItem value="FastAPI">FastAPI</SelectItem>
                  <SelectItem value="Django">Django</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your project in detail. What should it do? What features should it have? The more specific, the better Lumen QI can help you."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="features">Features (comma-separated)</Label>
            <Input
              id="features"
              placeholder="e.g., user authentication, real-time chat, responsive design, dark mode"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={generateCodeMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {generateCodeMutation.isPending ? 'Generating...' : 'Generate Code'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Code Display */}
      {generatedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Generated Code
            </CardTitle>
            <CardDescription>
              {generatedCode.files.length} files generated • {generatedCode.dependencies.length} dependencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="files" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="deploy">Deploy</TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* File List */}
                  <div className="lg:col-span-1">
                    <h4 className="font-semibold mb-2">Files</h4>
                    <ScrollArea className="h-96">
                      <div className="space-y-1">
                        {generatedCode.files.map((file, index) => (
                          <Button
                            key={index}
                            variant={activeFile === index ? "default" : "ghost"}
                            className="w-full justify-start text-left h-auto p-3"
                            onClick={() => setActiveFile(index)}
                          >
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.type)}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{file.path}</div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {file.type}
                                </Badge>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* File Content */}
                  <div className="lg:col-span-3">
                    {generatedCode.files[activeFile] && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{generatedCode.files[activeFile].path}</h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(generatedCode.files[activeFile].content)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFile(generatedCode.files[activeFile].path, generatedCode.files[activeFile].content)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <ScrollArea className="h-96">
                          <pre className="text-sm bg-gray-900 p-4 rounded-lg overflow-x-auto">
                            <code>{generatedCode.files[activeFile].content}</code>
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="setup" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dependencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {generatedCode.dependencies.map((dep, index) => (
                            <Badge key={index} variant="secondary">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Setup Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <ol className="list-decimal list-inside space-y-2">
                          {generatedCode.instructions.map((instruction, index) => (
                            <li key={index} className="text-sm">{instruction}</li>
                          ))}
                        </ol>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="deploy" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deployment Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm whitespace-pre-wrap">
                      {generatedCode.deploymentNotes}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}