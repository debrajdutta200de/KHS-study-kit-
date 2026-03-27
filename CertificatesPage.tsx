import { SchoolBackground } from '@/components/ui/school-background';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Trophy, Star, Calendar, TrendingUp, Download } from 'lucide-react';
import QuizCertificate from '@/components/QuizCertificate';

interface Certificate {
  id: string;
  studentName: string;
  subject: string;
  score: number;
  totalQuestions: number;
  date: string;
  weekNumber: number;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    // Load certificates from localStorage
    const savedCertificates = localStorage.getItem('quizCertificates');
    if (savedCertificates) {
      setCertificates(JSON.parse(savedCertificates));
    }
  }, []);

  const totalCertificates = certificates.length;
  const excellentCount = certificates.filter(c => (c.score / c.totalQuestions) >= 0.9).length;
  const averageScore = certificates.length > 0
    ? Math.round(certificates.reduce((sum, c) => sum + (c.score / c.totalQuestions) * 100, 0) / certificates.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-6 border border-border/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold gradient-text">My Certificates</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Your achievements and weekly quiz certificates
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Certificates</p>
                <p className="text-3xl font-bold">{totalCertificates}</p>
              </div>
              <Award className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Excellent Grades</p>
                <p className="text-3xl font-bold">{excellentCount}</p>
              </div>
              <Star className="w-10 h-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold">{averageScore}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">
            <Award className="w-4 h-4 mr-2" />
            All Certificates
          </TabsTrigger>
          <TabsTrigger value="view">
            <Trophy className="w-4 h-4 mr-2" />
            View Certificate
          </TabsTrigger>
        </TabsList>

        {/* All certificates list */}
        <TabsContent value="all" className="space-y-4 mt-6">
          {certificates.length === 0 ? (
            <Card className="premium-card">
              <CardContent className="empty-state py-16">
                <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Complete weekly quizzes to earn certificates. Each week, you'll receive a certificate for your achievements!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => {
                const percentage = Math.round((cert.score / cert.totalQuestions) * 100);
                const grade = percentage >= 90 ? 'Excellent' : percentage >= 75 ? 'Very Good' : percentage >= 60 ? 'Good' : 'Keep Practicing';
                const gradeColor = percentage >= 90 ? 'border-yellow-500 bg-yellow-500/10' : percentage >= 75 ? 'border-green-500 bg-green-500/10' : percentage >= 60 ? 'border-blue-500 bg-blue-500/10' : 'border-orange-500 bg-orange-500/10';

                return (
                  <Card key={cert.id} className={`premium-card hover-lift cursor-pointer ${gradeColor}`} onClick={() => setSelectedCertificate(cert)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{cert.subject}</CardTitle>
                          <CardDescription>Week {cert.weekNumber}</CardDescription>
                        </div>
                        <Trophy className="w-8 h-8 text-yellow-500" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">{cert.score}/{cert.totalQuestions}</p>
                          <p className="text-sm text-muted-foreground">Score</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{percentage}%</p>
                          <p className="text-sm text-muted-foreground">Percentage</p>
                        </div>
                      </div>

                      <Badge variant="outline" className="w-full justify-center py-2">
                        <Award className="w-4 h-4 mr-2" />
                        {grade}
                      </Badge>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(cert.date).toLocaleDateString()}
                        </div>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCertificate(cert);
                        }}>
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* View certificate */}
        <TabsContent value="view" className="mt-6">
          {selectedCertificate ? (
            <QuizCertificate
              studentName={selectedCertificate.studentName}
              subject={selectedCertificate.subject}
              score={selectedCertificate.score}
              totalQuestions={selectedCertificate.totalQuestions}
              date={selectedCertificate.date}
              weekNumber={selectedCertificate.weekNumber}
            />
          ) : (
            <Card className="premium-card">
              <CardContent className="empty-state py-16">
                <Award className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Certificate Selected</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Select a certificate from the "All Certificates" tab to view it here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
