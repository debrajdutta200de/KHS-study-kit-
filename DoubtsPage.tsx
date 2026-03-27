import { SchoolBackground } from '@/components/ui/school-background';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doubtApi, subjectApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import type { Subject, Doubt } from '@/types';

export default function DoubtsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      subjectApi.getSubjects(user.id),
      doubtApi.getDoubts(user.id)
    ]).then(([subjectsData, doubtsData]) => {
      setSubjects(subjectsData);
      setDoubts(doubtsData);
    });
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedDoubt?.conversation]);

  const handleCreateDoubt = async () => {
    if (!newQuestion.trim() || !user) return;

    setLoading(true);
    try {
      const doubt = await doubtApi.createDoubt(
        user.id,
        newQuestion.trim(),
        selectedSubject || undefined
      );

      // Get AI response
      const { data, error } = await supabase.functions.invoke('ai-explain', {
        body: {
          concept: newQuestion.trim(),
          mode: 'exam_focused',
          userProfile: {
            class_level: profile?.class_level,
            board: profile?.board
          }
        }
      });

      if (error) throw error;

      const conversation = [
        { role: 'user', content: newQuestion.trim() },
        { role: 'assistant', content: data.explanation }
      ];

      await doubtApi.updateDoubt(doubt.id, {
        answer: data.explanation,
        conversation: conversation
      });

      setDoubts([{ ...doubt, answer: data.explanation, conversation }, ...doubts]);
      setSelectedDoubt({ ...doubt, answer: data.explanation, conversation });
      setNewQuestion('');

      toast({
        title: 'Doubt Answered! 💡',
        description: 'Your question has been answered'
      });

    } catch (error) {
      console.error('Doubt creation error:', error);
      toast({
        title: 'Failed to Create Doubt',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedDoubt || !user) return;

    setLoading(true);
    try {
      const updatedConversation = [
        ...selectedDoubt.conversation,
        { role: 'user', content: message.trim() }
      ];

      // Get AI response
      const conversationHistory = updatedConversation.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const { data, error } = await supabase.functions.invoke('ai-explain', {
        body: {
          concept: message.trim(),
          mode: 'exam_focused',
          context: selectedDoubt.question,
          userProfile: {
            class_level: profile?.class_level,
            board: profile?.board
          }
        }
      });

      if (error) throw error;

      updatedConversation.push({ role: 'assistant', content: data.explanation });

      await doubtApi.updateDoubt(selectedDoubt.id, {
        conversation: updatedConversation
      });

      setSelectedDoubt({ ...selectedDoubt, conversation: updatedConversation });
      setDoubts(doubts.map(d => d.id === selectedDoubt.id ? { ...d, conversation: updatedConversation } : d));
      setMessage('');

    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: 'Failed to Send Message',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResolved = async (doubtId: string) => {
    try {
      await doubtApi.updateDoubt(doubtId, { resolved: true });
      setDoubts(doubts.map(d => d.id === doubtId ? { ...d, resolved: true } : d));
      toast({
        title: 'Doubt Resolved! ✅',
        description: 'Great job understanding the concept'
      });
    } catch (error) {
      console.error('Mark resolved error:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Doubts List */}
      <div className="w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ask a Doubt</CardTitle>
            <CardDescription>Get instant answers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Your Question</Label>
              <Input
                id="question"
                placeholder="What's your doubt?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateDoubt()}
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
              onClick={handleCreateDoubt}
              disabled={!newQuestion.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asking...
                </>
              ) : (
                'Ask Doubt'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Doubts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 p-4">
                {doubts.map((doubt) => (
                  <div
                    key={doubt.id}
                    onClick={() => setSelectedDoubt(doubt)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDoubt?.id === doubt.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <p className="font-medium text-sm line-clamp-2">{doubt.question}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(doubt.created_at).toLocaleDateString()}
                      </span>
                      {doubt.resolved && (
                        <Badge variant="outline" className="text-xs">Resolved</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedDoubt ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedDoubt.question}</CardTitle>
                  <CardDescription>
                    {new Date(selectedDoubt.created_at).toLocaleString()}
                  </CardDescription>
                </div>
                {!selectedDoubt.resolved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkResolved(selectedDoubt.id)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark Resolved
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {selectedDoubt.conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a follow-up question..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || loading}
                    size="icon"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Select a doubt to view the conversation</p>
              <p className="text-sm mt-2">or ask a new question</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
