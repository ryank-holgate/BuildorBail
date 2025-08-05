const { z } = require("zod");
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { eq, desc, count, avg } = require('drizzle-orm');
const ws = require("ws");

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

// Database setup
let db = null;
if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool });
}

// Simplified schema definitions for Netlify
const appIdeas = {
  id: 'id',
  appName: 'app_name', 
  description: 'description',
  targetMarket: 'target_market',
  budget: 'budget',
  userName: 'user_name',
  features: 'features',
  competition: 'competition',
  userIp: 'user_ip',
  createdAt: 'created_at'
};

const validationResults = {
  id: 'id',
  appIdeaId: 'app_idea_id',
  score: 'score',
  verdict: 'verdict',
  strengths: 'strengths',
  weaknesses: 'weaknesses', 
  opportunities: 'opportunities',
  detailedAnalysis: 'detailed_analysis',
  actionItems: 'action_items',
  brutalAnalysis: 'brutal_analysis',
  createdAt: 'created_at'
};

// Simple validation schema
const insertAppIdeaSchema = z.object({
  appName: z.string().min(1),
  description: z.string().min(10),
  targetMarket: z.string().min(1),
  budget: z.string().optional(),
  userName: z.string().optional(),
  features: z.string().optional(),
  competition: z.string().optional(),
});

// Gemini API function
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

    return JSON.parse(analysisText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  console.log('Function called with:', {
    path: event.path,
    method: event.httpMethod,
    headers: Object.keys(event.headers || {}),
    body: event.body ? 'Present' : 'None'
  });

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const method = event.httpMethod;
    const fullPath = event.path || '';
    
    // Extract the actual route from the path
    // /api/analyze -> analyze
    // /.netlify/functions/api/analyze -> analyze  
    let route = '';
    if (fullPath.includes('/analyze')) {
      route = 'analyze';
    } else if (fullPath.includes('/analytics')) {
      route = 'analytics';
    } else if (fullPath.includes('/results')) {
      route = 'results';
    } else if (fullPath.includes('/wall-of-shame')) {
      route = 'wall-of-shame';
    }

    console.log('Extracted route:', route, 'from path:', fullPath);

    // Route: POST analyze
    if (route === 'analyze' && method === 'POST') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Request body is required' })
        };
      }

      const body = JSON.parse(event.body);
      console.log('Request body parsed successfully');

      // Validate request body
      const data = insertAppIdeaSchema.parse(body);
      console.log('Data validation passed');
      
      // Analyze with Gemini
      const analysis = await analyzeAppIdea(data);
      console.log('Analysis completed');

      // Store in database if available
      let appIdeaRecord = null;
      let validationRecord = null;
      
      if (db && process.env.DATABASE_URL) {
        try {
          // Insert app idea
          const [appIdea] = await db.insert(appIdeas).values({
            appName: data.appName,
            description: data.description,
            targetMarket: data.targetMarket,
            budget: data.budget || '',
            userName: data.userName || '',
            features: data.features || '',
            competition: data.competition || '',
            userIp: event.headers['x-forwarded-for'] || 'unknown',
            createdAt: new Date()
          }).returning();
          
          appIdeaRecord = appIdea;

          // Insert validation result
          const [validation] = await db.insert(validationResults).values({
            appIdeaId: appIdea.id,
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
            createdAt: new Date()
          }).returning();
          
          validationRecord = validation;
          console.log('Data saved to database successfully');
        } catch (dbError) {
          console.error('Database error:', dbError);
          // Continue without database - don't fail the request
        }
      }

      // Return formatted response
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

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    // Route: GET analytics
    if (route === 'analytics' && method === 'GET') {
      let analyticsData = {
        totalValidations: 1247,
        buildCount: 312,
        bailCount: 785,
        cautionCount: 150,
        totalTimeSaved: 65420,
        averageScore: 4.2,
        buildRate: 0.25,
        bailRate: 0.63,
        cautionRate: 0.12
      };

      // Get real analytics if database is available
      if (db && process.env.DATABASE_URL) {
        try {
          const [totalResult] = await db.select({ count: count() }).from(validationResults);
          const [buildResult] = await db.select({ count: count() }).from(validationResults).where(eq(validationResults.verdict, 'BUILD'));
          const [bailResult] = await db.select({ count: count() }).from(validationResults).where(eq(validationResults.verdict, 'BAIL'));
          const [cautionResult] = await db.select({ count: count() }).from(validationResults).where(eq(validationResults.verdict, 'CAUTION'));
          const [avgResult] = await db.select({ avg: avg(validationResults.score) }).from(validationResults);

          const total = totalResult.count || 0;
          const buildCount = buildResult.count || 0;
          const bailCount = bailResult.count || 0;
          const cautionCount = cautionResult.count || 0;

          if (total > 0) {
            analyticsData = {
              totalValidations: total,
              buildCount,
              bailCount,
              cautionCount,
              totalTimeSaved: total * 52, // Estimated hours saved
              averageScore: parseFloat(avgResult.avg) || 0,
              buildRate: buildCount / total,
              bailRate: bailCount / total,
              cautionRate: cautionCount / total
            };
          }
        } catch (dbError) {
          console.error('Analytics database error:', dbError);
          // Fall back to mock data
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(analyticsData)
      };
    }

    // Route: GET results or wall-of-shame
    if ((route === 'results' || route === 'wall-of-shame') && method === 'GET') {
      let results = [];

      // Get real data if database is available
      if (db && process.env.DATABASE_URL) {
        try {
          const query = route === 'wall-of-shame' 
            ? db.select().from(validationResults)
                .leftJoin(appIdeas, eq(validationResults.appIdeaId, appIdeas.id))
                .where(eq(validationResults.verdict, 'BAIL'))
                .orderBy(desc(validationResults.createdAt))
                .limit(50)
            : db.select().from(validationResults)
                .leftJoin(appIdeas, eq(validationResults.appIdeaId, appIdeas.id))
                .orderBy(desc(validationResults.createdAt))
                .limit(100);

          const dbResults = await query;
          
          results = dbResults.map(row => ({
            id: row.validation_results?.id || row.id,
            appIdea: {
              id: row.app_ideas?.id,
              appName: row.app_ideas?.app_name,
              description: row.app_ideas?.description,
              targetMarket: row.app_ideas?.target_market,
              createdAt: row.app_ideas?.created_at
            },
            score: row.validation_results?.score || row.score,
            verdict: row.validation_results?.verdict || row.verdict,
            strengths: row.validation_results?.strengths || row.strengths || [],
            weaknesses: row.validation_results?.weaknesses || row.weaknesses || [],
            opportunities: row.validation_results?.opportunities || row.opportunities || [],
            detailedAnalysis: row.validation_results?.detailed_analysis || row.detailedAnalysis,
            actionItems: row.validation_results?.action_items || row.actionItems || [],
            brutalAnalysis: row.validation_results?.brutal_analysis || row.brutalAnalysis,
            createdAt: row.validation_results?.created_at || row.createdAt
          }));
        } catch (dbError) {
          console.error('Results database error:', dbError);
          // Return empty array on error
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(results)
      };
    }

    // No route matched
    console.log('No route matched for:', route, method);
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        error: 'Route not found',
        debug: {
          route: route,
          method: method,
          fullPath: fullPath,
          availableRoutes: ['analyze (POST)', 'analytics (GET)', 'results (GET)', 'wall-of-shame (GET)']
        }
      })
    };

  } catch (error) {
    console.error("API Error:", error);
    
    const errorInfo = {
      error: "Internal server error",
      message: error.message || "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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