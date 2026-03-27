-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create learning pace enum
CREATE TYPE learning_pace AS ENUM ('slow', 'normal', 'fast');

-- Create learning style enum
CREATE TYPE learning_style AS ENUM ('visual', 'text', 'mixed');

-- Create board type enum
CREATE TYPE board_type AS ENUM ('CBSE', 'ICSE', 'State');

-- Create explanation mode enum
CREATE TYPE explanation_mode AS ENUM ('beginner', 'exam_focused', 'advanced', 'rapid_revision');

-- Create question type enum
CREATE TYPE question_type AS ENUM ('mcq', 'short_answer', 'long_answer', 'numerical');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  role user_role NOT NULL DEFAULT 'user',
  class_level TEXT,
  board board_type,
  exam_date DATE,
  learning_pace learning_pace DEFAULT 'normal',
  learning_style learning_style DEFAULT 'mixed',
  daily_study_time INTEGER DEFAULT 120,
  streak_count INTEGER DEFAULT 0,
  last_study_date DATE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_weak BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create textbook_uploads table
CREATE TABLE textbook_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  extracted_text TEXT,
  detected_concepts TEXT[],
  chapter_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create explanations table
CREATE TABLE explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES textbook_uploads(id) ON DELETE SET NULL,
  concept TEXT NOT NULL,
  mode explanation_mode NOT NULL,
  explanation_text TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1,
  total_questions INTEGER DEFAULT 0,
  score INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_questions table
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_type question_type NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create doubts table
CREATE TABLE doubts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT,
  conversation JSONB DEFAULT '[]'::jsonb,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  next_review_date DATE,
  review_count INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create study_plans table
CREATE TABLE study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance_analytics table
CREATE TABLE performance_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_name TEXT,
  accuracy_rate DECIMAL(5,2),
  common_mistakes TEXT[],
  weakness_type TEXT,
  improvement_trend DECIMAL(5,2),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Extract username from email (remove @miaoda.com)
  extracted_username := REPLACE(NEW.email, '@miaoda.com', '');
  
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    NEW.id,
    extracted_username,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'user'::user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- RLS Policies for subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subjects" ON subjects
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for textbook_uploads
ALTER TABLE textbook_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own uploads" ON textbook_uploads
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for explanations
ALTER TABLE explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own explanations" ON explanations
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quizzes" ON quizzes
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for quiz_questions
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quiz questions" ON quiz_questions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid())
  );

-- RLS Policies for doubts
ALTER TABLE doubts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own doubts" ON doubts
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own flashcards" ON flashcards
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for study_plans
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own study plans" ON study_plans
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for performance_analytics
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own analytics" ON performance_analytics
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_textbook_uploads_user_id ON textbook_uploads(user_id);
CREATE INDEX idx_explanations_user_id ON explanations(user_id);
CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_doubts_user_id ON doubts(user_id);
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_next_review ON flashcards(user_id, next_review_date);
CREATE INDEX idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX idx_performance_analytics_user_id ON performance_analytics(user_id);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);