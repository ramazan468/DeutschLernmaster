import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TestSession from "./test-session";
import type { TestMode, TestType, TestSource } from "@shared/schema";

export default function TestTab() {
  const [selectedTestMode, setSelectedTestMode] = useState<TestMode>('artikel');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customCount, setCustomCount] = useState<string>('');
  const [testType, setTestType] = useState<TestType>('multiple');
  const [testSource, setTestSource] = useState<TestSource>('wordlist');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFavoriteList, setSelectedFavoriteList] = useState<string>('');
  const [isTestActive, setIsTestActive] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  const { data: favoriteLists = [] } = useQuery({
    queryKey: ['/api/favorite-lists'],
  });

  const testModes = [
    { id: 'artikel', label: 'Artikel', icon: 'font' },
    { id: 'plural', label: 'Plural Forms', icon: 'layer-group' },
    { id: 'tr-de', label: 'TR → DE', icon: 'arrow-right' },
    { id: 'de-tr', label: 'DE → TR', icon: 'arrow-left' },
    { id: 'sentence', label: 'Sentences', icon: 'comments' },
    { id: 'wo', label: 'WO?', icon: 'question' },
    { id: 'wohin', label: 'WOHIN?', icon: 'location-arrow' },
    { id: 'woher', label: 'WOHER?', icon: 'undo' },
  ];

  const questionCounts = [5, 10, 15, 20];

  const saveTestResultMutation = useMutation({
    mutationFn: async (result: { 
      testMode: string; 
      testType: string; 
      testSource: string; 
      questionCount: number; 
      correctAnswers: number; 
      totalQuestions: number; 
      score: number; 
    }) => {
      return apiRequest('POST', '/api/test-results', result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-results'] });
    },
  });

  const handleStartTest = () => {
    const finalCount = customCount ? parseInt(customCount) : questionCount;
    setIsTestActive(true);
  };

  const handleTestComplete = (correctAnswers: number, totalQuestions: number) => {
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    saveTestResultMutation.mutate({
      testMode: selectedTestMode,
      testType: testType,
      testSource: testSource,
      questionCount: totalQuestions,
      correctAnswers,
      totalQuestions,
      score,
    });

    toast({
      title: "Test Tamamlandı!",
      description: `Skorunuz: ${correctAnswers}/${totalQuestions} (%${score})`,
    });

    setIsTestActive(false);
  };

  const handleExitTest = () => {
    setIsTestActive(false);
  };

  if (isTestActive) {
    const finalCount = customCount ? parseInt(customCount) : questionCount;
    return (
      <TestSession
        mode={selectedTestMode}
        questionCount={finalCount}
        testType={testType}
        source={testSource}
        selectedCategory={selectedCategory}
        selectedFavoriteList={selectedFavoriteList}
        onComplete={handleTestComplete}
        onExit={handleExitTest}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 1. Test Modes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-clipboard-check mr-2 text-primary"></i>
            Test Modları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {testModes.map((mode) => (
              <div
                key={mode.id}
                onClick={() => setSelectedTestMode(mode.id as TestMode)}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-colors text-center ${
                  selectedTestMode === mode.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary'
                }`}
              >
                <i className={`fas fa-${mode.icon} text-lg text-muted-foreground mb-1 block`}></i>
                <p className="font-medium text-sm text-foreground">{mode.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Test Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-cog mr-2 text-primary"></i>
            Test Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question Count */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Soru Sayısı</Label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {questionCounts.map((count) => (
                <Button
                  key={count}
                  variant={questionCount === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setQuestionCount(count);
                    setCustomCount('');
                  }}
                >
                  {count}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Özel sayı"
              value={customCount}
              onChange={(e) => setCustomCount(e.target.value)}
              min="1"
              max="100"
            />
          </div>

          {/* Test Type */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Test Türü</Label>
            <RadioGroup value={testType} onValueChange={(value) => setTestType(value as TestType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple" id="multiple" />
                <Label htmlFor="multiple" className="text-sm">Çoktan Seçmeli</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fill" id="fill" />
                <Label htmlFor="fill" className="text-sm">Boşluk Doldurma</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="text-sm">Karışık</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* 3. Test Source */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-database mr-2 text-primary"></i>
            Test Kaynağı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Kaynak Seç</Label>
            <Select value={testSource} onValueChange={(value) => {
              setTestSource(value as TestSource);
              setSelectedCategory('');
              setSelectedFavoriteList('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wordlist">Tüm Kelimeler</SelectItem>
                <SelectItem value="category">Kategori</SelectItem>
                <SelectItem value="favorites">Favori Liste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          {testSource === 'category' && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Kategori Seç</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Bir kategori seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Favorite List Selection */}
          {testSource === 'favorites' && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Favori Liste Seç</Label>
              <Select value={selectedFavoriteList} onValueChange={setSelectedFavoriteList}>
                <SelectTrigger>
                  <SelectValue placeholder="Bir favori liste seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Favoriler</SelectItem>
                  {favoriteLists.map((list: any) => (
                    <SelectItem key={list.id} value={list.id.toString()}>
                      {list.name} ({list.wordIds.length} kelime)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Test Summary & Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-play-circle mr-2 text-primary"></i>
            Test Özeti ve Başlat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Test Bilgileri</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Mod: <span className="text-foreground">{testModes.find(m => m.id === selectedTestMode)?.label}</span></div>
              <div>Soru: <span className="text-foreground">{customCount || questionCount}</span></div>
              <div>Tür: <span className="text-foreground">{testType === 'multiple' ? 'Çoktan Seçmeli' : testType === 'fill' ? 'Boşluk Doldurma' : 'Karışık'}</span></div>
              <div>Kaynak: <span className="text-foreground">
                {testSource === 'wordlist' ? 'Tüm Kelimeler' : 
                 testSource === 'category' ? (selectedCategory ? `Kategori: ${selectedCategory}` : 'Kategori (seçilmedi)') : 
                 testSource === 'favorites' ? (selectedFavoriteList ? 
                   (selectedFavoriteList === 'all' ? 'Tüm Favoriler' : 
                    favoriteLists.find((l: any) => l.id.toString() === selectedFavoriteList)?.name || 'Favori Liste') 
                   : 'Favori Liste (seçilmedi)') : 'Bilinmeyen'}
              </span></div>
            </div>
          </div>

          <Button 
            onClick={handleStartTest} 
            className="w-full h-12 text-lg"
            disabled={
              (testSource === 'category' && !selectedCategory) ||
              (testSource === 'favorites' && !selectedFavoriteList)
            }
          >
            <i className="fas fa-play mr-2"></i>
            Testi Başlat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
