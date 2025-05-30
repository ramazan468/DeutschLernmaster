import { words, favoriteLists, testResults, type Word, type InsertWord, type FavoriteList, type InsertFavoriteList, type TestResult, type InsertTestResult } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Word operations
  getWords(): Promise<Word[]>;
  getWord(id: number): Promise<Word | undefined>;
  createWord(word: InsertWord): Promise<Word>;
  updateWord(id: number, word: Partial<InsertWord>): Promise<Word | undefined>;
  deleteWord(id: number): Promise<boolean>;
  getWordsByCategory(category: string): Promise<Word[]>;
  getWordsByIds(ids: number[]): Promise<Word[]>;
  searchWords(query: string): Promise<Word[]>;
  
  // Favorite operations
  getFavoriteLists(): Promise<FavoriteList[]>;
  getFavoriteList(id: number): Promise<FavoriteList | undefined>;
  createFavoriteList(list: InsertFavoriteList): Promise<FavoriteList>;
  updateFavoriteList(id: number, list: Partial<InsertFavoriteList>): Promise<FavoriteList | undefined>;
  deleteFavoriteList(id: number): Promise<boolean>;
  
  // Test result operations
  getTestResults(): Promise<TestResult[]>;
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  
  // Utility operations
  getCategories(): Promise<string[]>;
  getFavoriteWords(): Promise<Word[]>;
}

export class DatabaseStorage implements IStorage {
  async getWords(): Promise<Word[]> {
    const allWords = await db.select().from(words);
    return allWords;
  }

  async getWord(id: number): Promise<Word | undefined> {
    const [word] = await db.select().from(words).where(eq(words.id, id));
    return word || undefined;
  }

  async createWord(insertWord: InsertWord): Promise<Word> {
    const [word] = await db
      .insert(words)
      .values(insertWord)
      .returning();
    return word;
  }

  async updateWord(id: number, updateData: Partial<InsertWord>): Promise<Word | undefined> {
    const [word] = await db
      .update(words)
      .set(updateData)
      .where(eq(words.id, id))
      .returning();
    return word || undefined;
  }

  async deleteWord(id: number): Promise<boolean> {
    const result = await db.delete(words).where(eq(words.id, id));
    return result.rowCount > 0;
  }

  async getWordsByCategory(category: string): Promise<Word[]> {
    const categoryWords = await db.select().from(words).where(eq(words.category, category));
    return categoryWords;
  }

  async getWordsByIds(ids: number[]): Promise<Word[]> {
    if (ids.length === 0) return [];
    const selectedWords = await db.select().from(words).where(words.id.in ? words.id.in(ids) : eq(words.id, ids[0]));
    return selectedWords;
  }

  async searchWords(query: string): Promise<Word[]> {
    // For PostgreSQL, we can use ILIKE for case-insensitive search
    const searchPattern = `%${query}%`;
    const searchResults = await db.select().from(words).where(
      words.german.ilike ? words.german.ilike(searchPattern) : 
      words.turkish.ilike ? words.turkish.ilike(searchPattern) :
      words.category.ilike ? words.category.ilike(searchPattern) : undefined
    );
    return searchResults;
  }

  async getFavoriteLists(): Promise<FavoriteList[]> {
    const lists = await db.select().from(favoriteLists);
    return lists;
  }

  async getFavoriteList(id: number): Promise<FavoriteList | undefined> {
    const [list] = await db.select().from(favoriteLists).where(eq(favoriteLists.id, id));
    return list || undefined;
  }

  async createFavoriteList(insertList: InsertFavoriteList): Promise<FavoriteList> {
    const [list] = await db
      .insert(favoriteLists)
      .values(insertList)
      .returning();
    return list;
  }

  async updateFavoriteList(id: number, updateData: Partial<InsertFavoriteList>): Promise<FavoriteList | undefined> {
    const [list] = await db
      .update(favoriteLists)
      .set(updateData)
      .where(eq(favoriteLists.id, id))
      .returning();
    return list || undefined;
  }

  async deleteFavoriteList(id: number): Promise<boolean> {
    const result = await db.delete(favoriteLists).where(eq(favoriteLists.id, id));
    return result.rowCount > 0;
  }

  async getTestResults(): Promise<TestResult[]> {
    const results = await db.select().from(testResults);
    return results;
  }

  async createTestResult(insertResult: InsertTestResult): Promise<TestResult> {
    const [result] = await db
      .insert(testResults)
      .values(insertResult)
      .returning();
    return result;
  }

  async getCategories(): Promise<string[]> {
    const results = await db.selectDistinct({ category: words.category }).from(words);
    return results.map(r => r.category);
  }

  async getFavoriteWords(): Promise<Word[]> {
    const favoriteWords = await db.select().from(words).where(eq(words.isFavorite, true));
    return favoriteWords;
  }
}

export const storage = new DatabaseStorage();
