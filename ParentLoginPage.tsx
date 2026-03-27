import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Lock, ArrowRight } from 'lucide-react';

export default function ParentLoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [studentCode, setStudentCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async () => {
    if (!studentCode.trim()) {
      toast({
        title: 'Code Required',
        description: 'Please enter your child\'s student code',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Validate code format (STU-XXXXX)
      const codePattern = /^STU-[A-Z0-9]{5}$/;
      if (!codePattern.test(studentCode.toUpperCase())) {
        throw new Error('Invalid code format. Code should be like: STU-XXXXX');
      }

      // Get student data from localStorage
      const studentData = localStorage.getItem('studentProfile');
      if (!studentData) {
        throw new Error('No student profile found. Please ask your child to log in first.');
      }

      const profile = JSON.parse(studentData);
      
      // Check if code matches
      if (profile.studentCode !== studentCode.toUpperCase()) {
        throw new Error('Invalid student code. Please check the code and try again.');
      }

      // Store parent session
      localStorage.setItem('parentSession', JSON.stringify({
        studentCode: studentCode.toUpperCase(),
        studentName: profile.name || 'Student',
        accessTime: Date.now()
      }));

      toast({
        title: 'Access Granted',
        description: `Welcome! You can now view ${profile.name || 'your child'}\'s progress.`
      });

      // Navigate to parent panel
      navigate('/parents-panel');

    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Invalid student code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="glass-strong border-border/50 animate-scale-in">
          <CardHeader className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold gradient-text">Parents Panel</CardTitle>
              <CardDescription className="text-lg mt-2">
                Enter your child's unique student code to access their progress
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info card */}
            <Card className="bg-muted/50 border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Secure Access</p>
                    <p className="text-xs text-muted-foreground">
                      Each student has a unique code. Only you can access your child's data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Code input */}
            <div className="space-y-2">
              <Label htmlFor="student-code" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Student Code
              </Label>
              <Input
                id="student-code"
                placeholder="STU-XXXXX"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-wider"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground text-center">
                Ask your child for their student code from their profile
              </p>
            </div>

            {/* Verify button */}
            <Button
              onClick={handleVerifyCode}
              disabled={loading || !studentCode.trim()}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Access Panel
                </>
              )}
            </Button>

            {/* Help text */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have the code?
              </p>
              <p className="text-xs text-muted-foreground">
                Ask your child to go to their Profile page and share their unique student code with you.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
