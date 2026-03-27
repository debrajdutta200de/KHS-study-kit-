import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedImageBackground from '@/components/ui/AnimatedImageBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Loader2, Sparkles, Brain, Zap } from 'lucide-react';

import { SchoolBackground } from '@/components/ui/school-background';

const studyImages = [
  'https://miaoda-site-img.s3cdn.medo.dev/images/9e9c80e4-8cc2-45c5-b350-f1333e4269e8.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/6a84b502-5842-4d80-835a-4a69c1138c5f.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/11828505-9313-41ca-9391-4566f837ec31.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/749be4a0-c0ba-4eda-a162-aeeb09c50a73.jpg'
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  const { signInWithUsername, signUpWithUsername } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/dashboard';

  const validateUsername = (value: string): boolean => {
    return /^[a-zA-Z0-9_]+$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateUsername(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'login') {
        const { error: signInError } = await signInWithUsername(username, password);
        if (signInError) {
          setError(signInError.message || 'Invalid username or password');
        } else {
          navigate(from, { replace: true });
        }
      } else {
        const { error: signUpError } = await signUpWithUsername(username, password);
        if (signUpError) {
          setError(signUpError.message || 'Failed to create account');
        } else {
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SchoolBackground overlayOpacity="dark">
      <AnimatedImageBackground 
        images={studyImages}
        fallbackGradient="from-violet-950 via-purple-950 to-slate-950"
        transitionDuration={6000}
      >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Premium Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white mb-4 shadow-2xl animate-scale-in p-2">
              <img 
                src="https://miaoda-conversation-file.s3cdn.medo.dev/user-8isd6x76cw76/conv-8z3d3tngy9ds/20260117/file-8ztxvoamcav4.jpg"
                alt="KHS Study Kit Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-3 flex items-center justify-center gap-2">
              Kotalpur High School Study Kit
              <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
            </h1>
            <p className="text-muted-foreground text-lg">Focus. Discipline. Results.</p>
            
            {/* Feature badges */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/50">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-300">AI-Powered</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/50">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-300">Smart Learning</span>
              </div>
            </div>
          </div>

          <Card className="glass-strong border-border/50 shadow-2xl animate-scale-in">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                {activeTab === 'login' ? 'Sign in to continue your learning journey' : 'Create your account to get started'}
              </CardDescription>
            </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      autoComplete="username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      autoComplete="username"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only letters, numbers, and underscores allowed
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <p className="text-xs text-muted-foreground">
                      At least 6 characters
                    </p>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to our terms of service
            </p>
          </CardFooter>
        </Card>
        </div>
      </div>
      </AnimatedImageBackground>
    </SchoolBackground>
  );
}
