import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { uploadApi, explanationApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Volume2, Pause, Play, VolumeX } from 'lucide-react';
import type { ExplanationMode, TextbookUpload } from '@/types';
import { TextToSpeechService } from '@/services/textToSpeech';

const EXPLANATION_MODES: { value: ExplanationMode; label: string; description: string }[] = [
  { value: 'beginner', label: '🌱 Beginner', description: 'Simple explanations for foundational understanding' },
  { value: 'exam_focused', label: '🎯 Exam-Focused', description: 'Marks-oriented explanations aligned with exam patterns' },
  { value: 'advanced', label: '🚀 Advanced', description: 'Deep conceptual understanding for mastery' },
  { value: 'rapid_revision', label: '⚡ Rapid Revision', description: 'Quick summaries for fast review' }
];

export default function ExplainPage() {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [upload, setUpload] = useState<TextbookUpload | null>(null);
  const [concept, setConcept] = useState('');
  const [selectedMode, setSelectedMode] = useState<ExplanationMode>('beginner');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [ttsSupported, setTtsSupported] = useState(false);
  const ttsRef = useRef<TextToSpeechService | null>(null);

  useEffect(() => {
    // Initialize TTS
    if (TextToSpeechService.isSupported()) {
      try {
        ttsRef.current = new TextToSpeechService();
        ttsRef.current.onStart(() => {
          setIsPlaying(true);
          setIsPaused(false);
        });
        ttsRef.current.onEnd(() => {
          setIsPlaying(false);
          setIsPaused(false);
        });
        ttsRef.current.onPause(() => {
          setIsPaused(true);
        });
        setTtsSupported(true);
      } catch (error) {
        console.error('TTS initialization error:', error);
        setTtsSupported(false);
      }
    }

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
      });
    }

    // Cleanup on unmount
    return () => {
      if (ttsRef.current) {
        ttsRef.current.stop();
      }
    };
  }, [searchParams, user]);

  const handleExplain = async () => {
    if (!concept.trim() || !user) return;

    setLoading(true);
    setExplanation('');
    setAudioUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-explain', {
        body: {
          concept: concept.trim(),
          mode: selectedMode,
          context: upload?.extracted_text || undefined,
          userProfile: {
            class_level: profile?.class_level,
            board: profile?.board
          }
        }
      });

      if (error) throw error;

      setExplanation(data.explanation);

      // Save explanation to database
      await explanationApi.createExplanation({
        user_id: user.id,
        upload_id: upload?.id || null,
        concept: concept.trim(),
        mode: selectedMode,
        explanation_text: data.explanation,
        audio_url: null
      });

      toast({
        title: 'Explanation Generated! 📚',
        description: 'Your concept has been explained'
      });

    } catch (error) {
      console.error('Explanation error:', error);
      toast({
        title: 'Failed to Generate Explanation',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (!ttsRef.current || !explanation) return;

    try {
      ttsRef.current.speak(explanation, {
        rate: playbackSpeed,
        lang: 'en-US'
      });

      toast({
        title: 'Playing Explanation 🔊',
        description: 'Listening to your explanation'
      });
    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: 'Failed to Play Audio',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const handlePause = () => {
    if (!ttsRef.current) return;
    ttsRef.current.pause();
    setIsPaused(true);
  };

  const handleResume = () => {
    if (!ttsRef.current) return;
    ttsRef.current.resume();
    setIsPaused(false);
  };

  const handleStop = () => {
    if (!ttsRef.current) return;
    ttsRef.current.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  useEffect(() => {
    // Update playback speed when changed
    if (ttsRef.current && isPlaying) {
      // Need to restart speech with new rate
      const wasPlaying = isPlaying;
      if (wasPlaying) {
        handleStop();
        setTimeout(() => {
          handleSpeak();
        }, 100);
      }
    }
  }, [playbackSpeed]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Explanation Engine</h1>
        <p className="text-muted-foreground">
          Get personalized explanations in different learning modes
        </p>
      </div>

      {upload && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Content</CardTitle>
            <CardDescription>
              {upload.chapter_name && `Chapter: ${upload.chapter_name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upload.detected_concepts && upload.detected_concepts.length > 0 && (
              <div className="space-y-2">
                <Label>Detected Concepts</Label>
                <div className="flex flex-wrap gap-2">
                  {upload.detected_concepts.map((c, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setConcept(c)}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>What do you want to learn?</CardTitle>
          <CardDescription>
            Enter a concept, topic, or question
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="concept">Concept / Topic</Label>
            <Textarea
              id="concept"
              placeholder="e.g., Photosynthesis, Quadratic Equations, Newton's Laws..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Explanation Mode</Label>
            <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as ExplanationMode)}>
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                {EXPLANATION_MODES.map((mode) => (
                  <TabsTrigger key={mode.value} value={mode.value}>
                    {mode.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {EXPLANATION_MODES.map((mode) => (
                <TabsContent key={mode.value} value={mode.value}>
                  <p className="text-sm text-muted-foreground">{mode.description}</p>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <Button
            onClick={handleExplain}
            disabled={!concept.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Explanation...
              </>
            ) : (
              'Generate Explanation'
            )}
          </Button>
        </CardContent>
      </Card>

      {explanation && (
        <Card>
          <CardHeader>
            <CardTitle>Explanation</CardTitle>
            <CardDescription>
              {EXPLANATION_MODES.find(m => m.value === selectedMode)?.label} Mode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap">{explanation}</div>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t">
              {!ttsSupported ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <VolumeX className="h-4 w-4" />
                  <span>Text-to-Speech is not supported in your browser</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {!isPlaying ? (
                      <Button
                        onClick={handleSpeak}
                        variant="outline"
                        className="flex-1"
                      >
                        <Volume2 className="mr-2 h-4 w-4" />
                        Listen to Explanation
                      </Button>
                    ) : (
                      <>
                        {isPaused ? (
                          <Button
                            onClick={handleResume}
                            size="icon"
                            variant="outline"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={handlePause}
                            size="icon"
                            variant="outline"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={handleStop}
                          variant="outline"
                          className="flex-1"
                        >
                          Stop
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Playback Speed</span>
                      <span className="font-medium">{playbackSpeed.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[playbackSpeed]}
                      onValueChange={(v) => setPlaybackSpeed(v[0])}
                      min={0.5}
                      max={2.0}
                        step={0.25}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
