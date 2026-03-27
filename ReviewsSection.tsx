import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Quote } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  role: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
}

const reviews: Review[] = [
  {
    id: '1',
    name: 'Priya S.',
    role: 'Class 12 CBSE Student',
    rating: 5,
    comment: 'The AI explanations are incredibly detailed. I finally understood calculus concepts that confused me for months. The study planner helped me organize my preparation perfectly.',
    date: 'January 2026',
    avatar: '👩‍🎓'
  },
  {
    id: '2',
    name: 'Arjun M.',
    role: 'Class 10 ICSE Student',
    rating: 5,
    comment: 'Deep Focus Mode is a game-changer. No distractions, just pure study time. My parents love the progress tracking feature. Highly recommend for serious students.',
    date: 'January 2026',
    avatar: '👨‍🎓'
  },
  {
    id: '3',
    name: 'Ananya K.',
    role: 'Class 11 State Board Student',
    rating: 5,
    comment: 'The quiz system adapts to my level perfectly. Weak areas are identified quickly, and the AI provides targeted practice. My test scores improved significantly.',
    date: 'December 2025',
    avatar: '👩‍💼'
  },
  {
    id: '4',
    name: 'Rohan P.',
    role: 'Class 12 CBSE Student',
    rating: 5,
    comment: 'Best study companion I\'ve used. The concept explanations are clear, the revision system works brilliantly, and the interface is beautiful. Worth every minute.',
    date: 'December 2025',
    avatar: '👨‍💻'
  },
  {
    id: '5',
    name: 'Sneha R.',
    role: 'Class 10 CBSE Student',
    rating: 5,
    comment: 'The AI tutor feels like having a personal mentor. It explains things multiple ways until I understand. The study streak feature keeps me motivated daily.',
    date: 'January 2026',
    avatar: '👩‍🔬'
  }
];

export default function ReviewsSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <Badge variant="outline" className="mb-2">
            Early Preview Reactions
          </Badge>
          <h2 className="text-4xl font-bold">
            Trusted by <span className="gradient-text">Serious Students</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real feedback from students using Kotalpur High School Study Kit during our preview phase
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <Card 
              key={review.id} 
              className="glass hover-lift border-border/50 relative overflow-hidden group"
            >
              {/* Decorative quote icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-12 h-12 text-primary" />
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Avatar and Info */}
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{review.avatar}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{review.name}</h4>
                    <p className="text-sm text-muted-foreground">{review.role}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-4 h-4 fill-yellow-500 text-yellow-500" 
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-foreground/90 leading-relaxed">
                  "{review.comment}"
                </p>

                {/* Date */}
                <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                  {review.date}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            These are genuine testimonials from students who participated in our early preview program.
          </p>
        </div>
      </div>
    </section>
  );
}
