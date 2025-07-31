// API Integration Tests for BuildOrBail
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test data for various scenarios
const testCases = [
  {
    name: 'Strong App Idea - Should BUILD',
    data: {
      appName: 'HealthTracker Pro',
      description: 'A comprehensive health tracking app that uses AI to analyze medical data, connects with all major fitness devices, and provides personalized health insights backed by clinical research.',
      targetMarket: 'Health-conscious adults and chronic disease patients',
      budget: 'Freemium with premium subscription',
      agreeToTerms: true
    },
    expectedVerdict: 'BUILD'
  },
  {
    name: 'Terrible App Idea - Should BAIL',
    data: {
      appName: 'CryptoSocks',
      description: 'A subscription service that sends you crypto-themed socks every month. Each sock has a QR code that links to fake crypto coins.',
      targetMarket: 'Crypto enthusiasts',
      budget: 'Subscription fees',
      agreeToTerms: true
    },
    expectedVerdict: 'BAIL'
  },
  {
    name: 'Another Bad Idea - Should BAIL',
    data: {
      appName: 'Pet Rock 2.0',
      description: 'Digital pet rocks with NFT ownership certificates and blockchain-verified lineage tracking.',
      targetMarket: 'NFT collectors',
      budget: 'NFT sales',
      agreeToTerms: true
    },
    expectedVerdict: 'BAIL'
  }
];

async function runAPITests() {
  console.log('🚀 Starting BuildOrBail API Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`App: ${testCase.data.appName}`);
    
    try {
      totalTests++;
      const startTime = Date.now();
      
      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Validate response structure
      const requiredFields = ['verdict', 'score', 'brutalAnalysis', 'appIdeaId'];
      const missingFields = requiredFields.filter(field => !(field in result));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate verdict
      if (!['BUILD', 'BAIL'].includes(result.verdict)) {
        throw new Error(`Invalid verdict: ${result.verdict}. Expected BUILD or BAIL`);
      }

      // Validate score
      if (typeof result.score !== 'number' || result.score < 0 || result.score > 10) {
        throw new Error(`Invalid score: ${result.score}. Expected number between 0-10`);
      }

      // Validate brutal analysis structure
      const analysis = result.brutalAnalysis;
      const requiredAnalysisFields = ['market_reality', 'competition_analysis', 'technical_feasibility', 'monetization_reality', 'fatal_flaws', 'time_saved_hours'];
      const missingAnalysisFields = requiredAnalysisFields.filter(field => !(field in analysis));
      
      if (missingAnalysisFields.length > 0) {
        throw new Error(`Missing analysis fields: ${missingAnalysisFields.join(', ')}`);
      }

      // Validate each analysis section has score and analysis
      ['market_reality', 'competition_analysis', 'technical_feasibility', 'monetization_reality'].forEach(section => {
        if (!analysis[section].score || !analysis[section].analysis) {
          throw new Error(`Invalid ${section}: missing score or analysis`);
        }
      });

      // Validate fatal flaws is an array
      if (!Array.isArray(analysis.fatal_flaws)) {
        throw new Error('Fatal flaws must be an array');
      }

      // Validate time saved is a number
      if (typeof analysis.time_saved_hours !== 'number') {
        throw new Error('Time saved hours must be a number');
      }

      console.log(`✅ PASSED - Verdict: ${result.verdict}, Score: ${result.score}/10, Time: ${responseTime}ms`);
      console.log(`   Fatal Flaws: ${analysis.fatal_flaws.length}, Time Saved: ${analysis.time_saved_hours}h`);
      passedTests++;
      
    } catch (error) {
      console.log(`❌ FAILED - ${error.message}`);
    }
    
    console.log('---');
  }

  // Test invalid requests
  console.log('Testing invalid requests...');
  
  try {
    totalTests++;
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appName: '', // Empty name should fail
        description: 'Test',
        agreeToTerms: false // Should fail
      })
    });

    if (response.ok) {
      console.log('❌ FAILED - Should have rejected invalid request');
    } else {
      console.log('✅ PASSED - Correctly rejected invalid request');
      passedTests++;
    }
  } catch (error) {
    console.log('✅ PASSED - Correctly rejected invalid request');
    passedTests++;
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The brutal analysis system is working perfectly.');
  } else {
    console.log('⚠️  Some tests failed. Check the issues above.');
  }
}

// Health check test
async function healthCheck() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Server health check passed');
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not running or unreachable');
    return false;
  }
}

// Run tests
async function main() {
  console.log('BuildOrBail Automated Test Suite\n');
  
  const serverHealthy = await healthCheck();
  if (!serverHealthy) {
    console.log('Server is not available. Make sure the app is running on port 5000.');
    process.exit(1);
  }
  
  await runAPITests();
}

export { runAPITests, healthCheck };