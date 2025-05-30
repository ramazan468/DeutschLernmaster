import { words, favoriteLists, testResults, type Word, type InsertWord, type FavoriteList, type InsertFavoriteList, type TestResult, type InsertTestResult } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private words: Map<number, Word>;
  private favoriteLists: Map<number, FavoriteList>;
  private testResults: Map<number, TestResult>;
  private currentWordId: number;
  private currentFavoriteListId: number;
  private currentTestResultId: number;

  constructor() {
    this.words = new Map();
    this.favoriteLists = new Map();
    this.testResults = new Map();
    this.currentWordId = 1;
    this.currentFavoriteListId = 1;
    this.currentTestResultId = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleWords: InsertWord[] = [
      {
        article: "der",
        german: "Hund",
        plural: "Hunde",
        pluralSuffix: "-e",
        turkish: "köpek",
        category: "Animals",
        isFavorite: true,
        wo: "zu Hause",
        wohin: "nach Hause",
        woher: "von zu Hause"
      },
      {
        article: "die",
        german: "Katze",
        plural: "Katzen",
        pluralSuffix: "-n",
        turkish: "kedi",
        category: "Animals",
        isFavorite: true,
        wo: "auf dem Sofa",
        wohin: "auf das Sofa",
        woher: "vom Sofa"
      },
      {
        article: "das",
        german: "Haus",
        plural: "Häuser",
        pluralSuffix: "-er",
        turkish: "ev",
        category: "Home",
        isFavorite: false,
        wo: "in der Stadt",
        wohin: "in die Stadt",
        woher: "aus der Stadt"
      },
      {
        article: "das",
        german: "Brot",
        plural: "Brote",
        pluralSuffix: "-e",
        turkish: "ekmek",
        category: "Food",
        isFavorite: true,
        wo: "auf dem Tisch",
        wohin: "auf den Tisch",
        woher: "vom Tisch"
      },
      {
        article: "die",
        german: "Farbe",
        plural: "Farben",
        pluralSuffix: "-n",
        turkish: "renk",
        category: "Colors",
        isFavorite: false,
        wo: "im Bild",
        wohin: "ins Bild",
        woher: "aus dem Bild"
      }
    ];

    sampleWords.forEach(word => {
      const id = this.currentWordId++;
      this.words.set(id, { ...word, id });
    });
  }

  async getWords(): Promise<Word[]> {
    return Array.from(this.words.values());
  }

  async getWord(id: number): Promise<Word | undefined> {
    return this.words.get(id);
  }

  async createWord(insertWord: InsertWord): Promise<Word> {
    const id = this.currentWordId++;
    const word: Word = { ...insertWord, id };
    this.words.set(id, word);
    return word;
  }

  async updateWord(id: number, updateData: Partial<InsertWord>): Promise<Word | undefined> {
    const existingWord = this.words.get(id);
    if (!existingWord) return undefined;
    
    const updatedWord = { ...existingWord, ...updateData };
    this.words.set(id, updatedWord);
    return updatedWord;
  }

  async deleteWord(id: number): Promise<boolean> {
    return this.words.delete(id);
  }

  async getWordsByCategory(category: string): Promise<Word[]> {
    return Array.from(this.words.values()).filter(word => word.category === category);
  }

  async getWordsByIds(ids: number[]): Promise<Word[]> {
    return ids.map(id => this.words.get(id)).filter(Boolean) as Word[];
  }

  async searchWords(query: string): Promise<Word[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.words.values()).filter(word =>
      word.german.toLowerCase().includes(lowercaseQuery) ||
      word.turkish.toLowerCase().includes(lowercaseQuery) ||
      word.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getFavoriteLists(): Promise<FavoriteList[]> {
    return Array.from(this.favoriteLists.values());
  }

  async getFavoriteList(id: number): Promise<FavoriteList | undefined> {
    return this.favoriteLists.get(id);
  }

  async createFavoriteList(insertList: InsertFavoriteList): Promise<FavoriteList> {
    const id = this.currentFavoriteListId++;
    const list: FavoriteList = { ...insertList, id };
    this.favoriteLists.set(id, list);
    return list;
  }

  async updateFavoriteList(id: number, updateData: Partial<InsertFavoriteList>): Promise<FavoriteList | undefined> {
    const existingList = this.favoriteLists.get(id);
    if (!existingList) return undefined;
    
    const updatedList = { ...existingList, ...updateData };
    this.favoriteLists.set(id, updatedList);
    return updatedList;
  }

  async deleteFavoriteList(id: number): Promise<boolean> {
    return this.favoriteLists.delete(id);
  }

  async getTestResults(): Promise<TestResult[]> {
    return Array.from(this.testResults.values());
  }

  async createTestResult(insertResult: InsertTestResult): Promise<TestResult> {
    const id = this.currentTestResultId++;
    const result: TestResult = { ...insertResult, id };
    this.testResults.set(id, result);
    return result;
  }

  async getCategories(): Promise<string[]> {
    const categories = new Set<string>();
    for (const word of this.words.values()) {
      categories.add(word.category);
    }
    return Array.from(categories);
  }

  async getFavoriteWords(): Promise<Word[]> {
    return Array.from(this.words.values()).filter(word => word.isFavorite);
  }
}

export const storage = new MemStorage();
