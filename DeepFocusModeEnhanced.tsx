import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFocus } from '@/contexts/FocusContext';
import { 
  Lock, Unlock, Play, Pause, X, Volume2, VolumeX, Shield, 
  Target, Clock, Zap, Bell, BellOff, MessageSquare, MessageSquareOff,
  Coffee, Brain, BookOpen, GraduationCap, Trophy, Flame, ArrowLeft
} from 'lucide-react';

const motivationalQuotes = [
  "Focus is the gateway to thinking clearly.",
  "Concentration is the secret of strength.",
  "The successful warrior is the average man, with laser-like focus.",
  "Where focus goes, energy flows.",
  "Focus on being productive instead of busy."
];

const ambientSounds = [
  { id: 'rain', name: 'Rain', emoji: '🌧️' },
  { id: 'ocean', name: 'Ocean Waves', emoji: '🌊' },
  { id: 'forest', name: 'Forest', emoji: '🌲' },
  { id: 'cafe', name: 'Café', emoji: '☕' },
  { id: 'white-noise', name: 'White Noise', emoji: '📻' }
];

export default function DeepFocusModeEnhanced() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session, startFocus, pauseFocus, resumeFocus, endFocus, recordBlockedMessage, recordBlockedNotification } = useFocus();
  
  // Local state
  const [duration, setDuration] = useState(25); // minutes
  const [focusMode, setFocusMode] = useState<'deep' | 'pomodoro' | 'exam' | 'revision'>('deep');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [ambientSound, setAmbientSound] = useState<string | null>(null);
  const [soundVolume, setSoundVolume] = useState(50);
  const [blockMessages, setBlockMessages] = useState(true);
  const [blockNotifications, setBlockNotifications] = useState(true);
  const [breakReminders, setBreakReminders] = useState(true);
  const [currentQuote, setCurrentQuote] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preset durations based on mode
  const getPresets = () => {
    switch (focusMode) {
      case 'pomodoro':
        return [
          { label: '25 min', value: 25 },
          { label: '50 min', value: 50 }
        ];
      case 'exam':
        return [
          { label: '45 min', value: 45 },
          { label: '90 min', value: 90 },
          { label: '120 min', value: 120 }
        ];
      case 'revision':
        return [
          { label: '15 min', value: 15 },
          { label: '30 min', value: 30 },
          { label: '45 min', value: 45 }
        ];
      default:
        return [
          { label: '15 min', value: 15 },
          { label: '25 min', value: 25 },
          { label: '45 min', value: 45 },
          { label: '60 min', value: 60 },
          { label: '90 min', value: 90 }
        ];
    }
  };

  // Random motivational quote
  useEffect(() => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  // Simulate message blocking
  useEffect(() => {
    if (!session.isActive || !blockMessages) return;

    const messageInterval = setInterval(() => {
      // Simulate incoming message (in production, this would be real message interception)
      if (Math.random() > 0.7) {
        recordBlockedMessage();
        toast({
          title: '📵 Message Blocked',
          description: 'Incoming message blocked during focus session',
          duration: 2000
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(messageInterval);
  }, [session.isActive, blockMessages, recordBlockedMessage, toast]);

  // Simulate notification blocking
  useEffect(() => {
    if (!session.isActive || !blockNotifications) return;

    const notificationInterval = setInterval(() => {
      // Simulate incoming notification
      if (Math.random() > 0.8) {
        recordBlockedNotification();
        toast({
          title: '🔕 Notification Blocked',
          description: 'System notification blocked during focus',
          duration: 2000
        });
      }
    }, 45000); // Check every 45 seconds

    return () => clearInterval(notificationInterval);
  }, [session.isActive, blockNotifications, recordBlockedNotification, toast]);

  // Break reminders for long sessions
  useEffect(() => {
    if (!session.isActive || !breakReminders || session.duration < 45) return;

    const halfwayPoint = (session.duration * 60) / 2;
    const timeElapsed = session.duration * 60 - session.timeRemaining;

    if (Math.abs(timeElapsed - halfwayPoint) < 2) {
      toast({
        title: '💧 Hydration Reminder',
        description: 'Take a sip of water and stretch for 30 seconds',
        duration: 5000
      });
    }
  }, [session.timeRemaining, session.duration, session.isActive, breakReminders, toast]);

  // Handle emergency exit
  const handleEmergencyExit = () => {
    if (!showExitConfirm) {
      setShowExitConfirm(true);
      setTimeout(() => setShowExitConfirm(false), 3000);
      return;
    }
    
    endFocus(true);
    setShowExitConfirm(false);
    
    toast({
      title: 'Focus Session Ended',
      description: 'You can restart anytime',
      variant: 'destructive'
    });
  };

  // Start focus with selected mode
  const handleStartFocus = () => {
    startFocus(duration, focusMode);
    
    toast({
      title: `${focusMode.charAt(0).toUpperCase() + focusMode.slice(1)} Mode Activated`,
      description: `${duration} minutes of deep focus. Stay strong! 💪`
    });
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const progress = session.duration > 0 
    ? ((session.duration * 60 - session.timeRemaining) / (session.duration * 60)) * 100 
    : 0;

  // Show completion notification
  useEffect(() => {
    if (session.timeRemaining === 0 && session.duration > 0) {
      toast({
        title: '🎉 Focus Complete!',
        description: `You stayed focused for ${session.duration} minutes. Excellent work!`,
        duration: 5000
      });
    }
  }, [session.timeRemaining, session.duration, toast]);

  // Ambient sound control
  const toggleAmbientSound = (soundId: string) => {
    if (ambientSound === soundId) {
      setAmbientSound(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setAmbientSound(soundId);
      // In production, load and play actual audio file
      toast({
        title: '🎵 Ambient Sound',
        description: `Playing ${ambientSounds.find(s => s.id === soundId)?.name}`,
        duration: 2000
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back Button - Fixed Position */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="gap-2 glass hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Ambient animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl">
        {!session.isActive ? (
          // Setup screen
          <Card className="glass-strong border-border/50 animate-scale-in">
            <CardContent className="p-8 space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold gradient-text">Deep Focus Mode</h1>
                <p className="text-muted-foreground text-lg">
                  System-level lockdown. Zero distractions. Pure focus.
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "{currentQuote}"
                </p>
              </div>

              <Tabs value={focusMode} onValueChange={(v) => setFocusMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="deep" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Deep
                  </TabsTrigger>
                  <TabsTrigger value="pomodoro" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pomodoro
                  </TabsTrigger>
                  <TabsTrigger value="exam" className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Exam
                  </TabsTrigger>
                  <TabsTrigger value="revision" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Revision
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={focusMode} className="space-y-6 mt-6">
                  {/* Duration selection */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Select Duration</label>
                    <div className="grid grid-cols-3 gap-3">
                      {getPresets().map((preset) => (
                        <Button
                          key={preset.value}
                          variant={duration === preset.value ? 'default' : 'outline'}
                          onClick={() => setDuration(preset.value)}
                          className="h-16 text-lg"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Focus settings */}
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Protection Settings
                      </CardTitle>
                      <CardDescription>
                        Configure what gets blocked during your focus session
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquareOff className="w-4 h-4 text-muted-foreground" />
                          <Label htmlFor="block-messages">Block Messages</Label>
                        </div>
                        <Switch
                          id="block-messages"
                          checked={blockMessages}
                          onCheckedChange={setBlockMessages}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BellOff className="w-4 h-4 text-muted-foreground" />
                          <Label htmlFor="block-notifications">Block Notifications</Label>
                        </div>
                        <Switch
                          id="block-notifications"
                          checked={blockNotifications}
                          onCheckedChange={setBlockNotifications}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coffee className="w-4 h-4 text-muted-foreground" />
                          <Label htmlFor="break-reminders">Break Reminders</Label>
                        </div>
                        <Switch
                          id="break-reminders"
                          checked={breakReminders}
                          onCheckedChange={setBreakReminders}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ambient sounds */}
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Volume2 className="w-5 h-5" />
                        Ambient Sounds
                      </CardTitle>
                      <CardDescription>
                        Optional background sounds to enhance focus
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-5 gap-2">
                        {ambientSounds.map((sound) => (
                          <Button
                            key={sound.id}
                            variant={ambientSound === sound.id ? 'default' : 'outline'}
                            onClick={() => toggleAmbientSound(sound.id)}
                            className="h-16 flex flex-col items-center justify-center gap-1"
                          >
                            <span className="text-2xl">{sound.emoji}</span>
                            <span className="text-xs">{sound.name}</span>
                          </Button>
                        ))}
                      </div>

                      {ambientSound && (
                        <div className="space-y-2">
                          <Label>Volume: {soundVolume}%</Label>
                          <Slider
                            value={[soundVolume]}
                            onValueChange={(v) => setSoundVolume(v[0])}
                            max={100}
                            step={10}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Start button */}
                  <Button
                    size="lg"
                    className="w-full h-16 text-xl"
                    onClick={handleStartFocus}
                  >
                    <Play className="w-6 h-6 mr-2" />
                    Start {focusMode.charAt(0).toUpperCase() + focusMode.slice(1)} Focus
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          // Active focus screen
          <div className="space-y-6">
            {/* Main timer card */}
            <Card className="glass-strong border-border/50">
              <CardContent className="p-12 text-center space-y-8">
                {/* Mode badge */}
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {focusMode === 'deep' && <Brain className="w-4 h-4 mr-2" />}
                  {focusMode === 'pomodoro' && <Clock className="w-4 h-4 mr-2" />}
                  {focusMode === 'exam' && <GraduationCap className="w-4 h-4 mr-2" />}
                  {focusMode === 'revision' && <BookOpen className="w-4 h-4 mr-2" />}
                  {focusMode.charAt(0).toUpperCase() + focusMode.slice(1)} Mode
                </Badge>

                {/* Timer */}
                <div className="space-y-4">
                  <div className="text-8xl font-bold gradient-text tabular-nums">
                    {formatTime(session.timeRemaining)}
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-muted-foreground">
                    {Math.floor(progress)}% Complete
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  {session.isPaused ? (
                    <Button size="lg" onClick={resumeFocus}>
                      <Play className="w-5 h-5 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button size="lg" variant="outline" onClick={pauseFocus}>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                  )}

                  <Button
                    size="lg"
                    variant={showExitConfirm ? 'destructive' : 'outline'}
                    onClick={handleEmergencyExit}
                  >
                    <X className="w-5 h-5 mr-2" />
                    {showExitConfirm ? 'Confirm Exit' : 'Emergency Exit'}
                  </Button>
                </div>

                {showExitConfirm && (
                  <p className="text-sm text-destructive animate-pulse">
                    Click again to confirm exit
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-strong">
                <CardContent className="p-4 text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{session.distractionAttempts}</div>
                  <p className="text-xs text-muted-foreground">Distractions</p>
                </CardContent>
              </Card>

              <Card className="glass-strong">
                <CardContent className="p-4 text-center">
                  <MessageSquareOff className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{session.blockedMessages}</div>
                  <p className="text-xs text-muted-foreground">Messages Blocked</p>
                </CardContent>
              </Card>

              <Card className="glass-strong">
                <CardContent className="p-4 text-center">
                  <BellOff className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{session.blockedNotifications}</div>
                  <p className="text-xs text-muted-foreground">Notifications Blocked</p>
                </CardContent>
              </Card>

              <Card className="glass-strong">
                <CardContent className="p-4 text-center">
                  <Flame className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{Math.floor(progress)}%</div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                </CardContent>
              </Card>
            </div>

            {/* Motivational quote */}
            <Card className="glass-strong">
              <CardContent className="p-6 text-center">
                <p className="text-lg italic text-muted-foreground">
                  "{currentQuote}"
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
