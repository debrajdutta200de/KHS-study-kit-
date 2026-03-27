import ReviewsSection from '@/components/sections/ReviewsSection';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Reviews Content */}
      <ReviewsSection />

      {/* Call to Action */}
      <div className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h3 className="text-3xl font-bold">
            Ready to Join Them?
          </h3>
          <p className="text-muted-foreground text-lg">
            Start your journey to academic excellence with Kotalpur High School Study Kit
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/study-plan">
              <Button size="lg" className="gap-2">
                Generate Study Plan
              </Button>
            </Link>
            <Link to="/quiz">
              <Button size="lg" variant="outline" className="gap-2">
                Take a Quiz
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
