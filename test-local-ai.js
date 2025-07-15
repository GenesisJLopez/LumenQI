/**
 * Test script to verify Local AI functionality
 */

const testLocalAI = async () => {
  console.log('🧪 Testing Local AI Systems...\n');
  
  try {
    // Test Simple Local AI
    console.log('1. Testing Simple Local AI...');
    const { simpleLocalAI } = await import('./server/services/simple-local-ai.ts');
    
    const testResponse = await simpleLocalAI.generateResponse(
      "Hello Lumen, can you help me with coding?",
      [],
      [{ content: "User is learning JavaScript", context: "programming" }],
      "excited",
      false
    );
    
    console.log('✓ Simple Local AI Response:', testResponse.content);
    console.log('✓ Model:', testResponse.model);
    console.log('✓ Provider:', testResponse.provider);
    console.log('✓ Stats:', simpleLocalAI.getStats());
    
    // Test voice mode
    console.log('\n2. Testing Voice Mode...');
    const voiceResponse = await simpleLocalAI.generateResponse(
      "Tell me about the weather",
      [],
      [],
      "calm",
      true
    );
    
    console.log('✓ Voice Mode Response:', voiceResponse.content);
    console.log('✓ Response Length (should be limited):', voiceResponse.content.length);
    
    // Test AI Config Manager
    console.log('\n3. Testing AI Config Manager...');
    const { aiConfigManager } = await import('./server/services/ai-config.js');
    
    const providerStatus = await aiConfigManager.getProviderStatus();
    console.log('✓ Provider Status:', providerStatus);
    
    const activeAI = await aiConfigManager.getActiveAI();
    console.log('✓ Active AI Config:', activeAI.getConfig());
    
    // Test Local AI with different providers
    console.log('\n4. Testing Local AI Provider Selection...');
    const { LocalAI } = await import('./server/services/local-ai.js');
    
    const localAIConfig = {
      provider: 'local-python',
      model: 'simple-llama-3.2-1b',
      temperature: 0.7,
      maxTokens: 200
    };
    
    const localAI = new LocalAI(localAIConfig);
    
    const localResponse = await localAI.generateResponse(
      "What is machine learning?",
      [],
      [],
      undefined,
      false
    );
    
    console.log('✓ Local AI Response:', localResponse.content);
    console.log('✓ Local AI Usage:', localResponse.usage);
    
    // Test health check
    console.log('\n5. Testing Health Check...');
    const healthStatus = await localAI.healthCheck();
    console.log('✓ Health Status:', healthStatus);
    
    console.log('\n🎉 All Local AI tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

// Run the test
testLocalAI().catch(console.error);