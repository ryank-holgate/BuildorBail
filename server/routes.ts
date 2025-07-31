import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppIdeaSchema } from "@shared/schema";
import { validateAppIdea, brutallyAnalyzeAppIdea } from "./services/gemini";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Brutal analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertAppIdeaSchema.parse(req.body);
      
      // Remove agreeToTerms before storing
      const { agreeToTerms, ...appIdeaData } = validatedData;
      
      // Create app idea
      const appIdea = await storage.createAppIdea(appIdeaData);
      
      // Get brutal AI analysis
      const analysis = await brutallyAnalyzeAppIdea(validatedData);
      
      // Store validation result (convert brutal analysis to legacy format)
      const validationResult = await storage.createValidationResult({
        appIdeaId: appIdea.id,
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
        detailedAnalysis: `Market Score: ${analysis.market_reality.score}/10 - ${analysis.market_reality.analysis}\n\nCompetition Score: ${analysis.competition_analysis.score}/10 - ${analysis.competition_analysis.analysis}\n\nTechnical Score: ${analysis.technical_feasibility.score}/10 - ${analysis.technical_feasibility.analysis}\n\nMonetization Score: ${analysis.monetization_reality.score}/10 - ${analysis.monetization_reality.analysis}`,
        actionItems: analysis.fatal_flaws.map((flaw, index) => `Fatal Flaw ${index + 1}: ${flaw}`)
      });
      
      // Return both brutal and legacy format
      res.json({
        ...validationResult,
        appIdea,
        brutalAnalysis: analysis
      });
      
    } catch (error) {
      console.error("Brutal analysis error:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid input data",
          errors: error.errors,
        });
      } else {
        res.status(500).json({
          message: error instanceof Error ? error.message : "Failed to brutally analyze app idea",
        });
      }
    }
  });
  
  // Submit app idea for validation (legacy endpoint)
  app.post("/api/validate", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertAppIdeaSchema.parse(req.body);
      
      // Remove agreeToTerms before storing
      const { agreeToTerms, ...appIdeaData } = validatedData;
      
      // Create app idea
      const appIdea = await storage.createAppIdea(appIdeaData);
      
      // Get AI validation
      const analysis = await validateAppIdea(validatedData);
      
      // Store validation result
      const validationResult = await storage.createValidationResult({
        appIdeaId: appIdea.id,
        score: analysis.score,
        verdict: analysis.verdict,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        opportunities: analysis.opportunities,
        detailedAnalysis: analysis.detailedAnalysis,
        actionItems: analysis.actionItems,
      });
      
      // Return result with app idea data
      res.json({
        ...validationResult,
        appIdea,
      });
      
    } catch (error) {
      console.error("Validation error:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid input data",
          errors: error.errors,
        });
      } else {
        res.status(500).json({
          message: error instanceof Error ? error.message : "Failed to validate app idea",
        });
      }
    }
  });
  
  // Get validation result by ID
  app.get("/api/results/:id", async (req, res) => {
    try {
      const result = await storage.getValidationResultWithIdea(req.params.id);
      
      if (!result) {
        res.status(404).json({ message: "Validation result not found" });
        return;
      }
      
      res.json(result);
    } catch (error) {
      console.error("Get result error:", error);
      res.status(500).json({
        message: "Failed to get validation result",
      });
    }
  });
  
  // Get all validation results
  app.get("/api/results", async (req, res) => {
    try {
      const results = await storage.getAllValidationResults();
      res.json(results);
    } catch (error) {
      console.error("Get results error:", error);
      res.status(500).json({
        message: "Failed to get validation results",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
