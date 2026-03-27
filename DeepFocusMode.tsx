import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useFocus } from '@/contexts/FocusContext';
import { Lock, Unlock, Play, Pause, X, Volume2, VolumeX, Shield } from 'lucide-react';

export default function DeepFocusMode() {
  const { toast } = useToast();
  const { session, startFocus, pauseFocus, resumeFocus, endFocus } = useFocus();
  
  // Local state
  const [duration, setDuration] = useState(25); // minutes
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);

  // Preset durations
  const presets = [
    { label: '15 min', value: 15 },
    { label: '25 min', value: 25 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 },
    { label: '90 min', value: 90 }
  ];

  // Handle emergency exit
  const handleEmergencyExit = () => {
    if (!showExitConfirm) {
      setShowExitConfirm(true);
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
        description: `You stayed focused for ${session.duration} minutes. Well done!`
      });
    }
  }, [session.timeRemaining, session.duration, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl">
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
              </div>

              {/* Duration selection */}
              <div className="space-y-4">
                <label className="text-sm font-medium">Select Duration</label>
                <div className="grid grid-cols-3 gap-3">
                  {presets.map((preset) => (
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

              {/* Features list */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  System-Level Protection:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Blocks all in-app notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Prevents navigation to other pages
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Tracks distraction attempts
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Timer-based unlock only
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Parents can monitor (but not interrupt)
                  </li>
                </ul>
              </div>

              {/* Start button */}
              <Button
                onClick={() => startFocus(duration)}
                size="lg"
                className="w-full h-14 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Activate Deep Focus
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Active focus screen
          <div className="space-y-8 animate-fade-in">
            {/* Timer display */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 animate-pulse">
                <Lock className="w-12 h-12 text-white" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-6xl font-bold text-white tabular-nums">
                  {formatTime(session.timeRemaining)}
                </h2>
                <p className="text-muted-foreground">Stay focused. You've got this.</p>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {Math.floor(progress)}% complete
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Distractions</p>
                  <p className="text-2xl font-bold">{session.distractionAttempts}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Break Attempts</p>
                  <p className="text-2xl font-bold">{session.breakAttempts}</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <Card className="glass border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-center gap-4">
                  {/* Pause/Resume */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => session.isPaused ? resumeFocus() : pauseFocus()}
                  >
                    {session.isPaused ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>

                  {/* Ambient sound toggle */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setAmbientSound(!ambientSound)}
                  >
                    {ambientSound ? (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" />
                        Sound On
                      </>
                    ) : (
                      <>
                        <VolumeX className="mr-2 h-4 w-4" />
                        Sound Off
                      </>
                    )}
                  </Button>
                </div>

                {/* Emergency exit */}
                {!showExitConfirm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEmergencyExit}
                    className="w-full text-muted-foreground hover:text-destructive"
                  >
                    <Unlock className="mr-2 h-4 w-4" />
                    Emergency Exit
                  </Button>
                ) : (
                  <div className="space-y-2 p-4 bg-destructive/10 rounded-lg border border-destructive/50">
                    <p className="text-sm text-center font-medium">
                      Are you sure? This will count as a failed session.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExitConfirm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleEmergencyExit}
                        className="flex-1"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Exit Now
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Motivational quote */}
            <Card className="glass border-border/50">
              <CardContent className="p-6 text-center">
                <p className="text-lg italic text-muted-foreground">
                  "Focus is the gateway to thinking clearly, understanding deeply, and learning quickly."
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
