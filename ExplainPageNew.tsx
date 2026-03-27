import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { uploadApi, explanationApi } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Volume2, VolumeX, Play, Pause, RotateCw, Sparkles, BookOpen, Target, Rocket, Zap } from 'lucide-react';
import type { ExplanationMode, TextbookUpload } from '@/types';
import { explainChapter, regenerateExplanation } from '@/services/aiEngine';
import { createTTS, stopAllSpeech, isTTSSupported } from '@/services/textToSpeech';
import type { TTSControls } from '@/services/textToSpeech';

const EXPLANATION_MODES: { 
  value: ExplanationMode; 
  label: string; 
  description: string;
  icon: React.ReactNode;
}[] = [
  { 
    value: 'beginner', 
    label: 'Beginner', 
    description: 'Simple explanations for foundational understanding',
    icon: <BookOpen className="w-4 h-4" />
  },
  { 
    value: 'exam_focused', 
    label: 'Exam-Focused', 
    description: 'Marks-oriented explanations aligned with exam patterns',
    icon: <Target className="w-4 h-4" />
  },
  { 
    value: 'advanced', 
    label: 'Advanced', 
    description: 'Deep conceptual understanding for mastery',
    icon: <Rocket className="w-4 h-4" />
  },
  { 
    value: 'rapid_revision', 
    label: 'Rapid Revision', 
    description: 'Quick summaries for fast review',
    icon: <Zap className="w-4 h-4" />
  }
];

const REGENERATE_ANGLES: { value: 'simpler' | 'detailed' | 'examples' | 'visual'; label: string }[] = [
  { value: 'simpler', label: 'Simpler Terms' },
  { value: 'detailed', label: 'More Detailed' },
  { value: 'examples', label: 'With Examples' },
  { value: 'visual', label: 'Visual Approach' }
];

export default function ExplainPage() {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // State
  const [upload, setUpload] = useState<TextbookUpload | null>(null);
  const [concept, setConcept] = useState('');
  const [selectedMode, setSelectedMode] = useState<ExplanationMode>('exam_focused');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
  // TTS State
  const [ttsControls, setTtsControls] = useState<TTSControls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [ttsSupported] = useState(isTTSSupported());

  // Load upload data
  useEffect(() => {
    const uploadId = searchParams.get('uploadId');
    if (uploadId && user) {
      uploadApi.getUploads(user.id).then((uploads) => {
        const found = uploads.find(u => u.id === uploadId);
        if (found) {
          setUpload(found);
          if (found.detected_concepts && found.detected_concepts.length > 0) {
            setConcept(found.detected_concepts[0]);
          }
        }
      }).catch((error) => {
        console.error('Error loading upload:', error);
      });
    }
  }, [searchParams, user]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  // Generate explanation
  const handleExplain = async () => {
    if (!concept.trim() || !user) {
      toast({
        title: 'Concept Required',
        description: 'Please enter a concept to explain',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setExplanation('');
    setIsPlaying(false);
    stopAllSpeech();

    try {
      const result = await explainChapter({
        classLevel: profile?.class_level?.toString() || '10',
        subject: 'General',
        chapter: concept.trim(),
        extractedText: upload?.extracted_text || undefined,
        mode: selectedMode
      });

      setExplanation(result);

      // Save to database
      await explanationApi.createExplanation({
        user_id: user.id,
        upload_id: upload?.id || null,
        concept: concept.trim(),
        mode: selectedMode,
        explanation_text: result,
        audio_url: null
      });

      toast({
        title: 'Explanation Generated! ✨',
        description: 'Your explanation is ready'
      });

    } catch (error) {
      console.error('Error generating explanation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate explanation';
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Regenerate from different angle
  const handleRegenerate = async (angle: 'simpler' | 'detailed' | 'examples' | 'visual') => {
    if (!explanation || !concept) return;

    setRegenerating(true);
    stopAllSpeech();
    setIsPlaying(false);

    try {
      const result = await regenerateExplanation({
        originalExplanation: explanation,
        topic: concept,
        angle
      });

      setExplanation(result);

      toast({
        title: 'Regenerated! ✨',
        description: `Explanation regenerated with ${angle} approach`
      });

    } catch (error) {
      console.error('Error regenerating:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate';
      toast({
        title: 'Regeneration Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setRegenerating(false);
    }
  };

  // Text-to-Speech controls
  const handlePlayPause = async () => {
    if (!explanation) return;

    try {
      if (isPlaying && ttsControls) {
        ttsControls.pause();
        setIsPlaying(false);
      } else if (ttsControls && ttsControls.isPaused()) {
        ttsControls.resume();
        setIsPlaying(true);
      } else {
        // Create new TTS
        const controls = await createTTS(
          explanation,
          { rate: playbackSpeed },
          () => {
            setIsPlaying(false);
          },
          (error) => {
            console.error('TTS Error:', error);
            toast({
              title: 'Audio Error',
              description: error.message,
              variant: 'destructive'
            });
            setIsPlaying(false);
          }
        );

        setTtsControls(controls);
        controls.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      toast({
        title: 'Audio Not Available',
        description: 'Text-to-speech is not supported in your browser',
        variant: 'destructive'
      });
    }
  };

  const handleStop = () => {
    if (ttsControls) {
      ttsControls.stop();
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0];
    setPlaybackSpeed(newSpeed);
    if (ttsControls) {
      ttsControls.setRate(newSpeed);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-6 border border-border/50">
        <h1 className="text-4xl font-bold mb-2 gradient-text">AI Explanation Engine</h1>
        <p className="text-muted-foreground">
          Get personalized explanations tailored to your learning style
        </p>
      </div>

      {/* Upload Context */}
      {upload && (
        <Card className="premium-card animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg">📚 From Your Upload</CardTitle>
            <CardDescription>
              Uploaded Content
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Input Section */}
      <Card className="premium-card animate-slide-up">
        <CardHeader>
          <CardTitle>What do you want to learn?</CardTitle>
          <CardDescription>
            Enter a concept, topic, or chapter name
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="concept">Concept / Topic</Label>
            <Textarea
              id="concept"
              placeholder="e.g., Photosynthesis, Quadratic Equations, Newton's Laws..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              rows={3}
              className="resize-none focus-ring"
            />
          </div>

          {/* Explanation Modes */}
          <div className="space-y-2">
            <Label>Explanation Mode</Label>
            <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as ExplanationMode)}>
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
                {EXPLANATION_MODES.map((mode) => (
                  <TabsTrigger 
                    key={mode.value} 
                    value={mode.value}
                    className="flex items-center gap-2"
                  >
                    {mode.icon}
                    <span className="hidden sm:inline">{mode.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {EXPLANATION_MODES.map((mode) => (
                <TabsContent key={mode.value} value={mode.value} className="mt-2">
                  <p className="text-sm text-muted-foreground">{mode.description}</p>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <Button 
            onClick={handleExplain} 
            disabled={loading || !concept.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Explanation...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Explanation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Explanation Output */}
      {explanation && (
        <Card className="premium-card animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Explanation</CardTitle>
                <CardDescription>
                  {EXPLANATION_MODES.find(m => m.value === selectedMode)?.label} Mode
                </CardDescription>
              </div>
              
              {/* Audio Controls */}
              {ttsSupported && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayPause}
                    disabled={!explanation}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Listen
                      </>
                    )}
                  </Button>
                  {isPlaying && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleStop}
                    >
                      <VolumeX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Speed Control */}
            {ttsSupported && isPlaying && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Playback Speed</Label>
                  <span className="text-sm font-medium">{playbackSpeed.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[playbackSpeed]}
                  onValueChange={handleSpeedChange}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            )}

            {/* Explanation Content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap leading-relaxed">
                {explanation}
              </div>
            </div>

            {/* Regenerate Options */}
            <div className="pt-4 border-t">
              <Label className="text-sm mb-3 block">Regenerate from different angle:</Label>
              <div className="flex flex-wrap gap-2">
                {REGENERATE_ANGLES.map((angle) => (
                  <Button
                    key={angle.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerate(angle.value)}
                    disabled={regenerating}
                  >
                    {regenerating ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <RotateCw className="h-3 w-3 mr-2" />
                    )}
                    {angle.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!explanation && !loading && (
        <Card className="premium-card">
          <CardContent className="empty-state py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Learn</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Enter a concept above and select your preferred explanation mode to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
