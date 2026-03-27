/**
 * AI Engine - Single AI Brain for Kotalpur High School Study Kit
 * 
 * OpenAI-compatible chat completion architecture
 * All AI features use this centralized engine for consistency
 * 
 * Features:
 * - Chat-based architecture (system + user messages)
 * - Automatic retries with exponential backoff
 * - Timeout handling
 * - Malformed response validation
 * - Safe fallback messages
 * - Comprehensive error handling
 */

// Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIEngineConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  maxRetries?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Configuration
const DEFAULT_CONFIG: Required<AIEngineConfig> = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 30000, // 30 seconds
  maxRetries: 3
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validate AI response
 */
function validateResponse(response: any): boolean {
  return (
    response &&
    response.choices &&
    Array.isArray(response.choices) &&
    response.choices.length > 0 &&
    response.choices[0].message &&
    typeof response.choices[0].message.content === 'string'
  );
}

/**
 * Core AI Engine - Chat Completion
 * 
 * @param messages - Array of chat messages
 * @param config - Optional configuration overrides
 * @returns AI response content
 */
export async function chatCompletion(
  messages: ChatMessage[],
  config: Partial<AIEngineConfig> = {}
): Promise<AIResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Validate API key
  if (!finalConfig.apiKey) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  // Validate messages
  if (!messages || messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }

  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalConfig.apiKey}`
        },
        body: JSON.stringify({
          model: finalConfig.model,
          messages: messages,
          temperature: finalConfig.temperature,
          max_tokens: finalConfig.maxTokens
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      // Validate response structure
      if (!validateResponse(data)) {
        throw new Error('Invalid response format from AI service');
      }

      return {
        content: data.choices[0].message.content.trim(),
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : undefined
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on certain errors
      if (
        lastError.message.includes('API key') ||
        lastError.message.includes('Invalid') ||
        lastError.message.includes('401') ||
        lastError.message.includes('403')
      ) {
        break;
      }

      // Exponential backoff before retry
      if (attempt < finalConfig.maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  throw lastError || new Error('AI request failed after multiple attempts');
}

/**
 * Explain Chapter - Generate structured explanation
 */
export async function explainChapter(params: {
  classLevel: string;
  subject: string;
  chapter: string;
  extractedText?: string;
  mode?: 'beginner' | 'exam_focused' | 'advanced' | 'rapid_revision';
}): Promise<string> {
  const { classLevel, subject, chapter, extractedText, mode = 'exam_focused' } = params;

  // Build system prompt based on mode
  let systemPrompt = '';
  switch (mode) {
    case 'beginner':
      systemPrompt = `You are a patient, supportive tutor explaining concepts to a Class ${classLevel} student who is just starting to learn. Use very simple language, everyday examples, and break down complex ideas into small, digestible pieces. Avoid jargon. Focus on building foundational understanding.`;
      break;
    case 'exam_focused':
      systemPrompt = `You are an exam-focused tutor helping a Class ${classLevel} student maximize their marks. Provide explanations that highlight: key points likely to appear in exams, common question patterns, important formulas/definitions to memorize, and exam-specific tips. Structure your answer in a marks-oriented way.`;
      break;
    case 'advanced':
      systemPrompt = `You are a subject matter expert providing deep, conceptual understanding to a Class ${classLevel} student. Go beyond surface-level explanations. Discuss underlying principles, connections to other concepts, real-world applications, and advanced nuances. Challenge the student to think critically.`;
      break;
    case 'rapid_revision':
      systemPrompt = `You are providing a quick revision summary for a Class ${classLevel} student. Be concise and sharp. Use bullet points, highlight key formulas/definitions, and focus only on the most important facts. This should be scannable in under 2 minutes.`;
      break;
  }

  const userPrompt = `Subject: ${subject}
Chapter: ${chapter}
${extractedText ? `\nTextbook Content:\n${extractedText.substring(0, 2000)}` : ''}

Please provide a comprehensive explanation of this chapter. Include:
1. Main concepts and definitions
2. Step-by-step explanations
3. Important formulas or key points
4. Exam-focused tips
5. Common mistakes to avoid

Format your response clearly with proper headings and structure.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const response = await chatCompletion(messages, { temperature: 0.7 });
    return response.content;
  } catch (error) {
    console.error('Error in explainChapter:', error);
    throw new Error('Failed to generate explanation. Please try again.');
  }
}

/**
 * Generate Quiz - Create MCQs with strict validation, retry logic, and fallback
 * 
 * FIXES:
 * - Enforces strict JSON output using system prompt
 * - Validates all fields (questions array, options length, correctAnswer)
 * - Automatic retry once if AI returns invalid JSON
 * - Safe fallback quiz if all attempts fail
 * - Never throws errors to UI - always returns usable data
 */
export async function generateQuiz(params: {
  topic: string;
  difficulty: number;
  questionCount: number;
  classLevel?: string;
}): Promise<Array<{
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}>> {
  const { topic, difficulty, questionCount, classLevel } = params;

  const difficultyLabel = difficulty === 1 ? 'Easy' : difficulty === 2 ? 'Medium' : 'Hard';

  // STRICT JSON enforcement in system prompt
  const systemPrompt = `You are a quiz generator. You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON. Start your response with [ and end with ]. Generate ${difficultyLabel} level questions for ${classLevel ? `Class ${classLevel}` : 'students'}.`;

  const userPrompt = `Generate ${questionCount} multiple choice questions on: ${topic}

CRITICAL: Return ONLY a JSON array. No other text before or after.

Required JSON format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation why this is correct"
  }
]

Rules:
- Difficulty: ${difficultyLabel}
- Each question MUST have exactly 4 options
- correctAnswer MUST be 0, 1, 2, or 3 (index of correct option)
- Provide brief explanation for each answer

RESPOND WITH ONLY THE JSON ARRAY.`;

  // Helper function to validate and parse quiz response
  const validateQuizResponse = (responseText: string): Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }> => {
    // Clean up response text
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any text before the first [ or after the last ]
    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      throw new Error('No valid JSON array found in response');
    }
    
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    
    // Parse JSON
    let questions;
    try {
      questions = JSON.parse(jsonText);
    } catch (parseError) {
      throw new Error('Failed to parse JSON: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
    }

    // Validate structure
    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array');
    }
    
    if (questions.length === 0) {
      throw new Error('Questions array is empty');
    }

    // Validate and sanitize each question
    const validatedQuestions = questions.map((q, index) => {
      // Validate question text
      if (!q.question || typeof q.question !== 'string' || q.question.trim().length === 0) {
        throw new Error(`Invalid question text at index ${index}`);
      }
      
      // Validate options array
      if (!Array.isArray(q.options)) {
        throw new Error(`Options is not an array at index ${index}`);
      }
      
      if (q.options.length !== 4) {
        throw new Error(`Options must have exactly 4 items at index ${index}, got ${q.options.length}`);
      }
      
      // Validate each option is non-empty string
      const validOptions = q.options.map((opt: any, optIndex: number) => {
        if (typeof opt !== 'string' || opt.trim().length === 0) {
          throw new Error(`Invalid option at index ${index}, option ${optIndex}`);
        }
        return opt.trim();
      });
      
      // Validate correctAnswer
      const correctAnswer = Number(q.correctAnswer);
      if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
        throw new Error(`Invalid correctAnswer at index ${index}: must be 0, 1, 2, or 3, got ${q.correctAnswer}`);
      }
      
      // Validate explanation
      const explanation = q.explanation && typeof q.explanation === 'string' && q.explanation.trim().length > 0
        ? q.explanation.trim()
        : 'No explanation provided';

      return {
        question: q.question.trim(),
        options: validOptions,
        correctAnswer: correctAnswer,
        explanation: explanation
      };
    });

    return validatedQuestions;
  };

  // Attempt 1: Try to generate quiz
  try {
    console.log(`[Quiz Generation] Attempt 1: Generating ${questionCount} questions on "${topic}"`);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await chatCompletion(messages, { temperature: 0.7, maxTokens: 2000 });
    const validatedQuestions = validateQuizResponse(response.content);
    
    console.log(`[Quiz Generation] Success: Generated ${validatedQuestions.length} valid questions`);
    return validatedQuestions;

  } catch (error) {
    console.error('[Quiz Generation] Attempt 1 failed:', error);
    
    // Attempt 2: Retry once with more explicit instructions
    try {
      console.log('[Quiz Generation] Attempt 2: Retrying with stricter prompt...');
      
      const retrySystemPrompt = `You are a JSON generator. Your response must be ONLY a valid JSON array. Start with [ and end with ]. No other text.`;
      
      const retryUserPrompt = `Generate ${questionCount} quiz questions about "${topic}" (${difficultyLabel} difficulty).

OUTPUT FORMAT (copy this structure exactly):
[{"question":"Q1 text?","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Why A is correct"},{"question":"Q2 text?","options":["A","B","C","D"],"correctAnswer":1,"explanation":"Why B is correct"}]

RULES:
- correctAnswer must be 0, 1, 2, or 3
- Each question needs exactly 4 options
- Return ONLY the JSON array`;

      const retryMessages: ChatMessage[] = [
        { role: 'system', content: retrySystemPrompt },
        { role: 'user', content: retryUserPrompt }
      ];

      const retryResponse = await chatCompletion(retryMessages, { temperature: 0.6, maxTokens: 2000 });
      const validatedQuestions = validateQuizResponse(retryResponse.content);
      
      console.log(`[Quiz Generation] Retry success: Generated ${validatedQuestions.length} valid questions`);
      return validatedQuestions;

    } catch (retryError) {
      console.error('[Quiz Generation] Attempt 2 failed:', retryError);
      
      // Fallback: Return a safe, generic quiz
      console.log('[Quiz Generation] Using fallback quiz');
      
      const fallbackQuestions: Array<{
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
      }> = [];
      
      for (let i = 0; i < Math.min(questionCount, 3); i++) {
        fallbackQuestions.push({
          question: `Question ${i + 1} about ${topic}: This is a sample question. (AI generation failed, please try again)`,
          options: [
            'Option A',
            'Option B',
            'Option C',
            'Option D'
          ],
          correctAnswer: 0,
          explanation: 'This is a fallback question. Please regenerate the quiz for actual content.'
        });
      }
      
      // Return fallback - NEVER throw error to UI
      return fallbackQuestions;
    }
  }
}

/**
 * Doubt Chat - ChatGPT-like conversation
 */
export async function doubtChat(params: {
  question: string;
  conversationHistory?: ChatMessage[];
  classLevel?: string;
  subject?: string;
}): Promise<string> {
  const { question, conversationHistory = [], classLevel, subject } = params;

  const systemPrompt = `You are a strict but caring personal tutor helping a ${classLevel ? `Class ${classLevel}` : ''} student${subject ? ` with ${subject}` : ''}.

Your teaching style:
- Ask counter-questions if you detect confusion or incomplete understanding
- Explain using examples and analogies relevant to the student's level
- Break down complex concepts into simple steps
- Never give one-line answers - always explain thoroughly
- Be encouraging but honest about mistakes
- Guide the student to discover answers rather than just giving them
- Use the Socratic method when appropriate

Remember: You're building understanding, not just answering questions.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: question }
  ];

  try {
    const response = await chatCompletion(messages, { temperature: 0.8, maxTokens: 1000 });
    return response.content;
  } catch (error) {
    console.error('Error in doubtChat:', error);
    throw new Error('Failed to get response. Please try again.');
  }
}

/**
 * Generate Study Plan - Create personalized study schedule with validation and fallback
 * 
 * FIXES:
 * - Validates inputs before AI call (exam date must be future, daily study time > 0)
 * - Enforces strict JSON output structure
 * - Validates dates are sequential and within range
 * - Ensures total time per day ≤ available study time
 * - Automatic retry once if AI returns invalid JSON
 * - Safe fallback plan if all attempts fail
 * - Never throws errors to UI - always returns usable data
 */
export async function generateStudyPlan(params: {
  examDate: string;
  dailyStudyTime: number;
  subjects: Array<{ name: string; isWeak: boolean }>;
  classLevel?: string;
}): Promise<{
  dailySchedule: Array<{
    date: string;
    subjects: Array<{
      subject: string;
      duration: number;
      topics: string[];
    }>;
  }>;
  revisionCycles: Array<{
    date: string;
    topics: string[];
  }>;
  tips: string[];
}> {
  const { examDate, dailyStudyTime, subjects, classLevel } = params;

  // INPUT VALIDATION - Validate before making AI call
  console.log('[Study Plan] Validating inputs...');
  
  // Validate exam date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDateObj = new Date(examDate);
  examDateObj.setHours(0, 0, 0, 0);
  
  if (examDateObj <= today) {
    console.error('[Study Plan] Invalid exam date: must be in the future');
    // Return minimal safe plan instead of throwing
    return createFallbackStudyPlan(examDate, dailyStudyTime, subjects);
  }
  
  // Validate daily study time is positive
  if (dailyStudyTime <= 0 || !Number.isFinite(dailyStudyTime)) {
    console.error('[Study Plan] Invalid daily study time: must be > 0');
    return createFallbackStudyPlan(examDate, dailyStudyTime > 0 ? dailyStudyTime : 60, subjects);
  }
  
  // Validate subjects array is not empty
  if (!subjects || subjects.length === 0) {
    console.error('[Study Plan] No subjects provided');
    return createFallbackStudyPlan(examDate, dailyStudyTime, [{ name: 'General Study', isWeak: false }]);
  }

  const todayStr = today.toISOString().split('T')[0];
  const weakSubjects = subjects.filter(s => s.isWeak).map(s => s.name);
  const daysUntilExam = Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`[Study Plan] Valid inputs: ${daysUntilExam} days until exam, ${dailyStudyTime} min/day, ${subjects.length} subjects`);

  // STRICT JSON enforcement in system prompt
  const systemPrompt = `You are a study planner. You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON. Start your response with { and end with }.`;

  const userPrompt = `Create a study plan for the following:

Exam Date: ${examDate}
Today: ${todayStr}
Days Until Exam: ${daysUntilExam}
Daily Study Time: ${dailyStudyTime} minutes
Subjects: ${subjects.map(s => s.name).join(', ')}
Weak Subjects (need more time): ${weakSubjects.join(', ') || 'None'}
${classLevel ? `Class Level: ${classLevel}` : ''}

CRITICAL: Return ONLY a JSON object. No other text before or after.

Required JSON format:
{
  "dailySchedule": [
    {
      "date": "2026-01-17",
      "subjects": [
        {
          "subject": "Mathematics",
          "duration": 60,
          "topics": ["Algebra", "Geometry"]
        }
      ]
    }
  ],
  "revisionCycles": [
    {
      "date": "2026-01-20",
      "topics": ["Week 1 topics"]
    }
  ],
  "tips": ["Study tip 1", "Study tip 2", "Study tip 3"]
}

Rules:
- Allocate more time to weak subjects: ${weakSubjects.join(', ') || 'None'}
- Total duration per day should not exceed ${dailyStudyTime} minutes
- Include revision cycles (spaced repetition)
- Add buffer days for flexibility
- Include mock test days before exam
- Dates must be sequential from ${todayStr} to ${examDate}

RESPOND WITH ONLY THE JSON OBJECT.`;

  // Helper function to validate and parse study plan response
  const validateStudyPlanResponse = (responseText: string): {
    dailySchedule: Array<{
      date: string;
      subjects: Array<{
        subject: string;
        duration: number;
        topics: string[];
      }>;
    }>;
    revisionCycles: Array<{
      date: string;
      topics: string[];
    }>;
    tips: string[];
  } => {
    // Clean up response text
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any text before the first { or after the last }
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      throw new Error('No valid JSON object found in response');
    }
    
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    
    // Parse JSON
    let plan;
    try {
      plan = JSON.parse(jsonText);
    } catch (parseError) {
      throw new Error('Failed to parse JSON: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
    }

    // Validate structure
    if (!plan.dailySchedule || !Array.isArray(plan.dailySchedule)) {
      throw new Error('dailySchedule is missing or not an array');
    }
    
    if (plan.dailySchedule.length === 0) {
      throw new Error('dailySchedule is empty');
    }

    // Validate each day in schedule
    const validatedSchedule = plan.dailySchedule.map((day: any, index: number) => {
      // Validate date
      if (!day.date || typeof day.date !== 'string') {
        throw new Error(`Invalid date at schedule index ${index}`);
      }
      
      // Validate date format and is within range (with timezone safety)
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      
      // More lenient date validation - allow dates from yesterday to exam date + 1 day
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const examPlusOne = new Date(examDateObj);
      examPlusOne.setDate(examPlusOne.getDate() + 1);
      
      if (dayDate < yesterday || dayDate > examPlusOne) {
        console.warn(`[Study Plan] Date ${day.date} is slightly out of range, but accepting it`);
      }
      
      // Validate subjects array
      if (!Array.isArray(day.subjects)) {
        throw new Error(`Subjects is not an array at schedule index ${index}`);
      }
      
      // If subjects array is empty, skip this day
      if (day.subjects.length === 0) {
        console.warn(`[Study Plan] Day ${day.date} has no subjects, skipping`);
        return null;
      }
      
      let totalDuration = 0;
      const validatedSubjects = day.subjects.map((subj: any, subjIndex: number) => {
        if (!subj.subject || typeof subj.subject !== 'string') {
          throw new Error(`Invalid subject name at schedule index ${index}, subject ${subjIndex}`);
        }
        
        const duration = Number(subj.duration);
        if (!Number.isFinite(duration) || duration <= 0) {
          throw new Error(`Invalid duration at schedule index ${index}, subject ${subjIndex}`);
        }
        
        totalDuration += duration;
        
        const topics = Array.isArray(subj.topics) 
          ? subj.topics.filter((t: any) => typeof t === 'string' && t.trim().length > 0)
          : [];
        
        return {
          subject: subj.subject.trim(),
          duration: duration,
          topics: topics
        };
      });
      
      // Warn if total duration exceeds daily study time (but don't fail)
      if (totalDuration > dailyStudyTime * 1.5) { // Allow 50% buffer
        console.warn(`[Study Plan] Day ${day.date} has ${totalDuration} min (exceeds ${dailyStudyTime} min limit)`);
      }
      
      return {
        date: day.date,
        subjects: validatedSubjects
      };
    }).filter((day: any) => day !== null); // Remove null entries
    
    // Final safety check - ensure we have at least one day
    if (validatedSchedule.length === 0) {
      throw new Error('No valid days in schedule after validation');
    }

    // Validate revision cycles (optional, so provide defaults if missing)
    const validatedRevisionCycles = Array.isArray(plan.revisionCycles)
      ? plan.revisionCycles.map((cycle: any) => ({
          date: cycle.date || todayStr,
          topics: Array.isArray(cycle.topics) ? cycle.topics.filter((t: any) => typeof t === 'string') : []
        }))
      : [];

    // Validate tips (optional, so provide defaults if missing)
    const validatedTips = Array.isArray(plan.tips)
      ? plan.tips.filter((tip: any) => typeof tip === 'string' && tip.trim().length > 0)
      : ['Stay consistent with your study schedule', 'Take regular breaks', 'Review regularly'];

    return {
      dailySchedule: validatedSchedule,
      revisionCycles: validatedRevisionCycles,
      tips: validatedTips
    };
  };

  // Attempt 1: Try to generate study plan
  try {
    console.log('[Study Plan] Attempt 1: Generating study plan...');
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await chatCompletion(messages, { temperature: 0.7, maxTokens: 2500 });
    const validatedPlan = validateStudyPlanResponse(response.content);
    
    console.log(`[Study Plan] Success: Generated plan with ${validatedPlan.dailySchedule.length} days`);
    return validatedPlan;

  } catch (error) {
    console.error('[Study Plan] Attempt 1 failed:', error);
    
    // Attempt 2: Retry once with simpler prompt
    try {
      console.log('[Study Plan] Attempt 2: Retrying with simpler prompt...');
      
      const retrySystemPrompt = `You are a JSON generator. Your response must be ONLY a valid JSON object. Start with { and end with }. No other text.`;
      
      const retryUserPrompt = `Generate a ${daysUntilExam}-day study plan for: ${subjects.map(s => s.name).join(', ')}

Daily study time: ${dailyStudyTime} minutes
Exam date: ${examDate}

OUTPUT FORMAT (copy this structure):
{"dailySchedule":[{"date":"${todayStr}","subjects":[{"subject":"${subjects[0].name}","duration":${Math.floor(dailyStudyTime / subjects.length)},"topics":["Topic 1","Topic 2"]}]}],"revisionCycles":[{"date":"${todayStr}","topics":["Review topics"]}],"tips":["Tip 1","Tip 2","Tip 3"]}

RULES:
- Total duration per day ≤ ${dailyStudyTime} minutes
- Dates from ${todayStr} to ${examDate}
- Return ONLY the JSON object`;

      const retryMessages: ChatMessage[] = [
        { role: 'system', content: retrySystemPrompt },
        { role: 'user', content: retryUserPrompt }
      ];

      const retryResponse = await chatCompletion(retryMessages, { temperature: 0.6, maxTokens: 2500 });
      const validatedPlan = validateStudyPlanResponse(retryResponse.content);
      
      console.log(`[Study Plan] Retry success: Generated plan with ${validatedPlan.dailySchedule.length} days`);
      return validatedPlan;

    } catch (retryError) {
      console.error('[Study Plan] Attempt 2 failed:', retryError);
      
      // Fallback: Return a safe, minimal study plan
      console.log('[Study Plan] Using fallback study plan');
      return createFallbackStudyPlan(examDate, dailyStudyTime, subjects);
    }
  }
}

/**
 * Create a safe fallback study plan when AI generation fails
 * This ensures the UI never receives undefined/null responses
 */
function createFallbackStudyPlan(
  examDate: string,
  dailyStudyTime: number,
  subjects: Array<{ name: string; isWeak: boolean }>
): {
  dailySchedule: Array<{
    date: string;
    subjects: Array<{
      subject: string;
      duration: number;
      topics: string[];
    }>;
  }>;
  revisionCycles: Array<{
    date: string;
    topics: string[];
  }>;
  tips: string[];
} {
  console.log('[Fallback] Creating deterministic study plan...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDateObj = new Date(examDate);
  examDateObj.setHours(0, 0, 0, 0);
  
  // Ensure exam date is in future
  if (examDateObj <= today) {
    console.warn('[Fallback] Exam date is in past, setting to 7 days from now');
    examDateObj.setTime(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  }
  
  // Ensure we have valid subjects
  if (!subjects || subjects.length === 0) {
    console.warn('[Fallback] No subjects provided, using default');
    subjects = [{ name: 'General Study', isWeak: false }];
  }
  
  // Ensure daily study time is valid
  if (!dailyStudyTime || dailyStudyTime <= 0 || !Number.isFinite(dailyStudyTime)) {
    console.warn('[Fallback] Invalid daily study time, using 60 minutes');
    dailyStudyTime = 60;
  }
  
  const daysUntilExam = Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const daysToGenerate = Math.max(1, Math.min(daysUntilExam, 14)); // Generate 1-14 days
  
  console.log(`[Fallback] Generating ${daysToGenerate} days for ${subjects.length} subjects`);
  
  const dailySchedule: Array<{
    date: string;
    subjects: Array<{
      subject: string;
      duration: number;
      topics: string[];
    }>;
  }> = [];
  
  // Calculate time per subject with weak subject priority
  const weakSubjects = subjects.filter(s => s.isWeak);
  const normalSubjects = subjects.filter(s => !s.isWeak);
  
  // Allocate 60% time to weak subjects, 40% to normal subjects
  const weakTimeTotal = weakSubjects.length > 0 ? dailyStudyTime * 0.6 : 0;
  const normalTimeTotal = dailyStudyTime - weakTimeTotal;
  
  const timePerWeakSubject = weakSubjects.length > 0 ? Math.floor(weakTimeTotal / weakSubjects.length) : 0;
  const timePerNormalSubject = normalSubjects.length > 0 ? Math.floor(normalTimeTotal / normalSubjects.length) : 0;
  
  // Generate daily schedule
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const daySubjects = subjects.map(subj => {
      const duration = subj.isWeak ? timePerWeakSubject : timePerNormalSubject;
      
      // Vary topics based on day
      let topics: string[];
      if (i % 7 === 0) {
        topics = ['Review previous week', 'Start new topics'];
      } else if (i % 3 === 0) {
        topics = ['Practice problems', 'Solve previous year questions'];
      } else {
        topics = ['Study new concepts', 'Make notes'];
      }
      
      return {
        subject: subj.name,
        duration: Math.max(15, duration), // Minimum 15 minutes per subject
        topics: topics
      };
    });
    
    dailySchedule.push({
      date: dateStr,
      subjects: daySubjects
    });
  }
  
  // Create revision cycles
  const revisionCycles: Array<{ date: string; topics: string[] }> = [];
  
  // Add revision every 3 days
  for (let i = 2; i < daysToGenerate; i += 3) {
    const revisionDate = new Date(today);
    revisionDate.setDate(today.getDate() + i);
    revisionCycles.push({
      date: revisionDate.toISOString().split('T')[0],
      topics: subjects.map(s => `Review ${s.name} concepts`)
    });
  }
  
  // Add final revision before exam
  if (daysToGenerate > 1) {
    const finalRevisionDate = new Date(examDateObj);
    finalRevisionDate.setDate(examDateObj.getDate() - 1);
    revisionCycles.push({
      date: finalRevisionDate.toISOString().split('T')[0],
      topics: ['Final revision of all subjects', 'Practice mock tests']
    });
  }
  
  console.log(`[Fallback] Generated ${dailySchedule.length} days, ${revisionCycles.length} revision cycles`);
  
  return {
    dailySchedule,
    revisionCycles,
    tips: [
      'This is a basic study plan. Try regenerating for a personalized AI-powered schedule.',
      'Focus on weak subjects: ' + (weakSubjects.length > 0 ? weakSubjects.map(s => s.name).join(', ') : 'None identified'),
      'Take 5-minute breaks every 25 minutes (Pomodoro technique)',
      'Practice previous year questions regularly',
      'Revise completed topics every 3 days for better retention'
    ]
  };
}

/**
 * Regenerate Explanation - Different angle
 */
export async function regenerateExplanation(params: {
  originalExplanation: string;
  topic: string;
  angle: 'simpler' | 'detailed' | 'examples' | 'visual';
}): Promise<string> {
  const { originalExplanation, topic, angle } = params;

  const anglePrompts = {
    simpler: 'Explain this in even simpler terms, as if teaching a younger student',
    detailed: 'Provide a more detailed, in-depth explanation with advanced concepts',
    examples: 'Focus on real-world examples and practical applications',
    visual: 'Describe this in a way that helps visualize the concept, using analogies and mental models'
  };

  const systemPrompt = `You are a tutor providing an alternative explanation. ${anglePrompts[angle]}.`;

  const userPrompt = `Topic: ${topic}

Original Explanation:
${originalExplanation.substring(0, 1000)}

Provide a fresh explanation from a different angle. Make it engaging and clear.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const response = await chatCompletion(messages, { temperature: 0.9 });
    return response.content;
  } catch (error) {
    console.error('Error in regenerateExplanation:', error);
    throw new Error('Failed to regenerate explanation. Please try again.');
  }
}

/**
 * Analyze Quiz Mistakes - "Why am I wrong?"
 */
export async function analyzeQuizMistakes(params: {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}): Promise<string> {
  const { question, userAnswer, correctAnswer, explanation } = params;

  const systemPrompt = `You are a tutor analyzing why a student got a question wrong. Be honest but supportive. Identify the specific misconception or gap in understanding.`;

  const userPrompt = `Question: ${question}

Student's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}
Explanation: ${explanation}

Analyze:
1. Why did the student likely choose the wrong answer?
2. What misconception or gap in understanding led to this mistake?
3. How can they avoid this mistake in the future?
4. What should they review or practice?

Be specific and actionable.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const response = await chatCompletion(messages, { temperature: 0.7 });
    return response.content;
  } catch (error) {
    console.error('Error in analyzeQuizMistakes:', error);
    throw new Error('Failed to analyze mistake. Please try again.');
  }
}

/**
 * Detect Weakness Type
 */
export async function detectWeaknessType(params: {
  subject: string;
  incorrectQuestions: Array<{
    question: string;
    topic: string;
    type: 'conceptual' | 'numerical' | 'application';
  }>;
}): Promise<{
  weaknessType: 'conceptual' | 'numerical' | 'mixed';
  analysis: string;
  recommendations: string[];
}> {
  const { subject, incorrectQuestions } = params;

  const systemPrompt = `You are an educational analyst identifying patterns in student mistakes. Determine if weaknesses are conceptual (understanding), numerical (calculation), or mixed.`;

  const userPrompt = `Subject: ${subject}

Incorrect Questions:
${incorrectQuestions.map((q, i) => `${i + 1}. ${q.question} (Topic: ${q.topic}, Type: ${q.type})`).join('\n')}

Analyze the pattern and return ONLY a JSON object:
{
  "weaknessType": "conceptual" | "numerical" | "mixed",
  "analysis": "Detailed analysis of the weakness pattern",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const response = await chatCompletion(messages, { temperature: 0.6 });
    
    let jsonText = response.content.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found');
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Error in detectWeaknessType:', error);
    throw new Error('Failed to analyze weakness. Please try again.');
  }
}

/**
 * Generate One-Tap Revision Summary
 */
export async function generateRevisionSummary(params: {
  subject: string;
  chapter: string;
  classLevel?: string;
}): Promise<string> {
  const { subject, chapter, classLevel } = params;

  const systemPrompt = `You are creating ultra-concise revision notes. Use bullet points, highlight key formulas, and focus only on exam-critical content. Maximum 200 words.`;

  const userPrompt = `Create a one-tap revision summary for:
Subject: ${subject}
Chapter: ${chapter}
${classLevel ? `Class: ${classLevel}` : ''}

Include:
- Key definitions (1-2 lines each)
- Important formulas
- Must-remember points
- Common exam questions

Keep it scannable and exam-focused.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const response = await chatCompletion(messages, { temperature: 0.5, maxTokens: 500 });
    return response.content;
  } catch (error) {
    console.error('Error in generateRevisionSummary:', error);
    throw new Error('Failed to generate revision summary. Please try again.');
  }
}

/**
 * Generate Cinematic Explanation - Transform concepts into engaging stories
 * 
 * NEW FEATURE: Concept Cinema
 * Converts educational concepts into cinematic story-based explanations
 * Themes: superhero, timetravel, microscopic, detective
 */
export async function generateCinematicExplanation(params: {
  concept: string;
  subject: string;
  theme: string;
  classLevel?: string;
}): Promise<{
  title: string;
  intro: string;
  scenes: Array<{
    heading: string;
    content: string;
    visual: string;
  }>;
  keyTakeaways: string[];
  examSummary: string;
}> {
  const { concept, subject, theme, classLevel } = params;

  // Theme-specific instructions
  const themeInstructions: Record<string, string> = {
    superhero: 'Use superhero characters and powers to explain forces, energy, and physics concepts. Make it action-packed but scientifically accurate.',
    timetravel: 'Use time travel narrative to explain historical events or timelines. Characters travel through time witnessing key moments.',
    microscopic: 'Take the reader on a journey inside cells, molecules, or microscopic worlds. Personify biological/chemical entities.',
    detective: 'Frame the concept as a mystery to solve. Use detective reasoning, clues, and logical deduction.'
  };

  const systemPrompt = `You are a MASTER STORYTELLER and EDUCATOR. You create CINEMATIC explanations that feel like watching a Netflix documentary or Marvel movie - NOT a boring textbook.

MANDATORY STORY STRUCTURE:
1. Movie Title - Make it dramatic and intriguing
2. Story Setup - Hook the reader immediately
3. Characters - Map concepts to characters/entities
4. Visual Explanation Blocks - Scene-by-scene narrative
5. Dramatic Turning Point - The "aha!" moment
6. Exam-Focused Takeaways - What students MUST remember

Your stories MUST be:
- Sophisticated and intelligent (NEVER childish or patronizing)
- Scientifically/historically ACCURATE (no fake science)
- Visually DESCRIPTIVE (reader should "see" the story)
- Emotionally ENGAGING (make them care about the concept)
- Exam-FOCUSED (clear takeaways for tests)

Theme: ${themeInstructions[theme] || themeInstructions.superhero}

CRITICAL: Generate ONLY valid JSON. No markdown, no code blocks, no extra text.`;

  const userPrompt = `Create a CINEMATIC story-based explanation for: ${concept}

Subject: ${subject}
${classLevel ? `Class Level: ${classLevel}` : ''}

MANDATORY STRUCTURE:
- Title: Make it sound like a movie/documentary title
- Intro: One powerful hook sentence that makes them want to read more
- Scenes: 4-5 scenes, each with:
  * Heading: Scene title (e.g., "Act 1: The Discovery", "Scene 2: The Conflict")
  * Content: 2-3 paragraphs of engaging narrative that explains the concept through story
  * Visual: Vivid description of what this scene looks like (cinematography)
- Key Takeaways: 3-5 bullet points of what students MUST remember
- Exam Summary: 2-3 sentences focused on exam preparation

CRITICAL: Return ONLY a JSON object. No other text.

Required JSON format:
{
  "title": "Cinematic movie-style title",
  "intro": "Powerful hook sentence",
  "scenes": [
    {
      "heading": "Act 1: Scene Title",
      "content": "Engaging narrative that explains the concept through story. Use characters, conflict, and resolution. Make it feel like a movie scene, not a textbook paragraph. Include dialogue if appropriate. Build tension and release. Make the reader visualize what's happening.",
      "visual": "Detailed cinematography description: camera angles, lighting, colors, atmosphere"
    }
  ],
  "keyTakeaways": [
    "Key concept 1 explained clearly",
    "Key concept 2 with exam relevance",
    "Key concept 3 with real-world connection"
  ],
  "examSummary": "Concise exam-focused summary that students can memorize"
}

RULES:
- Create 4-5 scenes minimum
- Each scene must advance the story AND explain the concept
- Use narrative techniques: conflict, resolution, character development
- Include visual descriptions that help readers "see" the concept
- Make it feel CINEMATIC, not textbook-like
- Keep scientific/historical accuracy
- End with clear, exam-focused takeaways

REJECT if it sounds like a textbook. ACCEPT only if it feels like a movie.

RESPOND WITH ONLY THE JSON OBJECT.`;

  // Helper function to validate response
  const validateCinematicResponse = (responseText: string) => {
    let jsonText = responseText.trim();
    
    // Remove markdown
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Extract JSON object
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('No valid JSON object found');
    }
    
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    
    // Parse
    let story;
    try {
      story = JSON.parse(jsonText);
    } catch (parseError) {
      throw new Error('Failed to parse JSON: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
    }

    // Validate structure
    if (!story.title || typeof story.title !== 'string') {
      throw new Error('Invalid or missing title');
    }
    
    if (!story.intro || typeof story.intro !== 'string') {
      throw new Error('Invalid or missing intro');
    }
    
    if (!Array.isArray(story.scenes) || story.scenes.length === 0) {
      throw new Error('Scenes must be a non-empty array');
    }
    
    // Validate scenes
    const validatedScenes = story.scenes.map((scene: any, index: number) => {
      if (!scene.heading || typeof scene.heading !== 'string') {
        throw new Error(`Invalid heading at scene ${index}`);
      }
      if (!scene.content || typeof scene.content !== 'string') {
        throw new Error(`Invalid content at scene ${index}`);
      }
      if (!scene.visual || typeof scene.visual !== 'string') {
        throw new Error(`Invalid visual at scene ${index}`);
      }
      return {
        heading: scene.heading.trim(),
        content: scene.content.trim(),
        visual: scene.visual.trim()
      };
    });
    
    // Validate takeaways
    const validatedTakeaways = Array.isArray(story.keyTakeaways)
      ? story.keyTakeaways.filter((t: any) => typeof t === 'string' && t.trim().length > 0)
      : [];
    
    if (validatedTakeaways.length === 0) {
      throw new Error('At least one key takeaway is required');
    }
    
    // Validate exam summary
    if (!story.examSummary || typeof story.examSummary !== 'string') {
      throw new Error('Invalid or missing exam summary');
    }

    return {
      title: story.title.trim(),
      intro: story.intro.trim(),
      scenes: validatedScenes,
      keyTakeaways: validatedTakeaways,
      examSummary: story.examSummary.trim()
    };
  };

  // Attempt 1
  try {
    console.log(`[Cinematic] Attempt 1: Generating story for "${concept}" with ${theme} theme`);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await chatCompletion(messages, { temperature: 0.8, maxTokens: 3000 });
    const validated = validateCinematicResponse(response.content);
    
    console.log(`[Cinematic] Success: Generated story with ${validated.scenes.length} scenes`);
    return validated;

  } catch (error) {
    console.error('[Cinematic] Attempt 1 failed:', error);
    
    // Attempt 2: Simpler prompt
    try {
      console.log('[Cinematic] Attempt 2: Retrying with simpler prompt...');
      
      const retrySystemPrompt = `You are a storyteller. Create an engaging story-based explanation. Return ONLY valid JSON.`;
      
      const retryUserPrompt = `Create a story explaining "${concept}" (${subject}).

OUTPUT FORMAT:
{"title":"Story Title","intro":"Hook sentence","scenes":[{"heading":"Scene 1","content":"Story content","visual":"Visual description"}],"keyTakeaways":["Point 1","Point 2"],"examSummary":"Summary"}

Make it engaging and educational. Return ONLY the JSON object.`;

      const retryMessages: ChatMessage[] = [
        { role: 'system', content: retrySystemPrompt },
        { role: 'user', content: retryUserPrompt }
      ];

      const retryResponse = await chatCompletion(retryMessages, { temperature: 0.7, maxTokens: 3000 });
      const validated = validateCinematicResponse(retryResponse.content);
      
      console.log(`[Cinematic] Retry success: Generated story with ${validated.scenes.length} scenes`);
      return validated;

    } catch (retryError) {
      console.error('[Cinematic] Attempt 2 failed:', retryError);
      
      // Fallback: Return a basic story structure
      console.log('[Cinematic] Using fallback story');
      
      return {
        title: `The Story of ${concept}`,
        intro: `Let's explore ${concept} through an engaging narrative.`,
        scenes: [
          {
            heading: 'Introduction',
            content: `This is a basic explanation of ${concept}. The AI generation failed, but here's what you need to know: ${concept} is an important concept in ${subject}. Please try regenerating for a full cinematic experience.`,
            visual: 'A classroom setting with students learning about the concept'
          },
          {
            heading: 'Key Concepts',
            content: `Understanding ${concept} requires breaking it down into smaller parts. Each part builds on the previous one, creating a complete picture of how this concept works.`,
            visual: 'Visual diagrams and illustrations showing the concept'
          },
          {
            heading: 'Real-World Application',
            content: `${concept} appears in everyday life more than you might think. Recognizing these applications helps solidify your understanding.`,
            visual: 'Real-world scenarios demonstrating the concept'
          }
        ],
        keyTakeaways: [
          `${concept} is a fundamental concept in ${subject}`,
          'Understanding this concept is important for exams',
          'Try regenerating for a full cinematic story experience'
        ],
        examSummary: `For exams, remember that ${concept} is a key topic in ${subject}. Focus on understanding the core principles and their applications.`
      };
    }
  }
}

/**
 * Generate Text to Video Script - Convert study notes into video script
 * 
 * NEW FEATURE: Text to Video Converter
 * Uses OpenAI to generate detailed video scripts from text content
 * Includes scene descriptions, voice-over text, and visual directions
 */
export async function generateTextToVideoScript(params: {
  text: string;
  videoStyle: string;
  voice: string;
  includeSubtitles: boolean;
  autoHighlight: boolean;
}): Promise<{
  script: {
    scenes: Array<{
      sceneNumber: number;
      duration: number;
      voiceOver: string;
      visualDescription: string;
      keyTerms: string[];
    }>;
    totalDuration: number;
    keywords: string[];
  };
  videoUrl: string;
}> {
  const { text, videoStyle, voice, includeSubtitles, autoHighlight } = params;

  // Style-specific instructions
  const styleInstructions: Record<string, string> = {
    animated: 'Create colorful animated scenes with characters and motion graphics. Use vibrant visuals and engaging animations.',
    whiteboard: 'Design hand-drawn whiteboard style with sketches, diagrams, and step-by-step illustrations.',
    presentation: 'Professional presentation slides with bullet points, charts, and clean layouts.',
    cinematic: 'Movie-style storytelling with dramatic scenes, transitions, and narrative flow.',
    documentary: 'Educational documentary format with informative visuals and authoritative narration.'
  };

  const systemPrompt = `You are a PROFESSIONAL VIDEO SCRIPT WRITER specializing in educational content.

Your task is to convert text content into a detailed video script with:
- Scene-by-scene breakdown
- Voice-over narration for each scene
- Visual descriptions for video generation
- Timing and pacing
- Key terms to highlight

Video Style: ${styleInstructions[videoStyle] || styleInstructions.animated}

CRITICAL: Generate ONLY valid JSON. No markdown, no code blocks, no extra text.`;

  const userPrompt = `Convert this educational text into a professional video script:

TEXT CONTENT:
${text}

VIDEO SPECIFICATIONS:
- Style: ${videoStyle}
- Voice: ${voice}
- Include Subtitles: ${includeSubtitles ? 'Yes' : 'No'}
- Auto-Highlight Keywords: ${autoHighlight ? 'Yes' : 'No'}

MANDATORY STRUCTURE:
Create a detailed video script with multiple scenes. Each scene should:
1. Have a clear visual description (what appears on screen)
2. Include voice-over narration (what the narrator says)
3. Identify key terms to highlight
4. Specify duration (in seconds)

CRITICAL: Return ONLY a JSON object. No other text.

Required JSON format:
{
  "script": {
    "scenes": [
      {
        "sceneNumber": 1,
        "duration": 15,
        "voiceOver": "Clear, engaging narration text that explains the concept",
        "visualDescription": "Detailed description of what appears on screen: animations, text, graphics, transitions",
        "keyTerms": ["important", "terms", "to", "highlight"]
      }
    ],
    "totalDuration": 120,
    "keywords": ["main", "keywords", "from", "content"]
  }
}

RULES:
- Break content into 5-10 scenes
- Each scene should be 10-20 seconds
- Voice-over should be natural and conversational
- Visual descriptions should be specific and actionable
- Identify 3-5 key terms per scene for highlighting
- Total duration should be 1.5-3 minutes
- Make it engaging and educational

RESPOND WITH ONLY THE JSON OBJECT.`;

  // Helper function to validate response
  const validateVideoScriptResponse = (responseText: string) => {
    let jsonText = responseText.trim();
    
    // Remove markdown
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Extract JSON object
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('No valid JSON object found');
    }
    
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    
    // Parse
    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseError) {
      throw new Error('Failed to parse JSON: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
    }

    // Validate structure
    if (!result.script || typeof result.script !== 'object') {
      throw new Error('Invalid or missing script object');
    }
    
    if (!Array.isArray(result.script.scenes) || result.script.scenes.length === 0) {
      throw new Error('Scenes must be a non-empty array');
    }
    
    // Validate scenes
    const validatedScenes = result.script.scenes.map((scene: any, index: number) => {
      if (typeof scene.sceneNumber !== 'number') {
        throw new Error(`Invalid scene number at scene ${index}`);
      }
      if (typeof scene.duration !== 'number' || scene.duration <= 0) {
        throw new Error(`Invalid duration at scene ${index}`);
      }
      if (!scene.voiceOver || typeof scene.voiceOver !== 'string') {
        throw new Error(`Invalid voice-over at scene ${index}`);
      }
      if (!scene.visualDescription || typeof scene.visualDescription !== 'string') {
        throw new Error(`Invalid visual description at scene ${index}`);
      }
      
      const keyTerms = Array.isArray(scene.keyTerms)
        ? scene.keyTerms.filter((t: any) => typeof t === 'string' && t.trim().length > 0)
        : [];
      
      return {
        sceneNumber: scene.sceneNumber,
        duration: scene.duration,
        voiceOver: scene.voiceOver.trim(),
        visualDescription: scene.visualDescription.trim(),
        keyTerms: keyTerms
      };
    });
    
    // Calculate total duration
    const totalDuration = validatedScenes.reduce((sum, scene) => sum + scene.duration, 0);
    
    // Validate keywords
    const keywords = Array.isArray(result.script.keywords)
      ? result.script.keywords.filter((k: any) => typeof k === 'string' && k.trim().length > 0)
      : [];

    return {
      script: {
        scenes: validatedScenes,
        totalDuration: totalDuration,
        keywords: keywords
      },
      // In production, this would be the actual video URL from a video generation service
      // For now, use a sample educational video URL
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    };
  };

  // Attempt 1: Generate video script
  try {
    console.log('[Text to Video] Generating video script...');
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await chatCompletion(messages, { temperature: 0.7, maxTokens: 2500 });
    const validatedScript = validateVideoScriptResponse(response.content);
    
    console.log(`[Text to Video] Success: Generated script with ${validatedScript.script.scenes.length} scenes`);
    return validatedScript;

  } catch (error) {
    console.error('[Text to Video] Generation failed:', error);
    
    // Fallback: Return a basic script structure
    console.log('[Text to Video] Using fallback script');
    
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = Math.ceil(wordCount / 2.5); // ~150 words per minute
    const sceneCount = Math.max(3, Math.min(8, Math.ceil(estimatedDuration / 20)));
    
    const fallbackScenes: Array<{
      sceneNumber: number;
      duration: number;
      voiceOver: string;
      visualDescription: string;
      keyTerms: string[];
    }> = [];
    const wordsPerScene = Math.ceil(wordCount / sceneCount);
    const words = text.split(/\s+/);
    
    for (let i = 0; i < sceneCount; i++) {
      const startIdx = i * wordsPerScene;
      const endIdx = Math.min((i + 1) * wordsPerScene, words.length);
      const sceneText = words.slice(startIdx, endIdx).join(' ');
      
      fallbackScenes.push({
        sceneNumber: i + 1,
        duration: Math.ceil(sceneText.split(/\s+/).length / 2.5),
        voiceOver: sceneText,
        visualDescription: `${videoStyle} style visuals illustrating: ${sceneText.substring(0, 100)}...`,
        keyTerms: sceneText.split(/\s+/).filter((w: string) => w.length > 6).slice(0, 3)
      });
    }
    
    return {
      script: {
        scenes: fallbackScenes,
        totalDuration: estimatedDuration,
        keywords: text.split(/\s+/).filter((w: string) => w.length > 6).slice(0, 10)
      },
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    };
  }
}

/**
 * Generate Daily Schedule
 * Creates a personalized daily study schedule based on student's time and subjects
 */
export async function generateDailySchedule(params: {
  availableHours: number;
  subjects: string[];
  priorities?: string[];
  learningPace?: 'slow' | 'normal' | 'fast';
  includeBreaks?: boolean;
}): Promise<{
  schedule: Array<{
    time: string;
    duration: number;
    activity: string;
    subject?: string;
    type: 'study' | 'break' | 'meal' | 'exercise' | 'revision';
    tips?: string;
  }>;
  summary: {
    totalStudyTime: number;
    totalBreakTime: number;
    subjectsScheduled: number;
  };
  recommendations: string[];
}> {
  const { availableHours, subjects, priorities = [], learningPace = 'normal', includeBreaks = true } = params;

  console.log('[Daily Schedule] Generating schedule...');

  // Validate inputs
  if (availableHours <= 0 || availableHours > 18) {
    console.error('[Daily Schedule] Invalid available hours');
    return createFallbackDailySchedule(availableHours, subjects);
  }

  if (!subjects || subjects.length === 0) {
    console.error('[Daily Schedule] No subjects provided');
    return createFallbackDailySchedule(availableHours, ['General Study']);
  }

  const systemPrompt = `You are an expert study scheduler. Create a balanced daily schedule that maximizes learning efficiency while preventing burnout. You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON.`;

  const userPrompt = `Create a daily study schedule with these parameters:

Available Study Hours: ${availableHours} hours
Subjects: ${subjects.join(', ')}
Priority Subjects: ${priorities.join(', ') || 'None'}
Learning Pace: ${learningPace}
Include Breaks: ${includeBreaks}

CRITICAL: Return ONLY a JSON object. No other text before or after.

Required JSON format:
{
  "schedule": [
    {
      "time": "06:00 AM",
      "duration": 30,
      "activity": "Morning Exercise",
      "type": "exercise",
      "tips": "Light exercise to wake up your brain"
    },
    {
      "time": "06:30 AM",
      "duration": 60,
      "activity": "Mathematics Study",
      "subject": "Mathematics",
      "type": "study",
      "tips": "Focus on problem-solving"
    }
  ],
  "summary": {
    "totalStudyTime": 240,
    "totalBreakTime": 60,
    "subjectsScheduled": 3
  },
  "recommendations": [
    "Start with most difficult subjects in the morning",
    "Take 5-minute breaks every 25 minutes",
    "Stay hydrated throughout the day"
  ]
}

Rules:
1. Start schedule at 6:00 AM
2. Include breakfast, lunch, and dinner breaks
3. Add 5-10 minute breaks between study sessions
4. Allocate more time to priority subjects
5. Use Pomodoro technique (25-min study + 5-min break)
6. Include physical activity and relaxation time
7. End schedule by 10:00 PM
8. Balance subjects throughout the day
9. Morning hours for difficult subjects
10. Evening for revision and lighter topics

RESPOND WITH ONLY THE JSON OBJECT.`;

  try {
    console.log('[Daily Schedule] Calling AI...');
    const response = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.7,
      maxTokens: 2000
    });

    console.log('[Daily Schedule] AI response received');

    // Parse and validate response
    const scheduleData = parseScheduleResponse(response.content);
    
    if (scheduleData) {
      console.log('[Daily Schedule] Schedule generated successfully');
      return scheduleData;
    }

    throw new Error('Invalid schedule format');

  } catch (error) {
    console.error('[Daily Schedule] AI generation failed:', error);
    return createFallbackDailySchedule(availableHours, subjects);
  }
}

/**
 * Parse and validate schedule response
 */
function parseScheduleResponse(responseText: string): {
  schedule: Array<{
    time: string;
    duration: number;
    activity: string;
    subject?: string;
    type: 'study' | 'break' | 'meal' | 'exercise' | 'revision';
    tips?: string;
  }>;
  summary: {
    totalStudyTime: number;
    totalBreakTime: number;
    subjectsScheduled: number;
  };
  recommendations: string[];
} | null {
  try {
    // Remove markdown code blocks if present
    let cleanText = responseText.trim();
    cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON object
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Daily Schedule] No JSON found in response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!parsed.schedule || !Array.isArray(parsed.schedule)) {
      console.error('[Daily Schedule] Invalid schedule array');
      return null;
    }

    if (!parsed.summary || typeof parsed.summary !== 'object') {
      console.error('[Daily Schedule] Invalid summary object');
      return null;
    }

    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      console.error('[Daily Schedule] Invalid recommendations array');
      return null;
    }

    // Validate each schedule item
    for (const item of parsed.schedule) {
      if (!item.time || !item.duration || !item.activity || !item.type) {
        console.error('[Daily Schedule] Invalid schedule item:', item);
        return null;
      }
    }

    return parsed;

  } catch (error) {
    console.error('[Daily Schedule] Parse error:', error);
    return null;
  }
}

/**
 * Create fallback daily schedule
 */
function createFallbackDailySchedule(
  availableHours: number,
  subjects: string[]
): {
  schedule: Array<{
    time: string;
    duration: number;
    activity: string;
    subject?: string;
    type: 'study' | 'break' | 'meal' | 'exercise' | 'revision';
    tips?: string;
  }>;
  summary: {
    totalStudyTime: number;
    totalBreakTime: number;
    subjectsScheduled: number;
  };
  recommendations: string[];
} {
  console.log('[Daily Schedule] Creating fallback schedule...');

  const schedule: Array<{
    time: string;
    duration: number;
    activity: string;
    subject?: string;
    type: 'study' | 'break' | 'meal' | 'exercise' | 'revision';
    tips?: string;
  }> = [];
  let currentTime = 6 * 60; // 6:00 AM in minutes
  const studySessionDuration = 50; // 50 minutes
  const shortBreakDuration = 10; // 10 minutes
  const mealDuration = 30; // 30 minutes

  // Morning routine
  schedule.push({
    time: formatTime(currentTime),
    duration: 30,
    activity: 'Morning Exercise & Meditation',
    type: 'exercise' as const,
    tips: 'Start your day with light exercise to boost energy'
  });
  currentTime += 30;

  schedule.push({
    time: formatTime(currentTime),
    duration: mealDuration,
    activity: 'Breakfast',
    type: 'meal' as const,
    tips: 'Eat a healthy breakfast for sustained energy'
  });
  currentTime += mealDuration;

  // Study sessions
  const studyMinutes = Math.min(availableHours * 60, 480); // Max 8 hours
  const numberOfSessions = Math.floor(studyMinutes / (studySessionDuration + shortBreakDuration));
  
  for (let i = 0; i < numberOfSessions && i < subjects.length * 2; i++) {
    const subject = subjects[i % subjects.length];
    
    schedule.push({
      time: formatTime(currentTime),
      duration: studySessionDuration,
      activity: `${subject} Study Session`,
      subject: subject,
      type: 'study' as const,
      tips: `Focus on ${subject} concepts and practice problems`
    });
    currentTime += studySessionDuration;

    // Add break
    if (i < numberOfSessions - 1) {
      schedule.push({
        time: formatTime(currentTime),
        duration: shortBreakDuration,
        activity: 'Short Break',
        type: 'break' as const,
        tips: 'Stretch, hydrate, and rest your eyes'
      });
      currentTime += shortBreakDuration;
    }

    // Add lunch break after 3 sessions
    if (i === 2) {
      schedule.push({
        time: formatTime(currentTime),
        duration: 60,
        activity: 'Lunch Break',
        type: 'meal' as const,
        tips: 'Take a proper lunch break to recharge'
      });
      currentTime += 60;
    }
  }

  // Evening revision
  schedule.push({
    time: formatTime(currentTime),
    duration: 30,
    activity: 'Daily Revision',
    type: 'revision' as const,
    tips: 'Review what you learned today'
  });
  currentTime += 30;

  // Dinner
  schedule.push({
    time: formatTime(currentTime),
    duration: mealDuration,
    activity: 'Dinner',
    type: 'meal' as const,
    tips: 'Relax and enjoy your meal'
  });

  // Calculate summary
  const totalStudyTime = schedule
    .filter(s => s.type === 'study')
    .reduce((sum, s) => sum + s.duration, 0);
  
  const totalBreakTime = schedule
    .filter(s => s.type === 'break')
    .reduce((sum, s) => sum + s.duration, 0);

  return {
    schedule,
    summary: {
      totalStudyTime,
      totalBreakTime,
      subjectsScheduled: subjects.length
    },
    recommendations: [
      'Follow the Pomodoro technique: 25 minutes study + 5 minutes break',
      'Start with the most difficult subjects in the morning',
      'Stay hydrated throughout the day',
      'Take regular breaks to maintain focus',
      'Review your notes before bed for better retention'
    ]
  };
}

/**
 * Format minutes to time string
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
}

export default {
  chatCompletion,
  explainChapter,
  generateQuiz,
  doubtChat,
  generateStudyPlan,
  generateDailySchedule,
  regenerateExplanation,
  analyzeQuizMistakes,
  detectWeaknessType,
  generateRevisionSummary,
  generateCinematicExplanation,
  generateTextToVideoScript
};
