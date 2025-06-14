import { words, favoriteLists, testResults, categories, type Word, type InsertWord, type FavoriteList, type InsertFavoriteList, type TestResult, type InsertTestResult, type Category, type InsertCategory } from "@shared/schema";
import { db } from "./db";
import { eq, inArray, like, or } from "drizzle-orm";

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
  
  // Category operations
  getCategories(): Promise<string[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(oldName: string, newName: string): Promise<void>;
  deleteCategory(name: string): Promise<void>;
  
  // Utility operations
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
    // Check if word already exists
    const existingWord = await db
      .select()
      .from(words)
      .where(eq(words.german, insertWord.german));
    
    if (existingWord.length > 0) {
      // Return existing word instead of creating duplicate
      return existingWord[0];
    }
    
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
    try {
      // Get categories from both words and categories table
      const wordCategories = await db.selectDistinct({ category: words.category }).from(words);
      const storedCategories = await db.select({ name: categories.name }).from(categories);
      
      const wordCategoryNames = wordCategories.map(r => r.category);
      const storedCategoryNames = storedCategories.map(r => r.name);
      
      // Combine and deduplicate
      const allCategories = Array.from(new Set([...wordCategoryNames, ...storedCategoryNames]));
      return allCategories.sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to word categories only
      const wordCategories = await db.selectDistinct({ category: words.category }).from(words);
      return wordCategories.map(r => r.category).sort();
    }
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(oldName: string, newName: string): Promise<void> {
    // Update words with this category
    await db
      .update(words)
      .set({ category: newName })
      .where(eq(words.category, oldName));
    
    // Update category in categories table if it exists
    await db
      .update(categories)
      .set({ name: newName })
      .where(eq(categories.name, oldName));
  }

  async deleteCategory(name: string): Promise<void> {
    // Move all words to "Genel" category
    await db
      .update(words)
      .set({ category: "Genel" })
      .where(eq(words.category, name));
    
    // Delete from categories table
    await db
      .delete(categories)
      .where(eq(categories.name, name));
  }

  async getFavoriteWords(): Promise<Word[]> {
    const favoriteWords = await db.select().from(words).where(eq(words.isFavorite, true));
    return favoriteWords;
  }
}

export const storage = new DatabaseStorage();
