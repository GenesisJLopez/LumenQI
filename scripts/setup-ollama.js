#!/usr/bin/env node

/**
 * Ollama Setup Script for Lumen QI
 * Installs and configures Ollama for local AI processing
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import os from 'os';

class OllamaSetup {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.homeDir = os.homedir();
    this.ollamaDir = path.join(this.homeDir, '.ollama');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async checkSystemRequirements() {
    this.log('Checking system requirements...', 'info');
    
    // Check RAM
    const totalMemory = os.totalmem();
    const memoryGB = Math.round(totalMemory / (1024 * 1024 * 1024));
    
    if (memoryGB < 8) {
      this.log(`⚠️  WARNING: Only ${memoryGB}GB RAM detected. 8GB+ recommended for optimal performance.`, 'warning');
    } else if (memoryGB >= 16) {
      this.log(`✅ Excellent: ${memoryGB}GB RAM detected. Perfect for running larger models.`, 'success');
    } else {
      this.log(`✅ Good: ${memoryGB}GB RAM detected. Sufficient for most models.`, 'success');
    }

    // Check available disk space
    try {
      const stats = fs.statSync(this.homeDir);
      this.log(`✅ Home directory accessible: ${this.homeDir}`, 'success');
    } catch (error) {
      this.log(`❌ Cannot access home directory: ${error.message}`, 'error');
      return false;
    }

    // Check if curl is available
    try {
      execSync('curl --version', { stdio: 'ignore' });
      this.log('✅ curl is available', 'success');
    } catch {
      this.log('❌ curl is required but not found', 'error');
      return false;
    }

    return true;
  }

  async isOllamaInstalled() {
    try {
      const output = execSync('ollama --version', { encoding: 'utf8', stdio: 'pipe' });
      const version = output.trim();
      this.log(`✅ Ollama is already installed: ${version}`, 'success');
      return true;
    } catch {
      this.log('Ollama is not installed', 'info');
      return false;
    }
  }

  async installOllama() {
    this.log('Installing Ollama...', 'info');
    
    try {
      if (this.platform === 'win32') {
        this.log('Windows detected. Please download Ollama from: https://ollama.ai/download/windows', 'warning');
        this.log('After installation, run this script again to continue setup.', 'info');
        return false;
      } else if (this.platform === 'darwin') {
        this.log('macOS detected. Please download Ollama from: https://ollama.ai/download/mac', 'warning');
        this.log('After installation, run this script again to continue setup.', 'info');
        return false;
      } else {
        // Linux installation
        this.log('Installing Ollama on Linux...', 'info');
        execSync('curl -fsSL https://ollama.ai/install.sh | sh', { stdio: 'inherit' });
        this.log('✅ Ollama installed successfully', 'success');
        return true;
      }
    } catch (error) {
      this.log(`❌ Failed to install Ollama: ${error.message}`, 'error');
      return false;
    }
  }

  async startOllamaService() {
    try {
      // Check if Ollama service is already running
      const response = await this.checkOllamaService();
      if (response) {
        this.log('✅ Ollama service is already running', 'success');
        return true;
      }

      this.log('Starting Ollama service...', 'info');
      
      // Start Ollama in background
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore'
      });
      
      ollamaProcess.unref();
      
      // Wait a moment for service to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify service started
      const serviceRunning = await this.checkOllamaService();
      if (serviceRunning) {
        this.log('✅ Ollama service started successfully', 'success');
        return true;
      } else {
        this.log('❌ Failed to start Ollama service', 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error starting Ollama service: ${error.message}`, 'error');
      return false;
    }
  }

  async checkOllamaService() {
    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'localhost',
        port: 11434,
        path: '/api/tags',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => resolve(false));
      req.end();
    });
  }

  async downloadModel(modelName, size = 'unknown') {
    this.log(`Downloading model: ${modelName} (${size})...`, 'info');
    this.log('This may take several minutes depending on your internet connection.', 'info');
    
    try {
      execSync(`ollama pull ${modelName}`, { stdio: 'inherit' });
      this.log(`✅ Model ${modelName} downloaded successfully`, 'success');
      return true;
    } catch (error) {
      this.log(`❌ Failed to download model ${modelName}: ${error.message}`, 'error');
      return false;
    }
  }

  async setupRecommendedModels() {
    this.log('Setting up recommended models for Lumen QI...', 'info');
    
    const models = [
      { name: 'llama3.1:8b', size: '4.7GB', description: 'Best balance of performance and efficiency' },
      { name: 'phi3:mini', size: '2.3GB', description: 'Lightweight model for faster responses' },
      { name: 'mistral:7b', size: '4.1GB', description: 'Excellent reasoning capabilities' }
    ];

    const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    
    if (totalMemory < 8) {
      this.log('Limited RAM detected. Installing only the essential lightweight model.', 'warning');
      return await this.downloadModel('phi3:mini', '2.3GB');
    }

    let successCount = 0;
    for (const model of models) {
      this.log(`\n📦 Installing ${model.name}`, 'info');
      this.log(`   Description: ${model.description}`, 'info');
      this.log(`   Size: ${model.size}`, 'info');
      
      const success = await this.downloadModel(model.name, model.size);
      if (success) {
        successCount++;
      }
      
      // Stop after first successful download if low memory
      if (totalMemory < 12 && successCount > 0) {
        this.log('Stopping model installation due to memory constraints.', 'warning');
        break;
      }
    }

    return successCount > 0;
  }

  async testModelPerformance() {
    this.log('Testing model performance...', 'info');
    
    try {
      const testPrompt = "Hello! I'm testing the connection. Please respond briefly.";
      const startTime = Date.now();
      
      const output = execSync(`ollama run llama3.1:8b "${testPrompt}"`, { 
        encoding: 'utf8',
        timeout: 30000
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.log(`✅ Model test successful!`, 'success');
      this.log(`   Response time: ${responseTime}ms`, 'info');
      this.log(`   Response preview: ${output.substring(0, 100)}...`, 'info');
      
      return true;
    } catch (error) {
      this.log(`❌ Model test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async updateLumenConfig() {
    this.log('Updating Lumen AI configuration...', 'info');
    
    const configPath = path.join(process.cwd(), 'ai-config.json');
    const defaultConfig = {
      providers: [
        {
          provider: 'ollama',
          config: {
            provider: 'ollama',
            model: 'llama3.1:8b',
            baseUrl: 'http://localhost:11434',
            temperature: 0.7,
            maxTokens: 500
          },
          enabled: true,
          priority: 1
        },
        {
          provider: 'openai',
          config: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 500
          },
          enabled: true,
          priority: 2
        }
      ],
      fallbackEnabled: true,
      autoSwitch: true,
      lastUpdated: new Date().toISOString()
    };

    try {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      this.log('✅ Lumen AI configuration updated', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Failed to update Lumen config: ${error.message}`, 'error');
      return false;
    }
  }

  async createStartupScript() {
    this.log('Creating Ollama startup script...', 'info');
    
    const scriptContent = `#!/bin/bash
# Ollama Startup Script for Lumen QI
# This script ensures Ollama is running before starting Lumen

echo "🚀 Starting Ollama service..."

# Check if Ollama is already running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is already running"
else
    echo "Starting Ollama service..."
    nohup ollama serve > /dev/null 2>&1 &
    sleep 3
    
    # Verify service started
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama service started successfully"
    else
        echo "❌ Failed to start Ollama service"
        exit 1
    fi
fi

echo "🌟 Ollama is ready for Lumen QI!"
`;

    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'start-ollama.sh');
      fs.writeFileSync(scriptPath, scriptContent);
      execSync(`chmod +x ${scriptPath}`);
      this.log('✅ Startup script created at scripts/start-ollama.sh', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Failed to create startup script: ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    this.log('🌟 Welcome to Lumen QI Local AI Setup!', 'success');
    this.log('This script will install and configure Ollama for offline AI processing.', 'info');
    
    // Check system requirements
    const requirementsMet = await this.checkSystemRequirements();
    if (!requirementsMet) {
      this.log('❌ System requirements not met. Please resolve the issues above.', 'error');
      return false;
    }

    // Check if Ollama is installed
    const isInstalled = await this.isOllamaInstalled();
    if (!isInstalled) {
      const installSuccess = await this.installOllama();
      if (!installSuccess) {
        this.log('❌ Ollama installation failed. Please install manually.', 'error');
        return false;
      }
    }

    // Start Ollama service
    const serviceStarted = await this.startOllamaService();
    if (!serviceStarted) {
      this.log('❌ Failed to start Ollama service. Please check the installation.', 'error');
      return false;
    }

    // Download recommended models
    const modelsInstalled = await this.setupRecommendedModels();
    if (!modelsInstalled) {
      this.log('❌ Failed to install models. Please check your internet connection.', 'error');
      return false;
    }

    // Test model performance
    const testPassed = await this.testModelPerformance();
    if (!testPassed) {
      this.log('⚠️  Model test failed, but continuing with setup.', 'warning');
    }

    // Update Lumen configuration
    await this.updateLumenConfig();
    
    // Create startup script
    await this.createStartupScript();

    this.log('\n🎉 Ollama setup completed successfully!', 'success');
    this.log('\n📋 Next steps:', 'info');
    this.log('1. Start your Lumen application: npm run dev', 'info');
    this.log('2. Open the settings modal and switch to Ollama provider', 'info');
    this.log('3. Enjoy offline AI conversations!', 'info');
    this.log('\n💡 Tips:', 'info');
    this.log('- Use ./scripts/start-ollama.sh to start Ollama service', 'info');
    this.log('- Models are stored in ~/.ollama/models', 'info');
    this.log('- Visit http://localhost:11434 to verify Ollama is running', 'info');
    
    return true;
  }
}

// Run the setup if called directly
if (require.main === module) {
  const setup = new OllamaSetup();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = OllamaSetup;