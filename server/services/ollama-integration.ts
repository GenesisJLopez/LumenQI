/**
 * Ollama Integration Service
 * Handles local Llama 3.2 model installation and management
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface OllamaModel {
  name: string;
  size: string;
  modified: Date;
  digest: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
}

export class OllamaIntegration {
  private isInstalled: boolean = false;
  private isRunning: boolean = false;
  private availableModels: OllamaModel[] = [];
  private baseUrl: string = 'http://localhost:11434';
  private installedModels: Set<string> = new Set();

  constructor() {
    this.checkInstallation();
  }

  private async checkInstallation(): Promise<void> {
    try {
      const { stdout } = await execAsync('ollama --version');
      this.isInstalled = stdout.includes('ollama version');
      console.log('✓ Ollama is installed:', stdout.trim());
      
      if (this.isInstalled) {
        await this.checkRunningStatus();
        await this.loadAvailableModels();
      }
    } catch (error) {
      console.log('❌ Ollama not installed');
      this.isInstalled = false;
    }
  }

  private async checkRunningStatus(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      this.isRunning = response.ok;
      console.log('✓ Ollama service is running');
    } catch (error) {
      console.log('❌ Ollama service not running');
      this.isRunning = false;
    }
  }

  private async loadAvailableModels(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        this.availableModels = data.models || [];
        this.installedModels = new Set(this.availableModels.map(m => m.name));
        console.log('✓ Available Ollama models:', this.installedModels);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  }

  public async installOllama(): Promise<boolean> {
    if (this.isInstalled) {
      console.log('✓ Ollama already installed');
      return true;
    }

    try {
      console.log('🔧 Installing Ollama...');
      
      // Installation script for different platforms
      const platform = process.platform;
      let installCommand: string;
      
      if (platform === 'darwin') {
        // macOS
        installCommand = 'curl -fsSL https://ollama.ai/install.sh | sh';
      } else if (platform === 'linux') {
        // Linux
        installCommand = 'curl -fsSL https://ollama.ai/install.sh | sh';
      } else {
        throw new Error('Unsupported platform for Ollama installation');
      }
      
      const { stdout, stderr } = await execAsync(installCommand);
      console.log('Installation output:', stdout);
      
      if (stderr) {
        console.log('Installation warnings:', stderr);
      }
      
      // Verify installation
      await this.checkInstallation();
      
      if (this.isInstalled) {
        console.log('✅ Ollama installed successfully');
        return true;
      } else {
        console.log('❌ Ollama installation failed');
        return false;
      }
    } catch (error) {
      console.error('Ollama installation error:', error);
      return false;
    }
  }

  public async startOllamaService(): Promise<boolean> {
    if (this.isRunning) {
      console.log('✓ Ollama service already running');
      return true;
    }

    try {
      console.log('🚀 Starting Ollama service...');
      
      // Start Ollama service in background
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore'
      });
      
      ollamaProcess.unref();
      
      // Wait a moment for service to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if service is running
      await this.checkRunningStatus();
      
      if (this.isRunning) {
        console.log('✅ Ollama service started successfully');
        return true;
      } else {
        console.log('❌ Failed to start Ollama service');
        return false;
      }
    } catch (error) {
      console.error('Error starting Ollama service:', error);
      return false;
    }
  }

  public async downloadModel(modelName: string): Promise<boolean> {
    if (!this.isInstalled || !this.isRunning) {
      console.log('❌ Ollama not installed or not running');
      return false;
    }

    if (this.installedModels.has(modelName)) {
      console.log(`✓ Model ${modelName} already installed`);
      return true;
    }

    try {
      console.log(`🔧 Downloading model: ${modelName}...`);
      
      const { stdout, stderr } = await execAsync(`ollama pull ${modelName}`);
      console.log('Download output:', stdout);
      
      if (stderr) {
        console.log('Download warnings:', stderr);
      }
      
      // Refresh available models
      await this.loadAvailableModels();
      
      if (this.installedModels.has(modelName)) {
        console.log(`✅ Model ${modelName} downloaded successfully`);
        return true;
      } else {
        console.log(`❌ Failed to download model ${modelName}`);
        return false;
      }
    } catch (error) {
      console.error(`Error downloading model ${modelName}:`, error);
      return false;
    }
  }

  public async generateResponse(
    model: string,
    prompt: string,
    context?: number[],
    temperature: number = 0.7
  ): Promise<string> {
    if (!this.isInstalled || !this.isRunning) {
      throw new Error('Ollama not available');
    }

    if (!this.installedModels.has(model)) {
      throw new Error(`Model ${model} not installed`);
    }

    try {
      const requestBody = {
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          top_p: 0.9,
          top_k: 40
        }
      };

      if (context) {
        requestBody['context'] = context;
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  public async setupRecommendedModels(): Promise<boolean> {
    const recommendedModels = [
      'llama3.2:1b',    // Lightweight model
      'llama3.2:3b',    // Balanced model
      'llama3.2:8b'     // Full-featured model
    ];

    console.log('🔧 Setting up recommended Llama models...');
    
    let successCount = 0;
    
    for (const model of recommendedModels) {
      try {
        const success = await this.downloadModel(model);
        if (success) successCount++;
      } catch (error) {
        console.error(`Failed to download ${model}:`, error);
      }
    }

    console.log(`✅ Successfully installed ${successCount}/${recommendedModels.length} models`);
    return successCount > 0;
  }

  public async getModelInfo(modelName: string): Promise<any> {
    if (!this.isInstalled || !this.isRunning) {
      throw new Error('Ollama not available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: modelName })
      });

      if (!response.ok) {
        throw new Error(`Failed to get model info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting model info:', error);
      throw error;
    }
  }

  public getStatus(): {
    installed: boolean;
    running: boolean;
    models: string[];
    serviceUrl: string;
  } {
    return {
      installed: this.isInstalled,
      running: this.isRunning,
      models: Array.from(this.installedModels),
      serviceUrl: this.baseUrl
    };
  }

  public async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  public async performFullSetup(): Promise<boolean> {
    try {
      console.log('🚀 Starting full Ollama setup...');
      
      // Step 1: Install Ollama if not installed
      if (!this.isInstalled) {
        const installed = await this.installOllama();
        if (!installed) {
          console.log('❌ Failed to install Ollama');
          return false;
        }
      }
      
      // Step 2: Start Ollama service
      if (!this.isRunning) {
        const started = await this.startOllamaService();
        if (!started) {
          console.log('❌ Failed to start Ollama service');
          return false;
        }
      }
      
      // Step 3: Download recommended models
      const modelsInstalled = await this.setupRecommendedModels();
      if (!modelsInstalled) {
        console.log('❌ Failed to install any models');
        return false;
      }
      
      console.log('✅ Full Ollama setup completed successfully');
      return true;
    } catch (error) {
      console.error('Full setup error:', error);
      return false;
    }
  }
}

// Global instance
export const ollamaIntegration = new OllamaIntegration();