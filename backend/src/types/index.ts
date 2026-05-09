import { Request } from 'express';

export type UserRole = 'ADMIN' | 'STUDENT';
export type SectionSubject = 'VOCABULARY' | 'GRAMMAR';
export type SectionType = 'EXERCISE' | 'PRACTICE_TEST';

export type ExerciseType =
  | 'gap_fill'
  | 'mcq'
  | 'tfng'
  | 'matching'
  | 'error_correction'
  | 'sentence_transformation';

export const VARIANT_GROUPS = ['1_5', '5_10', '10_15', '15_20', '20_25'] as const;
export type VariantGroup = typeof VARIANT_GROUPS[number];

export interface JwtPayload {
  userId: string;
  role: UserRole;
  username: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Exercise JSON Types ────────────────────────────────────────────────────

export interface BaseQuestion {
  id: number;
  text: string;
  answer: string;
  [key: string]: unknown; // allow extra fields (options, errorWord, stem, prompt, answers)
}

export interface McqQuestion extends BaseQuestion {
  options: Record<string, string>; // { "A": "...", "B": "...", "C": "...", "D": "..." }
}

export interface ErrorCorrectionQuestion extends BaseQuestion {
  errorWord: string;
}

export interface SentenceTransformationQuestion extends BaseQuestion {
  stem: string;
  prompt: string;
  answers?: string[]; // multiple accepted answers
}

export interface MatchingExerciseFields {
  leftLabel?: string;
  rightLabel?: string;
  options: Record<string, string>; // { "A": "meaning1", "B": "meaning2", ... }
}

export interface Exercise {
  id: string;                  // e.g. "grammar_1_5_001"
  subject: SectionSubject;     // "GRAMMAR" | "VOCABULARY"  (uppercase to match enum)
  variantGroup: VariantGroup;
  type: ExerciseType;
  title: string;
  instruction: string;
  passage: string | null;
  image?: string;              // relative path under uploads/, e.g. "question_images/foo.png"
  questions: BaseQuestion[];   // typed more specifically per type at runtime

  // Matching-specific (optional)
  leftLabel?: string;
  rightLabel?: string;
  options?: Record<string, string>;
}

// ─── Client-facing Exercise (no answers) ────────────────────────────────────

export interface ClientQuestion {
  id: number;
  text: string;
  options?: Record<string, string>; // MCQ options
  errorWord?: string;               // error_correction
  stem?: string;                    // sentence_transformation
  prompt?: string;                  // sentence_transformation
}

export interface ClientExercise {
  id: string;
  subject: SectionSubject;
  type: ExerciseType;
  title: string;
  instruction: string;
  passage: string | null;
  image?: string;              // relative path under uploads/, e.g. "question_images/foo.png"
  questions: ClientQuestion[];

  // Matching-specific
  leftLabel?: string;
  rightLabel?: string;
  options?: Record<string, string>;
}

// ─── Practice Test Question Types ───────────────────────────────────────────

export interface PracticeQuestion {
  id: string;                  // e.g. "practice_vocabulary_1_5_001"
  subject: SectionSubject;
  variantGroup: VariantGroup;
  text: string;
  options: string[];           // array of option texts (no A/B/C/D labels)
  answer: string;              // correct answer text
}

export interface ClientPracticeOption {
  label: string;               // "A" | "B" | "C" | "D"
  text: string;                // option text
}

export interface ClientPracticeQuestion {
  id: string;
  text: string;
  options: ClientPracticeOption[]; // shuffled, labelled — NO answer
}

// ─── Section Config (for test creation) ─────────────────────────────────────

export interface SectionConfig {
  subject: SectionSubject;
  sectionType: SectionType;
  selectionMode?: 'BY_EXERCISE' | 'BY_QUESTION';
  targetQuestionCount?: number;
  variantGroups: string[];     // ["1_5", "10_15"]
  numberOfExercises: number;   // for PRACTICE_TEST: number of questions
  timeAllocated: number;       // minutes
  sectionOrder: number;
}

// ─── Result Submission ──────────────────────────────────────────────────────

export interface SubmitAnswer {
  questionId: string;       // format: "exerciseId_questionNum" e.g. "grammar_1_5_001_3"
  questionType: SectionSubject;
  selectedAnswer: string;
  questionText: string;
}
