import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertWordSchema, type InsertWord } from "@shared/schema";

export default function AddWordTab() {
  const [excelData, setExcelData] = useState("");
  const [previewData, setPreviewData] = useState<InsertWord[]>([]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Kategorileri yükle
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm<InsertWord>({
    resolver: zodResolver(insertWordSchema),
    defaultValues: {
      article: "",
      german: "",
      plural: "",
      pluralSuffix: "",
      turkish: "",
      category: "",
      isFavorite: false,
      wo: "",
      wohin: "",
      woher: "",
      exampleSentence: "",
      exampleTranslation: "",
    },
  });

  const addWordMutation = useMutation({
    mutationFn: async (wordData: InsertWord) => {
      return apiRequest('POST', '/api/words', wordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/words'] });
      form.reset();
      toast({
        title: "Success",
        description: "Word added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add word",
        variant: "destructive",
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (words: InsertWord[]) => {
      return apiRequest('POST', '/api/words/bulk', { words });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/words'] });
      setExcelData("");
      setPreviewData([]);
      toast({
        title: "Success",
        description: `${previewData.length} words imported successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import words",
        variant: "destructive",
      });
    },
  });

  const handleAddWord = (data: InsertWord) => {
    addWordMutation.mutate(data);
  };

  const parseExcelData = (data: string) => {
    const lines = data.trim().split('\n');
    const words: InsertWord[] = [];

    lines.forEach((line) => {
      const columns = line.split('\t');
      if (columns.length >= 6) {
        const word: InsertWord = {
          article: columns[0]?.trim() || "",           // 1-artikel
          german: columns[1]?.trim() || "",            // 2-kelime
          plural: columns[2]?.trim() || "",            // 3-çoğul
          pluralSuffix: columns[3]?.trim() || "",      // 4-çoğul eki
          turkish: columns[4]?.trim() || "",           // 5-anlam
          category: columns[5]?.trim() || "Other",     // 6-kategori
          // columns[6] = örnek cümle (şu an kullanılmıyor)
          // columns[7] = örnek cümle çeviri (şu an kullanılmıyor)
          isFavorite: false,
          wo: "",
          wohin: "",
          woher: "",
          exampleSentence: columns[6]?.trim() || "",    // 7-örnek cümle  
          exampleTranslation: columns[7]?.trim() || "", // 8-örnek cümle çeviri
        };
        
        if (word.german && word.turkish) {
          words.push(word);
        }
      }
    });

    setPreviewData(words);
  };

  const handleExcelDataChange = (value: string) => {
    setExcelData(value);
    if (value.trim()) {
      parseExcelData(value);
    } else {
      setPreviewData([]);
    }
  };

  const handleImportWords = () => {
    if (previewData.length > 0) {
      bulkImportMutation.mutate(previewData);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        handleExcelDataChange(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Excel Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-file-excel mr-2 text-primary"></i>
            Import from Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <i className="fas fa-file-excel text-4xl text-muted-foreground mb-4"></i>
            <p className="text-lg font-medium mb-2">Drop Excel file here</p>
            <p className="text-muted-foreground mb-4">or click to browse</p>
            <Button variant="outline">
              Choose File
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Paste Area */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Or paste Excel data</Label>
            <Textarea
              placeholder="Paste your Excel data here... (Tab-separated: article, german, plural, turkish, category)"
              rows={8}
              value={excelData}
              onChange={(e) => handleExcelDataChange(e.target.value)}
            />
          </div>

          {/* Preview Section */}
          {previewData.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-3">Preview ({previewData.length} words detected)</h3>
                <div className="text-sm space-y-3 max-h-48 overflow-y-auto">
                  {previewData.slice(0, 5).map((word, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border shadow-sm">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><strong>Artikel:</strong> {word.article}</div>
                        <div><strong>Kelime:</strong> {word.german}</div>
                        <div><strong>Çoğul:</strong> {word.plural || '-'}</div>
                        <div><strong>Çoğul Eki:</strong> {word.pluralSuffix || '-'}</div>
                        <div><strong>Türkçe:</strong> {word.turkish}</div>
                        <div><strong>Kategori:</strong> {word.category}</div>
                        <div className="col-span-2"><strong>Örnek:</strong> {word.exampleSentence || '-'}</div>
                        <div className="col-span-2"><strong>Çeviri:</strong> {word.exampleTranslation || '-'}</div>
                      </div>
                    </div>
                  ))}
                  {previewData.length > 5 && (
                    <div className="text-muted-foreground text-center py-2 border-t">
                      ... ve {previewData.length - 5} kelime daha
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  onClick={handleImportWords}
                  disabled={bulkImportMutation.isPending}
                >
                  {bulkImportMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-upload mr-2"></i>
                  )}
                  Import {previewData.length} Words
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-edit mr-2 text-primary"></i>
            Add Word Manually
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddWord)} className="space-y-6">
              {/* Article */}
              <FormField
                control={form.control}
                name="article"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select article..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No article</SelectItem>
                        <SelectItem value="der">der (masculine)</SelectItem>
                        <SelectItem value="die">die (feminine)</SelectItem>
                        <SelectItem value="das">das (neuter)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* German Word */}
              <FormField
                control={form.control}
                name="german"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>German Word *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hund" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Plural Form */}
              <FormField
                control={form.control}
                name="plural"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plural Form</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hunde" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Turkish Meaning */}
              <FormField
                control={form.control}
                name="turkish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turkish Meaning *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., köpek" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prepositions Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Prepositions (Optional)</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="wo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WO? (Where)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., zu Hause" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="wohin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WOHIN? (Where to)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., nach Hause" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="woher"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WOHER? (Where from)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., von zu Hause" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Add to Favorites */}
              <FormField
                control={form.control}
                name="isFavorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Add to favorites</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={addWordMutation.isPending}
                >
                  {addWordMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-plus mr-2"></i>
                  )}
                  Add Word
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Clear
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
