import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFocus } from '@/contexts/FocusContext';
import { useToast } from '@/hooks/use-toast';

export function FocusGuard({ children }: { children: React.ReactNode }) {
  const { session, recordBreakAttempt } = useFocus();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // If focus is active and user tries to navigate away from /focus
    if (session.isActive && !session.isPaused && location.pathname !== '/focus') {
      // Block navigation
      recordBreakAttempt();
      
      // Show warning
      toast({
        title: '🔒 Focus Mode Active',
        description: 'You cannot leave during an active focus session. Use emergency exit if needed.',
        variant: 'destructive',
        duration: 3000
      });

      // Force back to focus page
      navigate('/focus', { replace: true });
    }
  }, [session.isActive, session.isPaused, location.pathname, navigate, recordBreakAttempt, toast]);

  return <>{children}</>;
}
