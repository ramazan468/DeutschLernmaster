import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import type { Word } from "@shared/schema";

interface CategoriesTabProps {
  onOpenWordCard?: (word: Word) => void;
}

export default function CategoriesTab({ onOpenWordCard }: CategoriesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [wordSearchTerm, setWordSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("alphabetical");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  
  const { toast } = useToast();
  
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  const { data: allWords = [] } = useQuery<Word[]>({
    queryKey: ['/api/words'],
  });

  // Category mutations
  const addCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: categoryName }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to add category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setNewCategoryName("");
      toast({ title: "Kategori eklendi", description: "Yeni kategori başarıyla eklendi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kategori eklenirken bir hata oluştu.", variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const response = await fetch(`/api/categories/${encodeURIComponent(oldName)}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/words'] });
      setEditingCategory(null);
      setEditCategoryName("");
      toast({ title: "Kategori güncellendi", description: "Kategori adı başarıyla değiştirildi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kategori güncellenirken bir hata oluştu.", variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await fetch(`/api/categories/${encodeURIComponent(categoryName)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/words'] });
      setSelectedCategory(null);
      toast({ title: "Kategori silindi", description: "Kategori başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kategori silinirken bir hata oluştu.", variant: "destructive" });
    }
  });

  // Filter and sort categories
  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (sortOrder === "alphabetical") {
      return a.localeCompare(b);
    } else if (sortOrder === "wordCount") {
      const wordsInA = allWords.filter(word => word.category === a).length;
      const wordsInB = allWords.filter(word => word.category === b).length;
      return wordsInB - wordsInA;
    } else if (sortOrder === "mostUsed") {
      const favoritesInA = allWords.filter(word => word.category === a && word.isFavorite).length;
      const favoritesInB = allWords.filter(word => word.category === b && word.isFavorite).length;
      return favoritesInB - favoritesInA;
    }
    return 0;
  });

  // Show first 10 categories, rest in dropdown
  const displayedCategories = sortedCategories.slice(0, 10);
  const remainingCategories = sortedCategories.slice(10);

  const getCategoryData = (category: string) => {
    const categoryWords = allWords.filter(word => word.category === category);
    const learnedCount = categoryWords.filter(word => word.isFavorite).length;
    const progress = categoryWords.length > 0 ? Math.round((learnedCount / categoryWords.length) * 100) : 0;
    
    return {
      name: category,
      wordCount: categoryWords.length,
      progress,
      description: `Learn German ${category.toLowerCase()} vocabulary`,
      icon: getCategoryIcon(category),
      color: getCategoryColor(category),
    };
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'Tiere': 'paw',
      'Essen': 'utensils',
      'Haushalt': 'home',
      'Farben': 'palette',
      'Familie': 'users',
      'Transport': 'plane',
      'Arbeit': 'briefcase',
      'Schule': 'graduation-cap',
    };
    return iconMap[category] || 'folder';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'Tiere': 'text-green-600 bg-green-100',
      'Essen': 'text-orange-600 bg-orange-100',
      'Haushalt': 'text-blue-600 bg-blue-100',
      'Farben': 'text-purple-600 bg-purple-100',
      'Familie': 'text-pink-600 bg-pink-100',
      'Transport': 'text-indigo-600 bg-indigo-100',
      'Arbeit': 'text-gray-600 bg-gray-100',
      'Schule': 'text-yellow-600 bg-yellow-100',
    };
    return colorMap[category] || 'text-gray-600 bg-gray-100';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDisplayedWords = () => {
    if (!selectedCategory) return [];
    let words = allWords.filter(word => word.category === selectedCategory);
    
    // Apply word search filter
    if (wordSearchTerm.trim()) {
      words = words.filter(word => 
        word.german.toLowerCase().includes(wordSearchTerm.toLowerCase()) ||
        word.turkish.toLowerCase().includes(wordSearchTerm.toLowerCase()) ||
        (word.plural && word.plural.toLowerCase().includes(wordSearchTerm.toLowerCase()))
      );
    }
    
    return words;
  };

  const filteredWords = getDisplayedWords();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Categories Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Kategoriler</span>
              <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <i className="fas fa-cog mr-2"></i>
                    Yönet
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Kategori Yönetimi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Add new category */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Yeni Kategori Ekle</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Kategori adı..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <Button 
                          onClick={() => addCategoryMutation.mutate(newCategoryName)}
                          disabled={!newCategoryName.trim() || addCategoryMutation.isPending}
                        >
                          Ekle
                        </Button>
                      </div>
                    </div>

                    {/* Existing categories */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mevcut Kategoriler</label>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {categories.map((category) => {
                            const categoryData = getCategoryData(category);
                            return (
                              <div key={category} className="flex items-center gap-2 p-2 border rounded">
                                {editingCategory === category ? (
                                  <>
                                    <Input
                                      value={editCategoryName}
                                      onChange={(e) => setEditCategoryName(e.target.value)}
                                      className="flex-1"
                                    />
                                    <Button 
                                      size="sm"
                                      onClick={() => updateCategoryMutation.mutate({ oldName: category, newName: editCategoryName })}
                                      disabled={!editCategoryName.trim() || updateCategoryMutation.isPending}
                                    >
                                      <i className="fas fa-check"></i>
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        setEditingCategory(null);
                                        setEditCategoryName("");
                                      }}
                                    >
                                      <i className="fas fa-times"></i>
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex-1">
                                      <div className="font-medium">{category}</div>
                                      <div className="text-xs text-muted-foreground">{categoryData.wordCount} kelime</div>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        setEditingCategory(category);
                                        setEditCategoryName(category);
                                      }}
                                    >
                                      <i className="fas fa-edit"></i>
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive">
                                          <i className="fas fa-trash"></i>
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            "{category}" kategorisini silmek istediğinizden emin misiniz? Bu kategorideki tüm kelimeler "Genel" kategorisine taşınacak.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>İptal</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => deleteCategoryMutation.mutate(category)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Sil
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="space-y-4 mb-6">
              <Input
                placeholder="Kategori ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Sıralama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alfabetik</SelectItem>
                  <SelectItem value="wordCount">Kelime Sayısına Göre</SelectItem>
                  <SelectItem value="mostUsed">En Sık Kullanılan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {/* Show "All Categories" option */}
              <div 
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCategory === null 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-list mr-2"></i>
                    Tüm Kategoriler
                  </span>
                  <span className="text-sm">{allWords.length}</span>
                </div>
              </div>
              
              {/* First 10 categories */}
              {displayedCategories.map((category) => {
                const categoryData = getCategoryData(category);
                return (
                  <div 
                    key={category} 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCategory === category 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${categoryData.color} text-xs`}>
                          <i className={`fas fa-${categoryData.icon}`}></i>
                        </div>
                        {categoryData.name}
                      </span>
                      <span className="text-sm text-muted-foreground">{categoryData.wordCount}</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(categoryData.progress)}`}
                        style={{ width: `${categoryData.progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {/* Remaining categories in dropdown */}
              {remainingCategories.length > 0 && (
                <Card className="bg-background">
                  <CardContent className="p-3">
                    <Select onValueChange={(value) => setSelectedCategory(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Diğer kategoriler (${remainingCategories.length})`} />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-48">
                          {remainingCategories.map((category) => {
                            const data = getCategoryData(category);
                            return (
                              <SelectItem key={category} value={category}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{data.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {data.wordCount} kelime
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {selectedCategory ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedCategory}</span>
                <Badge variant="secondary">
                  {filteredWords.length} kelime
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Word search */}
              <div className="mb-4">
                <Input
                  placeholder="Kelime ara..."
                  value={wordSearchTerm}
                  onChange={(e) => setWordSearchTerm(e.target.value)}
                  className="w-full max-w-md"
                />
              </div>
              
              {/* Header */}
              <div className="grid grid-cols-7 gap-4 px-4 py-3 bg-gray-50 border-b font-medium text-sm text-gray-700">
                <div>Artikel</div>
                <div>Kelime</div>
                <div>Çoğul</div>
                <div>Ek</div>
                <div>Kategori</div>
                <div className="text-center">Favori</div>
                <div className="text-center">İşlemler</div>
              </div>
              
              {/* Rows */}
              <div className="divide-y divide-gray-200">
                {filteredWords.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-search text-2xl text-muted-foreground"></i>
                    <p className="mt-2 text-muted-foreground">
                      {wordSearchTerm ? "Aradığınız kelime bulunamadı" : "Bu kategoride kelime bulunmuyor"}
                    </p>
                  </div>
                ) : (
                  filteredWords.map((word) => (
                  <div key={word.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-7 gap-4 items-center">
                      {/* Artikel */}
                      <div>
                        <span className={`text-sm font-medium px-2 py-1 rounded min-w-[50px] text-center inline-block ${
                          word.article === 'der' ? 'bg-blue-100 text-blue-800' :
                          word.article === 'die' ? 'bg-red-100 text-red-800' :
                          word.article === 'das' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {word.article || '-'}
                        </span>
                      </div>
                      
                      {/* Kelime */}
                      <div>
                        <h3 className="font-semibold text-lg">
                          {word.german.charAt(0).toUpperCase() + word.german.slice(1)}
                        </h3>
                        <p className="text-sm text-gray-600">{word.turkish}</p>
                      </div>
                      
                      {/* Çoğul */}
                      <div>
                        <p className="text-sm text-gray-700">{word.plural || '-'}</p>
                      </div>
                      
                      {/* Ek */}
                      <div>
                        <p className="text-sm text-gray-700">{word.pluralSuffix || '-'}</p>
                      </div>
                      
                      {/* Kategori */}
                      <div>
                        <Badge variant="secondary">
                          {word.category}
                        </Badge>
                      </div>
                      
                      {/* Favori */}
                      <div className="text-center">
                        <i className={`fas fa-heart ${word.isFavorite ? 'text-red-500' : 'text-gray-300'}`}></i>
                      </div>
                      
                      {/* İşlemler */}
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenWordCard?.(word)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <i className="fas fa-tags text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-medium mb-2">Kategori Seçin</h3>
                <p className="text-muted-foreground">
                  Sol taraftan bir kategori seçerek kelimeleri görüntüleyin.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedCategory && filteredWords.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <i className="fas fa-empty-set text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-medium mb-2">Bu kategoride kelime yok</h3>
                <p className="text-muted-foreground">
                  {selectedCategory} kategorisinde henüz kelime bulunmuyor.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
