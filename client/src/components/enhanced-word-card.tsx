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
import { X, Edit3, Check, Plus } from 'lucide-react';

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
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-50 rounded px-2 py-1 min-h-[2rem] flex items-center ${className}`}
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className={`text-2xl font-bold ${colorClass}`}>
            {localWord.article && <span className="mr-2">{localWord.article}</span>}
            {localWord.german.charAt(0).toUpperCase() + localWord.german.slice(1)}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Main Word Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Artikel</label>
                <EditableField
                  value={localWord.article}
                  onSave={(value) => handleFieldUpdate('article', value)}
                  placeholder="der/die/das"
                  className={`text-lg font-semibold ${colorClass}`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Deutsches Wort</label>
                <EditableField
                  value={localWord.german}
                  onSave={(value) => handleFieldUpdate('german', value)}
                  placeholder="Deutsches Wort eingeben"
                  className={`text-xl font-bold ${colorClass}`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Plural</label>
                <EditableField
                  value={localWord.plural}
                  onSave={(value) => handleFieldUpdate('plural', value)}
                  placeholder="Pluralform"
                  className={colorClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Türkische Bedeutung</label>
                <EditableField
                  value={localWord.turkish}
                  onSave={(value) => handleFieldUpdate('turkish', value)}
                  placeholder="Türkische Übersetzung"
                  className="text-lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Kategorie</label>
                <EditableField
                  value={localWord.category}
                  onSave={(value) => handleFieldUpdate('category', value)}
                  placeholder="Kategorie"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">WO? (Wo ist es?)</label>
                <EditableField
                  value={localWord.wo}
                  onSave={(value) => handleFieldUpdate('wo', value)}
                  placeholder="z.B. in der Küche, im Garten"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">WOHIN? (Wohin geht es?)</label>
                <EditableField
                  value={localWord.wohin}
                  onSave={(value) => handleFieldUpdate('wohin', value)}
                  placeholder="z.B. in die Küche, an den Strand"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">WOHER? (Woher kommt es?)</label>
                <EditableField
                  value={localWord.woher}
                  onSave={(value) => handleFieldUpdate('woher', value)}
                  placeholder="z.B. aus der Küche, vom Strand"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Beschreibung</label>
            <EditableField
              value={localWord.description}
              onSave={(value) => handleFieldUpdate('description', value)}
              placeholder="Zusätzliche Beschreibung oder Erklärung..."
              multiline
              className="w-full"
            />
          </div>

          {/* Personal Notes */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Persönliche Notizen</label>
            <EditableField
              value={localWord.notes}
              onSave={(value) => handleFieldUpdate('notes', value)}
              placeholder="Ihre persönlichen Notizen zum Wort..."
              multiline
              className="w-full"
            />
          </div>

          {/* Notion-style Blocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-600">Notizen-Blöcke</label>
              <Button
                variant="outline"
                size="sm"
                onClick={addNotionBlock}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Block hinzufügen
              </Button>
            </div>
            
            <div className="space-y-2">
              {notionBlocks.map((block, index) => (
                <div key={index} className="flex items-start space-x-2 group">
                  <div className="flex-1">
                    <EditableField
                      value={block}
                      onSave={(value) => updateNotionBlock(index, value)}
                      placeholder="Notiz eingeben..."
                      className="w-full border border-gray-200 rounded"
                    />
                  </div>
                  {notionBlocks.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotionBlock(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
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