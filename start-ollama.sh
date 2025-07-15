#!/bin/bash

# Start Ollama service
echo "Starting Ollama service..."
OLLAMA_HOST=0.0.0.0:11434 ollama serve > ollama.log 2>&1 &

# Wait for service to start
sleep 5

# Check if service is running
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✓ Ollama service is running"
    
    # Download Llama 3.2 1B model (smaller, faster)
    echo "Downloading Llama 3.2 1B model..."
    ollama pull llama3.2:1b
    
    echo "✓ Llama 3.2 1B model ready for offline AI!"
else
    echo "✗ Failed to start Ollama service"
    exit 1
fi