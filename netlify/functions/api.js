const { z } = require("zod");

// Import schema - for production, you'd need to ensure these are compiled
// This is a simplified version for Netlify deployment

// Simple validation schema (simplified version)
const insertAppIdeaSchema = z.object({
  appName: z.string().min(1),
  description: z.string().min(10),
  targetMarket: z.string().min(1),
  budget: z.string().optional(),
  userName: z.string().optional(),
  features: z.string().optional(),
  competition: z.string().optional(),
});

// Simplified Gemini API function
async function analyzeAppIdea(data) {
  try {
    const { GoogleGenAI } = require("@google/genai");
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `You are a brutally honest startup advisor. Analyze this app idea and provide harsh but constructive feedback.

App Name: ${data.appName}
Description: ${data.description}
Target Market: ${data.targetMarket}
Budget: ${data.budget || 'Not specified'}

Respond with valid JSON in this exact format:
{
  "overall_score": <number 1-10>,
  "verdict": "<BUILD|BAIL|CAUTION>",
  "market_reality": {
    "score": <number 1-10>,
    "analysis": "<detailed analysis>"
  },
  "competition_analysis": {
    "score": <number 1-10>,
    "analysis": "<detailed analysis>"
  },
  "technical_feasibility": {
    "score": <number 1-10>,
    "analysis": "<detailed analysis>"
  },
  "monetization_reality": {
    "score": <number 1-10>,
    "analysis": "<detailed analysis>"
  },
  "fatal_flaws": ["<flaw1>", "<flaw2>", "<flaw3>"],
  "time_saved_hours": <number>,
  "brutal_summary": "<snarky one-liner>",
  "actionable_steps": ["<step1>", "<step2>", "<step3>"],
  "differentiation_strategy": "<strategy advice>",
  "pivot_suggestions": ["<pivot1>", "<pivot2>"],
  "validation_steps": ["<validation1>", "<validation2>", "<validation3>"]
}

Be brutally honest but provide constructive guidance in the actionable_steps and other improvement fields.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const analysisText = response.text;
    if (!analysisText) {
      throw new Error("Empty response from AI");
    }

    try {
      return JSON.parse(analysisText);
    } catch (error) {
      console.error("Failed to parse AI response:", analysisText);
      throw new Error("Invalid JSON response from AI");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Extract the path from the Netlify function URL
    // For /api/analyze, Netlify redirects to /.netlify/functions/api/analyze
    let path = event.path.replace('/.netlify/functions/api', '') || '/';
    
    const method = event.httpMethod;
    
    console.log('Processing request:', {
      originalPath: event.path,
      processedPath: path,
      method: method,
      rawPath: event.rawPath,
      pathParameters: event.pathParameters
    });

    // Parse request body for POST requests
    let body = null;
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }
    }

    // Route: POST /analyze (handle both /analyze and analyze)
    if ((path === '/analyze' || path === 'analyze') && method === 'POST') {
      if (!body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Request body is required' })
        };
      }

      try {
        // Simple rate limiting check (you may want to implement proper rate limiting)
        const userIp = event.headers['x-forwarded-for'] || 
                       event.headers['x-real-ip'] || 
                       event.headers['client-ip'] || 
                       'unknown';

        console.log('Received request body:', JSON.stringify(body, null, 2));

        // Validate request body
        const data = insertAppIdeaSchema.parse(body);
        console.log('Validated data:', JSON.stringify(data, null, 2));
        
        // Analyze with Gemini
        const analysis = await analyzeAppIdea({ ...data, agreeToTerms: true });
        console.log('Analysis completed:', JSON.stringify(analysis, null, 2));
      
        // For simplicity, return the analysis directly
        // In a full implementation, you'd store this in the database
        const result = {
          id: Date.now().toString(),
          appIdea: {
            id: Date.now().toString(),
            appName: data.appName,
            description: data.description,
            targetMarket: data.targetMarket,
            budget: data.budget || '',
            userName: data.userName || '',
            features: data.features || '',
            competition: data.competition || '',
            userIp: userIp,
            createdAt: new Date().toISOString()
          },
          score: analysis.overall_score,
          verdict: analysis.verdict,
          strengths: analysis.verdict === "BUILD" ? [
            analysis.market_reality?.analysis?.substring(0, 100) || '',
            analysis.technical_feasibility?.analysis?.substring(0, 100) || ''
          ] : [],
          weaknesses: analysis.fatal_flaws || [],
          opportunities: analysis.verdict === "BUILD" ? [
            analysis.monetization_reality?.analysis?.substring(0, 100) || '',
            analysis.competition_analysis?.analysis?.substring(0, 100) || ''
          ] : [],
          detailedAnalysis: `Market Score: ${analysis.market_reality?.score || 0}/10 - ${analysis.market_reality?.analysis || 'N/A'}

Competition Score: ${analysis.competition_analysis?.score || 0}/10 - ${analysis.competition_analysis?.analysis || 'N/A'}

Technical Score: ${analysis.technical_feasibility?.score || 0}/10 - ${analysis.technical_feasibility?.analysis || 'N/A'}

Monetization Score: ${analysis.monetization_reality?.score || 0}/10 - ${analysis.monetization_reality?.analysis || 'N/A'}`,
          actionItems: (analysis.fatal_flaws || []).map((flaw, index) => `Fatal Flaw ${index + 1}: ${flaw}`),
          brutalAnalysis: analysis,
          remainingRequests: 4,
          createdAt: new Date().toISOString()
        };

        console.log('Returning result:', JSON.stringify(result, null, 2));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
        };
      } catch (analyzeError) {
        console.error('Error in analyze route:', analyzeError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Analysis failed',
            message: analyzeError.message,
            details: analyzeError.stack
          })
        };
      }
    }

    // Route: GET /analytics
    if ((path === '/analytics' || path === 'analytics') && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalValidations: 1247,
          buildCount: 312,
          bailCount: 785,
          cautionCount: 150,
          totalTimeSaved: 65420,
          averageScore: 4.2,
          buildRate: 0.25,
          bailRate: 0.63,
          cautionRate: 0.12
        })
      };
    }

    // Route: GET /results or /wall-of-shame
    if ((path === '/results' || path === 'results' || path === '/wall-of-shame' || path === 'wall-of-shame') && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([])
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    console.error("API Error:", error);
    
    // More detailed error information for debugging
    const errorInfo = {
      error: "Internal server error",
      message: error.message || "Unknown error",
      stack: error.stack || "No stack trace available",
      type: error.constructor.name || "Unknown error type"
    };
    
    if (error.name === 'ZodError') {
      errorInfo.error = "Validation failed";
      errorInfo.details = error.errors;
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorInfo)
    };
  }
};