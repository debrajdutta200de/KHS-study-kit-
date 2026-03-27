import { SchoolBackground } from '@/components/ui/school-background';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subjectApi } from '@/db/api';
import { generateDailySchedule } from '@/services/aiEngine';
import VideoBackground from '@/components/ui/VideoBackground';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Clock, Calendar, Sparkles, Brain, Coffee, 
  BookOpen, Utensils, Dumbbell, RefreshCw, CheckCircle2,
  Lightbulb, TrendingUp
} from 'lucide-react';
import type { Subject } from '@/types';

interface ScheduleItem {
  time: string;
  duration: number;
  activity: string;
  subject?: string;
  type: 'study' | 'break' | 'meal' | 'exercise' | 'revision';
  tips?: string;
}

interface DailySchedule {
  schedule: ScheduleItem[];
  summary: {
    totalStudyTime: number;
    totalBreakTime: number;
    subjectsScheduled: number;
  };
  recommendations: string[];
}

export default function DailySchedulePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableHours, setAvailableHours] = useState(6);
  const [learningPace, setLearningPace] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<DailySchedule | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadSubjects();
  }, [user]);

  const loadSubjects = async () => {
    if (!user) return;
    try {
      const data = await subjectApi.getSubjects(user.id);
      setSubjects(data);
      setSelectedSubjects(data.map(s => s.name));
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const handleGenerateSchedule = async () => {
    if (selectedSubjects.length === 0) {
      toast({
        title: 'No Subjects Selected',
        description: 'Please select at least one subject',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const priorities = subjects
        .filter(s => s.is_weak && selectedSubjects.includes(s.name))
        .map(s => s.name);

      const scheduleData = await generateDailySchedule({
        availableHours,
        subjects: selectedSubjects,
        priorities,
        learningPace,
        includeBreaks: true
      });

      setSchedule(scheduleData);

      toast({
        title: 'Schedule Generated! 🎉',
        description: 'Your personalized daily schedule is ready'
      });

    } catch (error) {
      console.error('Failed to generate schedule:', error);
      toast({
        title: 'Generation Failed',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'study': return <BookOpen className="w-5 h-5" />;
      case 'break': return <Coffee className="w-5 h-5" />;
      case 'meal': return <Utensils className="w-5 h-5" />;
      case 'exercise': return <Dumbbell className="w-5 h-5" />;
      case 'revision': return <RefreshCw className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
      case 'break': return 'bg-green-500/20 border-green-500/50 text-green-300';
      case 'meal': return 'bg-orange-500/20 border-orange-500/50 text-orange-300';
      case 'exercise': return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
      case 'revision': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      default: return 'bg-muted';
    }
  };

  const toggleSubject = (subjectName: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectName)
        ? prev.filter(s => s !== subjectName)
        : [...prev, subjectName]
    );
  };

  return (
    <VideoBackground fallbackGradient="from-indigo-950 via-purple-950 to-pink-950">
      <div className="min-h-screen p-4 xl:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-2xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold gradient-text flex items-center gap-2">
                AI Daily Schedule Generator
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Let AI create your perfect study schedule
            </p>
          </div>

          {/* Configuration Card */}
          <Card className="glass-strong border-border/50 shadow-2xl animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Schedule Configuration
              </CardTitle>
              <CardDescription>
                Customize your daily schedule preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Available Hours */}
              <div className="space-y-2">
                <Label htmlFor="hours" className="text-base">
                  Available Study Hours: {availableHours} hours
                </Label>
                <Input
                  id="hours"
                  type="range"
                  min="2"
                  max="12"
                  step="1"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2 hours</span>
                  <span>12 hours</span>
                </div>
              </div>

              {/* Learning Pace */}
              <div className="space-y-2">
                <Label htmlFor="pace" className="text-base">Learning Pace</Label>
                <Select value={learningPace} onValueChange={(v: any) => setLearningPace(v)}>
                  <SelectTrigger id="pace">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow & Steady</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Fast & Intensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Selection */}
              <div className="space-y-3">
                <Label className="text-base">Select Subjects</Label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <Badge
                      key={subject.id}
                      variant={selectedSubjects.includes(subject.name) ? 'default' : 'outline'}
                      className="cursor-pointer px-4 py-2 text-sm hover:scale-105 transition-transform"
                      onClick={() => toggleSubject(subject.name)}
                    >
                      {subject.name}
                      {subject.is_weak && ' ⚡'}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚡ = Priority subjects (will get more time)
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateSchedule}
                disabled={loading || selectedSubjects.length === 0}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Your Schedule...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate AI Schedule
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Schedule Display */}
          {schedule && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass border-blue-500/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Study Time</p>
                        <p className="text-3xl font-bold text-blue-400">
                          {Math.floor(schedule.summary.totalStudyTime / 60)}h {schedule.summary.totalStudyTime % 60}m
                        </p>
                      </div>
                      <BookOpen className="w-12 h-12 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-green-500/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Break Time</p>
                        <p className="text-3xl font-bold text-green-400">
                          {Math.floor(schedule.summary.totalBreakTime / 60)}h {schedule.summary.totalBreakTime % 60}m
                        </p>
                      </div>
                      <Coffee className="w-12 h-12 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-purple-500/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Subjects</p>
                        <p className="text-3xl font-bold text-purple-400">
                          {schedule.summary.subjectsScheduled}
                        </p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card className="glass-strong border-border/50 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Your Daily Timeline
                  </CardTitle>
                  <CardDescription>
                    Follow this schedule for optimal learning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {schedule.schedule.map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getActivityColor(item.type)} hover:scale-[1.02] transition-transform`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {getActivityIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-lg">{item.activity}</p>
                              <Badge variant="outline" className="ml-2">
                                {item.duration} min
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.time}
                            </p>
                            {item.tips && (
                              <div className="flex items-start gap-2 mt-2 p-2 bg-background/50 rounded">
                                <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">{item.tips}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="glass border-yellow-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {schedule.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">✓</span>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </VideoBackground>
  );
}
