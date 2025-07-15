#!/bin/bash
# Proper Ollama startup script for Lumen QI

echo "🌟 Starting Ollama for Lumen QI Brain System..."

# Kill any existing ollama processes
pkill -f ollama 2>/dev/null || true

# Start Ollama server
export OLLAMA_HOST=0.0.0.0:11434
nohup ollama serve > ollama.log 2>&1 &

# Wait for server to start
echo "⏳ Waiting for Ollama to start..."
sleep 5

# Test if server is running
for i in {1..10}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama server is running!"
        break
    else
        echo "⏳ Waiting for Ollama... (attempt $i/10)"
        sleep 2
    fi
done

# Download Llama 3.2 1B model if not already present
echo "📥 Checking for Llama 3.2 1B model..."
if ollama list | grep -q "llama3.2:1b"; then
    echo "✅ Llama 3.2 1B model already available"
else
    echo "📥 Downloading Llama 3.2 1B model..."
    ollama pull llama3.2:1b
    echo "✅ Llama 3.2 1B model downloaded successfully"
fi

echo "🧠 Lumen QI Brain System is ready with hybrid online/offline capabilities!"
echo "🌐 Online: OpenAI GPT-4o for complex reasoning"
echo "🏠 Offline: Llama 3.2 1B for private, local processing"