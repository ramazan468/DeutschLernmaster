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

export default function FavoritesTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newListName, setNewListName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favoriteWords = [], isLoading } = useQuery<Word[]>({
    queryKey: ['/api/favorites', { search: searchTerm, category: selectedCategory }],
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

  const filteredWords = favoriteWords.filter(word => {
    const matchesSearch = !searchTerm || 
      word.german.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.turkish.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || word.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Favorite Lists Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Favorite Lists</CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <i className="fas fa-plus"></i>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Favorite List</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="list-name">List Name</Label>
                      <Input
                        id="list-name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Enter list name..."
                      />
                    </div>
                    <Button 
                      onClick={handleCreateList}
                      disabled={createListMutation.isPending || !newListName.trim()}
                      className="w-full"
                    >
                      Create List
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 bg-primary text-primary-foreground rounded-md cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-list mr-2"></i>
                    All Favorites
                  </span>
                  <span className="text-sm">{favoriteWords.length}</span>
                </div>
              </div>
              {favoriteLists.map((list) => (
                <div key={list.id} className="p-3 bg-muted hover:bg-muted/80 rounded-md cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <i className="fas fa-bookmark mr-2"></i>
                      {list.name}
                    </span>
                    <span className="text-sm text-muted-foreground">{list.wordIds.length}</span>
                  </div>
                </div>
              ))}
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
                    placeholder="Search favorites..."
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
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorites Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
            <p className="mt-2 text-muted-foreground">Loading favorites...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWords.map((word) => (
              <Card key={word.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-sm font-medium text-primary">{word.article}</span>
                      <h3 className="text-lg font-semibold">{word.german}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromFavorites(word.id)}
                      disabled={removeFavoriteMutation.isPending}
                    >
                      <i className="fas fa-heart text-red-600"></i>
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-2">{word.turkish}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Plural: {word.plural}
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">{word.category}</Badge>
                    <Button variant="ghost" size="sm">
                      <i className="fas fa-external-link-alt mr-1"></i>
                      View Card
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
