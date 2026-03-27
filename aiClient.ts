/**
 * Centralized AI Client Service
 * 
 * This service provides a unified interface for all AI operations in the app.
 * It handles API calls, error handling, and fallback responses.
 * 
 * All AI features (explanations, quiz generation, doubt clearing, study plans)
 * use this client for consistency and maintainability.
 */

import { supabase } from '@/db/supabase';
import type { ExplanationMode, Profile } from '@/types';

// AI API configuration
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;

/**
 * Check if AI service is available
 */
export function isAIAvailable(): boolean {
  // AI is always available through Supabase Edge Functions
  return true;
}

/**
 * Handle AI errors gracefully
 */
function handleAIError(error: unknown, context: string): never {
  console.error(`AI Error in ${context}:`, error);
  
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  // Provide user-friendly error messages
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    throw new Error('Network error. Please check your internet connection and try again.');
  }
  
  if (errorMessage.includes('timeout')) {
    throw new Error('Request timed out. Please try again.');
  }
  
  if (errorMessage.includes('API') || errorMessage.includes('key')) {
    throw new Error('AI service is temporarily unavailable. Please try again later.');
  }
  
  throw new Error(`Failed to ${context}. Please try again.`);
}

/**
 * Generate explanation for a concept
 */
export async function explainConcept(params: {
  concept: string;
  mode: ExplanationMode;
  context?: string;
  userProfile?: Partial<Profile>;
}): Promise<{ explanation: string; mode: ExplanationMode; concept: string }> {
  try {
    if (!params.concept || !params.concept.trim()) {
      throw new Error('Concept is required');
    }

    const { data, error } = await supabase.functions.invoke('ai-explain', {
      body: {
        concept: params.concept.trim(),
        mode: params.mode,
        context: params.context,
        userProfile: params.userProfile
      }
    });

    if (error) {
      throw error;
    }

    if (!data || !data.explanation) {
      throw new Error('Invalid response from AI service');
    }

    return data;
  } catch (error) {
    handleAIError(error, 'generate explanation');
  }
}

/**
 * Generate quiz questions
 */
export async function generateQuiz(params: {
  topic: string;
  difficulty: number;
  questionCount: number;
  questionTypes?: string[];
  classLevel?: string;
}): Promise<{ questions: Array<{
  type: string;
  question: string;
  options?: Record<string, string>;
  correctAnswer: string;
  explanation: string;
}> }> {
  try {
    if (!params.topic || !params.topic.trim()) {
      throw new Error('Topic is required');
    }

    if (params.difficulty < 1 || params.difficulty > 3) {
      throw new Error('Difficulty must be between 1 and 3');
    }

    if (params.questionCount < 1 || params.questionCount > 20) {
      throw new Error('Question count must be between 1 and 20');
    }

    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        topic: params.topic.trim(),
        difficulty: params.difficulty,
        questionCount: params.questionCount,
        questionTypes: params.questionTypes || ['mcq', 'short_answer'],
        classLevel: params.classLevel
      }
    });

    if (error) {
      throw error;
    }

    if (!data || !data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response from AI service');
    }

    if (data.questions.length === 0) {
      throw new Error('No questions were generated. Please try again.');
    }

    return data;
  } catch (error) {
    handleAIError(error, 'generate quiz');
  }
}

/**
 * Extract text from image using OCR
 */
export async function extractTextFromImage(params: {
  imageUrl?: string;
  base64Image?: string;
}): Promise<{
  extractedText: string;
  concepts: string[];
  chapter: string | null;
  keyPoints: string[];
}> {
  try {
    if (!params.imageUrl && !params.base64Image) {
      throw new Error('Either imageUrl or base64Image is required');
    }

    const { data, error } = await supabase.functions.invoke('ocr-extract', {
      body: {
        imageUrl: params.imageUrl,
        base64Image: params.base64Image
      }
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Invalid response from OCR service');
    }

    return {
      extractedText: data.extractedText || '',
      concepts: data.concepts || [],
      chapter: data.chapter || null,
      keyPoints: data.keyPoints || []
    };
  } catch (error) {
    handleAIError(error, 'extract text from image');
  }
}

/**
 * Convert text to speech
 */
export async function textToSpeech(params: {
  text: string;
  voice?: string;
}): Promise<{ audioData: string }> {
  try {
    if (!params.text || !params.text.trim()) {
      throw new Error('Text is required');
    }

    // Limit text length to prevent timeout
    const maxLength = 5000;
    const text = params.text.length > maxLength 
      ? params.text.substring(0, maxLength) + '...'
      : params.text;

    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: {
        text: text.trim(),
        voice: params.voice || 'heart'
      }
    });

    if (error) {
      throw error;
    }

    if (!data || !data.audioData) {
      throw new Error('Invalid response from TTS service');
    }

    return data;
  } catch (error) {
    handleAIError(error, 'convert text to speech');
  }
}

/**
 * Generate study plan
 */
export async function generateStudyPlan(params: {
  examDate: string;
  subjects: Array<{ name: string; isWeak: boolean }>;
  dailyStudyTime: number;
  classLevel?: string;
}): Promise<{
  planData: {
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
    tips: string[];
  };
}> {
  try {
    if (!params.examDate) {
      throw new Error('Exam date is required');
    }

    if (!params.subjects || params.subjects.length === 0) {
      throw new Error('At least one subject is required');
    }

    if (params.dailyStudyTime < 30 || params.dailyStudyTime > 720) {
      throw new Error('Daily study time must be between 30 and 720 minutes');
    }

    // Validate exam date is in the future
    const examDate = new Date(params.examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (examDate < today) {
      throw new Error('Exam date must be in the future');
    }

    const { data, error } = await supabase.functions.invoke('generate-study-plan', {
      body: {
        examDate: params.examDate,
        subjects: params.subjects,
        dailyStudyTime: params.dailyStudyTime,
        classLevel: params.classLevel
      }
    });

    if (error) {
      throw error;
    }

    if (!data || !data.planData) {
      throw new Error('Invalid response from AI service');
    }

    return data;
  } catch (error) {
    handleAIError(error, 'generate study plan');
  }
}

/**
 * Answer a doubt/question (chat-based)
 */
export async function answerDoubt(params: {
  question: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userProfile?: Partial<Profile>;
}): Promise<{ answer: string }> {
  try {
    if (!params.question || !params.question.trim()) {
      throw new Error('Question is required');
    }

    // Build context from conversation history
    let context = '';
    if (params.conversationHistory && params.conversationHistory.length > 0) {
      context = params.conversationHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');
    }

    // Use ai-explain with exam_focused mode for doubt clearing
    const { data, error } = await supabase.functions.invoke('ai-explain', {
      body: {
        concept: params.question.trim(),
        mode: 'exam_focused',
        context: context || undefined,
        userProfile: params.userProfile
      }
    });

    if (error) {
      throw error;
    }

    if (!data || !data.explanation) {
      throw new Error('Invalid response from AI service');
    }

    return { answer: data.explanation };
  } catch (error) {
    handleAIError(error, 'answer doubt');
  }
}

export default {
  isAIAvailable,
  explainConcept,
  generateQuiz,
  extractTextFromImage,
  textToSpeech,
  generateStudyPlan,
  answerDoubt
};
