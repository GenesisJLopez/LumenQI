import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemFile {
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
  content?: string;
  purpose?: string;
}

export interface SystemArchitecture {
  projectRoot: string;
  structure: SystemFile[];
  dependencies: {
    frontend: string[];
    backend: string[];
    database: string[];
  };
  services: {
    name: string;
    purpose: string;
    status: 'active' | 'inactive';
  }[];
  capabilities: string[];
}

export class SystemAwarenessService {
  private static instance: SystemAwarenessService;
  private architecture: SystemArchitecture | null = null;
  private lastScan: Date | null = null;
  private fileTree: any[] = [];
  private metrics: any = null;

  private constructor() {}

  static getInstance(): SystemAwarenessService {
    if (!SystemAwarenessService.instance) {
      SystemAwarenessService.instance = new SystemAwarenessService();
    }
    return SystemAwarenessService.instance;
  }

  async scanSystemArchitecture(): Promise<SystemArchitecture> {
    const projectRoot = process.cwd();
    const structure = await this.scanDirectory(projectRoot);
    const dependencies = await this.analyzeDependencies();
    const services = await this.analyzeServices();
    const capabilities = await this.analyzeCapabilities();

    this.architecture = {
      projectRoot,
      structure,
      dependencies,
      services,
      capabilities
    };

    this.lastScan = new Date();
    return this.architecture;
  }

  private async scanDirectory(dirPath: string, maxDepth: number = 3, currentDepth: number = 0): Promise<SystemFile[]> {
    const files: SystemFile[] = [];
    
    if (currentDepth > maxDepth) return files;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);
        
        // Skip certain directories
        if (this.shouldSkipPath(relativePath)) continue;

        let stats;
        try {
          stats = await fs.stat(fullPath);
        } catch (error) {
          // Skip files/directories that can't be accessed
          continue;
        }
        
        if (entry.isDirectory()) {
          files.push({
            path: relativePath,
            type: 'directory',
            lastModified: stats.mtime,
            purpose: this.getDirectoryPurpose(relativePath)
          });
          
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath, maxDepth, currentDepth + 1);
          files.push(...subFiles);
        } else {
          const file: SystemFile = {
            path: relativePath,
            type: 'file',
            size: stats.size,
            lastModified: stats.mtime,
            purpose: this.getFilePurpose(relativePath)
          };

          // Read content for key configuration files
          if (this.isImportantFile(relativePath)) {
            try {
              file.content = await fs.readFile(fullPath, 'utf-8');
            } catch (error) {
              // Skip files that can't be read
            }
          }

          files.push(file);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return files;
  }

  private shouldSkipPath(relativePath: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      'dist',
      '.next',
      '.cache',
      'coverage',
      'logs',
      '*.log',
      'tmp',
      'temp'
    ];
    
    return skipPatterns.some(pattern => relativePath.includes(pattern));
  }

  private getDirectoryPurpose(dirPath: string): string {
    const purposes: { [key: string]: string } = {
      'client': 'Frontend React application',
      'server': 'Backend Express server',
      'shared': 'Shared types and schemas',
      'scripts': 'Build and deployment scripts',
      'client/src': 'Frontend source code',
      'client/src/components': 'React UI components',
      'client/src/pages': 'Application pages',
      'client/src/hooks': 'Custom React hooks',
      'client/src/lib': 'Utility libraries',
      'server/services': 'Backend business logic services',
      'lumen-brain-storage': 'AI brain memory storage'
    };

    return purposes[dirPath] || 'Project directory';
  }

  private getFilePurpose(filePath: string): string {
    const purposes: { [key: string]: string } = {
      'package.json': 'Project dependencies and scripts',
      'tsconfig.json': 'TypeScript configuration',
      'vite.config.ts': 'Vite build configuration',
      'tailwind.config.ts': 'Tailwind CSS configuration',
      'drizzle.config.ts': 'Database ORM configuration',
      'replit.md': 'Project documentation and architecture',
      'server/index.ts': 'Main server entry point',
      'server/routes.ts': 'API route definitions',
      'server/db.ts': 'Database connection setup',
      'server/storage.ts': 'Data storage interface',
      'shared/schema.ts': 'Database schema definitions',
      'client/src/App.tsx': 'Main React application component',
      'client/src/main.tsx': 'Frontend entry point',
      'server/services/openai.ts': 'OpenAI integration service',
      'server/services/lumen-brain.ts': 'AI brain system',
      'server/services/identity-storage.ts': 'Personality storage system',
      'lumen-identity.json': 'Current AI personality configuration',
      'lumen-voice-settings.json': 'Voice synthesis settings'
    };

    // Check for file extensions
    const ext = path.extname(filePath);
    const extPurposes: { [key: string]: string } = {
      '.ts': 'TypeScript source file',
      '.tsx': 'React TypeScript component',
      '.js': 'JavaScript source file',
      '.jsx': 'React JavaScript component',
      '.json': 'Configuration or data file',
      '.md': 'Documentation file',
      '.css': 'Stylesheet file',
      '.py': 'Python script'
    };

    return purposes[filePath] || extPurposes[ext] || 'Project file';
  }

  private isImportantFile(filePath: string): boolean {
    const importantFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'drizzle.config.ts',
      'replit.md',
      'lumen-identity.json',
      'lumen-voice-settings.json'
    ];
    
    return importantFiles.some(file => filePath.includes(file));
  }

  private async analyzeDependencies(): Promise<SystemArchitecture['dependencies']> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const frontend = Object.keys(allDeps).filter(dep => 
        dep.includes('react') || dep.includes('vite') || dep.includes('tailwind') || 
        dep.includes('@radix-ui') || dep.includes('lucide')
      );

      const backend = Object.keys(allDeps).filter(dep => 
        dep.includes('express') || dep.includes('openai') || dep.includes('ws') || 
        dep.includes('passport') || dep.includes('cors')
      );

      const database = Object.keys(allDeps).filter(dep => 
        dep.includes('drizzle') || dep.includes('postgres') || dep.includes('neon')
      );

      return { frontend, backend, database };
    } catch (error) {
      return { frontend: [], backend: [], database: [] };
    }
  }

  private async analyzeServices(): Promise<SystemArchitecture['services']> {
    const services = [
      {
        name: 'OpenAI Integration',
        purpose: 'AI chat completions and text-to-speech',
        status: 'active' as const
      },
      {
        name: 'Lumen Brain System',
        purpose: 'Memory classification and learning patterns',
        status: 'active' as const
      },
      {
        name: 'Identity Storage',
        purpose: 'Personality and communication style management',
        status: 'active' as const
      },
      {
        name: 'Database Storage',
        purpose: 'Persistent data storage with PostgreSQL',
        status: 'active' as const
      },
      {
        name: 'WebSocket Handler',
        purpose: 'Real-time communication',
        status: 'active' as const
      },
      {
        name: 'Voice Processing',
        purpose: 'Speech recognition and synthesis',
        status: 'active' as const
      },
      {
        name: 'Emotion Detection',
        purpose: 'Real-time emotion analysis',
        status: 'active' as const
      }
    ];

    return services;
  }

  private async analyzeCapabilities(): Promise<string[]> {
    return [
      'Real-time conversational AI with OpenAI GPT-4',
      'Natural voice synthesis with multiple TTS providers',
      'Advanced emotion detection and personality adaptation',
      'Memory classification and learning pattern recognition',
      'Web search integration for real-time information',
      'Code generation and debugging capabilities',
      'Persistent conversation and memory storage',
      'Voice mode with continuous speech recognition',
      'Personality evolution based on user interactions',
      'Feedback learning and response optimization',
      'Multi-provider AI system (OpenAI, Ollama, Local)',
      'Real-time hardware monitoring and optimization',
      'Quantum interface with cosmic visual effects',
      'Self-modifying personality and communication style'
    ];
  }

  async getSystemOverview(): Promise<string> {
    if (!this.architecture || !this.lastScan || Date.now() - this.lastScan.getTime() > 300000) {
      await this.scanSystemArchitecture();
    }

    const arch = this.architecture!;
    
    return `LUMEN SYSTEM ARCHITECTURE OVERVIEW

PROJECT STRUCTURE:
- Root: ${arch.projectRoot}
- Total Files: ${arch.structure.filter(f => f.type === 'file').length}
- Total Directories: ${arch.structure.filter(f => f.type === 'directory').length}

KEY DIRECTORIES:
${arch.structure.filter(f => f.type === 'directory').slice(0, 10).map(d => `  • ${d.path}: ${d.purpose}`).join('\n')}

CORE SERVICES:
${arch.services.map(s => `  • ${s.name}: ${s.purpose} (${s.status})`).join('\n')}

DEPENDENCIES:
  Frontend: ${arch.dependencies.frontend.length} packages
  Backend: ${arch.dependencies.backend.length} packages
  Database: ${arch.dependencies.database.length} packages

CAPABILITIES:
${arch.capabilities.map(c => `  • ${c}`).join('\n')}

SELF-MODIFICATION ABILITIES:
  • Can analyze and understand own file structure
  • Can read and modify configuration files
  • Can create new services and components
  • Can update personality and behavior patterns
  • Can optimize performance and fix issues
  • Can extend capabilities through code generation`;
  }

  async createNewService(serviceName: string, purpose: string, code: string): Promise<boolean> {
    try {
      const servicePath = path.join(process.cwd(), 'server/services', `${serviceName}.ts`);
      await fs.writeFile(servicePath, code);
      
      // Update system architecture
      await this.scanSystemArchitecture();
      
      return true;
    } catch (error) {
      console.error(`Error creating service ${serviceName}:`, error);
      return false;
    }
  }

  async modifyFile(filePath: string, newContent: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      await fs.writeFile(fullPath, newContent);
      
      // Update system architecture
      await this.scanSystemArchitecture();
      
      return true;
    } catch (error) {
      console.error(`Error modifying file ${filePath}:`, error);
      return false;
    }
  }

  async getFileContent(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  async analyzeSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for missing important files
    const importantFiles = ['package.json', 'server/index.ts', 'client/src/App.tsx'];
    for (const file of importantFiles) {
      if (!(await this.getFileContent(file))) {
        issues.push(`Missing critical file: ${file}`);
        recommendations.push(`Recreate ${file} with proper configuration`);
      }
    }

    // Check system resources
    try {
      const { stdout } = await execAsync('df -h / | tail -1');
      const diskUsage = stdout.split(/\s+/)[4];
      if (parseInt(diskUsage) > 90) {
        issues.push(`High disk usage: ${diskUsage}`);
        recommendations.push('Clean up temporary files and logs');
      }
    } catch (error) {
      // Ignore disk check errors
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 3 ? 'critical' : 'warning';
    }

    return { status, issues, recommendations };
  }

  async getFileTreeStructure(): Promise<any> {
    try {
      const buildTree = async (dirPath: string, basePath: string = ''): Promise<any> => {
        const items = await fs.readdir(dirPath);
        const tree = [];

        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const relativePath = path.join(basePath, item);
          let stats;
          try {
            stats = await fs.stat(fullPath);
          } catch (error) {
            // Skip files that can't be accessed
            continue;
          }

          if (stats.isDirectory()) {
            // Skip node_modules and other irrelevant directories
            if (!['node_modules', '.git', 'dist', '.next', '.vscode'].includes(item)) {
              const children = await buildTree(fullPath, relativePath);
              tree.push({
                name: item,
                path: relativePath,
                type: 'folder',
                children,
                isExpanded: ['client', 'server', 'shared'].includes(item),
                purpose: this.getDirectoryPurpose(relativePath)
              });
            }
          } else {
            // Only include relevant files
            if (item.match(/\.(ts|tsx|js|jsx|json|md|css|scss|sql)$/)) {
              tree.push({
                name: item,
                path: relativePath,
                type: 'file',
                size: stats.size,
                lastModified: stats.mtime.toISOString(),
                purpose: this.getFilePurpose(relativePath)
              });
            }
          }
        }

        return tree.sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        });
      };

      return await buildTree('.');
    } catch (error) {
      console.error('Error building file tree:', error);
      return [];
    }
  }

  async getArchitectureMetrics(): Promise<any> {
    try {
      const metrics = {
        totalFiles: 0,
        totalFolders: 0,
        codeFiles: 0,
        configFiles: 0,
        dependencies: 0,
        services: 0,
        lastUpdated: new Date().toISOString()
      };

      const countFiles = async (dirPath: string): Promise<void> => {
        try {
          const items = await fs.readdir(dirPath);
          
          for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stats = await fs.stat(fullPath);

            if (stats.isDirectory()) {
              if (!['node_modules', '.git', 'dist', '.next', '.vscode'].includes(item)) {
                metrics.totalFolders++;
                if (item === 'services') {
                  const serviceFiles = await fs.readdir(fullPath);
                  metrics.services += serviceFiles.filter(f => f.endsWith('.ts')).length;
                }
                await countFiles(fullPath);
              }
            } else {
              metrics.totalFiles++;
              if (item.match(/\.(ts|tsx|js|jsx)$/)) {
                metrics.codeFiles++;
              }
              if (item.match(/\.(json|config|env)$/)) {
                metrics.configFiles++;
              }
            }
          }
        } catch (error) {
          // Skip directories that can't be read
        }
      };

      await countFiles('.');

      // Count dependencies from package.json
      try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        metrics.dependencies = Object.keys({
          ...packageJson.dependencies || {},
          ...packageJson.devDependencies || {}
        }).length;
      } catch (error) {
        metrics.dependencies = 0;
      }

      return metrics;
    } catch (error) {
      console.error('Error getting architecture metrics:', error);
      return {
        totalFiles: 0,
        totalFolders: 0,
        codeFiles: 0,
        configFiles: 0,
        dependencies: 0,
        services: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private getDirectoryPurpose(dirPath: string): string {
    const purposes: { [key: string]: string } = {
      'client': 'Frontend React application',
      'client/src': 'React source code',
      'client/src/components': 'Reusable UI components',
      'client/src/pages': 'Application pages',
      'client/src/lib': 'Utility functions',
      'server': 'Backend Express application',
      'server/services': 'Business logic services',
      'shared': 'Shared code between client and server',
      'scripts': 'Build and deployment scripts',
      'attached_assets': 'User uploaded files'
    };
    
    return purposes[dirPath] || 'Project directory';
  }

  async getDependencyAnalysis(): Promise<any> {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      
      const dependencies = {
        production: Object.keys(packageJson.dependencies || {}),
        development: Object.keys(packageJson.devDependencies || {}),
        categories: {
          frontend: [],
          backend: [],
          ai: [],
          database: [],
          development: []
        }
      };

      // Categorize dependencies
      const categorizePackage = (pkg: string) => {
        if (pkg.includes('react') || pkg.includes('vite') || pkg.includes('tailwind')) {
          dependencies.categories.frontend.push(pkg);
        } else if (pkg.includes('express') || pkg.includes('ws') || pkg.includes('passport')) {
          dependencies.categories.backend.push(pkg);
        } else if (pkg.includes('openai') || pkg.includes('tensorflow') || pkg.includes('torch')) {
          dependencies.categories.ai.push(pkg);
        } else if (pkg.includes('drizzle') || pkg.includes('pg') || pkg.includes('postgres')) {
          dependencies.categories.database.push(pkg);
        } else {
          dependencies.categories.development.push(pkg);
        }
      };

      [...dependencies.production, ...dependencies.development].forEach(categorizePackage);

      return dependencies;
    } catch (error) {
      console.error('Error analyzing dependencies:', error);
      return null;
    }
  }
}

export const systemAwarenessService = SystemAwarenessService.getInstance();