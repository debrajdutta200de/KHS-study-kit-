import { SchoolBackground } from '@/components/ui/school-background';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { flashcardApi, subjectApi } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, RotateCcw, Check, X } from 'lucide-react';
import type { Subject, Flashcard } from '@/types';

export default function FlashcardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Create flashcard state
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadFlashcards();
  }, [user]);

  const loadFlashcards = async () => {
    if (!user) return;
    const [subjectsData, flashcardsData, dueData] = await Promise.all([
      subjectApi.getSubjects(user.id),
      flashcardApi.getFlashcards(user.id),
      flashcardApi.getDueFlashcards(user.id)
    ]);
    setSubjects(subjectsData);
    setFlashcards(flashcardsData);
    setDueFlashcards(dueData);
  };

  const handleCreateFlashcard = async () => {
    if (!frontText.trim() || !backText.trim() || !user) return;

    try {
      const today = new Date();
      const nextReview = new Date(today);
      nextReview.setDate(today.getDate() + 1);

      await flashcardApi.createFlashcard({
        user_id: user.id,
        subject_id: selectedSubject || null,
        front_text: frontText.trim(),
        back_text: backText.trim(),
        next_review_date: nextReview.toISOString().split('T')[0],
        review_count: 0,
        difficulty: 0
      });

      setFrontText('');
      setBackText('');
      setSelectedSubject('');
      setDialogOpen(false);
      loadFlashcards();

      toast({
        title: 'Flashcard Created! 📝',
        description: 'Added to your collection'
      });

    } catch (error) {
      console.error('Create flashcard error:', error);
      toast({
        title: 'Failed to Create Flashcard',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const startReview = () => {
    if (dueFlashcards.length === 0) {
      toast({
        title: 'No Cards Due',
        description: 'All caught up! Come back tomorrow.',
      });
      return;
    }
    setCurrentCard(dueFlashcards[0]);
    setShowAnswer(false);
    setReviewMode(true);
  };

  const handleReview = async (difficulty: number) => {
    if (!currentCard) return;

    try {
      const today = new Date();
      const nextReview = new Date(today);
      
      // Spaced repetition algorithm
      const intervals = [1, 3, 7, 14, 30];
      const intervalIndex = Math.min(currentCard.review_count, intervals.length - 1);
      const daysToAdd = intervals[intervalIndex] * (difficulty === 0 ? 0.5 : difficulty === 1 ? 1 : 1.5);
      nextReview.setDate(today.getDate() + Math.ceil(daysToAdd));

      await flashcardApi.updateFlashcard(currentCard.id, {
        review_count: currentCard.review_count + 1,
        difficulty: difficulty,
        next_review_date: nextReview.toISOString().split('T')[0]
      });

      const remainingCards = dueFlashcards.filter(c => c.id !== currentCard.id);
      setDueFlashcards(remainingCards);

      if (remainingCards.length > 0) {
        setCurrentCard(remainingCards[0]);
        setShowAnswer(false);
      } else {
        setReviewMode(false);
        setCurrentCard(null);
        toast({
          title: 'Review Complete! 🎉',
          description: 'Great job! Come back tomorrow for more.'
        });
        loadFlashcards();
      }

    } catch (error) {
      console.error('Review error:', error);
    }
  };

  if (reviewMode && currentCard) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Flashcard Review</h1>
            <p className="text-muted-foreground">
              {dueFlashcards.length} cards remaining
            </p>
          </div>
          <Button variant="outline" onClick={() => setReviewMode(false)}>
            Exit Review
          </Button>
        </div>

        <Card className="min-h-[400px] flex flex-col justify-center items-center p-8 cursor-pointer" onClick={() => setShowAnswer(!showAnswer)}>
          <CardContent className="text-center space-y-6">
            <Badge>{showAnswer ? 'Answer' : 'Question'}</Badge>
            <p className="text-2xl font-medium">
              {showAnswer ? currentCard.back_text : currentCard.front_text}
            </p>
            {!showAnswer && (
              <p className="text-sm text-muted-foreground">Click to reveal answer</p>
            )}
          </CardContent>
        </Card>

        {showAnswer && (
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20"
              onClick={() => handleReview(0)}
            >
              <div className="text-center">
                <X className="h-6 w-6 mx-auto mb-2 text-destructive" />
                <p className="text-sm">Hard</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20"
              onClick={() => handleReview(1)}
            >
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-warning" />
                <p className="text-sm">Good</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20"
              onClick={() => handleReview(2)}
            >
              <div className="text-center">
                <Check className="h-6 w-6 mx-auto mb-2 text-secondary" />
                <p className="text-sm">Easy</p>
              </div>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Flashcards</h1>
          <p className="text-muted-foreground">
            Spaced repetition for better retention
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Flashcard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Flashcard</DialogTitle>
              <DialogDescription>
                Add a new flashcard to your collection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="front">Front (Question)</Label>
                <Textarea
                  id="front"
                  placeholder="Enter the question or term..."
                  value={frontText}
                  onChange={(e) => setFrontText(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="back">Back (Answer)</Label>
                <Textarea
                  id="back"
                  placeholder="Enter the answer or definition..."
                  value={backText}
                  onChange={(e) => setBackText(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateFlashcard}
                disabled={!frontText.trim() || !backText.trim()}
                className="w-full"
              >
                Create Flashcard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Due for Review</CardTitle>
            <CardDescription>
              {dueFlashcards.length} cards ready to review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dueFlashcards.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No cards due today. Great job! 🎉
              </p>
            ) : (
              <Button onClick={startReview} className="w-full">
                Start Review ({dueFlashcards.length} cards)
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Flashcards</CardTitle>
            <CardDescription>
              {flashcards.length} cards in your collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold gradient-text">
              {flashcards.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Flashcards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flashcards.map((card) => (
              <Card key={card.id} className="hover:shadow-hover transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm line-clamp-2">{card.front_text}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{card.back_text}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">
                      Reviewed {card.review_count}x
                    </Badge>
                    {card.next_review_date && (
                      <span className="text-xs text-muted-foreground">
                        Next: {new Date(card.next_review_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
