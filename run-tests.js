#!/usr/bin/env node
// Test runner for BuildOrBail
import { runAPITests, healthCheck } from './tests/api.test.js';
import { runFrontendTests } from './tests/frontend.test.js';

console.log('🔥 BuildOrBail - Brutal Testing Suite 🔥\n');
console.log('Testing the app that crushes dreams and saves time...\n');

async function main() {
  try {
    // Check if server is running
    const serverHealthy = await healthCheck();
    if (!serverHealthy) {
      console.log('❌ Server is not available. Make sure to run: npm run dev');
      process.exit(1);
    }

    // Run all API tests
    await runAPITests();
    
    // Run frontend integration tests
    await runFrontendTests();
    
    console.log('\n✅ Complete testing suite finished! Your brutal analysis system is ready to destroy bad ideas.');
    
  } catch (error) {
    console.error('💥 Test suite crashed:', error.message);
    process.exit(1);
  }
}

main();