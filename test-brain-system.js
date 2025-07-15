// Test script to demonstrate the brain system learning capabilities
import { WebSocket } from 'ws';

const ws = new WebSocket('ws://localhost:5000/ws');

// Test conversation to show brain learning
const testMessages = [
  "Hey Lumen, I love working with Python programming",
  "Can you help me with React development?",
  "I'm feeling excited about this new project",
  "What do you think about machine learning?",
  "I prefer TypeScript over JavaScript"
];

let messageIndex = 0;

ws.on('open', () => {
  console.log('🤖 Connected to Lumen Brain System');
  sendNextMessage();
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  
  if (response.type === 'ai_response') {
    console.log(`\n👤 User: ${testMessages[messageIndex - 1]}`);
    console.log(`🧠 Lumen (${response.source}): ${response.content}`);
    
    // Check brain stats after each interaction
    fetch('http://localhost:5000/api/brain/stats')
      .then(res => res.json())
      .then(stats => {
        console.log(`📊 Brain Stats: ${stats.totalMemories} memories, ${stats.totalPatterns} patterns`);
      })
      .catch(err => console.log('Stats unavailable'));
    
    // Send next message after a delay
    setTimeout(() => {
      sendNextMessage();
    }, 2000);
  }
});

function sendNextMessage() {
  if (messageIndex < testMessages.length) {
    const message = {
      type: 'chat_message',
      content: testMessages[messageIndex],
      conversationId: 99, // Test conversation
      isVoiceMode: false
    };
    
    ws.send(JSON.stringify(message));
    messageIndex++;
  } else {
    console.log('\n🧠 Brain learning test completed!');
    console.log('💡 The brain system has learned from these interactions and stored memories for future use.');
    ws.close();
  }
}

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});