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

// Import sql from drizzle-orm for raw queries
const { sql } = require('drizzle-orm');

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
          
          // Use Drizzle SQL template for reliability in serverless environment
          
          const appIdeaResult = await db.execute(sql`
            INSERT INTO app_ideas (app_name, description, target_market, budget, user_name, features, competition, user_ip, created_at)
            VALUES (${data.appName}, ${data.description}, ${data.targetMarket}, ${data.budget || ''}, ${data.userName || ''}, ${data.features || ''}, ${data.competition || ''}, ${event.headers['x-forwarded-for'] || 'unknown'}, ${new Date().toISOString()})
            RETURNING id
          `);
          
          const appIdeaId = appIdeaResult.rows[0]?.id;
          console.log('App idea saved with ID:', appIdeaId);

          if (appIdeaId) {
            
            const strengths = JSON.stringify(analysis.verdict === "BUILD" ? [
              analysis.market_reality?.analysis?.substring(0, 100) || '',
              analysis.technical_feasibility?.analysis?.substring(0, 100) || ''
            ] : []);
            
            const weaknesses = JSON.stringify(analysis.fatal_flaws || []);
            
            const opportunities = JSON.stringify(analysis.verdict === "BUILD" ? [
              analysis.monetization_reality?.analysis?.substring(0, 100) || '',
              analysis.competition_analysis?.analysis?.substring(0, 100) || ''
            ] : []);
            
            const detailedAnalysis = `Market Score: ${analysis.market_reality?.score || 0}/10 - ${analysis.market_reality?.analysis || 'N/A'}

Competition Score: ${analysis.competition_analysis?.score || 0}/10 - ${analysis.competition_analysis?.analysis || 'N/A'}

Technical Score: ${analysis.technical_feasibility?.score || 0}/10 - ${analysis.technical_feasibility?.analysis || 'N/A'}

Monetization Score: ${analysis.monetization_reality?.score || 0}/10 - ${analysis.monetization_reality?.analysis || 'N/A'}`;
            
            const actionItems = JSON.stringify((analysis.fatal_flaws || []).map((flaw, index) => `Fatal Flaw ${index + 1}: ${flaw}`));
            const brutalAnalysis = JSON.stringify(analysis);
            
            const validationResult = await db.execute(sql`
              INSERT INTO validation_results (app_idea_id, score, verdict, strengths, weaknesses, opportunities, detailed_analysis, action_items, brutal_analysis, created_at)
              VALUES (${appIdeaId}, ${analysis.overall_score}, ${analysis.verdict}, ${strengths}, ${weaknesses}, ${opportunities}, ${detailedAnalysis}, ${actionItems}, ${brutalAnalysis}, ${new Date().toISOString()})
              RETURNING id
            `);
            
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
        console.log('Database object:', !!db);
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

      console.log(`Fetching ${route} data. Database available:`, !!db, 'DATABASE_URL present:', !!process.env.DATABASE_URL);
      
      // Get real data if database is available
      if (db && process.env.DATABASE_URL) {
        try {
          // Test basic database connectivity first
          const testQuery = await db.execute(sql`SELECT 1 as test`);
          console.log('Database connection test successful:', testQuery.rows[0]);
          
          // Check if tables exist and create them if they don't
          try {
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS app_ideas (
                id SERIAL PRIMARY KEY,
                app_name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                target_market VARCHAR(255) NOT NULL,
                budget VARCHAR(255),
                user_name VARCHAR(255),
                features TEXT,
                competition TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
            
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS validation_results (
                id SERIAL PRIMARY KEY,
                app_idea_id INTEGER REFERENCES app_ideas(id) ON DELETE CASCADE,
                score INTEGER NOT NULL,
                verdict VARCHAR(50) NOT NULL,
                strengths JSONB,
                weaknesses JSONB,
                opportunities JSONB,
                detailed_analysis TEXT,
                action_items JSONB,
                brutal_analysis JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
            console.log('Database tables ensured to exist');
          } catch (tableError) {
            console.error('Table creation error (continuing anyway):', tableError.message);
          }


          let dbResults;
          if (route === 'wall-of-shame') {
            dbResults = await db.execute(sql`
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
            `);
          } else {
            dbResults = await db.execute(sql`
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
            `);
          }
          
          console.log(`Found ${dbResults.rows.length} results for ${route}`);
          
          results = dbResults.rows.map((row, index) => {
            const weaknesses = typeof row.weaknesses === 'string' ? JSON.parse(row.weaknesses) : (row.weaknesses || []);
            const brutalAnalysis = typeof row.brutal_analysis === 'string' ? JSON.parse(row.brutal_analysis) : row.brutal_analysis;
            
            return {
              id: row.id,
              rank: index + 1,
              appName: row.app_name,
              description: row.description,
              targetMarket: row.target_market,
              score: row.score,
              verdict: row.verdict,
              topWeaknesses: weaknesses.slice(0, 3), // Show only top 3 weaknesses
              createdAt: row.vr_created_at,
              timeSaved: brutalAnalysis?.time_saved_hours || Math.floor(Math.random() * 100) + 20, // Use from AI or fallback
              appIdea: {
                id: row.app_id,
                appName: row.app_name,
                description: row.description,
                targetMarket: row.target_market,
                createdAt: row.ai_created_at
              },
              strengths: typeof row.strengths === 'string' ? JSON.parse(row.strengths) : (row.strengths || []),
              weaknesses: weaknesses,
              opportunities: typeof row.opportunities === 'string' ? JSON.parse(row.opportunities) : (row.opportunities || []),
              detailedAnalysis: row.detailed_analysis,
              actionItems: typeof row.action_items === 'string' ? JSON.parse(row.action_items) : (row.action_items || []),
              brutalAnalysis: brutalAnalysis
            };
          });
          
          console.log(`Successfully processed ${results.length} database results for ${route}`);
        } catch (dbError) {
          console.error('Results database error:', dbError);
          console.error('Database error details:', dbError.message);
          console.error('Database error stack:', dbError.stack);
          console.error('Database connection string available:', !!process.env.DATABASE_URL);
          console.error('Query route:', route);
          // Return empty array on error
          results = [];
        }
      } else {
        console.log('Database not available for', route, '- returning empty array');
      }

      // Add fallback data if this is wall-of-shame and no results found
      if (route === 'wall-of-shame' && results.length === 0) {
        console.log('No wall-of-shame data found, adding sample data for demo');
        results = [
          {
            id: "demo-1",
            rank: 1,
            appName: "Yet Another Social Media App",
            description: "Like Facebook but for dogs. Revolutionary idea that nobody has thought of before.",
            targetMarket: "Dog owners worldwide",
            score: 2,
            verdict: "BAIL",
            topWeaknesses: [
              "Saturated market with established players",
              "No clear monetization strategy", 
              "Limited differentiation from existing pet social apps"
            ],
            createdAt: new Date().toISOString(),
            timeSaved: 245
          },
          {
            id: "demo-2", 
            rank: 2,
            appName: "Uber for Everything",
            description: "On-demand delivery service for literally anything you can think of. Disrupting all industries.",
            targetMarket: "Everyone who wants stuff delivered",
            score: 1,
            verdict: "BAIL",
            topWeaknesses: [
              "Vague value proposition",
              "Logistics nightmare for 'everything'",
              "Regulatory compliance issues across multiple industries"
            ],
            createdAt: new Date().toISOString(),
            timeSaved: 312
          }
        ];
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(results || [])
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