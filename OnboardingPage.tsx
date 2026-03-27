import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi, subjectApi } from '@/db/api';
import AnimatedImageBackground from '@/components/ui/AnimatedImageBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MultiSelect from '@/components/ui/multi-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import type { BoardType, LearningPace, LearningStyle } from '@/types';

import { SchoolBackground } from '@/components/ui/school-background';

const studyImages = [
  'https://miaoda-site-img.s3cdn.medo.dev/images/34145917-324f-466b-b42f-0c1fa3210084.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/11828505-9313-41ca-9391-4566f837ec31.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/749be4a0-c0ba-4eda-a162-aeeb09c50a73.jpg'
];

const COMMON_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
  'Hindi', 'History', 'Geography', 'Economics', 'Computer Science',
  'Accountancy', 'Business Studies', 'Political Science'
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [classLevel, setClassLevel] = useState('');
  const [board, setBoard] = useState<BoardType | ''>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [examDate, setExamDate] = useState('');
  const [learningPace, setLearningPace] = useState<LearningPace>('normal');
  const [learningStyle, setLearningStyle] = useState<LearningStyle>('mixed');
  const [dailyStudyTime, setDailyStudyTime] = useState('120');

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step === 1 && (!classLevel || !board || selectedSubjects.length === 0)) {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    if (step === 2 && !examDate) {
      toast({
        title: 'Exam Date Required',
        description: 'Please select your exam date',
        variant: 'destructive'
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update profile
      await profileApi.updateProfile(user.id, {
        class_level: classLevel,
        board: board as BoardType,
        exam_date: examDate,
        learning_pace: learningPace,
        learning_style: learningStyle,
        daily_study_time: Number.parseInt(dailyStudyTime)
      });

      // Create subjects
      for (const subject of selectedSubjects) {
        await subjectApi.createSubject(user.id, subject, weakSubjects.includes(subject));
      }

      await refreshProfile();

      toast({
        title: 'Profile Setup Complete! 🎉',
        description: 'Welcome to your learning journey'
      });

      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Setup Failed',
        description: 'Failed to complete profile setup. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const subjectOptions = COMMON_SUBJECTS.map(s => ({ label: s, value: s }));

  return (
    <SchoolBackground overlayOpacity="medium">
      <AnimatedImageBackground 
        images={studyImages}
        fallbackGradient="from-violet-950 via-purple-950 to-slate-950"
        transitionDuration={7000}
      >
        <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-2">Let's Set Up Your Profile</h1>
            <p className="text-center text-muted-foreground mb-4">
              Help us personalize your learning experience
            </p>
            <Progress value={progress} className="h-2" />
          </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Academic Information'}
              {step === 2 && 'Exam Details'}
              {step === 3 && 'Learning Preferences'}
              {step === 4 && 'Study Schedule'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Tell us about your class and subjects'}
              {step === 2 && 'When is your exam?'}
              {step === 3 && 'How do you prefer to learn?'}
              {step === 4 && 'Set your daily study goals'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="class">Class / Grade *</Label>
                  <Select value={classLevel} onValueChange={setClassLevel}>
                    <SelectTrigger id="class">
                      <SelectValue placeholder="Select your class" />
                    </SelectTrigger>
                    <SelectContent>
                      {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                        <SelectItem key={c} value={c}>Class {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="board">Board *</Label>
                  <Select value={board} onValueChange={(v) => setBoard(v as BoardType)}>
                    <SelectTrigger id="board">
                      <SelectValue placeholder="Select your board" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBSE">CBSE</SelectItem>
                      <SelectItem value="ICSE">ICSE</SelectItem>
                      <SelectItem value="State">State Board</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subjects *</Label>
                  <MultiSelect
                    options={subjectOptions}
                    defaultSelected={selectedSubjects}
                    onChange={setSelectedSubjects}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="exam-date">Exam Date *</Label>
                  <Input
                    id="exam-date"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Weak Subjects (Optional)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select subjects you need more focus on
                  </p>
                  <MultiSelect
                    options={selectedSubjects.map(s => ({ label: s, value: s }))}
                    defaultSelected={weakSubjects}
                    onChange={setWeakSubjects}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-3">
                  <Label>Learning Pace</Label>
                  <RadioGroup value={learningPace} onValueChange={(v) => setLearningPace(v as LearningPace)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="slow" id="slow" />
                      <Label htmlFor="slow" className="font-normal cursor-pointer">
                        Slow - Take your time to understand deeply
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal" className="font-normal cursor-pointer">
                        Normal - Balanced learning speed
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fast" id="fast" />
                      <Label htmlFor="fast" className="font-normal cursor-pointer">
                        Fast - Quick learner, cover more ground
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Learning Style</Label>
                  <RadioGroup value={learningStyle} onValueChange={(v) => setLearningStyle(v as LearningStyle)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="visual" id="visual" />
                      <Label htmlFor="visual" className="font-normal cursor-pointer">
                        Visual - Learn best with diagrams and images
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text" id="text" />
                      <Label htmlFor="text" className="font-normal cursor-pointer">
                        Text - Prefer reading and written explanations
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mixed" id="mixed" />
                      <Label htmlFor="mixed" className="font-normal cursor-pointer">
                        Mixed - Combination of both
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <Label htmlFor="study-time">Daily Study Time (minutes)</Label>
                <Input
                  id="study-time"
                  type="number"
                  min="30"
                  max="480"
                  step="30"
                  value={dailyStudyTime}
                  onChange={(e) => setDailyStudyTime(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Recommended: {Number.parseInt(dailyStudyTime) / 60} hours per day
                </p>
              </div>
            )}
          </CardContent>
          <div className="flex justify-between p-6 pt-0">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button onClick={handleNext} className="ml-auto">
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading} className="ml-auto">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
      </div>
      </AnimatedImageBackground>
    </SchoolBackground>
  );
}
