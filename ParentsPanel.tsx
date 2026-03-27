import { SchoolBackground } from '@/components/ui/school-background';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Heart, 
  TrendingUp, 
  Clock, 
  Target,
  Calendar,
  MessageCircle,
  Shield,
  BarChart3,
  Flame,
  Send,
  LogOut
} from 'lucide-react';

interface FocusStats {
  duration: number;
  completedMinutes: number;
  distractionAttempts: number;
  breakAttempts: number;
  timestamp: number;
  completed: boolean;
}

interface ParentMessage {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export default function ParentsPanel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [focusStats, setFocusStats] = useState<FocusStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [parentMessages, setParentMessages] = useState<ParentMessage[]>([]);

  // Check authentication
  useEffect(() => {
    const session = localStorage.getItem('parentSession');
    if (!session) {
      navigate('/parent-login');
      return;
    }

    try {
      const sessionData = JSON.parse(session);
      setStudentName(sessionData.studentName);
      
      // Load messages
      const savedMessages = localStorage.getItem('parentMessages');
      if (savedMessages) {
        setParentMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Invalid session:', error);
      navigate('/parent-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('parentSession');
    toast({
      title: 'Logged Out',
      description: 'You have been logged out of the Parents Panel'
    });
    navigate('/parent-login');
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message to send',
        variant: 'destructive'
      });
      return;
    }

    const newMessage: ParentMessage = {
      id: Date.now().toString(),
      message: message.trim(),
      timestamp: Date.now(),
      read: false
    };

    const updatedMessages = [...parentMessages, newMessage];
    setParentMessages(updatedMessages);
    localStorage.setItem('parentMessages', JSON.stringify(updatedMessages));

    toast({
      title: '💌 Message Sent!',
      description: `Your encouragement has been sent to ${studentName}`
    });

    setMessage('');
  };

  // Load real focus stats from localStorage
  useEffect(() => {
    try {
      const stats = JSON.parse(localStorage.getItem('focusStats') || '[]');
      setFocusStats(stats);
    } catch (error) {
      console.error('Failed to load focus stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate metrics from real data
  const calculateMetrics = () => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    // Filter stats from last 7 days
    const weekStats = focusStats.filter(s => s.timestamp >= oneWeekAgo);
    
    // Total focus hours this week
    const focusHoursThisWeek = weekStats.reduce((sum, s) => sum + s.completedMinutes, 0) / 60;
    
    // Calculate study streak (consecutive days with at least one session)
    const studyDays = new Set(
      weekStats.map(s => new Date(s.timestamp).toDateString())
    );
    const studyStreak = studyDays.size;
    
    // Total distraction attempts
    const distractionAttempts = weekStats.reduce((sum, s) => sum + s.distractionAttempts, 0);
    
    // Consistency score (completed sessions / total sessions)
    const completedSessions = weekStats.filter(s => s.completed).length;
    const totalSessions = weekStats.length;
    const consistency = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    
    // Weekly report
    const focusSessions = weekStats.length;
    const completedTasks = completedSessions;
    
    return {
      focusHoursThisWeek: Math.round(focusHoursThisWeek * 10) / 10,
      focusHoursGoal: 20,
      studyStreak,
      distractionAttempts,
      consistency,
      weeklyReport: {
        totalStudyTime: Math.round(focusHoursThisWeek * 10) / 10,
        focusSessions,
        completedTasks
      }
    };
  };

  const metrics = calculateMetrics();

  // Generate recent activity from focus stats
  const getRecentActivity = () => {
    return focusStats
      .slice(-7)
      .reverse()
      .map(stat => ({
        date: new Date(stat.timestamp).toLocaleDateString(),
        activity: stat.completed 
          ? `Completed ${stat.duration}-minute focus session` 
          : `Focus session (${stat.completedMinutes} min)`,
        duration: `${stat.completedMinutes} min`,
        distractions: stat.distractionAttempts
      }));
  };

  const recentActivity = getRecentActivity();

  // Generate AI insights based on real data
  const generateAIInsights = () => {
    const { focusHoursThisWeek, studyStreak, consistency, distractionAttempts } = metrics;
    
    const insights: string[] = [];
    
    if (studyStreak >= 5) {
      insights.push(`Excellent consistency with a ${studyStreak}-day study streak!`);
    } else if (studyStreak >= 3) {
      insights.push(`Good progress with a ${studyStreak}-day study streak.`);
    } else {
      insights.push('Encourage more consistent daily study habits.');
    }
    
    if (consistency >= 80) {
      insights.push('High completion rate shows strong commitment.');
    } else if (consistency >= 60) {
      insights.push('Moderate completion rate - encourage finishing sessions.');
    } else {
      insights.push('Many incomplete sessions - may need shorter focus durations.');
    }
    
    if (distractionAttempts > 10) {
      insights.push('High distraction attempts detected - consider removing environmental distractions.');
    } else if (distractionAttempts > 5) {
      insights.push('Some distraction attempts - focus environment could be improved.');
    } else {
      insights.push('Excellent focus discipline with minimal distractions.');
    }
    
    if (focusHoursThisWeek < 5) {
      insights.push('Study time is below recommended levels - encourage more focus sessions.');
    }
    
    return insights.join(' ');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="glass-strong rounded-2xl p-6 border border-border/50">
          <p className="text-muted-foreground">Loading parent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-6 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-4xl font-bold gradient-text">Parents Panel</h1>
              <p className="text-muted-foreground text-lg">
                Monitoring {studentName}'s learning journey
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <Badge variant="outline" className="border-blue-500/50 text-blue-500">
                This Week
              </Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.focusHoursThisWeek}h</p>
            <p className="text-sm text-muted-foreground">Focus Hours</p>
            <Progress 
              value={(metrics.focusHoursThisWeek / metrics.focusHoursGoal) * 100} 
              className="mt-2 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Goal: {metrics.focusHoursGoal}h
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <Badge variant="outline" className="border-orange-500/50 text-orange-500">
                Streak
              </Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.studyStreak} days</p>
            <p className="text-sm text-muted-foreground">Study Consistency</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <Badge variant="outline" className="border-green-500/50 text-green-500">
                Performance
              </Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.consistency}%</p>
            <p className="text-sm text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <Badge variant="outline" className="border-purple-500/50 text-purple-500">
                Focus
              </Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.distractionAttempts}</p>
            <p className="text-sm text-muted-foreground">Distraction Attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Report */}
      <Card className="premium-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Weekly AI Report
              </CardTitle>
              <CardDescription>
                Real-time analysis of learning patterns
              </CardDescription>
            </div>
            <Badge variant="outline" className={
              metrics.consistency >= 80 ? "border-green-500/50 text-green-500" : 
              metrics.consistency >= 60 ? "border-yellow-500/50 text-yellow-500" :
              "border-red-500/50 text-red-500"
            }>
              <TrendingUp className="w-3 h-3 mr-1" />
              {metrics.consistency >= 80 ? 'Excellent' : metrics.consistency >= 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Study Time</p>
              <p className="text-2xl font-bold">{metrics.weeklyReport.totalStudyTime}h</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Focus Sessions</p>
              <p className="text-2xl font-bold">{metrics.weeklyReport.focusSessions}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold">{metrics.weeklyReport.completedTasks}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Distractions</p>
              <p className="text-2xl font-bold">{metrics.distractionAttempts}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Consistency</p>
              <p className="text-2xl font-bold">{metrics.consistency}%</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/50">
            <p className="text-sm font-medium text-blue-500 mb-2">AI Insights</p>
            <p className="text-sm text-muted-foreground">
              {generateAIInsights()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Recent Focus Sessions
          </CardTitle>
          <CardDescription>
            Last 7 focus sessions with real data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.distractions > 5 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="font-medium">{activity.activity}</p>
                      <p className="text-sm text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                  <div className="text-right flex gap-2">
                    <Badge variant="outline">{activity.duration}</Badge>
                    {activity.distractions > 0 && (
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                        {activity.distractions} distractions
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No focus sessions recorded yet</p>
              <p className="text-sm">Data will appear here once your child starts using Deep Focus Mode</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Encouragement */}
      <Card className="premium-card bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Send Encouragement
          </CardTitle>
          <CardDescription>
            Your words can make a big difference in your child's motivation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Write an encouraging message for your child..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none focus-ring"
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage("Great job on maintaining your study streak! Keep it up! 🌟")}
            >
              Quick: Great Job
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage("I'm proud of your dedication to learning. You're doing amazing! 💪")}
            >
              Quick: Proud of You
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage("Remember to take breaks and stay hydrated. You've got this! 💙")}
            >
              Quick: Take Care
            </Button>
          </div>
          
          {/* Previous messages */}
          {parentMessages.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">Recent Messages:</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {parentMessages.slice(-3).reverse().map((msg) => (
                  <div key={msg.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="w-full"
            size="lg"
          >
            <Send className="mr-2 h-4 w-4" />
            Send Message to {studentName}
          </Button>
        </CardContent>
      </Card>

      {/* Parent Controls Info */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle>Parent Controls & Privacy</CardTitle>
          <CardDescription>
            What you can and cannot do
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex-shrink-0">
                ✓
              </div>
              <div>
                <p className="font-medium">You Can:</p>
                <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                  <li>• View real-time focus mode usage and statistics</li>
                  <li>• See study consistency and completion rates</li>
                  <li>• Track distraction attempts and break patterns</li>
                  <li>• Send encouragement messages</li>
                  <li>• Receive AI-generated insights</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex-shrink-0">
                ✗
              </div>
              <div>
                <p className="font-medium">You Cannot:</p>
                <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                  <li>• Control what content your child studies</li>
                  <li>• Interrupt active focus mode sessions</li>
                  <li>• Access private notes or AI conversations</li>
                  <li>• Force study schedules or tasks</li>
                  <li>• End focus sessions remotely</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/50">
              <p className="text-sm text-blue-500">
                <strong>Privacy First:</strong> All data shown here is collected from Deep Focus Mode sessions only. 
                We respect your child's autonomy while providing you with the insights you need to support them effectively.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
