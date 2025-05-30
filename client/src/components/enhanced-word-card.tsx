import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Word, InsertWord } from '@shared/schema';
import { X, Edit3, Check, Plus, Sparkles, Heart, BookOpen } from 'lucide-react';

interface EnhancedWordCardProps {
  word: Word;
  onClose: () => void;
  getArticleColor?: (article: string | null, hasPlural: boolean) => string;
}

interface EditableFieldProps {
  value: string | null | undefined;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}

function EditableField({ value, onSave, placeholder = '', className = '', multiline = false }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (!multiline) {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, multiline]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    const Component = multiline ? Textarea : Input;
    return (
      <Component
        ref={inputRef as any}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        rows={multiline ? 3 : undefined}
      />
    );
  }

  return (
    <div className="group">
      <div
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 rounded-lg px-3 py-3 min-h-[2.5rem] flex items-center border border-transparent hover:border-gray-200 hover:shadow-sm ${className}`}
      >
        {value ? (
          <span className="flex-1 leading-relaxed">{value}</span>
        ) : (
          <span className="text-gray-400 italic flex-1 leading-relaxed">{placeholder}</span>
        )}
        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Edit3 className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

export default function EnhancedWordCard({ word, onClose, getArticleColor }: EnhancedWordCardProps) {
  const [localWord, setLocalWord] = useState<Word>(word);
  const [notionBlocks, setNotionBlocks] = useState<string[]>(['']);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const hasPlural = Boolean(localWord.plural);
  const colorClass = getArticleColor ? getArticleColor(localWord.article, hasPlural && !localWord.article) : '';

  const updateWordMutation = useMutation({
    mutationFn: async (updateData: Partial<InsertWord>) => {
      return apiRequest('PATCH', `/api/words/${localWord.id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/words'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Gespeichert",
        description: "Änderungen wurden erfolgreich gespeichert.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Beim Speichern ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    },
  });

  const handleFieldUpdate = (field: keyof InsertWord, value: string) => {
    const trimmedValue = value.trim();
    const updateData = { [field]: trimmedValue || null };
    
    // Capitalize German words
    if (field === 'german' && trimmedValue) {
      updateData[field] = trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1).toLowerCase();
    }

    setLocalWord(prev => ({ ...prev, [field]: updateData[field] }));
    updateWordMutation.mutate(updateData);
  };

  const addNotionBlock = () => {
    setNotionBlocks(prev => [...prev, '']);
  };

  const updateNotionBlock = (index: number, value: string) => {
    setNotionBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = value;
      return newBlocks;
    });
  };

  const removeNotionBlock = (index: number) => {
    if (notionBlocks.length > 1) {
      setNotionBlocks(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <Card className="w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="relative bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${colorClass}`}>
                  {localWord.article || 'Artikel'}
                </div>
                <Badge variant={localWord.isFavorite ? "default" : "secondary"} className="flex items-center space-x-1">
                  <Heart className={`h-3 w-3 ${localWord.isFavorite ? 'fill-current' : ''}`} />
                  <span>{localWord.isFavorite ? 'Favorit' : 'Normal'}</span>
                </Badge>
              </div>
              <CardTitle className={`text-4xl font-bold mb-1 ${colorClass}`}>
                {localWord.german.charAt(0).toUpperCase() + localWord.german.slice(1)}
              </CardTitle>
              <p className="text-xl text-gray-600 font-medium">{localWord.turkish}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-white/80 rounded-full h-10 w-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 space-y-8">
          {/* Main Word Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <label className="text-sm font-semibold text-blue-800">Artikel</label>
                </div>
                <EditableField
                  value={localWord.article}
                  onSave={(value) => handleFieldUpdate('article', value)}
                  placeholder="der/die/das"
                  className={`text-lg font-semibold bg-white/70 ${colorClass}`}
                />
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center space-x-2 mb-3">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <label className="text-sm font-semibold text-green-800">Deutsches Wort</label>
                </div>
                <EditableField
                  value={localWord.german}
                  onSave={(value) => handleFieldUpdate('german', value)}
                  placeholder="Deutsches Wort eingeben"
                  className={`text-xl font-bold bg-white/70 ${colorClass}`}
                />
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center space-x-2 mb-3">
                  <Plus className="h-4 w-4 text-purple-600" />
                  <label className="text-sm font-semibold text-purple-800">Plural</label>
                </div>
                <EditableField
                  value={localWord.plural}
                  onSave={(value) => handleFieldUpdate('plural', value)}
                  placeholder="Pluralform"
                  className={`bg-white/70 ${colorClass}`}
                />
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg font-bold">🇹🇷</span>
                  <label className="text-sm font-semibold text-orange-800">Türkische Bedeutung</label>
                </div>
                <EditableField
                  value={localWord.turkish}
                  onSave={(value) => handleFieldUpdate('turkish', value)}
                  placeholder="Türkische Übersetzung"
                  className="text-lg bg-white/70"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">🏷️</span>
                  <label className="text-sm font-semibold text-gray-800">Kategorie</label>
                </div>
                <EditableField
                  value={localWord.category}
                  onSave={(value) => handleFieldUpdate('category', value)}
                  placeholder="Kategorie"
                  className="bg-white/70"
                />
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">📍</span>
                  <label className="text-sm font-semibold text-red-800">WO? (Wo ist es?)</label>
                </div>
                <EditableField
                  value={localWord.wo}
                  onSave={(value) => handleFieldUpdate('wo', value)}
                  placeholder="z.B. in der Küche, im Garten"
                  className="bg-white/70"
                />
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">➡️</span>
                  <label className="text-sm font-semibold text-teal-800">WOHIN? (Wohin geht es?)</label>
                </div>
                <EditableField
                  value={localWord.wohin}
                  onSave={(value) => handleFieldUpdate('wohin', value)}
                  placeholder="z.B. in die Küche, an den Strand"
                  className="bg-white/70"
                />
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">⬅️</span>
                  <label className="text-sm font-semibold text-pink-800">WOHER? (Woher kommt es?)</label>
                </div>
                <EditableField
                  value={localWord.woher}
                  onSave={(value) => handleFieldUpdate('woher', value)}
                  placeholder="z.B. aus der Küche, vom Strand"
                  className="bg-white/70"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-indigo-500 rounded-full p-2">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-indigo-900">Beschreibung</h3>
            </div>
            <EditableField
              value={localWord.description}
              onSave={(value) => handleFieldUpdate('description', value)}
              placeholder="Beschreibung oder zusätzliche Informationen hinzufügen..."
              multiline
              className="text-base bg-white/80 rounded-lg"
            />
          </div>

          {/* Personal Notes */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-amber-500 rounded-full p-2">
                <Edit3 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-amber-900">Persönliche Notizen</h3>
            </div>
            <EditableField
              value={localWord.notes}
              onSave={(value) => handleFieldUpdate('notes', value)}
              placeholder="Ihre persönlichen Notizen zum Wort..."
              multiline
              className="text-base bg-white/80 rounded-lg"
            />
          </div>

          {/* Notion-style Blocks */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-500 rounded-full p-2">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-emerald-900">Notizen-Blöcke</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addNotionBlock}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Block hinzufügen
              </Button>
            </div>
            
            <div className="space-y-4">
              {notionBlocks.map((block, index) => (
                <div key={index} className="group">
                  <div className="bg-white/80 rounded-xl p-4 border border-emerald-200/50 hover:border-emerald-300 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-medium text-emerald-700">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <EditableField
                          value={block}
                          onSave={(value) => updateNotionBlock(index, value)}
                          placeholder="Notiz eingeben..."
                          className="w-full bg-transparent"
                        />
                      </div>
                      {notionBlocks.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNotionBlock(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 h-8 w-8 p-0 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Word Statistics */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <Badge variant={localWord.isFavorite ? "default" : "secondary"} className="ml-2">
                  {localWord.isFavorite ? "Favorit" : "Normal"}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Artikel:</span>
                <span className={`ml-2 font-medium ${colorClass}`}>
                  {localWord.article || "Kein Artikel"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Hat Plural:</span>
                <span className="ml-2">{hasPlural ? "Ja" : "Nein"}</span>
              </div>
              <div>
                <span className="text-gray-600">Kategorie:</span>
                <Badge variant="outline" className="ml-2">{localWord.category}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}