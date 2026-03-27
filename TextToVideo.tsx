import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { generateTextToVideoScript } from '@/services/aiEngine';
import { 
  Video, Loader2, Download, Play, Pause, Volume2, VolumeX,
  Wand2, Sparkles, Film, Music, Mic, Settings, CheckCircle2, Maximize
} from 'lucide-react';

interface VideoStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  accent: string;
}

const VIDEO_STYLES: VideoStyle[] = [
  {
    id: 'animated',
    name: 'Animated Explainer',
    description: 'Colorful animations with characters and graphics',
    icon: '🎨'
  },
  {
    id: 'whiteboard',
    name: 'Whiteboard Animation',
    description: 'Hand-drawn style with sketches and diagrams',
    icon: '✏️'
  },
  {
    id: 'presentation',
    name: 'Presentation Style',
    description: 'Professional slides with bullet points',
    icon: '📊'
  },
  {
    id: 'cinematic',
    name: 'Cinematic Story',
    description: 'Movie-style storytelling with scenes',
    icon: '🎬'
  },
  {
    id: 'documentary',
    name: 'Documentary',
    description: 'Educational documentary format',
    icon: '📽️'
  }
];

const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'female-us', name: 'Sarah', gender: 'Female', accent: 'US English' },
  { id: 'male-us', name: 'David', gender: 'Male', accent: 'US English' },
  { id: 'female-uk', name: 'Emma', gender: 'Female', accent: 'British English' },
  { id: 'male-uk', name: 'James', gender: 'Male', accent: 'British English' },
  { id: 'female-in', name: 'Priya', gender: 'Female', accent: 'Indian English' },
  { id: 'male-in', name: 'Raj', gender: 'Male', accent: 'Indian English' }
];

const BACKGROUND_MUSIC = [
  { id: 'none', name: 'No Music' },
  { id: 'upbeat', name: 'Upbeat & Energetic' },
  { id: 'calm', name: 'Calm & Focused' },
  { id: 'inspiring', name: 'Inspiring & Motivational' },
  { id: 'classical', name: 'Classical Study Music' }
];

export default function TextToVideo() {
  const { toast } = useToast();

  // State
  const [text, setText] = useState('');
  const [videoStyle, setVideoStyle] = useState('animated');
  const [voice, setVoice] = useState('female-us');
  const [backgroundMusic, setBackgroundMusic] = useState('calm');
  const [musicVolume, setMusicVolume] = useState(30);
  const [voiceSpeed, setVoiceSpeed] = useState(100);
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [autoHighlight, setAutoHighlight] = useState(true);
  
  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoScript, setVideoScript] = useState<any>(null);

  // Preview state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Validate input
  const canGenerate = text.trim().length >= 50 && text.trim().length <= 5000;

  // Generate video using OpenAI
  const handleGenerateVideo = async () => {
    if (!canGenerate) {
      toast({
        title: 'Invalid Text Length',
        description: 'Text must be between 50 and 5000 characters',
        variant: 'destructive'
      });
      return;
    }

    setGenerating(true);
    setProgress(0);
    setVideoGenerated(false);
    setVideoUrl('');
    setVideoScript(null);

    try {
      // Step 1: Analyzing text
      setCurrentStep('Analyzing text content with AI...');
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Generate script with OpenAI
      setCurrentStep('Generating video script with ChatGPT...');
      setProgress(25);
      
      const scriptResult = await generateTextToVideoScript({
        text: text.trim(),
        videoStyle,
        voice,
        includeSubtitles,
        autoHighlight
      });
      
      setVideoScript(scriptResult.script);
      setProgress(50);

      // Step 3: Creating visual elements
      setCurrentStep('Creating visual elements...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(65);

      // Step 4: Synthesizing voice-over
      setCurrentStep('Synthesizing voice-over...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(80);

      // Step 5: Adding background music
      if (backgroundMusic !== 'none') {
        setCurrentStep('Adding background music...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      setProgress(90);

      // Step 6: Finalizing video
      setCurrentStep('Finalizing video...');
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(100);

      // Set video URL
      setVideoUrl(scriptResult.videoUrl);
      setVideoGenerated(true);

      toast({
        title: '🎉 Video Generated!',
        description: `Your video is ready with ${scriptResult.script.scenes.length} scenes`
      });

    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate video. Please check your OpenAI API key.',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
      setCurrentStep('');
    }
  };

  // Video player controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Download video
  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = 'educational-video.mp4';
      link.click();
      
      toast({
        title: 'Download Started',
        description: 'Your video is being downloaded...'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="premium-card bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Video className="w-8 h-8 text-blue-500" />
            <h2 className="text-3xl font-bold gradient-text">Text to Video Converter</h2>
          </div>
          <p className="text-muted-foreground">
            Transform your study notes into engaging video explanations with AI-powered visuals and voice-over
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Input & Settings */}
        <div className="space-y-6">
          {/* Text Input */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Your Text Content
              </CardTitle>
              <CardDescription>
                Enter your study notes, concept explanation, or any educational content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-input">Text Content</Label>
                <Textarea
                  id="text-input"
                  placeholder="Enter your text here... (50-5000 characters)&#10;&#10;Example:&#10;Photosynthesis is the process by which plants convert light energy into chemical energy. It occurs in the chloroplasts of plant cells, where chlorophyll captures sunlight. The process involves two main stages: light-dependent reactions and the Calvin cycle..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[300px] focus-ring font-mono text-sm"
                  maxLength={5000}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className={text.length < 50 ? 'text-destructive' : 'text-muted-foreground'}>
                    {text.length} / 5000 characters
                  </span>
                  {text.length >= 50 && (
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Style Selection */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="w-5 h-5" />
                Video Style
              </CardTitle>
              <CardDescription>
                Choose the visual style for your video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {VIDEO_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setVideoStyle(style.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      videoStyle === style.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{style.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{style.name}</div>
                        <p className="text-sm text-muted-foreground">{style.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Advanced Settings & Preview */}
        <div className="space-y-6">
          {/* Voice Settings */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Voice-Over Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice-select">Voice</Label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger id="voice-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.gender}, {v.accent})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Voice Speed: {voiceSpeed}%</Label>
                <Slider
                  value={[voiceSpeed]}
                  onValueChange={(v) => setVoiceSpeed(v[0])}
                  min={50}
                  max={150}
                  step={10}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slower</span>
                  <span>Normal</span>
                  <span>Faster</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Background Music */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Background Music
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="music-select">Music Style</Label>
                <Select value={backgroundMusic} onValueChange={setBackgroundMusic}>
                  <SelectTrigger id="music-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKGROUND_MUSIC.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {backgroundMusic !== 'none' && (
                <div className="space-y-2">
                  <Label>Music Volume: {musicVolume}%</Label>
                  <Slider
                    value={[musicVolume]}
                    onValueChange={(v) => setMusicVolume(v[0])}
                    max={100}
                    step={10}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Options */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Additional Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="subtitles">Include Subtitles</Label>
                  <p className="text-sm text-muted-foreground">
                    Add text captions to the video
                  </p>
                </div>
                <Switch
                  id="subtitles"
                  checked={includeSubtitles}
                  onCheckedChange={setIncludeSubtitles}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="highlight">Auto-Highlight Keywords</Label>
                  <p className="text-sm text-muted-foreground">
                    Emphasize important terms visually
                  </p>
                </div>
                <Switch
                  id="highlight"
                  checked={autoHighlight}
                  onCheckedChange={setAutoHighlight}
                />
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateVideo}
            disabled={!canGenerate || generating}
            size="lg"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generation Progress */}
      {generating && (
        <Card className="premium-card animate-scale-in">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium">{currentStep}</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Video Preview & Download */}
      {videoGenerated && (
        <Card className="premium-card animate-scale-in bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Video Generated Successfully!
            </CardTitle>
            <CardDescription>
              Your video is ready to preview and download
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Real Video Player */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-border">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                controls
              >
                Your browser does not support the video tag.
              </video>

              {/* Custom Controls Overlay (optional, video has native controls) */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlay}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>

                  <div className="flex-1" />

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleFullscreen}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Video Script Display */}
            {videoScript && (
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-sm">Generated Video Script</CardTitle>
                  <CardDescription>
                    {videoScript.scenes.length} scenes • {Math.floor(videoScript.totalDuration / 60)}:{(videoScript.totalDuration % 60).toString().padStart(2, '0')} duration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                  {videoScript.scenes.map((scene: any, index: number) => (
                    <div key={index} className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Scene {scene.sceneNumber}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {scene.duration}s
                        </span>
                      </div>
                      <p className="text-sm mb-2">{scene.voiceOver}</p>
                      <p className="text-xs text-muted-foreground italic">
                        Visual: {scene.visualDescription}
                      </p>
                      {scene.keyTerms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {scene.keyTerms.map((term: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Video Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Style</p>
                <p className="font-medium">
                  {VIDEO_STYLES.find(s => s.id === videoStyle)?.name}
                </p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Voice</p>
                <p className="font-medium">
                  {VOICE_OPTIONS.find(v => v.id === voice)?.name}
                </p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {videoScript ? `${Math.floor(videoScript.totalDuration / 60)}:${(videoScript.totalDuration % 60).toString().padStart(2, '0')}` : '~2:30'} min
                </p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Scenes</p>
                <p className="font-medium">{videoScript?.scenes.length || '-'}</p>
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              size="lg"
              className="w-full"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Video (MP4)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="premium-card bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">💡 Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Write clear, concise explanations with proper structure</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Break complex topics into smaller sections for better visuals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use simple language that's easy to understand</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Include examples and analogies for better engagement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Optimal text length: 200-1000 characters for best pacing</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
