import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { quizApi } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Brain, CheckCircle2, XCircle, AlertCircle, Sparkles, RotateCw } from 'lucide-react';
import { generateQuiz, analyzeQuizMistakes } from '@/services/aiEngine';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizResult {
  questionIndex: number;
  userAnswer: number;
  correct: boolean;
  analysis?: string;
}

export default function QuizPageNew() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Quiz Setup State
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState(2);
  const [questionCount, setQuestionCount] = useState(5);
  
  // Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Loading States
  const [generating, setGenerating] = useState(false);
  const [analyzingMistake, setAnalyzingMistake] = useState(false);

  // Generate Quiz
  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a topic for the quiz',
        variant: 'destructive'
      });
      return;
    }

    if (difficulty < 1 || difficulty > 3) {
      toast({
        title: 'Invalid Difficulty',
        description: 'Difficulty must be between 1 and 3',
        variant: 'destructive'
      });
      return;
    }

    if (questionCount < 1 || questionCount > 20) {
      toast({
        title: 'Invalid Question Count',
        description: 'Question count must be between 1 and 20',
        variant: 'destructive'
      });
      return;
    }

    setGenerating(true);
    setQuestions([]);
    setResults([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizCompleted(false);

    try {
      const generatedQuestions = await generateQuiz({
        topic: topic.trim(),
        difficulty,
        questionCount,
        classLevel: profile?.class_level?.toString()
      });

      setQuestions(generatedQuestions);

      toast({
        title: 'Quiz Generated! 🎯',
        description: `${generatedQuestions.length} questions ready`
      });

    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz';
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      toast({
        title: 'Select an Answer',
        description: 'Please select an option before submitting',
        variant: 'destructive'
      });
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correctAnswer;

    const result: QuizResult = {
      questionIndex: currentQuestionIndex,
      userAnswer: selectedAnswer,
      correct
    };

    setResults([...results, result]);

    // Move to next question or complete quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      setQuizCompleted(true);
      saveQuizResults([...results, result]);
    }
  };

  // Analyze Mistake
  const handleAnalyzeMistake = async (resultIndex: number) => {
    const result = results[resultIndex];
    const question = questions[result.questionIndex];

    if (result.correct) return;

    setAnalyzingMistake(true);

    try {
      const analysis = await analyzeQuizMistakes({
        question: question.question,
        userAnswer: question.options[result.userAnswer],
        correctAnswer: question.options[question.correctAnswer],
        explanation: question.explanation
      });

      // Update result with analysis
      const updatedResults = [...results];
      updatedResults[resultIndex] = { ...result, analysis };
      setResults(updatedResults);

      toast({
        title: 'Analysis Complete! 🔍',
        description: 'Check why you got this wrong'
      });

    } catch (error) {
      console.error('Error analyzing mistake:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze this mistake',
        variant: 'destructive'
      });
    } finally {
      setAnalyzingMistake(false);
    }
  };

  // Save Results to Database
  const saveQuizResults = async (finalResults: QuizResult[]) => {
    if (!user) return;

    try {
      const score = finalResults.filter(r => r.correct).length;
      const totalQuestions = questions.length;

      const quiz = await quizApi.createQuiz(
        user.id,
        `${topic.trim()} - ${difficulty === 1 ? 'Easy' : difficulty === 2 ? 'Medium' : 'Hard'}`
      );

      // Save questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const result = finalResults[i];
        await quizApi.createQuizQuestion({
          quiz_id: quiz.id,
          question_text: q.question,
          question_type: 'mcq',
          options: q.options.reduce((acc, opt, idx) => ({ ...acc, [idx]: opt }), {}),
          correct_answer: q.correctAnswer.toString(),
          user_answer: result?.userAnswer?.toString() ?? null,
          is_correct: result?.correct ?? false,
          explanation: q.explanation
        });
      }

    } catch (error) {
      console.error('Error saving quiz results:', error);
    }
  };

  // Reset Quiz
  const handleResetQuiz = () => {
    setQuestions([]);
    setResults([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizCompleted(false);
  };

  // Calculate Score
  const score = results.filter(r => r.correct).length;
  const totalQuestions = questions.length;
  const scorePercentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-6 border border-border/50">
        <h1 className="text-4xl font-bold mb-2 gradient-text">AI Quiz Generator</h1>
        <p className="text-muted-foreground">
          Test your knowledge with adaptive AI-generated questions
        </p>
      </div>

      {/* Quiz Setup */}
      {questions.length === 0 && (
        <Card className="premium-card animate-slide-up">
          <CardHeader>
            <CardTitle>Create Your Quiz</CardTitle>
            <CardDescription>
              Customize your quiz based on topic and difficulty
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Algebra, Photosynthesis, World War II..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="focus-ring"
              />
            </div>

            <div className="space-y-2">
              <Label>Difficulty Level: {difficulty}</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map((level) => (
                  <Button
                    key={level}
                    variant={difficulty === level ? 'default' : 'outline'}
                    onClick={() => setDifficulty(level)}
                    className="flex-1"
                  >
                    {level === 1 ? '😊 Easy' : level === 2 ? '🤔 Medium' : '🔥 Hard'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionCount">Number of Questions: {questionCount}</Label>
              <Input
                id="questionCount"
                type="number"
                min={1}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                className="focus-ring"
              />
            </div>

            <Button 
              onClick={handleGenerateQuiz} 
              disabled={generating || !topic.trim()}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quiz In Progress */}
      {questions.length > 0 && !quizCompleted && (
        <>
          {/* Progress */}
          <Card className="premium-card">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {currentQuestionIndex + 1} / {totalQuestions}
                  </span>
                </div>
                <Progress 
                  value={((currentQuestionIndex + 1) / totalQuestions) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Current Question */}
          <Card className="premium-card animate-scale-in">
            <CardHeader>
              <CardTitle className="text-xl">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              <CardDescription className="text-base leading-relaxed pt-2">
                {currentQuestion.question}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={selectedAnswer?.toString()} 
                onValueChange={(v) => setSelectedAnswer(parseInt(v))}
              >
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button 
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="w-full"
                size="lg"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quiz Results */}
      {quizCompleted && (
        <>
          {/* Score Card */}
          <Card className="premium-card animate-scale-in">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {scorePercentage >= 80 ? (
                  <CheckCircle2 className="h-16 w-16 text-success" />
                ) : scorePercentage >= 50 ? (
                  <AlertCircle className="h-16 w-16 text-warning" />
                ) : (
                  <XCircle className="h-16 w-16 text-destructive" />
                )}
              </div>
              <CardTitle className="text-3xl">
                {scorePercentage >= 80 ? 'Excellent!' : scorePercentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
              </CardTitle>
              <CardDescription className="text-lg pt-2">
                You scored {score} out of {totalQuestions} ({scorePercentage.toFixed(0)}%)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 justify-center">
              <Button onClick={handleResetQuiz} variant="outline">
                <RotateCw className="mr-2 h-4 w-4" />
                New Quiz
              </Button>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>Review your answers and learn from mistakes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, index) => {
                const question = questions[result.questionIndex];
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.correct 
                        ? 'border-success/50 bg-success/5' 
                        : 'border-destructive/50 bg-destructive/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.correct ? (
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-2">
                        <p className="font-medium">{question.question}</p>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">Your answer:</span>{' '}
                            <span className={result.correct ? 'text-success' : 'text-destructive'}>
                              {question.options[result.userAnswer]}
                            </span>
                          </p>
                          {!result.correct && (
                            <p>
                              <span className="text-muted-foreground">Correct answer:</span>{' '}
                              <span className="text-success">
                                {question.options[question.correctAnswer]}
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="pt-2 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">Explanation:</p>
                          <p>{question.explanation}</p>
                        </div>
                        
                        {/* Mistake Analysis */}
                        {!result.correct && (
                          <div className="pt-2">
                            {result.analysis ? (
                              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                <p className="font-medium mb-1 flex items-center gap-2">
                                  <Brain className="h-4 w-4" />
                                  Why You Got This Wrong:
                                </p>
                                <p className="text-muted-foreground">{result.analysis}</p>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAnalyzeMistake(index)}
                                disabled={analyzingMistake}
                              >
                                {analyzingMistake ? (
                                  <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <Brain className="mr-2 h-3 w-3" />
                                    Why Am I Wrong?
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {questions.length === 0 && !generating && (
        <Card className="premium-card">
          <CardContent className="empty-state py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Test Your Knowledge?</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Enter a topic above and customize your quiz settings to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
