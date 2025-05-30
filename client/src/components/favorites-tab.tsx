import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Edit, Plus, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Word, FavoriteList } from "@shared/schema";

interface FavoritesTabProps {
  onOpenWordCard?: (word: Word) => void;
  onEditWord?: (word: Word) => void;
}

export default function FavoritesTab({ onOpenWordCard, onEditWord }: FavoritesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newListName, setNewListName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [editListName, setEditListName] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favoriteWords = [], isLoading } = useQuery<Word[]>({
    queryKey: ['/api/favorites', { 
      search: searchTerm, 
      category: selectedCategory === 'all' ? undefined : selectedCategory 
    }],
  });

  const { data: allWords = [] } = useQuery<Word[]>({
    queryKey: ['/api/words'],
  });

  const { data: favoriteLists = [] } = useQuery<FavoriteList[]>({
    queryKey: ['/api/favorite-lists'],
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest('POST', '/api/favorite-lists', { name, wordIds: [] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-lists'] });
      setNewListName("");
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Favorite list created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create favorite list",
        variant: "destructive",
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PUT', `/api/words/${id}`, { isFavorite: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Success",
        description: "Removed from favorites",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    },
  });

  const updateListMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return apiRequest('PATCH', `/api/favorite-lists/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-lists'] });
      toast({
        title: "Başarılı",
        description: "Liste adı güncellendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Liste adı güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/favorite-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-lists'] });
      setSelectedListId(null); // Reset to "All Favorites" after deletion
      toast({
        title: "Başarılı",
        description: "Liste silindi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Liste silinemedi",
        variant: "destructive",
      });
    },
  });

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    try {
      await createListMutation.mutateAsync(newListName);
      setNewListName("");
      setIsCreateDialogOpen(false);
      toast({
        title: "Başarılı",
        description: "Favori listesi oluşturuldu",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Favori listesi oluşturulamadı",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromFavorites = (id: number) => {
    removeFavoriteMutation.mutate(id);
  };

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest('POST', '/api/categories', { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      return apiRequest('PATCH', `/api/categories/${encodeURIComponent(oldName)}`, { name: newName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/words'] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest('DELETE', `/api/categories/${encodeURIComponent(name)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/words'] });
    },
  });

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await createCategoryMutation.mutateAsync(newCategoryName);
      setNewCategoryName("");
      toast({
        title: "Başarılı",
        description: "Kategori oluşturuldu",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kategori oluşturulamadı",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async (oldName: string) => {
    if (!editCategoryName.trim()) return;
    
    try {
      await updateCategoryMutation.mutateAsync({ oldName, newName: editCategoryName });
      setEditingCategory(null);
      setEditCategoryName("");
      toast({
        title: "Başarılı",
        description: "Kategori güncellendi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kategori güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (!confirm(`"${name}" kategorisini silmek istediğinizden emin misiniz? Bu kategorideki tüm kelimeler "Genel" kategorisine taşınacak.`)) {
      return;
    }
    
    try {
      await deleteCategoryMutation.mutateAsync(name);
      toast({
        title: "Başarılı",
        description: "Kategori silindi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kategori silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleUpdateList = async (id: number) => {
    if (!editListName.trim()) return;
    
    try {
      await updateListMutation.mutateAsync({ id, name: editListName });
      setEditingListId(null);
      setEditListName("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteList = async (id: number, name: string) => {
    if (!confirm(`"${name}" listesini silmek istediğinizden emin misiniz?`)) {
      return;
    }
    
    try {
      await deleteListMutation.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getDisplayedWords = () => {
    if (selectedListId === null) {
      // Show all favorites
      return favoriteWords.filter(word => {
        const matchesSearch = !searchTerm || 
          word.german.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.turkish.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || selectedCategory === 'all' || word.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    } else {
      // Show words from specific list
      const selectedList = favoriteLists.find(list => list.id === selectedListId);
      if (!selectedList) return [];
      
      const listWords = allWords.filter(word => selectedList.wordIds.includes(word.id.toString()));
      return listWords.filter(word => {
        const matchesSearch = !searchTerm || 
          word.german.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.turkish.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || selectedCategory === 'all' || word.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    }
  };

  const filteredWords = getDisplayedWords();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Favorite Lists Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Favori Listeleri</CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <i className="fas fa-plus"></i>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yeni Favori Listesi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="list-name">Liste Adı</Label>
                      <Input
                        id="list-name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Liste adını girin..."
                      />
                    </div>
                    <Button 
                      onClick={handleCreateList}
                      disabled={createListMutation.isPending || !newListName.trim()}
                      className="w-full"
                    >
                      Liste Oluştur
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Always show "All Favorites" */}
              <div 
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedListId === null 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => setSelectedListId(null)}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-list mr-2"></i>
                    Tüm Favoriler
                  </span>
                  <span className="text-sm">{favoriteWords.length}</span>
                </div>
              </div>
              
              {/* Show first 5 lists directly */}
              {favoriteLists.slice(0, 5).map((list) => (
                <div 
                  key={list.id} 
                  className={`p-3 rounded-lg transition-colors ${
                    selectedListId === list.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {editingListId === list.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editListName}
                        onChange={(e) => setEditListName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateList(list.id);
                          } else if (e.key === 'Escape') {
                            setEditingListId(null);
                            setEditListName("");
                          }
                        }}
                        className="flex-1 h-8"
                        autoFocus
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateList(list.id)}
                        disabled={updateListMutation.isPending}
                        className="h-8 w-8 p-0"
                      >
                        ✓
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          setEditingListId(null);
                          setEditListName("");
                        }}
                        className="h-8 w-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span 
                        className="flex items-center cursor-pointer flex-1"
                        onClick={() => setSelectedListId(list.id)}
                      >
                        <i className="fas fa-bookmark mr-2"></i>
                        {list.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground mr-2">{list.wordIds.length}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingListId(list.id);
                            setEditListName(list.name);
                          }}
                          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list.id, list.name);
                          }}
                          disabled={deleteListMutation.isPending}
                          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Dropdown for remaining lists if more than 5 */}
              {favoriteLists.length > 5 && (
                <Select onValueChange={(value) => setSelectedListId(Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Diğer Listeler (${favoriteLists.length - 5})`} />
                  </SelectTrigger>
                  <SelectContent>
                    {favoriteLists.slice(5).map((list) => (
                      <SelectItem key={list.id} value={list.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span className="flex items-center">
                            <i className="fas fa-bookmark mr-2"></i>
                            {list.name}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({list.wordIds.length})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="relative">
                  <Input
                    placeholder="Favorilerde ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-muted-foreground"></i>
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Tüm Kategoriler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isCategoryManageOpen} onOpenChange={setIsCategoryManageOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Kategori Yönetimi</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Add new category */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Yeni kategori adı..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                        />
                        <Button 
                          onClick={handleCreateCategory}
                          disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Category list */}
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {categories.map((category) => (
                          <div key={category} className="flex items-center gap-2 p-2 border rounded">
                            {editingCategory === category ? (
                              <>
                                <Input
                                  value={editCategoryName}
                                  onChange={(e) => setEditCategoryName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdateCategory(category);
                                    } else if (e.key === 'Escape') {
                                      setEditingCategory(null);
                                      setEditCategoryName("");
                                    }
                                  }}
                                  className="flex-1"
                                  autoFocus
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => handleUpdateCategory(category)}
                                  disabled={updateCategoryMutation.isPending}
                                >
                                  ✓
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    setEditingCategory(null);
                                    setEditCategoryName("");
                                  }}
                                >
                                  ✕
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1">{category}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setEditCategoryName(category);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCategory(category)}
                                  disabled={deleteCategoryMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sırala..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Son Eklenenler</SelectItem>
                    <SelectItem value="alphabetical">Alfabetik</SelectItem>
                    <SelectItem value="category">Kategoriye Göre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorites List */}
        {isLoading ? (
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
            <p className="mt-2 text-muted-foreground">Favoriler yükleniyor...</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
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
                {filteredWords.map((word, index) => (
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
                        <i className="fas fa-heart text-red-500"></i>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditWord?.(word)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromFavorites(word.id)}
                          disabled={removeFavoriteMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredWords.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <i className="fas fa-heart text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-medium mb-2">No favorite words found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategory 
                    ? "Try adjusting your filters to see more results."
                    : "Start adding words to your favorites from the word list."
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
