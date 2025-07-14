#!/usr/bin/env node

/**
 * Test Custom AI Engine Integration
 * Quick test to verify the custom AI engine is working with Lumen
 */

const { spawn } = require('child_process');
const WebSocket = require('ws');

console.log('🧠 Testing Custom AI Engine Integration...');

// Wait for server to start
setTimeout(() => {
  console.log('📡 Connecting to Lumen server...');
  
  const ws = new WebSocket('ws://localhost:5000');
  
  ws.on('open', () => {
    console.log('✅ Connected to Lumen server');
    
    // Test conversation
    const testMessage = {
      type: 'chat_message',
      content: 'Hello! Are you using the custom AI engine?',
      conversationId: 1,
      isVoiceMode: false
    };
    
    console.log('🗣️  Sending test message:', testMessage.content);
    ws.send(JSON.stringify(testMessage));
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'ai_response') {
      console.log('🤖 AI Response:', message.content);
      console.log('✅ Custom AI engine is working!');
      
      // Test another message
      const testMessage2 = {
        type: 'chat_message',
        content: 'Can you write a simple React component?',
        conversationId: 1,
        isVoiceMode: false
      };
      
      console.log('🗣️  Sending coding test:', testMessage2.content);
      ws.send(JSON.stringify(testMessage2));
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('👋 Connection closed');
    process.exit(0);
  });
  
  // Close after 30 seconds
  setTimeout(() => {
    console.log('🔄 Test completed');
    ws.close();
  }, 30000);
  
}, 5000);