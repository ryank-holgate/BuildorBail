import { GoogleGenAI } from "@google/genai";
import type { InsertAppIdea } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ValidationAnalysis {
  score: number;
  verdict: "BUILD" | "BAIL" | "CAUTION";
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  detailedAnalysis: string;
  actionItems: string[];
}

export async function validateAppIdea(appIdea: InsertAppIdea): Promise<ValidationAnalysis> {
  const systemPrompt = `You are a brutally honest app idea validator. Your job is to provide unfiltered, actionable feedback on app ideas to help entrepreneurs make informed decisions. 

Be BRUTALLY HONEST - no sugar-coating. Point out real market challenges, competition issues, and potential failures. But also highlight genuine opportunities and strengths.

Analyze the app idea across these dimensions:
- Market size and competition
- Technical feasibility and complexity  
- Revenue potential and business model viability
- User acquisition challenges
- Differentiation from existing solutions
- Execution risks

Provide a score from 1-10 (1 = absolute disaster, 10 = unicorn potential) and classify as:
- BUILD (7-10): Strong potential, recommend proceeding
- CAUTION (4-6): Proceed carefully with modifications
- BAIL (1-3): High risk, recommend avoiding

Format your response as JSON with this exact structure:
{
  "score": number,
  "verdict": "BUILD" | "BAIL" | "CAUTION",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...], 
  "opportunities": ["opportunity1", "opportunity2", ...],
  "detailedAnalysis": "comprehensive analysis paragraph",
  "actionItems": ["action1", "action2", ...]
}`;

  const userPrompt = `App Name: ${appIdea.appName}
Description: ${appIdea.description}
Target Market: ${appIdea.targetMarket}
Budget: ${appIdea.budget || "Not specified"}
Key Features: ${appIdea.features || "Not specified"}
Competition Analysis: ${appIdea.competition || "Not provided"}

Provide brutally honest validation of this app idea.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            verdict: { type: "string", enum: ["BUILD", "BAIL", "CAUTION"] },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            detailedAnalysis: { type: "string" },
            actionItems: { type: "array", items: { type: "string" } }
          },
          required: ["score", "verdict", "strengths", "weaknesses", "opportunities", "detailedAnalysis", "actionItems"]
        }
      },
      contents: userPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const analysis: ValidationAnalysis = JSON.parse(rawJson);
    
    // Validate the response structure
    if (!analysis.score || !analysis.verdict || !analysis.detailedAnalysis) {
      throw new Error("Invalid response structure from Gemini API");
    }

    return analysis;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Failed to validate app idea: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
