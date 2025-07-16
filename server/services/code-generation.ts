import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CodeProject {
  id: string;
  name: string;
  description: string;
  type: 'website' | 'app' | 'api' | 'database' | 'mobile' | 'desktop';
  language: string;
  framework: string;
  files: CodeFile[];
  createdAt: string;
}

export interface CodeFile {
  name: string;
  content: string;
  language: string;
  type: 'component' | 'service' | 'config' | 'style' | 'test' | 'documentation';
}

export interface CodeGenerationRequest {
  projectName: string;
  description: string;
  type: string;
  language: string;
  framework: string;
  requirements?: {
    responsive?: boolean;
    accessible?: boolean;
    optimized?: boolean;
    tested?: boolean;
  };
}

export interface CodeAnalysis {
  issues: string[];
  suggestions: string[];
  complexity: number;
  performance: string[];
  security: string[];
  bestPractices: string[];
}

export class CodeGenerationService {
  private static instance: CodeGenerationService;
  private projects: CodeProject[] = [];

  private constructor() {}

  static getInstance(): CodeGenerationService {
    if (!CodeGenerationService.instance) {
      CodeGenerationService.instance = new CodeGenerationService();
    }
    return CodeGenerationService.instance;
  }

  async generateProject(request: CodeGenerationRequest): Promise<CodeProject> {
    try {
      const projectId = `project_${Date.now()}`;
      
      const systemPrompt = `You are an expert full-stack developer with capabilities equal to the best development teams. Generate a complete, production-ready project with the following specifications:

Project: ${request.projectName}
Description: ${request.description}
Type: ${request.type}
Language: ${request.language}
Framework: ${request.framework}

Requirements:
- ${request.requirements?.responsive ? 'Responsive design' : 'Standard design'}
- ${request.requirements?.accessible ? 'Accessibility compliant' : 'Basic accessibility'}
- ${request.requirements?.optimized ? 'Performance optimized' : 'Standard performance'}
- ${request.requirements?.tested ? 'Include tests' : 'No tests required'}

Generate a complete project structure with all necessary files. Include:
1. Main application files
2. Configuration files
3. Styling files
4. Component files (if applicable)
5. Service files (if applicable)
6. Documentation files

Return response in JSON format with this structure:
{
  "name": "project name",
  "description": "project description",
  "type": "project type",
  "language": "programming language",
  "framework": "framework used",
  "files": [
    {
      "name": "filename.ext",
      "content": "complete file content",
      "language": "file language",
      "type": "component|service|config|style|test|documentation"
    }
  ]
}

Make sure all code is production-ready, follows best practices, and is well-documented.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Generate a complete ${request.type} project called "${request.projectName}" with the following requirements: ${request.description}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      const project: CodeProject = {
        id: projectId,
        name: result.name || request.projectName,
        description: result.description || request.description,
        type: result.type as any || request.type as any,
        language: result.language || request.language,
        framework: result.framework || request.framework,
        files: result.files || [],
        createdAt: new Date().toISOString()
      };

      this.projects.push(project);
      return project;
    } catch (error) {
      console.error('Code generation error:', error);
      throw new Error('Failed to generate project');
    }
  }

  async analyzeCode(code: string, language: string, framework: string): Promise<CodeAnalysis> {
    try {
      const systemPrompt = `You are an expert code analyst with deep knowledge of ${language} and ${framework}. Analyze the provided code and return a comprehensive analysis in JSON format.

Analyze for:
1. Code issues and bugs
2. Performance improvements
3. Security vulnerabilities
4. Best practices compliance
5. Code complexity
6. Optimization suggestions

Return response in JSON format with this structure:
{
  "issues": ["array of issues found"],
  "suggestions": ["array of improvement suggestions"],
  "complexity": number (1-10 scale),
  "performance": ["array of performance recommendations"],
  "security": ["array of security concerns"],
  "bestPractices": ["array of best practices violations"]
}

Be thorough and provide actionable feedback.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Analyze this ${language} code using ${framework}:\n\n${code}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        issues: result.issues || [],
        suggestions: result.suggestions || [],
        complexity: result.complexity || 5,
        performance: result.performance || [],
        security: result.security || [],
        bestPractices: result.bestPractices || []
      };
    } catch (error) {
      console.error('Code analysis error:', error);
      throw new Error('Failed to analyze code');
    }
  }

  async debugCode(code: string, language: string, framework: string, errorDescription?: string): Promise<{
    fixedCode: string;
    suggestions: string;
    explanation: string;
  }> {
    try {
      const systemPrompt = `You are an expert debugger with deep knowledge of ${language} and ${framework}. Debug the provided code and fix any issues found.

Instructions:
1. Identify all bugs and issues
2. Fix the code
3. Provide explanation of fixes
4. Suggest improvements

${errorDescription ? `Error description: ${errorDescription}` : ''}

Return response in JSON format with this structure:
{
  "fixedCode": "corrected code",
  "suggestions": "suggestions for improvement",
  "explanation": "explanation of fixes made"
}

Make sure the fixed code is production-ready and follows best practices.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Debug this ${language} code using ${framework}:\n\n${code}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        fixedCode: result.fixedCode || code,
        suggestions: result.suggestions || 'No suggestions available',
        explanation: result.explanation || 'No explanation available'
      };
    } catch (error) {
      console.error('Code debugging error:', error);
      throw new Error('Failed to debug code');
    }
  }

  async explainCode(code: string, language: string): Promise<{
    explanation: string;
    keyComponents: string[];
    flowDescription: string;
    suggestions: string[];
  }> {
    try {
      const systemPrompt = `You are an expert code explainer with deep knowledge of ${language}. Explain the provided code in a clear, educational manner.

Instructions:
1. Provide a comprehensive explanation
2. Identify key components and their purposes
3. Describe the code flow
4. Suggest improvements or alternatives

Return response in JSON format with this structure:
{
  "explanation": "detailed explanation of the code",
  "keyComponents": ["array of key components and their purposes"],
  "flowDescription": "description of code execution flow",
  "suggestions": ["array of improvement suggestions"]
}

Make explanations clear and educational.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Explain this ${language} code:\n\n${code}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        explanation: result.explanation || 'No explanation available',
        keyComponents: result.keyComponents || [],
        flowDescription: result.flowDescription || 'No flow description available',
        suggestions: result.suggestions || []
      };
    } catch (error) {
      console.error('Code explanation error:', error);
      throw new Error('Failed to explain code');
    }
  }

  async optimizeCode(code: string, language: string, framework: string): Promise<{
    optimizedCode: string;
    improvements: string[];
    performanceGains: string[];
  }> {
    try {
      const systemPrompt = `You are an expert code optimizer with deep knowledge of ${language} and ${framework}. Optimize the provided code for better performance, readability, and maintainability.

Instructions:
1. Optimize for performance
2. Improve code readability
3. Enhance maintainability
4. Follow best practices
5. Maintain functionality

Return response in JSON format with this structure:
{
  "optimizedCode": "optimized version of the code",
  "improvements": ["array of improvements made"],
  "performanceGains": ["array of performance improvements"]
}

Make sure the optimized code is production-ready and maintains all original functionality.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Optimize this ${language} code using ${framework}:\n\n${code}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        optimizedCode: result.optimizedCode || code,
        improvements: result.improvements || [],
        performanceGains: result.performanceGains || []
      };
    } catch (error) {
      console.error('Code optimization error:', error);
      throw new Error('Failed to optimize code');
    }
  }

  getProjects(): CodeProject[] {
    return this.projects;
  }

  getProject(id: string): CodeProject | undefined {
    return this.projects.find(p => p.id === id);
  }

  deleteProject(id: string): boolean {
    const index = this.projects.findIndex(p => p.id === id);
    if (index > -1) {
      this.projects.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const codeGenerationService = CodeGenerationService.getInstance();