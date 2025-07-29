import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Code, Play, FileText, Download, Copy, Zap, Bug, Lightbulb, Terminal, Database, Globe, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeProject {
  id: string;
  name: string;
  description: string;
  type: 'website' | 'app' | 'api' | 'database' | 'mobile' | 'desktop';
  language: string;
  framework: string;
  files: CodeFile[];
  createdAt: string;
}

interface CodeFile {
  name: string;
  content: string;
  language: string;
  type: 'component' | 'service' | 'config' | 'style' | 'test' | 'documentation';
}

interface CodeAnalysis {
  issues: string[];
  suggestions: string[];
  complexity: number;
  performance: string[];
  security: string[];
  bestPractices: string[];
}

export function CodeAssistant() {
  const [activeTab, setActiveTab] = useState<'generate' | 'analyze' | 'debug' | 'projects'>('generate');
  const [projectType, setProjectType] = useState<string>('website');
  const [language, setLanguage] = useState<string>('javascript');
  const [framework, setFramework] = useState<string>('react');
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [codeInput, setCodeInput] = useState<string>('');
  const [currentProject, setCurrentProject] = useState<CodeProject | null>(null);
  const [projects, setProjects] = useState<CodeProject[]>([]);
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string>('');
  
  const { toast } = useToast();

  const generateCode = async () => {
    if (!projectName.trim() || !projectDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide project name and description",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/code/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          description: projectDescription,
          type: projectType,
          language,
          framework,
          requirements: {
            responsive: true,
            accessible: true,
            optimized: true,
            tested: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const project: CodeProject = await response.json();
      
      setCurrentProject(project);
      setProjects(prev => [project, ...prev]);
      
      toast({
        title: "Code Generated Successfully",
        description: `Created ${project.files.length} files for ${project.name}`,
      });
    } catch (err) {
      console.error('Code generation error:', err);
      toast({
        title: "Generation Error",
        description: "Failed to generate code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeCode = async () => {
    if (!codeInput.trim()) {
      toast({
        title: "No Code to Analyze",
        description: "Please enter some code to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/code/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeInput,
          language,
          framework
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const analysisResult: CodeAnalysis = await response.json();
      
      setAnalysis(analysisResult);
      
      toast({
        title: "Code Analysis Complete",
        description: `Found ${analysisResult.issues.length} issues and ${analysisResult.suggestions.length} suggestions`,
      });
    } catch (err) {
      console.error('Code analysis error:', err);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const debugCode = async () => {
    if (!codeInput.trim()) {
      toast({
        title: "No Code to Debug",
        description: "Please enter some code to debug",
        variant: "destructive",
      });
      return;
    }

    setIsDebugging(true);
    setDebugOutput('');
    
    try {
      const response = await fetch('/api/code/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeInput,
          language,
          framework,
          errorDescription: 'Find and fix any bugs or issues'
        })
      });

      if (!response.ok) {
        throw new Error(`Debugging failed: ${response.status}`);
      }

      const debugResult = await response.json();
      
      setDebugOutput(debugResult.fixedCode || debugResult.suggestions || 'No issues found');
      
      toast({
        title: "Debug Complete",
        description: "Code has been analyzed and fixed",
      });
    } catch (err) {
      console.error('Code debugging error:', err);
      toast({
        title: "Debug Error",
        description: "Failed to debug code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Code has been copied to clipboard",
    });
  };

  const downloadProject = (project: CodeProject) => {
    const zip = {
      name: project.name,
      files: project.files.map(file => ({
        name: file.name,
        content: file.content
      }))
    };
    
    const dataStr = JSON.stringify(zip, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${project.name}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'website': return <Globe className="w-4 h-4" />;
      case 'app': return <Zap className="w-4 h-4" />;
      case 'api': return <Database className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'desktop': return <Terminal className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Code Assistant
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Full-stack development capabilities with code generation, analysis, debugging, and project management
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">
            <Code className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="analyze">
            <Lightbulb className="w-4 h-4 mr-2" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="debug">
            <Bug className="w-4 h-4 mr-2" />
            Debug
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FileText className="w-4 h-4 mr-2" />
            Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Code Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Project Type
                  </label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="app">Web App</SelectItem>
                      <SelectItem value="api">REST API</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="mobile">Mobile App</SelectItem>
                      <SelectItem value="desktop">Desktop App</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Language
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                      <SelectItem value="php">PHP</SelectItem>
                      <SelectItem value="ruby">Ruby</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Framework
                  </label>
                  <Select value={framework} onValueChange={setFramework}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="vue">Vue.js</SelectItem>
                      <SelectItem value="angular">Angular</SelectItem>
                      <SelectItem value="svelte">Svelte</SelectItem>
                      <SelectItem value="nextjs">Next.js</SelectItem>
                      <SelectItem value="express">Express.js</SelectItem>
                      <SelectItem value="django">Django</SelectItem>
                      <SelectItem value="flask">Flask</SelectItem>
                      <SelectItem value="laravel">Laravel</SelectItem>
                      <SelectItem value="rails">Ruby on Rails</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Project Name
                </label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Project Description
                </label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe what you want to build in detail..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={generateCode}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4 mr-2" />
                    Generate Project
                  </>
                )}
              </Button>

              {currentProject && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getProjectIcon(currentProject.type)}
                        <span className="ml-2">{currentProject.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadProject(currentProject)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {currentProject.description}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{currentProject.language}</Badge>
                        <Badge variant="secondary">{currentProject.framework}</Badge>
                        <Badge variant="secondary">{currentProject.files.length} files</Badge>
                      </div>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {currentProject.files.map((file, index) => (
                            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{file.name}</span>
                                <div className="flex space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {file.type}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(file.content)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <pre className="text-xs text-gray-600 dark:text-gray-400 max-h-20 overflow-y-auto">
                                {file.content.substring(0, 200)}...
                              </pre>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Code Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Language
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                      <SelectItem value="php">PHP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Framework
                  </label>
                  <Select value={framework} onValueChange={setFramework}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="vue">Vue.js</SelectItem>
                      <SelectItem value="angular">Angular</SelectItem>
                      <SelectItem value="express">Express.js</SelectItem>
                      <SelectItem value="django">Django</SelectItem>
                      <SelectItem value="flask">Flask</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Code to Analyze
                </label>
                <Textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Paste your code here for analysis..."
                  rows={8}
                />
              </div>

              <Button 
                onClick={analyzeCode}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Code...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Analyze Code
                  </>
                )}
              </Button>

              {analysis && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {analysis.complexity}
                          </div>
                          <div className="text-sm text-gray-600">Complexity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {analysis.issues.length}
                          </div>
                          <div className="text-sm text-gray-600">Issues</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {analysis.suggestions.length}
                          </div>
                          <div className="text-sm text-gray-600">Suggestions</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        {analysis.issues.length > 0 && (
                          <div>
                            <h4 className="font-medium text-red-600 mb-2">Issues Found</h4>
                            <ul className="space-y-1">
                              {analysis.issues.map((issue, index) => (
                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                  • {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.suggestions.length > 0 && (
                          <div>
                            <h4 className="font-medium text-green-600 mb-2">Suggestions</h4>
                            <ul className="space-y-1">
                              {analysis.suggestions.map((suggestion, index) => (
                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                  • {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.performance.length > 0 && (
                          <div>
                            <h4 className="font-medium text-blue-600 mb-2">Performance</h4>
                            <ul className="space-y-1">
                              {analysis.performance.map((perf, index) => (
                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                  • {perf}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.security.length > 0 && (
                          <div>
                            <h4 className="font-medium text-purple-600 mb-2">Security</h4>
                            <ul className="space-y-1">
                              {analysis.security.map((sec, index) => (
                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                  • {sec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bug className="w-5 h-5 mr-2" />
                Code Debugging
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Language
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                      <SelectItem value="php">PHP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Framework
                  </label>
                  <Select value={framework} onValueChange={setFramework}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="vue">Vue.js</SelectItem>
                      <SelectItem value="angular">Angular</SelectItem>
                      <SelectItem value="express">Express.js</SelectItem>
                      <SelectItem value="django">Django</SelectItem>
                      <SelectItem value="flask">Flask</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Code to Debug
                </label>
                <Textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Paste your code here for debugging..."
                  rows={8}
                />
              </div>

              <Button 
                onClick={debugCode}
                disabled={isDebugging}
                className="w-full"
              >
                {isDebugging ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                    Debugging Code...
                  </>
                ) : (
                  <>
                    <Bug className="w-4 h-4 mr-2" />
                    Debug & Fix Code
                  </>
                )}
              </Button>

              {debugOutput && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Debug Results
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(debugOutput)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                      {debugOutput}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Generated Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No projects generated yet. Create your first project in the Generate tab.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {getProjectIcon(project.type)}
                            <div>
                              <h4 className="font-medium">{project.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {project.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentProject(project)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadProject(project)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{project.language}</Badge>
                          <Badge variant="secondary">{project.framework}</Badge>
                          <Badge variant="secondary">{project.files.length} files</Badge>
                          <Badge variant="outline">{project.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}