import { Router } from "express";
import { z } from "zod";
import { insertAppIdeaSchema } from "@shared/schema";
import { storage } from "./storage";
import { brutallyAnalyzeAppIdea } from "./services/gemini";

const router = Router();

// Middleware to get client IP
const getClientIp = (req: any) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip || 
         '127.0.0.1';
};

router.post("/api/analyze", async (req, res) => {
  try {
    const userIp = getClientIp(req);
    
    // Check rate limit
    const rateCheck = await storage.checkRateLimit(userIp);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: "You can only analyze 5 ideas per hour. Come back when you're less desperate.",
        remainingRequests: 0,
        resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
    }

    // Update rate limit
    await storage.updateRateLimit(userIp);
    
    // Validate request body
    const data = insertAppIdeaSchema.parse(req.body);
    
    // Create app idea with IP
    const appIdea = await storage.createAppIdea({ ...data, userIp });
    
    // Analyze with Gemini
    const analysis = await brutallyAnalyzeAppIdea({ ...data, agreeToTerms: true });
    
    // Store validation result
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
      actionItems: analysis.fatal_flaws.map((flaw, index) => `Fatal Flaw ${index + 1}: ${flaw}`),
      brutalAnalysis: analysis
    });

    // Update analytics
    const timeSaved = analysis.time_saved_hours || Math.floor(Math.random() * 120) + 40;
    await storage.updateAnalytics(analysis.verdict, analysis.overall_score, timeSaved);

    // Return combined result
    res.json({
      ...validationResult,
      appIdea,
      brutalAnalysis: analysis,
      remainingRequests: rateCheck.remainingRequests
    });
  } catch (error) {
    console.error("Error analyzing idea:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
    }
    
    res.status(500).json({
      error: "Failed to analyze idea",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/api/results", async (req, res) => {
  try {
    const results = await storage.getAllValidationResults();
    res.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({
      error: "Failed to fetch results",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/api/results/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await storage.getValidationResultWithIdea(id);
    
    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({
      error: "Failed to fetch result",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Analytics dashboard endpoint
router.get("/api/admin/analytics", async (req, res) => {
  try {
    const analytics = await storage.getAnalytics();
    
    if (!analytics) {
      return res.json({
        totalIdeasAnalyzed: 0,
        totalBuildVerdicts: 0,
        totalBailVerdicts: 0,
        totalTimeSaved: 0,
        averageScore: 0,
        buildBailRatio: "0:0"
      });
    }

    const buildBailRatio = `${analytics.totalBuildVerdicts}:${analytics.totalBailVerdicts}`;
    
    res.json({
      ...analytics,
      buildBailRatio
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      error: "Failed to fetch analytics",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Wall of Shame endpoint
router.get("/api/wall-of-shame", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const bailVerdicts = await storage.getBailVerdicts(limit);
    
    // Anonymize the data
    const anonymized = bailVerdicts.map((result, index) => ({
      id: result.id,
      rank: index + 1,
      appName: result.appIdea.appName,
      description: result.appIdea.description.length > 200 
        ? result.appIdea.description.substring(0, 200) + "..." 
        : result.appIdea.description,
      targetMarket: result.appIdea.targetMarket,
      score: result.score,
      verdict: result.verdict,
      topWeaknesses: result.weaknesses.slice(0, 3),
      createdAt: result.createdAt,
      timeSaved: (result.brutalAnalysis as any)?.time_saved_hours || Math.floor(Math.random() * 120) + 40
    }));
    
    res.json(anonymized);
  } catch (error) {
    console.error("Error fetching wall of shame:", error);
    res.status(500).json({
      error: "Failed to fetch wall of shame",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;