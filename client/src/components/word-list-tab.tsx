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

interface WordListTabProps {
  onOpenWordCard?: (word: Word) => void;
  onEditWord?: (word: Word) => void;
  getArticleColor?: (article: string | null, hasPlural: boolean) => string;
}

export default function WordListTab({ onOpenWordCard, onEditWord, getArticleColor }: WordListTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [favoriteFilter, setFavoriteFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("alphabetical");
  const [selectedWordForFavorite, setSelectedWordForFavorite] = useState<Word | null>(null);
  const [isAddToFavoriteDialogOpen, setIsAddToFavoriteDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: allWords = [], isLoading } = useQuery<Word[]>({
    queryKey: ['/api/words'],
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  const { data: favoriteLists = [] } = useQuery<FavoriteList[]>({
    queryKey: ['/api/favorite-lists'],
  });

  // Client-side filtering
  const filteredWords = allWords.filter(word => {
    // Search filter
    if (searchTerm && !word.german.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !word.turkish.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (selectedCategory !== 'all' && word.category !== selectedCategory) {
      return false;
    }
    
    // Favorite filter
    if (favoriteFilter === 'general-favorites' && !word.isFavorite) {
      return false;
    } else if (favoriteFilter === 'not-favorites' && word.isFavorite) {
      return false;
    } else if (favoriteFilter !== 'all' && favoriteFilter !== 'general-favorites' && favoriteFilter !== 'not-favorites') {
      // Specific favorite list filter
      const list = favoriteLists.find(list => list.id.toString() === favoriteFilter);
      if (!list || !list.wordIds.includes(word.id.toString())) {
        return false;
      }
    }
    
    return true;
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

  const sortedWords = [...filteredWords].sort((a, b) => {
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
                  placeholder="Wörter suchen..."
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
                  <SelectValue placeholder="Alle Kategorien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
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
                  <SelectValue placeholder="Favori Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Wörter</SelectItem>
                  <SelectItem value="general-favorites">Genel Favoriler</SelectItem>
                  <SelectItem value="not-favorites">Nicht-Favoriten</SelectItem>
                  {favoriteLists.map((list) => (
                    <SelectItem key={list.id} value={list.id.toString()}>
                      {list.name} ({list.wordIds.length} kelime)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alphabetisch</SelectItem>
                  <SelectItem value="category">Nach Kategorie</SelectItem>
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
              {sortedWords.length} words
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
                    <TableHead>Artikel</TableHead>
                    <TableHead>Wort</TableHead>
                    <TableHead>Plural</TableHead>
                    <TableHead>Bedeutung</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>WO/WOHIN/WOHER</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedWords.map((word) => {
                    const hasPlural = Boolean(word.plural);
                    const colorClass = getArticleColor ? getArticleColor(word.article, hasPlural && !word.article) : '';
                    
                    return (
                      <TableRow key={word.id}>
                        <TableCell className={`font-medium ${colorClass}`}>{word.article || (hasPlural ? 'die' : '-')}</TableCell>
                        <TableCell className={`font-bold ${colorClass}`}>{word.german.charAt(0).toUpperCase() + word.german.slice(1)}</TableCell>
                        <TableCell className={colorClass}>{word.plural}</TableCell>
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
                            onClick={() => onEditWord?.(word)}
                          >
                            <i className="fas fa-edit text-blue-600"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenWordCard?.(word)}
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
                    );
                  })}
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
            <DialogTitle>Zur Favoritenliste hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Zu welcher Liste möchten Sie "{selectedWordForFavorite?.german}" hinzufügen?
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
