import { type AppIdea, type InsertAppIdea, type ValidationResult, type InsertValidationResult, type ValidationResultWithIdea } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createAppIdea(appIdea: InsertAppIdea): Promise<AppIdea>;
  getAppIdea(id: string): Promise<AppIdea | undefined>;
  createValidationResult(result: InsertValidationResult): Promise<ValidationResult>;
  getValidationResult(id: string): Promise<ValidationResult | undefined>;
  getValidationResultByAppIdeaId(appIdeaId: string): Promise<ValidationResult | undefined>;
  getValidationResultWithIdea(id: string): Promise<ValidationResultWithIdea | undefined>;
  getAllValidationResults(): Promise<ValidationResultWithIdea[]>;
}

export class MemStorage implements IStorage {
  private appIdeas: Map<string, AppIdea>;
  private validationResults: Map<string, ValidationResult>;

  constructor() {
    this.appIdeas = new Map();
    this.validationResults = new Map();
  }

  async createAppIdea(insertAppIdea: InsertAppIdea): Promise<AppIdea> {
    const id = randomUUID();
    const appIdea: AppIdea = {
      ...insertAppIdea,
      id,
      createdAt: new Date(),
    };
    this.appIdeas.set(id, appIdea);
    return appIdea;
  }

  async getAppIdea(id: string): Promise<AppIdea | undefined> {
    return this.appIdeas.get(id);
  }

  async createValidationResult(insertResult: InsertValidationResult): Promise<ValidationResult> {
    const id = randomUUID();
    const result: ValidationResult = {
      ...insertResult,
      id,
      createdAt: new Date(),
    };
    this.validationResults.set(id, result);
    return result;
  }

  async getValidationResult(id: string): Promise<ValidationResult | undefined> {
    return this.validationResults.get(id);
  }

  async getValidationResultByAppIdeaId(appIdeaId: string): Promise<ValidationResult | undefined> {
    return Array.from(this.validationResults.values()).find(
      (result) => result.appIdeaId === appIdeaId,
    );
  }

  async getValidationResultWithIdea(id: string): Promise<ValidationResultWithIdea | undefined> {
    const result = this.validationResults.get(id);
    if (!result) return undefined;

    const appIdea = this.appIdeas.get(result.appIdeaId);
    if (!appIdea) return undefined;

    return { ...result, appIdea };
  }

  async getAllValidationResults(): Promise<ValidationResultWithIdea[]> {
    const results: ValidationResultWithIdea[] = [];
    
    for (const result of this.validationResults.values()) {
      const appIdea = this.appIdeas.get(result.appIdeaId);
      if (appIdea) {
        results.push({ ...result, appIdea });
      }
    }

    return results.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
}

export const storage = new MemStorage();
