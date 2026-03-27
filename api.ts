import { supabase } from './supabase';
import type { Profile, Subject, TextbookUpload, Explanation, Quiz, QuizQuestion, Doubt, Flashcard, StudyPlan, PerformanceAnalytics, Achievement } from '@/types';

// Profile API
export const profileApi = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStreak(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);
    if (!profile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastStudy = profile.last_study_date;
    
    let newStreak = profile.streak_count;
    if (lastStudy) {
      const lastDate = new Date(lastStudy);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await this.updateProfile(userId, {
      streak_count: newStreak,
      last_study_date: today
    });
  }
};

// Subject API
export const subjectApi = {
  async getSubjects(userId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createSubject(userId: string, name: string, isWeak: boolean = false): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ user_id: userId, name, is_weak: isWeak })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSubject(id: string, updates: Partial<Subject>): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSubject(id: string): Promise<void> {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Textbook Upload API
export const uploadApi = {
  async getUploads(userId: string): Promise<TextbookUpload[]> {
    const { data, error } = await supabase
      .from('textbook_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createUpload(userId: string, imageUrl: string, subjectId?: string): Promise<TextbookUpload> {
    const { data, error } = await supabase
      .from('textbook_uploads')
      .insert({ 
        user_id: userId, 
        image_url: imageUrl,
        subject_id: subjectId || null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateUpload(id: string, updates: Partial<TextbookUpload>): Promise<TextbookUpload> {
    const { data, error } = await supabase
      .from('textbook_uploads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Explanation API
export const explanationApi = {
  async getExplanations(userId: string): Promise<Explanation[]> {
    const { data, error } = await supabase
      .from('explanations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createExplanation(explanation: Omit<Explanation, 'id' | 'created_at'>): Promise<Explanation> {
    const { data, error } = await supabase
      .from('explanations')
      .insert(explanation)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Quiz API
export const quizApi = {
  async getQuizzes(userId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createQuiz(userId: string, title: string, subjectId?: string): Promise<Quiz> {
    const { data, error } = await supabase
      .from('quizzes')
      .insert({ 
        user_id: userId, 
        title,
        subject_id: subjectId || null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    const { data, error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createQuizQuestion(question: Omit<QuizQuestion, 'id' | 'created_at'>): Promise<QuizQuestion> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(question)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateQuizQuestion(id: string, updates: Partial<QuizQuestion>): Promise<QuizQuestion> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Doubt API
export const doubtApi = {
  async getDoubts(userId: string): Promise<Doubt[]> {
    const { data, error } = await supabase
      .from('doubts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createDoubt(userId: string, question: string, subjectId?: string): Promise<Doubt> {
    const { data, error } = await supabase
      .from('doubts')
      .insert({ 
        user_id: userId, 
        question,
        subject_id: subjectId || null,
        conversation: []
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDoubt(id: string, updates: Partial<Doubt>): Promise<Doubt> {
    const { data, error } = await supabase
      .from('doubts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Flashcard API
export const flashcardApi = {
  async getFlashcards(userId: string): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getDueFlashcards(userId: string): Promise<Flashcard[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createFlashcard(flashcard: Omit<Flashcard, 'id' | 'created_at'>): Promise<Flashcard> {
    const { data, error } = await supabase
      .from('flashcards')
      .insert(flashcard)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard> {
    const { data, error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFlashcard(id: string): Promise<void> {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Study Plan API
export const studyPlanApi = {
  async getActivePlan(userId: string): Promise<StudyPlan | null> {
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createPlan(plan: Omit<StudyPlan, 'id' | 'created_at'>): Promise<StudyPlan> {
    const { data, error } = await supabase
      .from('study_plans')
      .insert(plan)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deactivatePlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('study_plans')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  }
};

// Performance Analytics API
export const analyticsApi = {
  async getAnalytics(userId: string): Promise<PerformanceAnalytics[]> {
    const { data, error } = await supabase
      .from('performance_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async upsertAnalytics(analytics: Omit<PerformanceAnalytics, 'id'>): Promise<PerformanceAnalytics> {
    const { data, error } = await supabase
      .from('performance_analytics')
      .upsert(analytics)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Achievement API
export const achievementApi = {
  async getAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createAchievement(userId: string, badgeName: string, description: string): Promise<Achievement> {
    const { data, error } = await supabase
      .from('achievements')
      .insert({ 
        user_id: userId, 
        badge_name: badgeName,
        badge_description: description
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
