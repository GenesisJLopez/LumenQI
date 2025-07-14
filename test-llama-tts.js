/**
 * Test Llama TTS Integration
 * Quick test to verify the Llama TTS system is working with Nova voice
 */

const { llamaTTSService } = require('./server/services/llama-tts');

async function testLlamaTTS() {
  console.log('🧪 Testing Llama TTS Service...');
  
  try {
    // Test initialization
    console.log('🔧 Initializing service...');
    await llamaTTSService.initialize();
    
    // Test health check
    console.log('❤️ Testing health check...');
    const health = await llamaTTSService.healthCheck();
    console.log('Health status:', health);
    
    // Test voice synthesis
    console.log('🎤 Testing voice synthesis...');
    const testText = "Hello! I'm Lumen, and I'm testing my new Nova-quality voice powered by Llama 3. How do I sound?";
    
    const audioResponse = await llamaTTSService.synthesizeVoice(testText, {
      voice: 'nova',
      emotionalTone: 'warm',
      speed: 1.0,
      pitch: 1.0,
      temperature: 0.7,
      model: 'llasa-3b'
    });
    
    console.log('✅ Voice synthesis successful!');
    console.log('Audio details:', {
      duration: audioResponse.duration,
      sampleRate: audioResponse.sampleRate,
      format: audioResponse.format,
      provider: audioResponse.provider,
      model: audioResponse.model,
      bufferSize: audioResponse.audioBuffer.length
    });
    
  } catch (error) {
    console.error('❌ TTS test failed:', error);
    
    // Test fallback system
    console.log('🔄 Testing fallback system...');
    try {
      const fallbackHealth = await llamaTTSService.healthCheck();
      console.log('Fallback health:', fallbackHealth);
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
  }
}

// Run the test
testLlamaTTS().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});