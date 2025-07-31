import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appIdeas = pgTable("app_ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appName: text("app_name").notNull(),
  userName: text("user_name"),
  description: text("description").notNull(),
  targetMarket: text("target_market").notNull(),
  budget: text("budget"),
  features: text("features"),
  competition: text("competition"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const validationResults = pgTable("validation_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appIdeaId: varchar("app_idea_id").notNull().references(() => appIdeas.id),
  score: real("score").notNull(),
  verdict: text("verdict").notNull(), // "BUILD", "BAIL", "CAUTION"
  strengths: jsonb("strengths").$type<string[]>().notNull().default([]),
  weaknesses: jsonb("weaknesses").$type<string[]>().notNull().default([]),
  opportunities: jsonb("opportunities").$type<string[]>().notNull().default([]),
  detailedAnalysis: text("detailed_analysis").notNull(),
  actionItems: jsonb("action_items").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppIdeaSchema = createInsertSchema(appIdeas).omit({
  id: true,
  createdAt: true,
}).extend({
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to receive brutally honest feedback"
  })
});

export const insertValidationResultSchema = createInsertSchema(validationResults).omit({
  id: true,
  createdAt: true,
});

export type InsertAppIdea = z.infer<typeof insertAppIdeaSchema>;
export type AppIdea = typeof appIdeas.$inferSelect;
export type InsertValidationResult = z.infer<typeof insertValidationResultSchema>;
export type ValidationResult = typeof validationResults.$inferSelect;

export type ValidationResultWithIdea = ValidationResult & {
  appIdea: AppIdea;
};
