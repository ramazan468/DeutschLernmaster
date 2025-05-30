import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  article: text("article"),
  german: text("german").notNull(),
  plural: text("plural"),
  pluralSuffix: text("plural_suffix"),
  turkish: text("turkish").notNull(),
  category: text("category").notNull(),
  isFavorite: boolean("is_favorite").notNull().default(false),
  wo: text("wo"),
  wohin: text("wohin"),
  woher: text("woher"),
});

export const favoriteLists = pgTable("favorite_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  wordIds: text("word_ids").array().notNull().default([]),
});

export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  testMode: text("test_mode").notNull(),
  testType: text("test_type").notNull(),
  testSource: text("test_source").notNull(),
  questionCount: integer("question_count").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  score: integer("score").notNull(),
});

export const insertWordSchema = createInsertSchema(words).omit({
  id: true,
});

export const insertFavoriteListSchema = createInsertSchema(favoriteLists).omit({
  id: true,
});

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
});

export type InsertWord = z.infer<typeof insertWordSchema>;
export type Word = typeof words.$inferSelect;

export type InsertFavoriteList = z.infer<typeof insertFavoriteListSchema>;
export type FavoriteList = typeof favoriteLists.$inferSelect;

export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResults.$inferSelect;

export type TestMode = 'artikel' | 'plural' | 'tr-de' | 'de-tr' | 'sentence' | 'wo' | 'wohin' | 'woher';
export type TestType = 'multiple' | 'fill' | 'mixed';
export type TestSource = 'wordlist' | 'category' | 'favorites';
