import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface FocusSession {
  isActive: boolean;
  startTime: number | null;
  duration: number; // minutes
  timeRemaining: number; // seconds
  isPaused: boolean;
  distractionAttempts: number;
  breakAttempts: number;
  blockedMessages: number;
  blockedNotifications: number;
  focusMode: 'deep' | 'pomodoro' | 'exam' | 'revision';
  breakTime: number; // minutes for pomodoro
  pomodoroRound: number;
}

interface FocusContextType {
  session: FocusSession;
  startFocus: (duration: number, mode?: 'deep' | 'pomodoro' | 'exam' | 'revision') => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  endFocus: (forced?: boolean) => void;
  recordDistraction: () => void;
  recordBreakAttempt: () => void;
  recordBlockedMessage: () => void;
  recordBlockedNotification: () => void;
  isNavigationBlocked: boolean;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState<FocusSession>({
    isActive: false,
    startTime: null,
    duration: 0,
    timeRemaining: 0,
    isPaused: false,
    distractionAttempts: 0,
    breakAttempts: 0,
    blockedMessages: 0,
    blockedNotifications: 0,
    focusMode: 'deep',
    breakTime: 5,
    pomodoroRound: 0
  });

  // Block navigation during active focus
  const isNavigationBlocked = session.isActive && !session.isPaused;

  // Timer logic
  useEffect(() => {
    if (!session.isActive || session.isPaused || session.timeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setSession(prev => {
        const newTimeRemaining = prev.timeRemaining - 1;
        
        if (newTimeRemaining <= 0) {
          // Session complete
          completeFocusSession();
          return { ...prev, timeRemaining: 0, isActive: false };
        }
        
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isActive, session.isPaused, session.timeRemaining]);

  // Block navigation during focus
  useEffect(() => {
    if (!isNavigationBlocked) return;

    // Prevent navigation away from focus page
    if (location.pathname !== '/focus') {
      recordDistraction();
      navigate('/focus', { replace: true });
    }

    // Block browser back button
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      recordBreakAttempt();
      navigate('/focus', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    
    // Block page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You are in Deep Focus Mode. Leaving will end your session.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isNavigationBlocked, location.pathname, navigate]);

  // Suppress notifications during focus
  useEffect(() => {
    if (!session.isActive) return;

    // Store original Notification permission
    const originalNotification = window.Notification;

    // Override Notification constructor to block new notifications
    if ('Notification' in window) {
      (window as any).Notification = class extends originalNotification {
        constructor(title: string, options?: NotificationOptions) {
          // Block all notifications during focus except completion
          if (session.isActive && !title.includes('Focus Complete')) {
            console.log('[Focus Mode] Blocked notification:', title);
            return {} as any;
          }
          super(title, options);
        }
      };
    }

    return () => {
      // Restore original Notification
      if (originalNotification) {
        window.Notification = originalNotification;
      }
    };
  }, [session.isActive]);

  // Detect app backgrounding
  useEffect(() => {
    if (!session.isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Focus Mode] App backgrounded - distraction detected');
        recordDistraction();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session.isActive]);

  const startFocus = (duration: number, mode: 'deep' | 'pomodoro' | 'exam' | 'revision' = 'deep') => {
    const now = Date.now();
    
    setSession({
      isActive: true,
      startTime: now,
      duration,
      timeRemaining: duration * 60,
      isPaused: false,
      distractionAttempts: 0,
      breakAttempts: 0,
      blockedMessages: 0,
      blockedNotifications: 0,
      focusMode: mode,
      breakTime: mode === 'pomodoro' ? 5 : 0,
      pomodoroRound: mode === 'pomodoro' ? 1 : 0
    });

    // Navigate to focus page
    navigate('/focus');

    // Request notification permission for completion alert
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Save session to localStorage for persistence
    localStorage.setItem('focusSession', JSON.stringify({
      startTime: now,
      duration,
      timeRemaining: duration * 60,
      focusMode: mode
    }));
  };

  const pauseFocus = () => {
    setSession(prev => ({ ...prev, isPaused: true }));
  };

  const resumeFocus = () => {
    setSession(prev => ({ ...prev, isPaused: false }));
  };

  const endFocus = (forced = false) => {
    if (forced) {
      recordBreakAttempt();
    }

    // Save session stats before ending
    saveFocusStats();

    setSession({
      isActive: false,
      startTime: null,
      duration: 0,
      timeRemaining: 0,
      isPaused: false,
      distractionAttempts: 0,
      breakAttempts: 0,
      blockedMessages: 0,
      blockedNotifications: 0,
      focusMode: 'deep',
      breakTime: 5,
      pomodoroRound: 0
    });

    localStorage.removeItem('focusSession');
  };

  const recordDistraction = () => {
    setSession(prev => ({
      ...prev,
      distractionAttempts: prev.distractionAttempts + 1
    }));
  };

  const recordBreakAttempt = () => {
    setSession(prev => ({
      ...prev,
      breakAttempts: prev.breakAttempts + 1
    }));
  };

  const recordBlockedMessage = () => {
    setSession(prev => ({
      ...prev,
      blockedMessages: prev.blockedMessages + 1
    }));
    console.log('[Focus Mode] Blocked incoming message');
  };

  const recordBlockedNotification = () => {
    setSession(prev => ({
      ...prev,
      blockedNotifications: prev.blockedNotifications + 1
    }));
    console.log('[Focus Mode] Blocked notification');
  };

  const completeFocusSession = () => {
    // Show completion notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎉 Focus Session Complete!', {
        body: `Great job! You completed ${session.duration} minutes of focused study.`,
        icon: '/icon.png'
      });
    }

    // Save stats
    saveFocusStats();
  };

  const saveFocusStats = () => {
    const stats = {
      duration: session.duration,
      completedMinutes: Math.floor((session.duration * 60 - session.timeRemaining) / 60),
      distractionAttempts: session.distractionAttempts,
      breakAttempts: session.breakAttempts,
      blockedMessages: session.blockedMessages,
      blockedNotifications: session.blockedNotifications,
      focusMode: session.focusMode,
      timestamp: Date.now(),
      completed: session.timeRemaining === 0
    };

    // Save to localStorage (in production, this would go to database)
    const existingStats = JSON.parse(localStorage.getItem('focusStats') || '[]');
    existingStats.push(stats);
    localStorage.setItem('focusStats', JSON.stringify(existingStats));

    console.log('[Focus Mode] Session stats saved:', stats);
  };

  // Restore session on mount (if page was refreshed during focus)
  useEffect(() => {
    const savedSession = localStorage.getItem('focusSession');
    if (savedSession) {
      try {
        const { startTime, duration, timeRemaining, focusMode } = JSON.parse(savedSession);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, timeRemaining - elapsed);

        if (remaining > 0) {
          setSession({
            isActive: true,
            startTime,
            duration,
            timeRemaining: remaining,
            isPaused: false,
            distractionAttempts: 0,
            breakAttempts: 0,
            blockedMessages: 0,
            blockedNotifications: 0,
            focusMode: focusMode || 'deep',
            breakTime: focusMode === 'pomodoro' ? 5 : 0,
            pomodoroRound: focusMode === 'pomodoro' ? 1 : 0
          });
          navigate('/focus');
        } else {
          localStorage.removeItem('focusSession');
        }
      } catch (error) {
        console.error('[Focus Mode] Failed to restore session:', error);
        localStorage.removeItem('focusSession');
      }
    }
  }, []);

  return (
    <FocusContext.Provider
      value={{
        session,
        startFocus,
        pauseFocus,
        resumeFocus,
        endFocus,
        recordDistraction,
        recordBreakAttempt,
        recordBlockedMessage,
        recordBlockedNotification,
        isNavigationBlocked
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within FocusProvider');
  }
  return context;
}
