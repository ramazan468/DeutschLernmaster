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
  onComplete: (score: number, totalQuestions: number) => void;
  onExit: () => void;
}

export default function TestSession({ mode, questionCount, testType, source, onComplete, onExit }: TestSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [fillAnswer, setFillAnswer] = useState("");
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const { data: words = [] } = useQuery<Word[]>({
    queryKey: ['/api/words'],
  });

  const { data: favoriteWords = [] } = useQuery<Word[]>({
    queryKey: ['/api/favorites'],
    enabled: source === 'favorites'
  });

  useEffect(() => {
    if ((words.length > 0 || favoriteWords.length > 0) && questions.length === 0) {
      generateQuestions();
    }
  }, [words, favoriteWords]);

  const getSourceWords = () => {
    switch (source) {
      case 'favorites':
        return favoriteWords;
      case 'wordlist':
      default:
        return words;
    }
  };

  const generateQuestions = () => {
    const sourceWords = getSourceWords();
    if (sourceWords.length === 0) return;

    const shuffled = [...sourceWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(questionCount, sourceWords.length));
    
    const generatedQuestions: TestQuestion[] = selectedWords.map((word, index) => {
      const questionType = testType === 'mixed' ? (Math.random() > 0.5 ? 'multiple' : 'fill') : 
                          testType === 'multiple' ? 'multiple' : 'fill';

      return generateQuestionForWord(word, index, questionType, sourceWords);
    });

    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setFillAnswer("");
    setUserAnswers([]);
    setIsAnswered(false);
    setShowResult(false);
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

  const handleAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const answer = currentQuestion.type === 'multiple' ? selectedAnswer : fillAnswer;
    
    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);
    setIsAnswered(true);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer("");
        setFillAnswer("");
        setIsAnswered(false);
      } else {
        finishTest(newAnswers);
      }
    }, 1500);
  };

  const finishTest = (answers: string[]) => {
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (answer.toLowerCase().trim() === questions[index].correctAnswer.toLowerCase().trim()) {
        correctCount++;
      }
    });
    
    setShowResult(true);
    setTimeout(() => {
      onComplete(correctCount, questions.length);
    }, 3000);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isCorrect = isAnswered && 
    (currentQuestion?.type === 'multiple' ? selectedAnswer : fillAnswer).toLowerCase().trim() === 
    currentQuestion?.correctAnswer.toLowerCase().trim();

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

  if (showResult) {
    const correctCount = userAnswers.filter((answer, index) => 
      answer.toLowerCase().trim() === questions[index].correctAnswer.toLowerCase().trim()
    ).length;
    
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <i className="fas fa-trophy text-4xl text-yellow-500 mb-4"></i>
            <h2 className="text-2xl font-bold mb-4">Test Tamamlandı!</h2>
            <p className="text-lg mb-2">
              Skorunuz: {correctCount}/{questions.length} ({Math.round((correctCount/questions.length)*100)}%)
            </p>
            <p className="text-muted-foreground">Ana sayfaya yönlendiriliyorsunuz...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Test - {mode.toUpperCase()}</CardTitle>
            <Button variant="outline" onClick={onExit}>
              <i className="fas fa-times mr-2"></i>
              Çıkış
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Soru {currentQuestionIndex + 1} / {questions.length}</span>
              <span>%{Math.round(progress)}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <h3 className="text-xl font-medium mb-4">{currentQuestion?.question}</h3>
            
            {currentQuestion?.type === 'multiple' ? (
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="text-left max-w-md mx-auto">
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option} 
                      id={`option-${index}`}
                      disabled={isAnswered}
                    />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className={`${isAnswered ? 
                        option === currentQuestion.correctAnswer ? 'text-green-600 font-semibold' : 
                        option === selectedAnswer && option !== currentQuestion.correctAnswer ? 'text-red-600' : ''
                        : ''}`}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="max-w-md mx-auto">
                <Input
                  value={fillAnswer}
                  onChange={(e) => setFillAnswer(e.target.value)}
                  placeholder="Cevabınızı yazın..."
                  disabled={isAnswered}
                  className={`text-center ${isAnswered ? 
                    isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                    : ''}`}
                />
                {isAnswered && !isCorrect && (
                  <p className="text-sm text-green-600 mt-2">
                    Doğru cevap: {currentQuestion.correctAnswer}
                  </p>
                )}
              </div>
            )}
          </div>

          {isAnswered ? (
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-lg ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <i className={`fas ${isCorrect ? 'fa-check' : 'fa-times'} mr-2`}></i>
                {isCorrect ? 'Doğru!' : 'Yanlış!'}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Button 
                onClick={handleAnswer}
                disabled={currentQuestion?.type === 'multiple' ? !selectedAnswer : !fillAnswer.trim()}
                size="lg"
              >
                Cevapla
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}