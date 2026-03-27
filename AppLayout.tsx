import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  GraduationCap, Home, Upload, Brain, MessageSquare, Layers, 
  Calendar, TrendingUp, User, Settings, LogOut, Menu,
  BookOpen, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Explain', href: '/explain', icon: Brain },
  { name: 'Quiz', href: '/quiz', icon: BookOpen },
  { name: 'Doubts', href: '/doubts', icon: MessageSquare },
  { name: 'Flashcards', href: '/flashcards', icon: Layers },
  { name: 'Study Plan', href: '/study-plan', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Parents Panel', href: '/parents', icon: Users },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-4">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white p-1">
          <img 
            src="https://miaoda-conversation-file.s3cdn.medo.dev/user-8isd6x76cw76/conv-8z3d3tngy9ds/20260117/file-8ztxvoamcav4.jpg"
            alt="KHS Study Kit Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">KHS Study Kit</p>
          <p className="text-xs text-muted-foreground">{String(profile?.username || 'Student')}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-2 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-sidebar">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white p-0.5">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-8isd6x76cw76/conv-8z3d3tngy9ds/20260117/file-8ztxvoamcav4.jpg"
              alt="KHS Study Kit Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-semibold">KHS Study Kit</span>
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 lg:p-8 mt-16 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
