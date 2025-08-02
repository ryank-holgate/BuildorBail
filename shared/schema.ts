import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, jsonb, integer } from "drizzle-orm/pg-core";
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
  userIp: varchar("user_ip", { length: 45 }), // IPv6 support
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
  brutalAnalysis: jsonb("brutal_analysis").$type<any>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rate limiting table
export const rateLimits = pgTable("rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userIp: varchar("user_ip", { length: 45 }).notNull(),
  requestCount: integer("request_count").default(1).notNull(),
  lastRequest: timestamp("last_request").defaultNow().notNull(),
  windowStart: timestamp("window_start").defaultNow().notNull(),
});

// Analytics table for aggregated stats
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalIdeasAnalyzed: integer("total_ideas_analyzed").default(0).notNull(),
  totalBuildVerdicts: integer("total_build_verdicts").default(0).notNull(),
  totalBailVerdicts: integer("total_bail_verdicts").default(0).notNull(),
  totalTimeSaved: integer("total_time_saved").default(0).notNull(), 
  averageScore: real("average_score").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const insertRateLimitSchema = createInsertSchema(rateLimits).omit({
  id: true,
  lastRequest: true,
  windowStart: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  updatedAt: true,
});

export type InsertAppIdea = z.infer<typeof insertAppIdeaSchema>;
export type AppIdea = typeof appIdeas.$inferSelect;
export type InsertValidationResult = z.infer<typeof insertValidationResultSchema>;
export type ValidationResult = typeof validationResults.$inferSelect;
export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type ValidationResultWithIdea = ValidationResult & {
  appIdea: AppIdea;
};
