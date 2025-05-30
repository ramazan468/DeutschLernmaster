import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Word, TestMode, TestType, TestSource } from "@shared/schema";

interface TestQuestion {
  id: number;
  question: string;
  correctAnswer: string;
  options?: string[];
  type: 'multiple' | 'fill';
}

interface TestSessionProps {
  mode: TestMode;
  questionCount: number;
  testType: TestType;
  source: TestSource;
  selectedCategory?: string;
  selectedFavoriteList?: string;
  onComplete: (score: number, totalQuestions: number) => void;
  onExit: () => void;
}

export default function TestSession({ mode, questionCount, testType, source, selectedCategory, selectedFavoriteList, onComplete, onExit }: TestSessionProps) {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);

  const { data: allWords = [] } = useQuery<Word[]>({
    queryKey: ['/api/words'],
  });

  const { data: favoriteWords = [] } = useQuery<Word[]>({
    queryKey: ['/api/favorites'],
    enabled: source === 'favorites' && selectedFavoriteList === 'all'
  });

  const { data: favoriteLists = [] } = useQuery({
    queryKey: ['/api/favorite-lists'],
    enabled: source === 'favorites' && selectedFavoriteList !== 'all'
  });

  // Get the filtered words based on source and selections
  const getFilteredWords = (): Word[] => {
    if (source === 'wordlist') {
      return allWords;
    } else if (source === 'category' && selectedCategory) {
      return allWords.filter(word => word.category === selectedCategory);
    } else if (source === 'favorites') {
      if (selectedFavoriteList === 'all') {
        return favoriteWords;
      } else if (selectedFavoriteList && favoriteLists.length > 0) {
        const selectedList = favoriteLists.find((list: any) => list.id.toString() === selectedFavoriteList);
        if (selectedList) {
          return allWords.filter(word => selectedList.wordIds.includes(word.id));
        }
      }
    }
    return [];
  };

  const filteredWords = getFilteredWords();

  useEffect(() => {
    if (filteredWords.length > 0 && questions.length === 0) {
      generateQuestions();
      setIsTestStarted(true);
    }
  }, [filteredWords]);

  const generateQuestions = () => {
    const sourceWords = filteredWords;
    if (sourceWords.length === 0) return;

    const shuffled = [...sourceWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(questionCount, sourceWords.length));
    
    const generatedQuestions: TestQuestion[] = selectedWords.map((word, index) => {
      const questionType = testType === 'mixed' ? (Math.random() > 0.5 ? 'multiple' : 'fill') : 
                          testType === 'multiple' ? 'multiple' : 'fill';

      return generateQuestionForWord(word, index, questionType, sourceWords);
    });

    setQuestions(generatedQuestions);
  };

  const generateQuestionForWord = (word: Word, index: number, type: 'multiple' | 'fill', allWords: Word[]): TestQuestion => {
    let question = "";
    let correctAnswer = "";
    let options: string[] = [];

    switch (mode) {
      case 'artikel':
        question = `"${word.german}" kelimesinin artikeli nedir?`;
        correctAnswer = word.article || "";
        if (type === 'multiple') {
          options = ['der', 'die', 'das'].filter(article => article !== correctAnswer);
          options.push(correctAnswer);
          options.sort(() => Math.random() - 0.5);
        }
        break;

      case 'plural':
        question = `"${word.article} ${word.german}" kelimesinin çoğulu nedir?`;
        correctAnswer = word.plural || "";
        if (type === 'multiple') {
          const otherPlurals = allWords
            .filter(w => w.id !== word.id && w.plural)
            .map(w => w.plural!)
            .slice(0, 3);
          options = [...otherPlurals, correctAnswer].sort(() => Math.random() - 0.5);
        }
        break;

      case 'tr-de':
        question = `"${word.turkish}" kelimesinin Almancası nedir?`;
        correctAnswer = `${word.article} ${word.german}`;
        if (type === 'multiple') {
          const otherGerman = allWords
            .filter(w => w.id !== word.id)
            .map(w => `${w.article} ${w.german}`)
            .slice(0, 3);
          options = [...otherGerman, correctAnswer].sort(() => Math.random() - 0.5);
        }
        break;

      case 'de-tr':
        question = `"${word.article} ${word.german}" kelimesinin Türkçesi nedir?`;
        correctAnswer = word.turkish;
        if (type === 'multiple') {
          const otherTurkish = allWords
            .filter(w => w.id !== word.id)
            .map(w => w.turkish)
            .slice(0, 3);
          options = [...otherTurkish, correctAnswer].sort(() => Math.random() - 0.5);
        }
        break;

      case 'wo':
        question = `"${word.article} ${word.german}" için WO? (Nerede?) cevabı nedir?`;
        correctAnswer = word.wo || "";
        if (type === 'multiple') {
          const otherWo = allWords
            .filter(w => w.id !== word.id && w.wo)
            .map(w => w.wo!)
            .slice(0, 3);
          options = [...otherWo, correctAnswer].sort(() => Math.random() - 0.5);
        }
        break;

      case 'wohin':
        question = `"${word.article} ${word.german}" için WOHIN? (Nereye?) cevabı nedir?`;
        correctAnswer = word.wohin || "";
        if (type === 'multiple') {
          const otherWohin = allWords
            .filter(w => w.id !== word.id && w.wohin)
            .map(w => w.wohin!)
            .slice(0, 3);
          options = [...otherWohin, correctAnswer].sort(() => Math.random() - 0.5);
        }
        break;

      case 'woher':
        question = `"${word.article} ${word.german}" için WOHER? (Nereden?) cevabı nedir?`;
        correctAnswer = word.woher || "";
        if (type === 'multiple') {
          const otherWoher = allWords
            .filter(w => w.id !== word.id && w.woher)
            .map(w => w.woher!)
            .slice(0, 3);
          options = [...otherWoher, correctAnswer].sort(() => Math.random() - 0.5);
        }
        break;

      default:
        question = `"${word.turkish}" kelimesinin Almancası nedir?`;
        correctAnswer = word.german;
    }

    return {
      id: index,
      question,
      correctAnswer,
      options: type === 'multiple' ? options : undefined,
      type
    };
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const finishTest = () => {
    let correctCount = 0;
    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index] || '';
      if (userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
        correctCount++;
      }
    });
    
    setShowResult(true);
  };

  const getCorrectCount = () => {
    return questions.filter((question, index) => {
      const userAnswer = userAnswers[index] || '';
      return userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    }).length;
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">Test hazırlanıyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }



  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Test - {mode.toUpperCase()}</CardTitle>
            <div className="flex gap-2">
              {showResult ? (
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold">
                    Skor: <span className="text-green-600">{getCorrectCount()}</span>/{questions.length} 
                    <span className="text-sm text-muted-foreground ml-2">
                      (%{Math.round((getCorrectCount() / questions.length) * 100)})
                    </span>
                  </div>
                  <Button onClick={() => {
                    setShowResult(false);
                    setUserAnswers({});
                    generateQuestions();
                  }} variant="outline">
                    <i className="fas fa-redo mr-2"></i>
                    Yeni Test
                  </Button>
                  <Button onClick={onExit} variant="default">
                    <i className="fas fa-home mr-2"></i>
                    Ana Sayfaya Dön
                  </Button>
                </div>
              ) : (
                <>
                  <Button onClick={finishTest} variant="default">
                    <i className="fas fa-check mr-2"></i>
                    Testi Bitir
                  </Button>
                  <Button variant="outline" onClick={onExit}>
                    <i className="fas fa-times mr-2"></i>
                    Çıkış
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {showResult ? 
              "Test tamamlandı - Cevaplarınız aşağıda işaretlenmiştir" : 
              `Toplam ${questions.length} soru - Tüm soruları yanıtlayın`
            }
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.map((question, index) => {
              const userAnswer = userAnswers[index] || '';
              const isCorrect = showResult && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
              const isAnswered = userAnswer.length > 0;
              
              return (
                <Card key={index} className={`p-4 ${showResult ? (isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : ''}`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Soru {index + 1}</span>
                      {showResult ? (
                        <div className={`px-2 py-1 rounded text-xs font-bold ${isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                          {isCorrect ? '✓' : '✗'}
                        </div>
                      ) : (
                        isAnswered && <i className="fas fa-check text-green-600 text-sm"></i>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-sm">{question.question}</h4>
                    
                    {showResult && (
                      <div className="text-xs space-y-1 p-2 bg-white/50 rounded border">
                        <p><span className="font-semibold">Sizin:</span> <span className={isCorrect ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>{userAnswer || 'Boş'}</span></p>
                        <p><span className="font-semibold">Doğru:</span> <span className="text-green-700 font-bold">{question.correctAnswer}</span></p>
                      </div>
                    )}
                    
                    {question.type === 'multiple' ? (
                      <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => {
                          const isSelected = userAnswer === option;
                          const isCorrectOption = option === question.correctAnswer;
                          const isWrongSelected = showResult && isSelected && !isCorrectOption;
                          
                          let buttonStyle = "w-full justify-start text-xs h-8 ";
                          if (showResult) {
                            if (isCorrectOption) {
                              buttonStyle += "bg-green-500 text-white border-green-600 hover:bg-green-600";
                            } else if (isWrongSelected) {
                              buttonStyle += "bg-red-500 text-white border-red-600 hover:bg-red-600";
                            } else {
                              buttonStyle += "bg-gray-100 text-gray-600";
                            }
                          } else {
                            if (isSelected) {
                              buttonStyle += "bg-blue-500 text-white border-blue-600 hover:bg-blue-600";
                            } else {
                              buttonStyle += "bg-white border-gray-200 hover:bg-gray-50";
                            }
                          }
                          
                          return (
                            <Button
                              key={optionIndex}
                              variant="outline"
                              className={buttonStyle}
                              onClick={() => !showResult && handleAnswerChange(index, option)}
                              disabled={showResult}
                            >
                              {option}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <Input
                        value={userAnswers[index] || ''}
                        onChange={(e) => !showResult && handleAnswerChange(index, e.target.value)}
                        placeholder="Cevabınızı yazın..."
                        className={`text-sm ${showResult ? (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                        disabled={showResult}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}