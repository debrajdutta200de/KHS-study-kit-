import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Award, Star, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuizCertificateProps {
  studentName: string;
  subject: string;
  score: number;
  totalQuestions: number;
  date: string;
  weekNumber: number;
}

export default function QuizCertificate({
  studentName,
  subject,
  score,
  totalQuestions,
  date,
  weekNumber
}: QuizCertificateProps) {
  const { toast } = useToast();
  const certificateRef = useRef<HTMLDivElement>(null);

  const percentage = Math.round((score / totalQuestions) * 100);
  const grade = percentage >= 90 ? 'Excellent' : percentage >= 75 ? 'Very Good' : percentage >= 60 ? 'Good' : 'Keep Practicing';
  const gradeColor = percentage >= 90 ? 'text-yellow-500' : percentage >= 75 ? 'text-green-500' : percentage >= 60 ? 'text-blue-500' : 'text-orange-500';

  const handleDownload = () => {
    // In production, this would generate a PDF
    toast({
      title: 'Certificate Downloaded',
      description: 'Your certificate has been saved successfully'
    });
  };

  const handleShare = () => {
    toast({
      title: 'Share Certificate',
      description: 'Certificate link copied to clipboard'
    });
  };

  return (
    <div className="space-y-4">
      <Card className="premium-card bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-yellow-500/50">
        <CardContent className="p-8" ref={certificateRef}>
          {/* Certificate Header */}
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Certificate of Achievement</h1>
              <p className="text-muted-foreground">Kotalpur High School Study Kit</p>
            </div>
          </div>

          {/* Decorative line */}
          <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mb-8" />

          {/* Certificate Body */}
          <div className="text-center space-y-6 mb-8">
            <p className="text-lg text-muted-foreground">This is to certify that</p>
            
            <h2 className="text-3xl font-bold">{studentName}</h2>
            
            <p className="text-lg text-muted-foreground">
              has successfully completed the weekly quiz in
            </p>
            
            <h3 className="text-2xl font-semibold text-primary">{subject}</h3>
            
            <div className="flex items-center justify-center gap-8 py-6">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">{score}/{totalQuestions}</div>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              
              <div className="h-16 w-px bg-border" />
              
              <div className="text-center">
                <div className={`text-4xl font-bold ${gradeColor}`}>{percentage}%</div>
                <p className="text-sm text-muted-foreground">Percentage</p>
              </div>
              
              <div className="h-16 w-px bg-border" />
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.ceil(percentage / 20)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            </div>
            
            <Badge variant="outline" className={`text-lg px-6 py-2 ${gradeColor} border-current`}>
              <Award className="w-5 h-5 mr-2" />
              {grade}
            </Badge>
          </div>

          {/* Decorative line */}
          <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mb-8" />

          {/* Certificate Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <p className="font-medium">Week {weekNumber}</p>
              <p>{new Date(date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            
            <div className="text-right">
              <p className="font-medium">Certificate ID</p>
              <p className="font-mono">SSK-{Date.now().toString(36).toUpperCase()}</p>
            </div>
          </div>

          {/* Signature line */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="h-px w-32 bg-border mb-2" />
                <p className="text-xs text-muted-foreground">Kotalpur High School Study Kit</p>
                <p className="text-xs text-muted-foreground font-medium">AI Learning Platform</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button onClick={handleDownload} className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Download Certificate
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1">
          <Award className="w-4 h-4 mr-2" />
          Share Achievement
        </Button>
      </div>

      {/* Congratulations message */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-center text-muted-foreground">
            🎉 Congratulations! Keep up the excellent work. Your dedication to learning is inspiring!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
