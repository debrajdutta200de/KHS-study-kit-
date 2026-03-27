import { SchoolBackground } from '@/components/ui/school-background';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsApi, quizApi, subjectApi } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import type { PerformanceAnalytics, Quiz, Subject } from '@/types';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<PerformanceAnalytics[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [analyticsData, quizzesData, subjectsData] = await Promise.all([
        analyticsApi.getAnalytics(user.id),
        quizApi.getQuizzes(user.id),
        subjectApi.getSubjects(user.id)
      ]);
      setAnalytics(analyticsData);
      setQuizzes(quizzesData.filter(q => q.completed_at));
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallAccuracy = () => {
    const completedQuizzes = quizzes.filter(q => q.score !== null);
    if (completedQuizzes.length === 0) return 0;
    const totalScore = completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
    const totalQuestions = completedQuizzes.reduce((sum, q) => sum + q.total_questions, 0);
    return totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
  };

  const getSubjectPerformance = () => {
    return subjects.map(subject => {
      const subjectQuizzes = quizzes.filter(q => q.subject_id === subject.id && q.score !== null);
      if (subjectQuizzes.length === 0) return { subject: subject.name, accuracy: 0 };
      const totalScore = subjectQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
      const totalQuestions = subjectQuizzes.reduce((sum, q) => sum + q.total_questions, 0);
      return {
        subject: subject.name,
        accuracy: totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0
      };
    });
  };

  const getWeakAreas = () => {
    const subjectPerf = getSubjectPerformance();
    return subjectPerf.filter(s => s.accuracy < 60 && s.accuracy > 0).sort((a, b) => a.accuracy - b.accuracy);
  };

  const getStrengths = () => {
    const subjectPerf = getSubjectPerformance();
    return subjectPerf.filter(s => s.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy);
  };

  const overallAccuracy = calculateOverallAccuracy();
  const subjectPerformance = getSubjectPerformance();
  const weakAreas = getWeakAreas();
  const strengths = getStrengths();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Performance Analytics</h1>
        <p className="text-muted-foreground">
          Track your progress and identify areas for improvement
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{overallAccuracy.toFixed(1)}%</div>
            <Progress value={overallAccuracy} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quizzes Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{quizzes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {quizzes.reduce((sum, q) => sum + q.total_questions, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {subjectPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Performance</CardTitle>
            <CardDescription>
              Your accuracy across different subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Weak Areas
            </CardTitle>
            <CardDescription>
              Subjects that need more focus
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weakAreas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No weak areas identified. Keep up the good work! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {weakAreas.map((area, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{area.subject}</span>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-semibold">{area.accuracy.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={area.accuracy} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-secondary" />
              Strengths
            </CardTitle>
            <CardDescription>
              Subjects you're excelling in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Keep practicing to build your strengths! 💪
              </p>
            ) : (
              <div className="space-y-3">
                {strengths.map((strength, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{strength.subject}</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-secondary" />
                        <span className="text-sm font-semibold">{strength.accuracy.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={strength.accuracy} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Honest Feedback</CardTitle>
          <CardDescription>
            Your AI mentor's assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overallAccuracy >= 80 && (
              <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <p className="text-sm">
                  <strong>Excellent work!</strong> You're consistently performing well. Keep challenging yourself with harder topics to maintain this momentum.
                </p>
              </div>
            )}
            {overallAccuracy >= 60 && overallAccuracy < 80 && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm">
                  <strong>Good progress!</strong> You're on the right track. Focus more on your weak subjects and practice regularly to improve further.
                </p>
              </div>
            )}
            {overallAccuracy < 60 && overallAccuracy > 0 && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm">
                  <strong>Needs improvement.</strong> Don't be discouraged! Identify your weak areas, break down complex topics, and practice consistently. Consider reviewing fundamentals.
                </p>
              </div>
            )}
            {weakAreas.length > 0 && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm">
                  <strong>Recommendation:</strong> Allocate more study time to {weakAreas[0].subject}. Use the explanation engine in beginner mode to build strong foundations.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
