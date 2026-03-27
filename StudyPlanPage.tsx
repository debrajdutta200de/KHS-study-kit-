import { SchoolBackground } from '@/components/ui/school-background';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { studyPlanApi, subjectApi } from '@/db/api';
import { generateStudyPlan } from '@/services/aiEngine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Target, Lightbulb, Sparkles } from 'lucide-react';
import type { Subject, StudyPlan } from '@/types';

export default function StudyPlanPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [subjectsData, planData] = await Promise.all([
      subjectApi.getSubjects(user.id),
      studyPlanApi.getActivePlan(user.id)
    ]);
    setSubjects(subjectsData);
    setActivePlan(planData);
  };

  const handleGeneratePlan = async () => {
    if (!user || !profile?.exam_date) {
      toast({
        title: 'Missing Information',
        description: 'Please set your exam date in profile settings',
        variant: 'destructive'
      });
      return;
    }

    if (subjects.length === 0) {
      toast({
        title: 'No Subjects',
        description: 'Please add subjects in your profile',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Deactivate old plan if exists
      if (activePlan) {
        await studyPlanApi.deactivatePlan(activePlan.id);
      }

      // Use AI Engine to generate study plan
      console.log('[StudyPlanPage] Generating study plan with AI...');
      const planData = await generateStudyPlan({
        examDate: String(profile.exam_date),
        subjects: subjects.map(s => ({ name: s.name, isWeak: s.is_weak || false })),
        dailyStudyTime: Number(profile.daily_study_time) || 120,
        classLevel: String(profile.class_level || '')
      });

      console.log('[StudyPlanPage] Study plan generated successfully');

      const today = new Date().toISOString().split('T')[0];
      
      // Transform planData to match database schema
      const transformedPlanData = {
        daily_schedule: planData.dailySchedule,
        revision_cycles: planData.revisionCycles,
        tips: planData.tips
      };
      
      const plan = await studyPlanApi.createPlan({
        user_id: user.id,
        plan_data: transformedPlanData,
        start_date: today,
        end_date: String(profile.exam_date || today),
        is_active: true
      });

      setActivePlan(plan);

      toast({
        title: 'Study Plan Generated! 📅',
        description: 'Your personalized schedule is ready'
      });

    } catch (error) {
      console.error('Generate plan error:', error);
      toast({
        title: 'Failed to Generate Plan',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayStatus = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (date < today) return 'past';
    if (date === today) return 'today';
    return 'future';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Study Plan</h1>
          <p className="text-muted-foreground">
            AI-generated personalized study schedule
          </p>
        </div>
        <Button onClick={handleGeneratePlan} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Target className="mr-2 h-4 w-4" />
              {activePlan ? 'Regenerate Plan' : 'Generate Plan'}
            </>
          )}
        </Button>
      </div>

      {!activePlan ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Study Plan</h3>
            <p className="text-muted-foreground text-center mb-6">
              Generate a personalized study plan based on your exam date and subjects
            </p>
            <Button onClick={handleGeneratePlan} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Study Plan'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Start Date</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {new Date(activePlan.start_date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">End Date</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {new Date(activePlan.end_date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Days</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.ceil((new Date(activePlan.end_date).getTime() - new Date(activePlan.start_date).getTime()) / (1000 * 60 * 60 * 24))}
                </p>
              </CardContent>
            </Card>
          </div>

          {activePlan.plan_data.tips && activePlan.plan_data.tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {activePlan.plan_data.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Daily Schedule</CardTitle>
              <CardDescription>
                Your day-by-day study plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {activePlan.plan_data.daily_schedule?.map((day, index) => {
                  const status = getDayStatus(day.date);
                  return (
                    <AccordionItem key={index} value={`day-${index}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          {status === 'today' && (
                            <Badge>Today</Badge>
                          )}
                          {status === 'past' && (
                            <Badge variant="outline">Completed</Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {day.subjects.map((subject, subIndex) => (
                            <div key={subIndex} className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{subject.subject}</span>
                                <Badge variant="outline">{subject.duration} min</Badge>
                              </div>
                              {subject.topics && subject.topics.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Topics: {subject.topics.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          {activePlan.plan_data.revision_cycles && activePlan.plan_data.revision_cycles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revision Cycles</CardTitle>
                <CardDescription>
                  Scheduled revision sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activePlan.plan_data.revision_cycles.map((cycle, index) => (
                    <div key={index} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {new Date(cycle.date).toLocaleDateString()}
                        </span>
                        <Badge variant="outline">Revision</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cycle.topics.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
