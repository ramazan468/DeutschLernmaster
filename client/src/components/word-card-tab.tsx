import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { Word } from "@shared/schema";

export default function WordCardTab() {
  const [cardType, setCardType] = useState<'turkish' | 'german'>('turkish');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [favoriteFilter, setFavoriteFilter] = useState<string>("all");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data: allWords = [] } = useQuery<Word[]>({
    queryKey: ['/api/words'],
  });

  const { data: favoriteWords = [] } = useQuery<Word[]>({
    queryKey: ['/api/favorites'],
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  // Filter words based on current filters
  const filteredWords = useMemo(() => {
    let words = favoriteFilter === 'true' ? favoriteWords : allWords;

    if (searchTerm) {
      words = words.filter(word => 
        word.german.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.turkish.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      words = words.filter(word => word.category === selectedCategory);
    }

    return words;
  }, [allWords, favoriteWords, searchTerm, selectedCategory, favoriteFilter]);

  const currentWord = filteredWords[currentCardIndex];
  const progress = filteredWords.length > 0 ? ((currentCardIndex + 1) / filteredWords.length) * 100 : 0;

  // Reset current card index when filters change
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [searchTerm, selectedCategory, favoriteFilter]);

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    if (currentCardIndex < filteredWords.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePreviousCard();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNextCard();
          break;
        case ' ':
        case 'Spacebar':
          event.preventDefault();
          handleFlipCard();
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (isFlipped) handleCardAction('correct');
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (isFlipped) handleCardAction('incorrect');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCardIndex, filteredWords.length, isFlipped]);

  const handleCardAction = (action: 'incorrect' | 'partial' | 'correct') => {
    console.log(`Marked as ${action}:`, currentWord);
    // TODO: Save learning progress
    handleNextCard();
  };

  if (!currentWord) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <i className="fas fa-credit-card text-4xl text-muted-foreground mb-4"></i>
            <h3 className="text-lg font-medium mb-2">No words available</h3>
            <p className="text-muted-foreground">
              Add some words to start studying with flashcards.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Controls Sidebar */}
      <div className="lg:col-span-1">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Card Type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={cardType} onValueChange={(value) => setCardType(value as 'turkish' | 'german')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="turkish" id="turkish" />
                <Label htmlFor="turkish" className="text-sm">Turkish → German</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="german" id="german" />
                <Label htmlFor="german" className="text-sm">German → Turkish</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Search</Label>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
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
              <Label className="text-sm font-medium mb-2 block">Favorites</Label>
              <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Words</SelectItem>
                  <SelectItem value="true">Favorites Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card Display */}
      <div className="lg:col-span-3">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">
                    Card {currentCardIndex + 1} of {filteredWords.length}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Main Card */}
              <div 
                className="bg-muted/50 rounded-xl p-8 mb-6 min-h-64 flex items-center justify-center cursor-pointer transition-all hover:shadow-md"
                onClick={handleFlipCard}
              >
                {!isFlipped ? (
                  // Front Side
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">
                      {cardType === 'turkish' ? currentWord.turkish : `${currentWord.article || ''} ${currentWord.german}`}
                    </h1>
                    <p className="text-lg text-muted-foreground">Click or press Space to reveal answer</p>
                    <i className="fas fa-eye text-muted-foreground mt-4"></i>
                  </div>
                ) : (
                  // Back Side
                  <div className="text-center">
                    <div className="mb-4">
                      {cardType === 'turkish' ? (
                        <>
                          <span className="text-lg text-primary font-medium">{currentWord.article}</span>
                          <h1 className="text-4xl font-bold">{currentWord.german}</h1>
                        </>
                      ) : (
                        <h1 className="text-4xl font-bold">{currentWord.turkish}</h1>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground mb-2">
                      Plural: {currentWord.plural}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Category: {currentWord.category}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mb-6">
                <Button 
                  variant="destructive"
                  onClick={() => handleCardAction('incorrect')}
                  disabled={!isFlipped}
                >
                  <i className="fas fa-times mr-2"></i>
                  Don't Know
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleCardAction('partial')}
                  disabled={!isFlipped}
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                >
                  <i className="fas fa-question mr-2"></i>
                  Partial
                </Button>
                <Button 
                  onClick={() => handleCardAction('correct')}
                  disabled={!isFlipped}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <i className="fas fa-check mr-2"></i>
                  Know It
                </Button>
              </div>

              {/* Keyboard Shortcuts Info */}
              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                <div>Use arrow keys: ← Previous | → Next | ↑ Correct | ↓ Don't Know</div>
                <div>Press Space to flip card</div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline"
                  onClick={handlePreviousCard}
                  disabled={currentCardIndex === 0}
                >
                  <i className="fas fa-chevron-left mr-2"></i>
                  Previous
                </Button>
                
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm">
                    <i className={`fas fa-heart text-xl ${currentWord.isFavorite ? 'text-red-600' : 'text-gray-400'}`}></i>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <i className="fas fa-volume-up text-xl text-primary"></i>
                  </Button>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={handleNextCard}
                  disabled={currentCardIndex === filteredWords.length - 1}
                >
                  Next
                  <i className="fas fa-chevron-right ml-2"></i>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Word Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">WO? (Where)</h3>
              <p className="text-muted-foreground">{currentWord.wo || "Not specified"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">WOHIN? (Where to)</h3>
              <p className="text-muted-foreground">{currentWord.wohin || "Not specified"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">WOHER? (Where from)</h3>
              <p className="text-muted-foreground">{currentWord.woher || "Not specified"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
