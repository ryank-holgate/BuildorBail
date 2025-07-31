import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppIdeaSchema } from "@shared/schema";
import { validateAppIdea } from "./services/gemini";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Submit app idea for validation
  app.post("/api/validate", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertAppIdeaSchema.parse(req.body);
      
      // Remove agreeToTerms before storing
      const { agreeToTerms, ...appIdeaData } = validatedData;
      
      // Create app idea
      const appIdea = await storage.createAppIdea(appIdeaData);
      
      // Get AI validation
      const analysis = await validateAppIdea(appIdeaData);
      
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
