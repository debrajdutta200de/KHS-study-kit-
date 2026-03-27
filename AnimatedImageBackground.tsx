import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedImageBackgroundProps {
  images: string[];
  fallbackGradient?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
  children?: React.ReactNode;
  transitionDuration?: number;
}

export default function AnimatedImageBackground({
  images,
  fallbackGradient = 'from-violet-950 via-purple-950 to-slate-950',
  overlay = true,
  overlayOpacity = 0.75,
  className,
  children,
  transitionDuration = 5000
}: AnimatedImageBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, transitionDuration);

    return () => clearInterval(interval);
  }, [images.length, transitionDuration]);

  useEffect(() => {
    // Preload images
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    setIsLoaded(true);
  }, [images]);

  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden', className)}>
      {/* Image Backgrounds with Crossfade */}
      {images.length > 0 && isLoaded ? (
        <>
          {images.map((image, index) => (
            <div
              key={image}
              className={cn(
                'absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out',
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              )}
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
          ))}
          {overlay && (
            <div 
              className="absolute inset-0 bg-gradient-to-br from-black/85 via-violet-950/80 to-purple-950/85"
              style={{ opacity: overlayOpacity }}
            />
          )}
        </>
      ) : (
        // Fallback gradient background
        <div className={cn('absolute inset-0 bg-gradient-to-br', fallbackGradient)} />
      )}

      {/* Animated particles overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
