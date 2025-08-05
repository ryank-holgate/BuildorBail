import { 
  type AppIdea, 
  type ValidationResult, 
  type ValidationResultWithIdea,
  type InsertAppIdea,
  type InsertValidationResult,
  type RateLimit,
  appIdeas,
  validationResults,
  rateLimits
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  createAppIdea(data: InsertAppIdea & { userIp?: string }): Promise<AppIdea>;
  getAppIdea(id: string): Promise<AppIdea | undefined>;
  createValidationResult(result: InsertValidationResult): Promise<ValidationResult>;
  getValidationResult(id: string): Promise<ValidationResult | undefined>;
  getValidationResultByAppIdeaId(appIdeaId: string): Promise<ValidationResult | undefined>;
  getValidationResultWithIdea(id: string): Promise<ValidationResultWithIdea | undefined>;
  getAllValidationResults(): Promise<ValidationResultWithIdea[]>;
  checkRateLimit(userIp: string): Promise<{ allowed: boolean; remainingRequests: number }>;
  updateRateLimit(userIp: string): Promise<void>;

  getBailVerdicts(limit?: number): Promise<ValidationResultWithIdea[]>;
}

export class DatabaseStorage implements IStorage {
  async createAppIdea(data: InsertAppIdea & { userIp?: string }): Promise<AppIdea> {
    const [newIdea] = await db
      .insert(appIdeas)
      .values({
        appName: data.appName,
        userName: data.userName,
        description: data.description,
        targetMarket: data.targetMarket,
        budget: data.budget,
        features: data.features,
        competition: data.competition,
        userIp: data.userIp,
      })
      .returning();
    return newIdea;
  }

  async getAppIdea(id: string): Promise<AppIdea | undefined> {
    const [result] = await db
      .select()
      .from(appIdeas)
      .where(eq(appIdeas.id, id));
    return result;
  }
  
  async createValidationResult(data: InsertValidationResult): Promise<ValidationResult> {
    const [newResult] = await db
      .insert(validationResults)
      .values(data)
      .returning();
    return newResult;
  }

  async getValidationResult(id: string): Promise<ValidationResult | undefined> {
    const [result] = await db
      .select()
      .from(validationResults)
      .where(eq(validationResults.id, id));
    return result;
  }

  async getValidationResultByAppIdeaId(appIdeaId: string): Promise<ValidationResult | undefined> {
    const [result] = await db
      .select()
      .from(validationResults)
      .where(eq(validationResults.appIdeaId, appIdeaId));
    return result;
  }
  
  async getAllValidationResults(): Promise<ValidationResultWithIdea[]> {
    const results = await db
      .select()
      .from(validationResults)
      .leftJoin(appIdeas, eq(validationResults.appIdeaId, appIdeas.id))
      .orderBy(desc(validationResults.createdAt))
      .limit(100);
    
    return results
      .filter((row): row is { validation_results: ValidationResult; app_ideas: AppIdea } => 
        row.app_ideas !== null
      )
      .map(row => ({
        ...row.validation_results,
        appIdea: row.app_ideas
      }));
  }
  
  async getValidationResultWithIdea(id: string): Promise<ValidationResultWithIdea | undefined> {
    const [result] = await db
      .select()
      .from(validationResults)
      .leftJoin(appIdeas, eq(validationResults.appIdeaId, appIdeas.id))
      .where(eq(validationResults.id, id));
      
    if (!result || !result.app_ideas) return undefined;
    
    return {
      ...result.validation_results,
      appIdea: result.app_ideas
    };
  }

  async checkRateLimit(userIp: string): Promise<{ allowed: boolean; remainingRequests: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const [existingLimit] = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.userIp, userIp),
          gte(rateLimits.windowStart, oneHourAgo)
        )
      );

    if (!existingLimit) {
      return { allowed: true, remainingRequests: 4 }; // 5 - 1 for current request
    }

    const requestCount = existingLimit.requestCount;
    const maxRequests = 5; // 5 requests per hour
    
    if (requestCount >= maxRequests) {
      return { allowed: false, remainingRequests: 0 };
    }

    return { allowed: true, remainingRequests: maxRequests - requestCount - 1 };
  }

  async updateRateLimit(userIp: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const [existingLimit] = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.userIp, userIp),
          gte(rateLimits.windowStart, oneHourAgo)
        )
      );

    if (existingLimit) {
      await db
        .update(rateLimits)
        .set({
          requestCount: existingLimit.requestCount + 1,
          lastRequest: new Date()
        })
        .where(eq(rateLimits.id, existingLimit.id));
    } else {
      await db
        .insert(rateLimits)
        .values({
          userIp,
          requestCount: 1,
        });
    }
  }



  async getBailVerdicts(limit: number = 50): Promise<ValidationResultWithIdea[]> {
    const results = await db
      .select()
      .from(validationResults)
      .leftJoin(appIdeas, eq(validationResults.appIdeaId, appIdeas.id))
      .where(eq(validationResults.verdict, 'BAIL'))
      .orderBy(desc(validationResults.createdAt))
      .limit(limit);
    
    return results
      .filter((row): row is { validation_results: ValidationResult; app_ideas: AppIdea } => 
        row.app_ideas !== null
      )
      .map(row => ({
        ...row.validation_results,
        appIdea: row.app_ideas
      }));
  }
}

export const storage = new DatabaseStorage();