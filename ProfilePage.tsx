import { SchoolBackground } from '@/components/ui/school-background';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi, subjectApi, achievementApi } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trophy, Zap, Target, Calendar, Copy, Shield, Users } from 'lucide-react';
import type { Subject, Achievement, BoardType, LearningPace, LearningStyle } from '@/types';

// Generate unique student code
function generateStudentCode(username: string): string {
  const stored = localStorage.getItem('studentCode');
  if (stored) return stored;
  
  const hash = username.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const code = `STU-${Math.abs(hash).toString(36).toUpperCase().padStart(5, '0').slice(0, 5)}`;
  localStorage.setItem('studentCode', code);
  return code;
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentCode] = useState(() => generateStudentCode(String(profile?.username || 'student')));

  // Edit state
  const [classLevel, setClassLevel] = useState('');
  const [board, setBoard] = useState<BoardType | ''>('');
  const [examDate, setExamDate] = useState('');
  const [learningPace, setLearningPace] = useState<LearningPace>('normal');
  const [learningStyle, setLearningStyle] = useState<LearningStyle>('mixed');
  const [dailyStudyTime, setDailyStudyTime] = useState('120');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      subjectApi.getSubjects(user.id),
      achievementApi.getAchievements(user.id)
    ]).then(([subjectsData, achievementsData]) => {
      setSubjects(subjectsData);
      setAchievements(achievementsData);
    });
  }, [user]);

  useEffect(() => {
    if (profile) {
      setClassLevel(String(profile.class_level || ''));
      setBoard((profile.board as BoardType) || '');
      setExamDate(String(profile.exam_date || ''));
      setLearningPace(profile.learning_pace as LearningPace);
      setLearningStyle(profile.learning_style as LearningStyle);
      setDailyStudyTime(String(profile.daily_study_time || 120));
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await profileApi.updateProfile(user.id, {
        class_level: classLevel || null,
        board: (board as BoardType) || null,
        exam_date: examDate || null,
        learning_pace: learningPace,
        learning_style: learningStyle,
        daily_study_time: Number.parseInt(dailyStudyTime)
      });

      await refreshProfile();

      toast({
        title: 'Profile Updated! ✅',
        description: 'Your changes have been saved'
      });

    } catch (error) {
      console.error('Update profile error:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExam = () => {
    if (!profile?.exam_date) return null;
    const today = new Date();
    const examDate = new Date(String(profile.exam_date));
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExam = getDaysUntilExam();

  const copyStudentCode = () => {
    navigator.clipboard.writeText(studentCode);
    toast({
      title: 'Code Copied!',
      description: 'Share this code with your parents'
    });
  };

  // Save student code to profile for parent access
  useEffect(() => {
    if (profile?.username) {
      const profileData = {
        name: profile.username,
        studentCode: studentCode,
        classLevel: classLevel,
        board: board
      };
      localStorage.setItem('studentProfile', JSON.stringify(profileData));
    }
  }, [profile, studentCode, classLevel, board]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and learning preferences
        </p>
      </div>

      {/* Student Code Card - For Parents */}
      <Card className="premium-card bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-blue-500/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Parent Access Code</CardTitle>
                <CardDescription>
                  Share this code with your parents to let them track your progress
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 p-4 bg-background/50 rounded-lg border-2 border-dashed border-border">
              <p className="text-3xl font-bold font-mono text-center tracking-wider gradient-text">
                {studentCode}
              </p>
            </div>
            <Button onClick={copyStudentCode} size="lg" className="shrink-0">
              <Copy className="w-5 h-5 mr-2" />
              Copy Code
            </Button>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How it works:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Share this unique code with your parents</li>
                <li>They can enter it in the Parents Panel to view your progress</li>
                <li>Your parents can send you encouragement messages</li>
                <li>Only your parents with this code can access your data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{String(profile?.streak_count || 0)}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{String(profile?.level || 1)}</div>
            <p className="text-xs text-muted-foreground">current level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{String(profile?.total_points || 0)}</div>
            <p className="text-xs text-muted-foreground">total earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exam</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysUntilExam !== null ? daysUntilExam : '-'}</div>
            <p className="text-xs text-muted-foreground">days left</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your academic details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={String(profile?.username || '')}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class / Grade</Label>
              <Select value={classLevel} onValueChange={setClassLevel}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select your class" />
                </SelectTrigger>
                <SelectContent>
                  {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="board">Board</Label>
              <Select value={board} onValueChange={(v) => setBoard(v as BoardType)}>
                <SelectTrigger id="board">
                  <SelectValue placeholder="Select your board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBSE">CBSE</SelectItem>
                  <SelectItem value="ICSE">ICSE</SelectItem>
                  <SelectItem value="State">State Board</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-date">Exam Date</Label>
              <Input
                id="exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pace">Learning Pace</Label>
              <Select value={learningPace} onValueChange={(v) => setLearningPace(v as LearningPace)}>
                <SelectTrigger id="pace">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Learning Style</Label>
              <Select value={learningStyle} onValueChange={(v) => setLearningStyle(v as LearningStyle)}>
                <SelectTrigger id="style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">Visual</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="study-time">Daily Study Time (minutes)</Label>
              <Input
                id="study-time"
                type="number"
                min="30"
                max="480"
                step="30"
                value={dailyStudyTime}
                onChange={(e) => setDailyStudyTime(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>Your Subjects</CardTitle>
          <CardDescription>
            {subjects.length} subjects enrolled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Badge key={subject.id} variant={subject.is_weak ? 'destructive' : 'default'}>
                {subject.name}
                {subject.is_weak && ' (Weak)'}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            {achievements.length} badges earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keep learning to earn badges! 🏆
            </p>
          ) : (
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Trophy className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{achievement.badge_name}</p>
                    <p className="text-sm text-muted-foreground">{achievement.badge_description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Earned on {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
