export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  title?: string;
}

export type UserRole = 'user' | 'admin';
export type LearningPace = 'slow' | 'normal' | 'fast';
export type LearningStyle = 'visual' | 'text' | 'mixed';
export type BoardType = 'CBSE' | 'ICSE' | 'State';
export type ExplanationMode = 'beginner' | 'exam_focused' | 'advanced' | 'rapid_revision';
export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'numerical';

export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  role: UserRole;
  class_level: string | null;
  board: BoardType | null;
  exam_date: string | null;
  learning_pace: LearningPace;
  learning_style: LearningStyle;
  daily_study_time: number;
  streak_count: number;
  last_study_date: string | null;
  total_points: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  is_weak: boolean;
  created_at: string;
}

export interface TextbookUpload {
  id: string;
  user_id: string;
  subject_id: string | null;
  image_url: string;
  extracted_text: string | null;
  detected_concepts: string[] | null;
  chapter_name: string | null;
  created_at: string;
}

export interface Explanation {
  id: string;
  user_id: string;
  upload_id: string | null;
  concept: string;
  mode: ExplanationMode;
  explanation_text: string;
  audio_url: string | null;
  created_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  difficulty_level: number;
  total_questions: number;
  score: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: QuestionType;
  question_text: string;
  options: Record<string, string> | null;
  correct_answer: string;
  user_answer: string | null;
  is_correct: boolean | null;
  explanation: string | null;
  created_at: string;
}

export interface Doubt {
  id: string;
  user_id: string;
  subject_id: string | null;
  question: string;
  answer: string | null;
  conversation: Array<{ role: string; content: string }>;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id: string | null;
  front_text: string;
  back_text: string;
  next_review_date: string | null;
  review_count: number;
  difficulty: number;
  created_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  plan_data: {
    daily_schedule: Array<{
      date: string;
      subjects: Array<{
        subject: string;
        duration: number;
        topics: string[];
      }>;
    }>;
    revision_cycles: Array<{
      date: string;
      topics: string[];
    }>;
    tips?: string[];
  };
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface PerformanceAnalytics {
  id: string;
  user_id: string;
  subject_id: string | null;
  chapter_name: string | null;
  accuracy_rate: number;
  common_mistakes: string[] | null;
  weakness_type: string | null;
  improvement_trend: number;
  last_updated: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_name: string;
  badge_description: string | null;
  earned_at: string;
}
