import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWordSchema, insertFavoriteListSchema, insertTestResultSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Word routes
  app.get("/api/words", async (req, res) => {
    try {
      const { category, search, favorites } = req.query;
      let words = await storage.getWords();
      
      if (category) {
        words = words.filter(word => word.category === category);
      }
      
      if (search) {
        const searchTerm = String(search).toLowerCase();
        words = words.filter(word =>
          word.german.toLowerCase().includes(searchTerm) ||
          word.turkish.toLowerCase().includes(searchTerm) ||
          word.category.toLowerCase().includes(searchTerm)
        );
      }
      
      if (favorites === 'true') {
        words = words.filter(word => word.isFavorite);
      } else if (favorites === 'false') {
        words = words.filter(word => !word.isFavorite);
      }
      
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch words" });
    }
  });

  app.get("/api/words/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const word = await storage.getWord(id);
      if (!word) {
        return res.status(404).json({ message: "Word not found" });
      }
      res.json(word);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch word" });
    }
  });

  app.post("/api/words", async (req, res) => {
    try {
      const wordData = insertWordSchema.parse(req.body);
      const word = await storage.createWord(wordData);
      res.status(201).json(word);
    } catch (error) {
      res.status(400).json({ message: "Invalid word data" });
    }
  });

  app.put("/api/words/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertWordSchema.partial().parse(req.body);
      const word = await storage.updateWord(id, updateData);
      if (!word) {
        return res.status(404).json({ message: "Word not found" });
      }
      res.json(word);
    } catch (error) {
      res.status(400).json({ message: "Invalid word data" });
    }
  });

  app.patch("/api/words/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertWordSchema.partial().parse(req.body);
      const word = await storage.updateWord(id, updateData);
      if (!word) {
        return res.status(404).json({ message: "Word not found" });
      }
      res.json(word);
    } catch (error) {
      res.status(400).json({ message: "Invalid word data" });
    }
  });

  app.delete("/api/words/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWord(id);
      if (!deleted) {
        return res.status(404).json({ message: "Word not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete word" });
    }
  });

  app.post("/api/words/bulk", async (req, res) => {
    try {
      const wordsData = req.body.words;
      if (!Array.isArray(wordsData)) {
        return res.status(400).json({ message: "Words must be an array" });
      }
      
      const createdWords = [];
      for (const wordData of wordsData) {
        const validatedData = insertWordSchema.parse(wordData);
        const word = await storage.createWord(validatedData);
        createdWords.push(word);
      }
      
      res.status(201).json(createdWords);
    } catch (error) {
      res.status(400).json({ message: "Invalid words data" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      // Check if category already exists
      const categories = await storage.getCategories();
      if (categories.includes(name)) {
        return res.status(409).json({ message: "Category already exists" });
      }
      
      // Create the category
      const category = await storage.createCategory({ name });
      res.status(201).json(category);
    } catch (error) {
      console.error('Category creation error:', error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/categories/:name", async (req, res) => {
    try {
      const oldName = decodeURIComponent(req.params.name);
      const { name: newName } = req.body;
      
      if (!newName || typeof newName !== 'string') {
        return res.status(400).json({ message: "New category name is required" });
      }
      
      // Update category
      await storage.updateCategory(oldName, newName);
      
      res.json({ message: `Category updated from "${oldName}" to "${newName}"` });
    } catch (error) {
      console.error('Category update error:', error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:name", async (req, res) => {
    try {
      const categoryName = decodeURIComponent(req.params.name);
      
      // Delete category and move words to "Genel"
      await storage.deleteCategory(categoryName);
      
      res.json({ message: `Category "${categoryName}" deleted and words moved to "Genel"` });
    } catch (error) {
      console.error('Category delete error:', error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.get("/api/categories/:category/words", async (req, res) => {
    try {
      const category = req.params.category;
      const words = await storage.getWordsByCategory(category);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category words" });
    }
  });

  // Favorite routes
  app.get("/api/favorites", async (req, res) => {
    try {
      const words = await storage.getFavoriteWords();
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite words" });
    }
  });

  app.get("/api/favorite-lists", async (req, res) => {
    try {
      const lists = await storage.getFavoriteLists();
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite lists" });
    }
  });

  app.post("/api/favorite-lists", async (req, res) => {
    try {
      const listData = insertFavoriteListSchema.parse(req.body);
      const list = await storage.createFavoriteList(listData);
      res.status(201).json(list);
    } catch (error) {
      res.status(400).json({ message: "Invalid favorite list data" });
    }
  });

  app.put("/api/favorite-lists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertFavoriteListSchema.partial().parse(req.body);
      const list = await storage.updateFavoriteList(id, updateData);
      if (!list) {
        return res.status(404).json({ message: "Favorite list not found" });
      }
      res.json(list);
    } catch (error) {
      res.status(400).json({ message: "Invalid favorite list data" });
    }
  });

  app.delete("/api/favorite-lists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFavoriteList(id);
      if (!deleted) {
        return res.status(404).json({ message: "Favorite list not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete favorite list" });
    }
  });

  // Test routes
  app.get("/api/test-results", async (req, res) => {
    try {
      const results = await storage.getTestResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test results" });
    }
  });

  app.post("/api/test-results", async (req, res) => {
    try {
      const resultData = insertTestResultSchema.parse(req.body);
      const result = await storage.createTestResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid test result data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
