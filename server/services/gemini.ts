import { GoogleGenAI } from "@google/genai";
import type { InsertAppIdea } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface BrutalAnalysis {
  verdict: "BUILD" | "BAIL";
  overall_score: number;
  market_reality: {
    score: number;
    analysis: string;
  };
  competition_analysis: {
    score: number;
    analysis: string;
  };
  technical_feasibility: {
    score: number;
    analysis: string;
  };
  monetization_reality: {
    score: number;
    analysis: string;
  };
  fatal_flaws: string[];
  time_saved_hours: number;
}

export interface ValidationAnalysis {
  score: number;
  verdict: "BUILD" | "BAIL" | "CAUTION";
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  detailedAnalysis: string;
  actionItems: string[];
}

export async function brutallyAnalyzeAppIdea(appIdea: InsertAppIdea): Promise<BrutalAnalysis> {
  const prompt = `You are a brutally honest startup advisor and technical expert known for destroying bad ideas with facts. A developer pitched this app idea: ${appIdea.description}

Target audience: ${appIdea.targetMarket}
Monetization plan: ${appIdea.budget}

Your job is to provide a harsh but constructive analysis. Return a JSON response with:

{
  "verdict": "BUILD" or "BAIL",
  "overall_score": 1-10,
  "market_reality": {
    "score": 1-10,
    "analysis": "Brutal honest assessment of market demand, size, and competition"
  },
  "competition_analysis": {
    "score": 1-10,
    "analysis": "Existing competitors and why this idea isn't unique enough"
  },
  "technical_feasibility": {
    "score": 1-10,
    "analysis": "Technical challenges and required expertise"
  },
  "monetization_reality": {
    "score": 1-10,
    "analysis": "Why their money-making plan won't work"
  },
  "fatal_flaws": ["list of major problems"],
  "time_saved_hours": estimated_hours_saved_by_not_building
}

Be extremely harsh. Only give BUILD verdict if genuinely promising. Use phrases like 'market reality check', 'competition crusher', 'technical difficulty bomb'. Include specific data and examples.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            verdict: { type: "string", enum: ["BUILD", "BAIL"] },
            overall_score: { type: "number" },
            market_reality: {
              type: "object",
              properties: {
                score: { type: "number" },
                analysis: { type: "string" }
              },
              required: ["score", "analysis"]
            },
            competition_analysis: {
              type: "object",
              properties: {
                score: { type: "number" },
                analysis: { type: "string" }
              },
              required: ["score", "analysis"]
            },
            technical_feasibility: {
              type: "object",
              properties: {
                score: { type: "number" },
                analysis: { type: "string" }
              },
              required: ["score", "analysis"]
            },
            monetization_reality: {
              type: "object",
              properties: {
                score: { type: "number" },
                analysis: { type: "string" }
              },
              required: ["score", "analysis"]
            },
            fatal_flaws: { type: "array", items: { type: "string" } },
            time_saved_hours: { type: "number" }
          },
          required: ["verdict", "overall_score", "market_reality", "competition_analysis", "technical_feasibility", "monetization_reality", "fatal_flaws", "time_saved_hours"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const analysis: BrutalAnalysis = JSON.parse(rawJson);
    
    // Validate the response structure
    if (!analysis.verdict || !analysis.overall_score) {
      throw new Error("Invalid response structure from Gemini API");
    }

    return analysis;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Failed to brutally analyze app idea: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function validateAppIdea(appIdea: InsertAppIdea): Promise<ValidationAnalysis> {
  // Get brutal analysis first
  const brutalAnalysis = await brutallyAnalyzeAppIdea(appIdea);
  
  // Transform to legacy format for compatibility
  const analysis: ValidationAnalysis = {
    score: brutalAnalysis.overall_score,
    verdict: brutalAnalysis.verdict === "BUILD" ? "BUILD" : "BAIL",
    strengths: brutalAnalysis.verdict === "BUILD" ? [
      brutalAnalysis.market_reality.analysis.split('.')[0],
      brutalAnalysis.technical_feasibility.analysis.split('.')[0]
    ] : [],
    weaknesses: brutalAnalysis.fatal_flaws,
    opportunities: brutalAnalysis.verdict === "BUILD" ? [
      brutalAnalysis.monetization_reality.analysis.split('.')[0],
      brutalAnalysis.competition_analysis.analysis.split('.')[0]
    ] : [],
    detailedAnalysis: `Market Reality: ${brutalAnalysis.market_reality.analysis}\n\nCompetition: ${brutalAnalysis.competition_analysis.analysis}\n\nTechnical: ${brutalAnalysis.technical_feasibility.analysis}\n\nMonetization: ${brutalAnalysis.monetization_reality.analysis}`,
    actionItems: brutalAnalysis.fatal_flaws.map((flaw, index) => `Address fatal flaw ${index + 1}: ${flaw}`)
  };

  return analysis;
}
