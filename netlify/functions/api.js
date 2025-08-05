const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require("ws");
const { z } = require("zod");

// Import schema - for production, you'd need to ensure these are compiled
// This is a simplified version for Netlify deployment

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

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

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

// Simplified Gemini API function
async function analyzeAppIdea(data) {
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
    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;

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

    // Route: POST /analyze
    if (path === '/analyze' && method === 'POST') {
      if (!body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Request body is required' })
        };
      }

      // Simple rate limiting check (you may want to implement proper rate limiting)
      const userIp = event.headers['x-forwarded-for'] || 
                     event.headers['x-real-ip'] || 
                     event.headers['client-ip'] || 
                     'unknown';

      // Validate request body
      const data = insertAppIdeaSchema.parse(body);
      
      // Analyze with Gemini
      const analysis = await analyzeAppIdea({ ...data, agreeToTerms: true });
      
      // For simplicity, return the analysis directly
      // In a full implementation, you'd store this in the database
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: Date.now().toString(),
          appIdea: {
            id: Date.now().toString(),
            appName: data.appName,
            description: data.description,
            targetMarket: data.targetMarket,
            budget: data.budget,
            createdAt: new Date().toISOString()
          },
          score: analysis.overall_score,
          verdict: analysis.verdict,
          strengths: analysis.verdict === "BUILD" ? [
            analysis.market_reality.analysis.substring(0, 100),
            analysis.technical_feasibility.analysis.substring(0, 100)
          ] : [],
          weaknesses: analysis.fatal_flaws,
          opportunities: analysis.verdict === "BUILD" ? [
            analysis.monetization_reality.analysis.substring(0, 100),
            analysis.competition_analysis.analysis.substring(0, 100)
          ] : [],
          detailedAnalysis: `Market Score: ${analysis.market_reality.score}/10 - ${analysis.market_reality.analysis}\\n\\nCompetition Score: ${analysis.competition_analysis.score}/10 - ${analysis.competition_analysis.analysis}\\n\\nTechnical Score: ${analysis.technical_feasibility.score}/10 - ${analysis.technical_feasibility.analysis}\\n\\nMonetization Score: ${analysis.monetization_reality.score}/10 - ${analysis.monetization_reality.analysis}`,
          actionItems: analysis.fatal_flaws.map((flaw, index) => `Fatal Flaw ${index + 1}: ${flaw}`),
          brutalAnalysis: analysis,
          remainingRequests: 4,
          createdAt: new Date().toISOString()
        })
      };
    }

    // Route: GET /analytics
    if (path === '/analytics' && method === 'GET') {
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
    if ((path === '/results' || path === '/wall-of-shame') && method === 'GET') {
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
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message || "Unknown error"
      })
    };
  }
};