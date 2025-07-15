#!/bin/bash

# Start Ollama properly for Lumen QI
echo "Starting Ollama service..."

# Kill any existing ollama processes
pkill -f ollama || true

# Wait a moment
sleep 2

# Set environment variables
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS="*"

# Start ollama in background
echo "Starting Ollama server..."
nohup ollama serve > ollama.log 2>&1 &

# Wait for service to start
sleep 10

# Check if service is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama is running successfully!"
    
    # Pull Llama 3.2 1B model
    echo "Downloading Llama 3.2 1B model..."
    ollama pull llama3.2:1b
    
    # List available models
    echo "Available models:"
    ollama list
    
    echo "Ollama setup complete!"
else
    echo "Failed to start Ollama service"
    cat ollama.log
fi