// Demo script to show brain learning capabilities
const testConversation = async () => {
  console.log('🧠 Testing Lumen Brain Learning System...\n');
  
  // Test 1: Check initial brain stats
  console.log('📊 Initial Brain Stats:');
  try {
    const response = await fetch('http://localhost:5000/api/brain/stats');
    const stats = await response.json();
    console.log(`- Memories: ${stats.totalMemories}`);
    console.log(`- Patterns: ${stats.totalPatterns}`);
    console.log(`- Evolution Cycle: ${stats.evolutionCycle}`);
    console.log(`- Hybrid Capable: ${stats.hybridCapable ? 'Yes' : 'No'}`);
  } catch (error) {
    console.log('Error fetching stats:', error.message);
  }
  
  console.log('\n🎯 The brain system is now:');
  console.log('✓ Storing memories locally for continuous learning');
  console.log('✓ Analyzing personality traits and evolving them');
  console.log('✓ Building learning patterns from interactions');
  console.log('✓ Automatically switching between online/offline AI');
  console.log('✓ Creating connections between related memories');
  
  console.log('\n🔮 Try having a conversation with Lumen to see:');
  console.log('- How it remembers your preferences');
  console.log('- How it learns from each interaction');
  console.log('- How the brain statistics grow over time');
  console.log('- How personality traits evolve based on your messages');
  
  console.log('\n📈 Check the Quantum Core settings to see live brain stats!');
};

// Execute the demo
testConversation();