import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TestTab from "@/components/test-tab";
import WordListTab from "@/components/word-list-tab";
import FavoritesTab from "@/components/favorites-tab";
import CategoriesTab from "@/components/categories-tab";
import WordCardTab from "@/components/word-card-tab";
import AddWordTab from "@/components/add-word-tab";
import type { Word, InsertWord } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWordSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TabType = 'test' | 'wordlist' | 'favorites' | 'categories' | 'wordcard' | 'addword';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('test');
  const [selectedWordForCard, setSelectedWordForCard] = useState<Word | null>(null);
  const [isWordCardModalOpen, setIsWordCardModalOpen] = useState(false);
  const [selectedWordForEdit, setSelectedWordForEdit] = useState<Word | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  const editForm = useForm<InsertWord>({
    resolver: zodResolver(insertWordSchema),
    defaultValues: {
      german: '',
      turkish: '',
      article: 'der',
      category: '',
      plural: '',
      pluralSuffix: '',
      wo: '',
      wohin: '',
      woher: '',
    },
  });

  const updateWordMutation = useMutation({
    mutationFn: async (data: { id: number; word: InsertWord }) => {
      return apiRequest('PATCH', `/api/words/${data.id}`, data.word);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/words'] });
      toast({
        title: "Erfolgreich",
        description: "Wort wurde erfolgreich aktualisiert.",
      });
      setIsEditModalOpen(false);
      setSelectedWordForEdit(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Beim Aktualisieren des Wortes ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    },
  });

  const tabs = [
    { id: 'test', label: 'Test', icon: 'clipboard-check' },
    { id: 'wordlist', label: 'Wortliste', icon: 'list' },
    { id: 'favorites', label: 'Favoriten', icon: 'heart' },
    { id: 'categories', label: 'Kategorien', icon: 'tag' },
    { id: 'wordcard', label: 'Wortkarte', icon: 'credit-card' },
    { id: 'addword', label: 'Wort hinzufügen', icon: 'plus' },
  ];

  const handleOpenWordCard = (word: Word) => {
    setSelectedWordForCard(word);
    setIsWordCardModalOpen(true);
  };

  const handleEditWord = (word: Word) => {
    setSelectedWordForEdit(word);
    editForm.reset({
      german: word.german,
      turkish: word.turkish,
      article: word.article || 'der',
      category: word.category,
      plural: word.plural || '',
      pluralSuffix: word.pluralSuffix || '',
      wo: word.wo || '',
      wohin: word.wohin || '',
      woher: word.woher || '',
    });
    setIsEditModalOpen(true);
  };

  const onEditSubmit = (data: InsertWord) => {
    if (selectedWordForEdit) {
      // Wort mit großem Anfangsbuchstaben
      const formattedData = {
        ...data,
        german: data.german.charAt(0).toUpperCase() + data.german.slice(1).toLowerCase()
      };
      updateWordMutation.mutate({ id: selectedWordForEdit.id, word: formattedData });
    }
  };

  // Funktion für Artikel-Farben
  const getArticleColor = (article: string | null, hasPlural: boolean) => {
    if (hasPlural && !article) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'; // Nur Plural
    }
    
    switch (article) {
      case 'der':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'die':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'das':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'test':
        return <TestTab />;
      case 'wordlist':
        return <WordListTab onOpenWordCard={handleOpenWordCard} onEditWord={handleEditWord} getArticleColor={getArticleColor} />;
      case 'favorites':
        return <FavoritesTab onOpenWordCard={handleOpenWordCard} />;
      case 'categories':
        return <CategoriesTab />;
      case 'wordcard':
        return <WordCardTab />;
      case 'addword':
        return <AddWordTab />;
      default:
        return <TestTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <i className="fas fa-language text-primary text-2xl"></i>
              <h1 className="text-xl font-semibold text-foreground">Deutsch Lernen</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Progress: 245 words learned</span>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <i className="fas fa-user text-primary-foreground text-sm"></i>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                <i className={`fas fa-${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>

      {/* Word Card Modal */}
      <Dialog open={isWordCardModalOpen} onOpenChange={setIsWordCardModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kelime Kartı</DialogTitle>
          </DialogHeader>
          {selectedWordForCard && (
            <div className="space-y-6">
              {/* Main Word Display */}
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div className="text-sm text-primary font-medium mb-2">
                  {selectedWordForCard.article}
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {selectedWordForCard.german}
                </div>
                <div className="text-xl text-muted-foreground">
                  {selectedWordForCard.turkish}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Çoğul</h4>
                  <p className="text-lg">{selectedWordForCard.plural || '-'}</p>
                  {selectedWordForCard.pluralSuffix && (
                    <p className="text-sm text-muted-foreground">({selectedWordForCard.pluralSuffix})</p>
                  )}
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Kategori</h4>
                  <p className="text-lg">{selectedWordForCard.category}</p>
                </div>

                {selectedWordForCard.wo && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">WO? (Nerede?)</h4>
                    <p className="text-lg">{selectedWordForCard.wo}</p>
                  </div>
                )}

                {selectedWordForCard.wohin && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">WOHIN? (Nereye?)</h4>
                    <p className="text-lg">{selectedWordForCard.wohin}</p>
                  </div>
                )}

                {selectedWordForCard.woher && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">WOHER? (Nereden?)</h4>
                    <p className="text-lg">{selectedWordForCard.woher}</p>
                  </div>
                )}
              </div>

              {/* Favorite Status */}
              <div className="flex items-center justify-center">
                <div className={`flex items-center px-4 py-2 rounded-full ${
                  selectedWordForCard.isFavorite 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <i className={`fas fa-heart mr-2 ${
                    selectedWordForCard.isFavorite ? 'text-red-600' : 'text-gray-400'
                  }`}></i>
                  {selectedWordForCard.isFavorite ? 'Favorilerimde' : 'Favorilerde değil'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Word Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelime Düzenle</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Article Selection */}
                <FormField
                  control={editForm.control}
                  name="article"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artikel</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Artikel seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="der">der</SelectItem>
                          <SelectItem value="die">die</SelectItem>
                          <SelectItem value="das">das</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* German Word */}
                <FormField
                  control={editForm.control}
                  name="german"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Almanca Kelime</FormLabel>
                      <FormControl>
                        <Input placeholder="Almanca kelime girin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Turkish Meaning */}
                <FormField
                  control={editForm.control}
                  name="turkish"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Türkçe Anlamı</FormLabel>
                      <FormControl>
                        <Input placeholder="Türkçe anlamını girin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Plural */}
                <FormField
                  control={editForm.control}
                  name="plural"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çoğul Hali</FormLabel>
                      <FormControl>
                        <Input placeholder="Çoğul halini girin" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Plural Suffix */}
                <FormField
                  control={editForm.control}
                  name="pluralSuffix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çoğul Eki</FormLabel>
                      <FormControl>
                        <Input placeholder="Çoğul ekini girin" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WO */}
                <FormField
                  control={editForm.control}
                  name="wo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WO? (Nerede?)</FormLabel>
                      <FormControl>
                        <Input placeholder="WO sorusunun cevabı" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WOHIN */}
                <FormField
                  control={editForm.control}
                  name="wohin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WOHIN? (Nereye?)</FormLabel>
                      <FormControl>
                        <Input placeholder="WOHIN sorusunun cevabı" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WOHER */}
                <FormField
                  control={editForm.control}
                  name="woher"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WOHER? (Nereden?)</FormLabel>
                      <FormControl>
                        <Input placeholder="WOHER sorusunun cevabı" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedWordForEdit(null);
                    editForm.reset();
                  }}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={updateWordMutation.isPending}>
                  {updateWordMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Kaydet
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
