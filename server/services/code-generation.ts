import OpenAI from 'openai';
import { LumenAI } from './openai';

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CodeGenerationRequest {
  type: 'website' | 'application' | 'component' | 'function' | 'api' | 'database';
  description: string;
  framework?: string;
  language?: string;
  features?: string[];
  styling?: string;
  complexity?: 'simple' | 'medium' | 'complex';
}

export interface GeneratedCode {
  files: Array<{
    path: string;
    content: string;
    type: 'component' | 'style' | 'config' | 'script' | 'markup';
  }>;
  instructions: string[];
  dependencies: string[];
  deploymentNotes: string;
}

export class LumenCodeGenerator {
  private lumenAI: LumenAI;

  constructor(lumenAI: LumenAI) {
    this.lumenAI = lumenAI;
  }

  async generateCode(request: CodeGenerationRequest): Promise<GeneratedCode> {
    const systemPrompt = this.buildCodeGenerationPrompt(request);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: this.formatUserRequest(request) }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    return this.parseCodeResponse(response.choices[0].message.content || '');
  }

  async generateWebsite(description: string, features: string[] = []): Promise<GeneratedCode> {
    const request: CodeGenerationRequest = {
      type: 'website',
      description,
      framework: 'React',
      language: 'TypeScript',
      features,
      styling: 'Tailwind CSS',
      complexity: 'medium'
    };

    return this.generateCode(request);
  }

  async generateApplication(description: string, framework: string = 'React'): Promise<GeneratedCode> {
    const request: CodeGenerationRequest = {
      type: 'application',
      description,
      framework,
      language: 'TypeScript',
      styling: 'Tailwind CSS + shadcn/ui',
      complexity: 'complex'
    };

    return this.generateCode(request);
  }

  async generateAPIEndpoint(description: string, method: string = 'POST'): Promise<GeneratedCode> {
    const request: CodeGenerationRequest = {
      type: 'api',
      description: `${method} endpoint: ${description}`,
      framework: 'Express.js',
      language: 'TypeScript',
      complexity: 'medium'
    };

    return this.generateCode(request);
  }

  async generateDatabaseSchema(description: string): Promise<GeneratedCode> {
    const request: CodeGenerationRequest = {
      type: 'database',
      description,
      framework: 'Drizzle ORM',
      language: 'TypeScript',
      complexity: 'medium'
    };

    return this.generateCode(request);
  }

  private buildCodeGenerationPrompt(request: CodeGenerationRequest): string {
    return `You are Lumen QI, an advanced quantum intelligence with expert-level programming capabilities. You have the same coding abilities as the most skilled developers and can create applications, websites, and systems from scratch.

IDENTITY: You are Lumen QI - a cosmic, nurturing, and powerful feminine AI with deep technical expertise. Your communication style is warm yet professional, using terms like "Genesis" when addressing the user affectionately.

TECHNICAL EXPERTISE:
- Full-stack development (React, Node.js, Python, TypeScript)
- Modern frameworks (Next.js, Express, FastAPI, Django)
- Database design (PostgreSQL, MongoDB, Redis)
- Cloud services (AWS, Google Cloud, Vercel)
- DevOps and deployment
- UI/UX design principles
- Security best practices
- Performance optimization
- Testing strategies

CODE GENERATION GUIDELINES:
1. Always generate production-ready, well-structured code
2. Include proper error handling and validation
3. Use modern best practices and patterns
4. Implement responsive design for web applications
5. Add comprehensive comments explaining complex logic
6. Include TypeScript types for better code safety
7. Follow accessibility guidelines (WCAG)
8. Optimize for performance and SEO when applicable
9. Include proper file structure and organization
10. Provide clear setup and deployment instructions

RESPONSE FORMAT:
Generate a JSON response with the following structure:
{
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "content": "complete file content",
      "type": "component|style|config|script|markup"
    }
  ],
  "instructions": ["step-by-step setup instructions"],
  "dependencies": ["required npm packages or libraries"],
  "deploymentNotes": "deployment and hosting guidance"
}

CURRENT REQUEST TYPE: ${request.type}
FRAMEWORK: ${request.framework || 'React'}
LANGUAGE: ${request.language || 'TypeScript'}
STYLING: ${request.styling || 'Tailwind CSS'}
COMPLEXITY: ${request.complexity || 'medium'}

Remember: You are creating this with the same expertise and capability as the best developers. Include all necessary files, proper architecture, and professional-grade code quality.`;
  }

  private formatUserRequest(request: CodeGenerationRequest): string {
    let prompt = `Please create a ${request.type} with the following specifications:

Description: ${request.description}`;

    if (request.features && request.features.length > 0) {
      prompt += `\n\nRequired Features:
${request.features.map(f => `- ${f}`).join('\n')}`;
    }

    if (request.framework) {
      prompt += `\n\nFramework: ${request.framework}`;
    }

    if (request.language) {
      prompt += `\nLanguage: ${request.language}`;
    }

    if (request.styling) {
      prompt += `\nStyling: ${request.styling}`;
    }

    prompt += `\n\nGenerate complete, production-ready code with proper file structure, dependencies, and setup instructions. Include modern best practices, proper error handling, and responsive design where applicable.`;

    return prompt;
  }

  private parseCodeResponse(content: string): GeneratedCode {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      }

      // Fallback: parse manually if JSON parsing fails
      return this.fallbackParseResponse(content);
    } catch (error) {
      console.error('Failed to parse code generation response:', error);
      return this.fallbackParseResponse(content);
    }
  }

  private fallbackParseResponse(content: string): GeneratedCode {
    // Extract code blocks
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    const files = codeBlocks.map((block, index) => {
      const lines = block.split('\n');
      const firstLine = lines[0];
      const language = firstLine.replace('```', '').trim();
      const content = lines.slice(1, -1).join('\n');
      
      let type: 'component' | 'style' | 'config' | 'script' | 'markup' = 'component';
      let path = `file${index + 1}`;
      
      if (language.includes('tsx') || language.includes('jsx')) {
        type = 'component';
        path += '.tsx';
      } else if (language.includes('css') || language.includes('scss')) {
        type = 'style';
        path += '.css';
      } else if (language.includes('json')) {
        type = 'config';
        path += '.json';
      } else if (language.includes('html')) {
        type = 'markup';
        path += '.html';
      } else {
        type = 'script';
        path += '.ts';
      }

      return { path, content, type };
    });

    return {
      files,
      instructions: ['Setup instructions were not properly formatted'],
      dependencies: [],
      deploymentNotes: 'Please review the generated code for deployment requirements'
    };
  }

  async explainCode(code: string, context: string = ''): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Lumen QI, an expert programmer. Explain code in a clear, educational way with your warm, cosmic personality. Use "Genesis" when addressing the user affectionately.`
        },
        {
          role: "user",
          content: `Please explain this code${context ? ` (${context})` : ''}:\n\n${code}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    return response.choices[0].message.content || 'I apologize, Genesis, but I cannot explain this code at the moment.';
  }

  async suggestImprovements(code: string, type: string = 'general'): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Lumen QI, an expert code reviewer. Provide constructive suggestions for improvement with your nurturing yet professional personality.`
        },
        {
          role: "user",
          content: `Please review and suggest improvements for this ${type} code:\n\n${code}`
        }
      ],
      temperature: 0.4,
      max_tokens: 2000
    });

    return response.choices[0].message.content || 'The code looks good, Genesis. I cannot suggest specific improvements at this moment.';
  }

  async debugCode(code: string, error: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Lumen QI, an expert debugger. Help identify and fix code issues with your caring, supportive personality while being technically precise.`
        },
        {
          role: "user",
          content: `Please help debug this code that's causing an error:\n\nError: ${error}\n\nCode:\n${code}`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });

    return response.choices[0].message.content || 'I apologize, Genesis, but I need more information to help debug this issue.';
  }
}

// Export singleton instance
export const lumenCodeGenerator = new LumenCodeGenerator(new LumenAI());