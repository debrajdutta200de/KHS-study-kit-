import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Gamepad2, 
  Zap, 
  Target, 
  Trophy, 
  Clock, 
  Brain,
  Sparkles,
  Play,
  ArrowRight
} from 'lucide-react';

interface Game {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  color: string;
}

const GAMES: Game[] = [
  {
    id: 'quiz-battle',
    title: 'Quiz Battle ⚔️',
    description: 'Challenge yourself with rapid-fire MCQs. Beat the clock and climb the leaderboard.',
    icon: <Zap className="w-6 h-6" />,
    duration: '5-10 min',
    difficulty: 'Medium',
    category: 'Speed & Accuracy',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'concept-match',
    title: 'Concept Match 🎯',
    description: 'Match concepts with definitions. Perfect for memorization and quick recall.',
    icon: <Target className="w-6 h-6" />,
    duration: '5 min',
    difficulty: 'Easy',
    category: 'Memory & Recall',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'formula-race',
    title: 'Formula Race 🏎️',
    description: 'Solve formula-based problems as fast as you can. Math and Physics mastery.',
    icon: <Sparkles className="w-6 h-6" />,
    duration: '10 min',
    difficulty: 'Hard',
    category: 'Problem Solving',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'time-attack',
    title: 'Time Attack ⏱️',
    description: 'Answer as many questions as possible in 60 seconds. Pure adrenaline.',
    icon: <Clock className="w-6 h-6" />,
    duration: '1 min',
    difficulty: 'Medium',
    category: 'Speed Challenge',
    color: 'from-red-500 to-rose-500'
  },
  {
    id: 'ai-challenge',
    title: 'AI vs You 🤖',
    description: 'Compete against SKY 2.0 AI. Can you outsmart the machine?',
    icon: <Brain className="w-6 h-6" />,
    duration: '10 min',
    difficulty: 'Hard',
    category: 'Strategic Thinking',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'concept-builder',
    title: 'Concept Builder 🏗️',
    description: 'Build knowledge step-by-step. Connect concepts to form complete understanding.',
    icon: <Trophy className="w-6 h-6" />,
    duration: '15 min',
    difficulty: 'Medium',
    category: 'Deep Learning',
    color: 'from-indigo-500 to-purple-500'
  }
];

export default function LearnAndPlay() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const handlePlayGame = (gameId: string) => {
    setSelectedGame(gameId);
    toast({
      title: 'Game Starting Soon! 🎮',
      description: 'This feature is being built. Stay tuned!'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-500/10 text-green-500 border-green-500/50';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50';
      case 'Hard':
        return 'bg-red-500/10 text-red-500 border-red-500/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-6 border border-border/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="w-8 h-8 text-purple-500" />
            <h1 className="text-4xl font-bold gradient-text">Learn & Play 🎮</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Master concepts through engaging games. Every game builds real skills.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Games Played</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Gamepad2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Win Streak</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <Card 
            key={game.id} 
            className="premium-card hover-lift group cursor-pointer transition-all"
            onClick={() => handlePlayGame(game.id)}
          >
            <CardHeader>
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} mb-4 group-hover:scale-110 transition-transform`}>
                <div className="text-white">
                  {game.icon}
                </div>
              </div>
              <CardTitle className="text-xl">{game.title}</CardTitle>
              <CardDescription className="text-base">
                {game.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Game info */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getDifficultyColor(game.difficulty)}>
                  {game.difficulty}
                </Badge>
                <Badge variant="outline" className="border-border">
                  <Clock className="w-3 h-3 mr-1" />
                  {game.duration}
                </Badge>
              </div>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  {game.category}
                </p>
                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Play Now
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon Banner */}
      <Card className="premium-card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/50">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-500" />
          <h3 className="text-2xl font-bold mb-2">More Games Coming Soon!</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're building more engaging, concept-based games to make learning fun and effective. 
            Every game is designed to reinforce real knowledge, not just entertainment.
          </p>
        </CardContent>
      </Card>

      {/* Game Rules */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle>Game Rules & Philosophy</CardTitle>
          <CardDescription>
            How Learn & Play works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex-shrink-0">
                ✓
              </div>
              <div>
                <p className="font-medium">Concept-Based Learning</p>
                <p className="text-sm text-muted-foreground">
                  Every game is built around real concepts from your syllabus
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex-shrink-0">
                ✓
              </div>
              <div>
                <p className="font-medium">Skill Building</p>
                <p className="text-sm text-muted-foreground">
                  Improve speed, accuracy, problem-solving, and critical thinking
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex-shrink-0">
                ✓
              </div>
              <div>
                <p className="font-medium">Short Sessions</p>
                <p className="text-sm text-muted-foreground">
                  5-15 minute games that fit into your study breaks
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex-shrink-0">
                ✗
              </div>
              <div>
                <p className="font-medium">No Useless Games</p>
                <p className="text-sm text-muted-foreground">
                  We don't include arcade games or distractions. Every game has educational value.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
