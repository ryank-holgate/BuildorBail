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

// Use Drizzle table definitions instead of simplified objects
const { sql } = require('drizzle-orm');

// Define table schemas that match your database
const appIdeas = sql`app_ideas`;
const validationResults = sql`validation_results`;

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
          console.log('Attempting to save to database...');
          
          // Use raw SQL for reliability in serverless environment
          const appIdeaQuery = `
            INSERT INTO app_ideas (app_name, description, target_market, budget, user_name, features, competition, user_ip, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
          `;
          
          const appIdeaResult = await db.execute(sql.raw(appIdeaQuery, [
            data.appName,
            data.description,
            data.targetMarket,
            data.budget || '',
            data.userName || '',
            data.features || '',
            data.competition || '',
            event.headers['x-forwarded-for'] || 'unknown',
            new Date().toISOString()
          ]));
          
          const appIdeaId = appIdeaResult.rows[0]?.id;
          console.log('App idea saved with ID:', appIdeaId);

          if (appIdeaId) {
            const validationQuery = `
              INSERT INTO validation_results (app_idea_id, score, verdict, strengths, weaknesses, opportunities, detailed_analysis, action_items, brutal_analysis, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              RETURNING id
            `;
            
            const validationResult = await db.execute(sql.raw(validationQuery, [
              appIdeaId,
              analysis.overall_score,
              analysis.verdict,
              JSON.stringify(analysis.verdict === "BUILD" ? [
                analysis.market_reality?.analysis?.substring(0, 100) || '',
                analysis.technical_feasibility?.analysis?.substring(0, 100) || ''
              ] : []),
              JSON.stringify(analysis.fatal_flaws || []),
              JSON.stringify(analysis.verdict === "BUILD" ? [
                analysis.monetization_reality?.analysis?.substring(0, 100) || '',
                analysis.competition_analysis?.analysis?.substring(0, 100) || ''
              ] : []),
              `Market Score: ${analysis.market_reality?.score || 0}/10 - ${analysis.market_reality?.analysis || 'N/A'}

Competition Score: ${analysis.competition_analysis?.score || 0}/10 - ${analysis.competition_analysis?.analysis || 'N/A'}

Technical Score: ${analysis.technical_feasibility?.score || 0}/10 - ${analysis.technical_feasibility?.analysis || 'N/A'}

Monetization Score: ${analysis.monetization_reality?.score || 0}/10 - ${analysis.monetization_reality?.analysis || 'N/A'}`,
              JSON.stringify((analysis.fatal_flaws || []).map((flaw, index) => `Fatal Flaw ${index + 1}: ${flaw}`)),
              JSON.stringify(analysis),
              new Date().toISOString()
            ]));
            
            console.log('Validation result saved with ID:', validationResult.rows[0]?.id);
          }
          
          console.log('Data saved to database successfully');
        } catch (dbError) {
          console.error('Database error:', dbError);
          console.error('Database error details:', dbError.message, dbError.stack);
          // Continue without database - don't fail the request
        }
      } else {
        console.log('Database not available - DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');
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
          const totalQuery = await db.execute(sql`SELECT COUNT(*) as count FROM validation_results`);
          const buildQuery = await db.execute(sql`SELECT COUNT(*) as count FROM validation_results WHERE verdict = 'BUILD'`);
          const bailQuery = await db.execute(sql`SELECT COUNT(*) as count FROM validation_results WHERE verdict = 'BAIL'`);
          const cautionQuery = await db.execute(sql`SELECT COUNT(*) as count FROM validation_results WHERE verdict = 'CAUTION'`);
          const avgQuery = await db.execute(sql`SELECT AVG(score) as avg FROM validation_results`);

          const total = parseInt(totalQuery.rows[0]?.count) || 0;
          const buildCount = parseInt(buildQuery.rows[0]?.count) || 0;
          const bailCount = parseInt(bailQuery.rows[0]?.count) || 0;
          const cautionCount = parseInt(cautionQuery.rows[0]?.count) || 0;

          if (total > 0) {
            analyticsData = {
              totalValidations: total,
              buildCount,
              bailCount,
              cautionCount,
              totalTimeSaved: total * 52, // Estimated hours saved
              averageScore: parseFloat(avgQuery.rows[0]?.avg) || 0,
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
          const wallOfShameQuery = `
            SELECT 
              vr.id, vr.score, vr.verdict, vr.strengths, vr.weaknesses, 
              vr.opportunities, vr.detailed_analysis, vr.action_items, 
              vr.brutal_analysis, vr.created_at as vr_created_at,
              ai.id as app_id, ai.app_name, ai.description, 
              ai.target_market, ai.created_at as ai_created_at
            FROM validation_results vr
            LEFT JOIN app_ideas ai ON vr.app_idea_id = ai.id
            WHERE vr.verdict = 'BAIL'
            ORDER BY vr.created_at DESC
            LIMIT 50
          `;
          
          const allResultsQuery = `
            SELECT 
              vr.id, vr.score, vr.verdict, vr.strengths, vr.weaknesses, 
              vr.opportunities, vr.detailed_analysis, vr.action_items, 
              vr.brutal_analysis, vr.created_at as vr_created_at,
              ai.id as app_id, ai.app_name, ai.description, 
              ai.target_market, ai.created_at as ai_created_at
            FROM validation_results vr
            LEFT JOIN app_ideas ai ON vr.app_idea_id = ai.id
            ORDER BY vr.created_at DESC
            LIMIT 100
          `;

          const query = route === 'wall-of-shame' ? wallOfShameQuery : allResultsQuery;
          const dbResults = await db.execute(sql.raw(query));
          
          console.log(`Found ${dbResults.rows.length} results for ${route}`);
          
          results = dbResults.rows.map(row => ({
            id: row.id,
            appIdea: {
              id: row.app_id,
              appName: row.app_name,
              description: row.description,
              targetMarket: row.target_market,
              createdAt: row.ai_created_at
            },
            score: row.score,
            verdict: row.verdict,
            strengths: typeof row.strengths === 'string' ? JSON.parse(row.strengths) : (row.strengths || []),
            weaknesses: typeof row.weaknesses === 'string' ? JSON.parse(row.weaknesses) : (row.weaknesses || []),
            opportunities: typeof row.opportunities === 'string' ? JSON.parse(row.opportunities) : (row.opportunities || []),
            detailedAnalysis: row.detailed_analysis,
            actionItems: typeof row.action_items === 'string' ? JSON.parse(row.action_items) : (row.action_items || []),
            brutalAnalysis: typeof row.brutal_analysis === 'string' ? JSON.parse(row.brutal_analysis) : row.brutal_analysis,
            createdAt: row.vr_created_at
          }));
        } catch (dbError) {
          console.error('Results database error:', dbError);
          console.error('Results database error details:', dbError.message);
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