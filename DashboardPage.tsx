import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi, subjectApi, quizApi, studyPlanApi, achievementApi } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ReviewsSection from '@/components/sections/ReviewsSection';
import { 
  BookOpen, Brain, Trophy, Target, Calendar, TrendingUp, 
  Upload, MessageSquare, Zap, Award, Users
} from 'lucide-react';
import type { Subject, Quiz, StudyPlan, Achievement } from '@/types';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        const [subjectsData, quizzesData, planData, achievementsData] = await Promise.all([
          subjectApi.getSubjects(user.id),
          quizApi.getQuizzes(user.id),
          studyPlanApi.getActivePlan(user.id),
          achievementApi.getAchievements(user.id)
        ]);

        setSubjects(subjectsData);
        setRecentQuizzes(quizzesData.slice(0, 3));
        setActivePlan(planData);
        setAchievements(achievementsData.slice(0, 3));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const getDaysUntilExam = () => {
    if (!profile?.exam_date) return null;
    const today = new Date();
    const examDate = new Date(String(profile.exam_date));
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExam = getDaysUntilExam();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 bg-muted" />
          <Skeleton className="h-40 bg-muted" />
          <Skeleton className="h-40 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-lg p-6 text-white shadow-card">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {String(profile?.username || 'Student')}! 👋
        </h1>
        <p className="text-white/90 mb-4">
          Ready to continue your learning journey? Let's make today count.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span className="font-semibold">{String(profile?.streak_count || 0)} Day Streak</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <span className="font-semibold">Level {String(profile?.level || 1)}</span>
          </div>
          {daysUntilExam !== null && (
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">{String(daysUntilExam)} days until exam</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/upload">
          <Card className="hover:shadow-hover transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upload Textbook</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Extract text and get AI explanations
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/quiz">
          <Card className="hover:shadow-hover transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Take Quiz</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Test your knowledge with AI quizzes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/doubts">
          <Card className="hover:shadow-hover transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ask Doubts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Get instant answers to your questions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/study-plan">
          <Card className="hover:shadow-hover transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Plan</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                AI-generated personalized schedule
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/daily-schedule">
          <Card className="hover:shadow-hover transition-shadow cursor-pointer border-green-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                AI-powered daily routine planner
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Premium Features */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/focus">
          <Card className="hover:shadow-hover transition-shadow cursor-pointer border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deep Focus Mode</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                System-level focus with distraction blocking
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/cinema">
          <Card className="hover:shadow-hover transition-shadow cursor-pointer border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concept Cinema</CardTitle>
              <Brain className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Cinematic story-based learning experience
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/parents">
          <Card className="hover:shadow-hover transition-shadow cursor-pointer border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parents Panel</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Track progress and send encouragement
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/certificates">
          <Card className="hover:shadow-hover transition-shadow cursor-pointer border-yellow-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Certificates</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View your quiz achievements
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Your Subjects
            </CardTitle>
            <CardDescription>
              {subjects.length} subjects enrolled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects added yet</p>
            ) : (
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="font-medium">{subject.name}</span>
                    {subject.is_weak && (
                      <Badge variant="outline" className="text-xs">Needs Focus</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Quizzes
            </CardTitle>
            <CardDescription>
              Your latest performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentQuizzes.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No quizzes taken yet</p>
                <Link to="/quiz">
                  <Button size="sm">Take Your First Quiz</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{quiz.title}</span>
                      {quiz.score !== null && (
                        <span className="text-sm font-semibold">
                          {quiz.score}/{quiz.total_questions}
                        </span>
                      )}
                    </div>
                    {quiz.score !== null && (
                      <Progress value={(quiz.score / quiz.total_questions) * 100} className="h-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Study Plan Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Study Plan
            </CardTitle>
            <CardDescription>
              Your personalized schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!activePlan ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No active study plan</p>
                <Link to="/study-plan">
                  <Button size="sm">Generate Study Plan</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{new Date(activePlan.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">End Date</span>
                  <span className="font-medium">{new Date(activePlan.end_date).toLocaleDateString()}</span>
                </div>
                <Link to="/study-plan">
                  <Button size="sm" variant="outline" className="w-full">View Full Plan</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
            <CardDescription>
              Your earned badges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keep learning to earn badges!</p>
            ) : (
              <div className="space-y-2">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <Trophy className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{achievement.badge_name}</p>
                      <p className="text-xs text-muted-foreground">{achievement.badge_description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      <ReviewsSection />
    </div>
  );
}
