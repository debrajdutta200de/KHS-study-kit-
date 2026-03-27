import { SchoolBackground } from '@/components/ui/school-background';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { quizApi, subjectApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Trophy, Award } from 'lucide-react';
import type { Subject, Quiz, QuizQuestion } from '@/types';

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export default function QuizPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);

  // Quiz creation state
  const [topic, setTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [difficulty, setDifficulty] = useState('1');
  const [questionCount, setQuestionCount] = useState('5');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      subjectApi.getSubjects(user.id),
      quizApi.getQuizzes(user.id)
    ]).then(([subjectsData, quizzesData]) => {
      setSubjects(subjectsData);
      setQuizzes(quizzesData);
    });
  }, [user]);

  const handleCreateQuiz = async () => {
    if (!topic.trim() || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic: topic.trim(),
          difficulty: Number.parseInt(difficulty),
          questionCount: Number.parseInt(questionCount),
          questionTypes: ['mcq', 'short_answer'],
          classLevel: profile?.class_level
        }
      });

      if (error) throw error;

      // Create quiz
      const quiz = await quizApi.createQuiz(
        user.id,
        `${topic} Quiz`,
        selectedSubject || undefined
      );

      // Create questions
      const createdQuestions: QuizQuestion[] = [];
      for (const q of data.questions) {
        const question = await quizApi.createQuizQuestion({
          quiz_id: quiz.id,
          question_type: q.type,
          question_text: q.question,
          options: q.options || null,
          correct_answer: q.correctAnswer,
          user_answer: null,
          is_correct: null,
          explanation: q.explanation
        });
        createdQuestions.push(question);
      }

      await quizApi.updateQuiz(quiz.id, { total_questions: createdQuestions.length });

      setActiveQuiz(quiz);
      setQuestions(createdQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowResults(false);

      toast({
        title: 'Quiz Created! 🎯',
        description: `${createdQuestions.length} questions generated`
      });

    } catch (error) {
      console.error('Quiz creation error:', error);
      toast({
        title: 'Failed to Create Quiz',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !user) return;

    setLoading(true);
    try {
      let correctCount = 0;

      for (const question of questions) {
        const userAnswer = userAnswers[question.id] || '';
        const isCorrect = userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
        
        if (isCorrect) correctCount++;

        await quizApi.updateQuizQuestion(question.id, {
          user_answer: userAnswer,
          is_correct: isCorrect
        });
      }

      await quizApi.updateQuiz(activeQuiz.id, {
        score: correctCount,
        completed_at: new Date().toISOString()
      });

      // Generate certificate
      const now = new Date();
      const weekNumber = getWeekNumber(now);
      const subjectName = subjects.find(s => s.id === activeQuiz.subject_id)?.name || 'General';
      
      const certificate = {
        id: `cert-${Date.now()}`,
        studentName: profile?.username || 'Student',
        subject: subjectName,
        score: correctCount,
        totalQuestions: questions.length,
        date: now.toISOString(),
        weekNumber: weekNumber
      };

      // Save certificate to localStorage
      const savedCertificates = localStorage.getItem('quizCertificates');
      const certificates = savedCertificates ? JSON.parse(savedCertificates) : [];
      certificates.push(certificate);
      localStorage.setItem('quizCertificates', JSON.stringify(certificates));
      
      setCertificateGenerated(true);
      setShowResults(true);

      toast({
        title: 'Quiz Completed! 🎉',
        description: `You scored ${correctCount}/${questions.length}. Certificate generated!`
      });

    } catch (error) {
      console.error('Submit quiz error:', error);
      toast({
        title: 'Failed to Submit Quiz',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (activeQuiz && !showResults) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{activeQuiz.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <Badge>Difficulty: {activeQuiz.difficulty_level}</Badge>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        {currentQuestion && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{currentQuestion.question_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.question_type === 'mcq' && currentQuestion.options ? (
                <RadioGroup
                  value={userAnswers[currentQuestion.id] || ''}
                  onValueChange={(v) => handleAnswerSelect(currentQuestion.id, v)}
                >
                  {Object.entries(currentQuestion.options).map(([key, value]) => (
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                      <RadioGroupItem value={key} id={`option-${key}`} />
                      <Label htmlFor={`option-${key}`} className="flex-1 cursor-pointer">
                        <span className="font-medium">{key}.</span> <span>{String(value)}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  <Label>Your Answer</Label>
                  <Input
                    value={userAnswers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer..."
                  />
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button onClick={handleSubmitQuiz} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Quiz'
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>Next</Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (showResults) {
    const correctCount = questions.filter(q => {
      const userAnswer = userAnswers[q.id] || '';
      return userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
    }).length;
    const percentage = (correctCount / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="text-center">
          <CardHeader>
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
            <CardDescription>Here are your results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-5xl font-bold gradient-text">
              {correctCount}/{questions.length}
            </div>
            <Progress value={percentage} className="h-4" />
            <p className="text-lg text-muted-foreground">
              You scored {percentage.toFixed(0)}%
            </p>
            
            {certificateGenerated && (
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/50">
                <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-medium mb-2">🎉 Certificate Generated!</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Your weekly quiz certificate is ready to view
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/certificates')}
                  className="w-full"
                >
                  <Award className="w-4 h-4 mr-2" />
                  View Certificate
                </Button>
              </div>
            )}
            
            <Button onClick={() => {
              setActiveQuiz(null);
              setQuestions([]);
              setShowResults(false);
              setCertificateGenerated(false);
            }}>
              Take Another Quiz
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, index) => {
              const userAnswer = userAnswers[q.id] || '';
              const isCorrect = userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();

              return (
                <div key={q.id} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">Q{index + 1}. {q.question_text}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your answer: <span className={isCorrect ? 'text-secondary' : 'text-destructive'}>{userAnswer || 'Not answered'}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-muted-foreground">
                          Correct answer: <span className="text-secondary">{q.correct_answer}</span>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Quiz System</h1>
        <p className="text-muted-foreground">
          Test your knowledge with AI-generated quizzes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Quiz</CardTitle>
          <CardDescription>
            Generate a personalized quiz on any topic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              placeholder="e.g., Photosynthesis, Algebra, World War II..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Easy</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Number of Questions</Label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger id="count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="15">15 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreateQuiz}
            disabled={!topic.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              'Generate Quiz'
            )}
          </Button>
        </CardContent>
      </Card>

      {quizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Quizzes</CardTitle>
            <CardDescription>Your quiz history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quizzes.slice(0, 5).map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {quiz.score !== null && (
                    <Badge variant={quiz.score / quiz.total_questions >= 0.7 ? 'default' : 'secondary'}>
                      {quiz.score}/{quiz.total_questions}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
