import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Word, FavoriteList } from "@shared/schema";

interface FavoritesTabProps {
  onOpenWordCard?: (word: Word) => void;
}

export default function FavoritesTab({ onOpenWordCard }: FavoritesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newListName, setNewListName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

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

  const handleCreateList = () => {
    if (newListName.trim()) {
      createListMutation.mutate(newListName.trim());
    }
  };

  const handleRemoveFromFavorites = (id: number) => {
    removeFavoriteMutation.mutate(id);
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
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedListId === list.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => setSelectedListId(list.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <i className="fas fa-bookmark mr-2"></i>
                      {list.name}
                    </span>
                    <span className="text-sm text-muted-foreground">{list.wordIds.length}</span>
                  </div>
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
              <div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
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
              <div className="divide-y divide-gray-200">
                {filteredWords.map((word, index) => (
                  <div key={word.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 w-8">
                            {index + 1}
                          </span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium px-2 py-1 rounded ${
                                word.article === 'der' ? 'bg-blue-100 text-blue-800' :
                                word.article === 'die' ? 'bg-red-100 text-red-800' :
                                word.article === 'das' ? 'bg-green-100 text-green-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {word.article || '-'}
                              </span>
                              <h3 className="font-semibold text-lg">
                                {word.german.charAt(0).toUpperCase() + word.german.slice(1)}
                              </h3>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-gray-700 font-medium">{word.turkish}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Plural:</span> {word.plural || '-'}
                          </p>
                          <Badge variant="secondary" className="mt-1">
                            {word.category}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenWordCard?.(word)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <i className="fas fa-eye mr-1"></i>
                            Kartı Gör
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromFavorites(word.id)}
                            disabled={removeFavoriteMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <i className="fas fa-heart mr-1"></i>
                            Kaldır
                          </Button>
                        </div>
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
