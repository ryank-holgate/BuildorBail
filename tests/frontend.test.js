// Frontend Integration Tests for BuildOrBail
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testFrontendLoading() {
  console.log('Testing Frontend Loading...');
  
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      const html = await response.text();
      
      // Check for key elements that should be in the brutal interface
      const checks = [
        { name: 'Title contains BuildOrBail', test: html.includes('BuildOrBail') },
        { name: 'Dark theme styles present', test: html.includes('dark:') || html.includes('bg-black') },
        { name: 'React root element present', test: html.includes('root') },
        { name: 'Main CSS loaded', test: html.includes('index.css') || html.includes('style') },
      ];
      
      let passed = 0;
      checks.forEach(check => {
        if (check.test) {
          console.log(`✅ ${check.name}`);
          passed++;
        } else {
          console.log(`❌ ${check.name}`);
        }
      });
      
      console.log(`Frontend loading: ${passed}/${checks.length} checks passed\n`);
      return passed === checks.length;
      
    } else {
      console.log(`❌ Frontend failed to load: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Frontend loading error: ${error.message}`);
    return false;
  }
}

async function testCompleteUserFlow() {
  console.log('Testing Complete User Flow...');
  
  const testIdea = {
    appName: 'TestApp',
    description: 'A test application for automated testing purposes.',
    targetMarket: 'Test users',
    budget: 'Test budget',
    agreeToTerms: true
  };
  
  try {
    // Step 1: Submit idea for analysis
    console.log('Step 1: Submitting idea for brutal analysis...');
    const analysisResponse = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testIdea)
    });
    
    if (!analysisResponse.ok) {
      throw new Error(`Analysis failed: ${analysisResponse.status}`);
    }
    
    const result = await analysisResponse.json();
    console.log(`✅ Analysis complete - Verdict: ${result.verdict}, Score: ${result.score}/10`);
    
    // Step 2: Verify result can be retrieved
    console.log('Step 2: Retrieving analysis result...');
    const retrieveResponse = await fetch(`${BASE_URL}/api/results/${result.id}`);
    
    if (!retrieveResponse.ok) {
      throw new Error(`Retrieval failed: ${retrieveResponse.status}`);
    }
    
    const retrievedResult = await retrieveResponse.json();
    console.log(`✅ Result retrieved successfully - ID: ${retrievedResult.id}`);
    
    // Step 3: Check all results endpoint
    console.log('Step 3: Testing results listing...');
    const allResultsResponse = await fetch(`${BASE_URL}/api/results`);
    
    if (!allResultsResponse.ok) {
      throw new Error(`Results listing failed: ${allResultsResponse.status}`);
    }
    
    const allResults = await allResultsResponse.json();
    console.log(`✅ Results listing works - Found ${allResults.length} total results`);
    
    console.log('✅ Complete user flow test passed!\n');
    return true;
    
  } catch (error) {
    console.log(`❌ User flow test failed: ${error.message}\n`);
    return false;
  }
}

async function testErrorHandling() {
  console.log('Testing Error Handling...');
  
  const errorTests = [
    {
      name: 'Empty request body',
      data: {},
      expectedStatus: 400
    },
    {
      name: 'Terms not agreed',
      data: {
        appName: 'Test',
        description: 'Test',
        targetMarket: 'Test',
        agreeToTerms: false
      },
      expectedStatus: 400
    },
    {
      name: 'Missing required fields',
      data: {
        appName: 'Test',
        agreeToTerms: true
      },
      expectedStatus: 400
    }
  ];
  
  let passed = 0;
  
  for (const test of errorTests) {
    try {
      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.data)
      });
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name} - correctly returned ${response.status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - expected ${test.expectedStatus}, got ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - request failed: ${error.message}`);
    }
  }
  
  console.log(`Error handling: ${passed}/${errorTests.length} tests passed\n`);
  return passed === errorTests.length;
}

export async function runFrontendTests() {
  console.log('🎯 Frontend & Integration Testing\n');
  
  const results = {
    frontend: await testFrontendLoading(),
    userFlow: await testCompleteUserFlow(),
    errorHandling: await testErrorHandling()
  };
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`📊 Frontend Test Results: ${passedTests}/${totalTests} test suites passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All frontend tests passed! The brutal analysis system is fully functional.');
  } else {
    console.log('⚠️ Some frontend tests failed. Check the issues above.');
  }
  
  return results;
}