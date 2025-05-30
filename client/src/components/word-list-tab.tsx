import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Word, FavoriteList } from "@shared/schema";

export default function WordListTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [favoriteFilter, setFavoriteFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("alphabetical");
  const [selectedWordForFavorite, setSelectedWordForFavorite] = useState<Word | null>(null);
  const [isAddToFavoriteDialogOpen, setIsAddToFavoriteDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: words = [], isLoading } = useQuery<Word[]>({
    queryKey: ['/api/words', { 
      search: searchTerm, 
      category: selectedCategory === 'all' ? undefined : selectedCategory, 
      favorites: favoriteFilter === 'all' ? undefined : favoriteFilter 
    }],
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  const { data: favoriteLists = [] } = useQuery<FavoriteList[]>({
    queryKey: ['/api/favorite-lists'],
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: number; isFavorite: boolean }) => {
      return apiRequest('PUT', `/api/words/${id}`, { isFavorite: !isFavorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/words'] });
      toast({
        title: "Success",
        description: "Favorite status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    },
  });

  const deleteWordMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/words/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/words'] });
      toast({
        title: "Success",
        description: "Word deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete word",
        variant: "destructive",
      });
    },
  });

  const addToListMutation = useMutation({
    mutationFn: async ({ listId, wordId }: { listId: number; wordId: number }) => {
      const list = favoriteLists.find(l => l.id === listId);
      if (!list) throw new Error('List not found');
      
      const newWordIds = [...list.wordIds, wordId.toString()];
      return apiRequest('PUT', `/api/favorite-lists/${listId}`, { 
        name: list.name, 
        wordIds: newWordIds 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-lists'] });
      setIsAddToFavoriteDialogOpen(false);
      setSelectedWordForFavorite(null);
      toast({
        title: "Başarılı",
        description: "Kelime listeye eklendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Kelime listeye eklenemedi",
        variant: "destructive",
      });
    },
  });

  const handleToggleFavorite = (word: Word) => {
    if (!word.isFavorite) {
      // If not favorite, show dialog to choose list
      setSelectedWordForFavorite(word);
      setIsAddToFavoriteDialogOpen(true);
    } else {
      // If already favorite, just toggle off
      toggleFavoriteMutation.mutate({ id: word.id, isFavorite: word.isFavorite });
    }
  };

  const handleAddToGeneralFavorites = () => {
    if (selectedWordForFavorite) {
      toggleFavoriteMutation.mutate({ 
        id: selectedWordForFavorite.id, 
        isFavorite: selectedWordForFavorite.isFavorite 
      });
      setIsAddToFavoriteDialogOpen(false);
      setSelectedWordForFavorite(null);
    }
  };

  const handleAddToSpecificList = (listId: number) => {
    if (selectedWordForFavorite) {
      // First make it favorite
      toggleFavoriteMutation.mutate({ 
        id: selectedWordForFavorite.id, 
        isFavorite: selectedWordForFavorite.isFavorite 
      });
      // Then add to specific list
      addToListMutation.mutate({ 
        listId, 
        wordId: selectedWordForFavorite.id 
      });
    }
  };

  const handleDeleteWord = (id: number) => {
    if (confirm("Are you sure you want to delete this word?")) {
      deleteWordMutation.mutate(id);
    }
  };

  const sortedWords = [...words].sort((a, b) => {
    switch (sortOrder) {
      case 'alphabetical':
        return a.german.localeCompare(b.german);
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Input
                  placeholder="Search words..."
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
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Words</SelectItem>
                  <SelectItem value="true">Favorites Only</SelectItem>
                  <SelectItem value="false">Not Favorites</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="category">By Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <i className="fas fa-list mr-2 text-primary"></i>
              Word List
            </span>
            <span className="text-sm text-muted-foreground">
              {words.length} words
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
              <p className="mt-2 text-muted-foreground">Loading words...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Word</TableHead>
                    <TableHead>Plural</TableHead>
                    <TableHead>Meaning</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>WO/WOHIN/WOHER</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedWords.map((word) => (
                    <TableRow key={word.id}>
                      <TableCell className="font-medium">{word.article}</TableCell>
                      <TableCell>{word.german}</TableCell>
                      <TableCell>{word.plural}</TableCell>
                      <TableCell>{word.turkish}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{word.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="space-y-1">
                          {word.wo && <div>WO: {word.wo}</div>}
                          {word.wohin && <div>WOHIN: {word.wohin}</div>}
                          {word.woher && <div>WOHER: {word.woher}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(word)}
                            disabled={toggleFavoriteMutation.isPending}
                          >
                            <i className={`fas fa-heart ${word.isFavorite ? 'text-red-600' : 'text-gray-400'}`}></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Open word card modal
                              console.log('Open word card for:', word);
                            }}
                          >
                            <i className="fas fa-credit-card text-primary"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWord(word.id)}
                            disabled={deleteWordMutation.isPending}
                          >
                            <i className="fas fa-trash text-red-600"></i>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add to Favorite List Dialog */}
      <Dialog open={isAddToFavoriteDialogOpen} onOpenChange={setIsAddToFavoriteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Favori Listesine Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              "{selectedWordForFavorite?.german}" kelimesini hangi listeye eklemek istiyorsunuz?
            </p>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAddToGeneralFavorites}
              >
                <i className="fas fa-heart mr-2 text-red-500"></i>
                Genel Favoriler
              </Button>
              
              {favoriteLists.map((list) => (
                <Button
                  key={list.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAddToSpecificList(list.id)}
                >
                  <i className="fas fa-bookmark mr-2 text-blue-500"></i>
                  {list.name} ({list.wordIds.length} kelime)
                </Button>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddToFavoriteDialogOpen(false);
                  setSelectedWordForFavorite(null);
                }}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
