import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SchoolBackgroundProps {
  children: ReactNode;
  className?: string;
  overlayOpacity?: 'light' | 'medium' | 'dark';
}

export function SchoolBackground({ 
  children, 
  className,
  overlayOpacity = 'dark'
}: SchoolBackgroundProps) {
  const overlayClasses = {
    light: 'bg-gradient-to-br from-black/90 via-violet-950/88 to-black/90',
    medium: 'bg-gradient-to-br from-black/95 via-violet-950/93 to-black/95',
    dark: 'bg-gradient-to-br from-black/98 via-violet-950/97 to-black/98'
  };

  return (
    <div className={cn("relative min-h-screen w-full", className)}>
      {/* School Photo Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/kotalpur-school.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'blur(2px) brightness(0.3)',
          opacity: 0.4,
        }}
      />
      
      {/* Dark Overlay with Violet Tint */}
      <div className={cn(
        "fixed inset-0 z-0",
        overlayClasses[overlayOpacity]
      )} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
