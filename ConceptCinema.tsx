import { SchoolBackground } from '@/components/ui/school-background';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Film, Sparkles, BookOpen, Zap, Rocket, Video } from 'lucide-react';
import { generateCinematicExplanation } from '@/services/aiEngine';
import TextToVideo from '@/components/TextToVideo';

const CINEMA_THEMES = [
  { 
    value: 'superhero', 
    label: 'Superhero Adventure', 
    icon: <Zap className="w-4 h-4" />,
    description: 'Physics, Forces, Energy'
  },
  { 
    value: 'timetravel', 
    label: 'Time Travel Story', 
    icon: <Rocket className="w-4 h-4" />,
    description: 'History, Events, Timelines'
  },
  { 
    value: 'microscopic', 
    label: 'Microscopic Journey', 
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Biology, Chemistry, Cells'
  },
  { 
    value: 'detective', 
    label: 'Detective Mystery', 
    icon: <Film className="w-4 h-4" />,
    description: 'Math, Logic, Problem Solving'
  }
];

export default function ConceptCinema() {
  const { profile } = useAuth();
  const { toast } = useToast();

  // State
  const [concept, setConcept] = useState('');
  const [subject, setSubject] = useState('');
  const [theme, setTheme] = useState<string>('superhero');
  const [story, setStory] = useState<{
    title: string;
    intro: string;
    scenes: Array<{
      heading: string;
      content: string;
      visual: string;
    }>;
    keyTakeaways: string[];
    examSummary: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate cinematic explanation
  const handleGenerate = async () => {
    if (!concept.trim()) {
      toast({
        title: 'Concept Required',
        description: 'Please enter a concept to explain',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setStory(null);

    try {
      const result = await generateCinematicExplanation({
        concept: concept.trim(),
        subject: subject.trim() || 'General',
        theme,
        classLevel: profile?.class_level?.toString()
      });

      setStory(result);

      toast({
        title: '🎬 Cinema Ready!',
        description: 'Your concept story is ready to watch'
      });

    } catch (error) {
      console.error('Error generating cinematic explanation:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to create story',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-6 border border-border/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Film className="w-8 h-8 text-purple-500" />
            <h1 className="text-4xl font-bold gradient-text">Concept Cinema 🎬</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Learn through cinematic stories and AI-powered videos
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="story" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger value="story" className="flex items-center gap-2 py-3">
            <Film className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Cinematic Story</div>
              <div className="text-xs text-muted-foreground">AI-generated story explanations</div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2 py-3">
            <Video className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Text to Video</div>
              <div className="text-xs text-muted-foreground">Convert notes to video</div>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Cinematic Story Tab */}
        <TabsContent value="story" className="space-y-6 mt-6">
          {/* Input Section */}
          <Card className="premium-card animate-slide-up">
            <CardHeader>
              <CardTitle>Create Your Story</CardTitle>
              <CardDescription>
                Transform any concept into an engaging cinematic experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* Concept input */}
          <div className="space-y-2">
            <Label htmlFor="concept">Concept / Topic</Label>
            <Input
              id="concept"
              placeholder="e.g., Newton's Laws, Photosynthesis, World War II..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="focus-ring"
            />
          </div>

          {/* Subject input */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (Optional)</Label>
            <Input
              id="subject"
              placeholder="e.g., Physics, Biology, History..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="focus-ring"
            />
          </div>

          {/* Theme selection */}
          <div className="space-y-2">
            <Label>Story Theme</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CINEMA_THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    theme === t.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {t.icon}
                    <span className="font-medium">{t.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !concept.trim()}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Your Story...
              </>
            ) : (
              <>
                <Film className="mr-2 h-4 w-4" />
                Generate Cinematic Explanation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Story Display */}
      {story && (
        <div className="space-y-6 animate-scale-in">
          {/* Title Card */}
          <Card className="premium-card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/50">
            <CardContent className="p-8 text-center">
              <Film className="w-16 h-16 mx-auto mb-4 text-purple-500" />
              <h2 className="text-3xl font-bold mb-2">{story.title}</h2>
              <p className="text-lg text-muted-foreground italic">
                {story.intro}
              </p>
            </CardContent>
          </Card>

          {/* Story Scenes */}
          <Tabs defaultValue="story" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="story">
                <Film className="w-4 h-4 mr-2" />
                Story
              </TabsTrigger>
              <TabsTrigger value="takeaways">
                <Sparkles className="w-4 h-4 mr-2" />
                Key Points
              </TabsTrigger>
              <TabsTrigger value="exam">
                <BookOpen className="w-4 h-4 mr-2" />
                Exam Focus
              </TabsTrigger>
            </TabsList>

            {/* Story Tab */}
            <TabsContent value="story" className="space-y-4 mt-6">
              {story.scenes.map((scene, index) => (
                <Card key={index} className="premium-card hover-lift">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                        {index + 1}
                      </div>
                      <CardTitle className="text-xl">{scene.heading}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Visual description */}
                    <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-purple-500">
                      <p className="text-sm font-medium text-purple-500 mb-2">🎨 Visual Scene</p>
                      <p className="text-muted-foreground italic">{scene.visual}</p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="leading-relaxed whitespace-pre-wrap">{scene.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Key Takeaways Tab */}
            <TabsContent value="takeaways" className="mt-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Key Takeaways
                  </CardTitle>
                  <CardDescription>
                    Remember these essential points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {story.keyTakeaways.map((takeaway, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-black font-bold text-sm flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="flex-1">{takeaway}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exam Summary Tab */}
            <TabsContent value="exam" className="mt-6">
              <Card className="premium-card bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    Exam-Focused Summary
                  </CardTitle>
                  <CardDescription>
                    What you need to know for exams
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="leading-relaxed whitespace-pre-wrap">{story.examSummary}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {!story && !loading && (
        <Card className="premium-card">
          <CardContent className="empty-state py-16">
            <Film className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ready for Your Story</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Enter a concept above and select a theme to transform it into an engaging cinematic experience
            </p>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* Text to Video Tab */}
        <TabsContent value="video" className="mt-6">
          <TextToVideo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
