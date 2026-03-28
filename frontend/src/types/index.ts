export type UserRole = 'ADMIN' | 'STUDENT';
export type SectionSubject = 'VOCABULARY' | 'GRAMMAR';
export type ExerciseType =
  | 'gap_fill'
  | 'mcq'
  | 'tfng'
  | 'matching'
  | 'error_correction'
  | 'sentence_transformation';

export const VARIANT_GROUPS = ['1_5', '5_10', '10_15', '15_20', '20_25'] as const;
export type VariantGroup = typeof VARIANT_GROUPS[number];

export const VARIANT_GROUP_LABELS: Record<VariantGroup, string> = {
  '1_5': 'Unit 1–5',
  '5_10': 'Unit 5–10',
  '10_15': 'Unit 10–15',
  '15_20': 'Unit 15–20',
  '20_25': 'Unit 20–25',
};

export interface User {
  id: string;
  fullName: string;
  username: string;
  phoneNumber: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// ─── Exercise / Question types (client-facing, no answers) ──────────────────

export interface ClientQuestion {
  id: number;
  text: string;
  options?: Record<string, string>; // MCQ
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

// ─── Section / Test types ───────────────────────────────────────────────────

export interface SectionConfig {
  subject: SectionSubject;
  variantGroups: string[];
  numberOfExercises: number;
  timeAllocated: number;
  sectionOrder: number;
}

export interface TestSection extends SectionConfig {
  id: string;
  testSessionId: string;
}

export interface TestSession {
  id: string;
  pinCode: string;
  title: string;
  maxAttempts: number;
  isActive: boolean;
  createdAt: string;
  sections: TestSection[];
  _count?: { results: number };
}

export interface CurrentSection {
  subject: SectionSubject;
  sectionOrder: number;
  deadline: string;
  exercises: ClientExercise[];
}

export interface JoinTestResponse {
  testSessionId: string;
  title: string;
  sections: SectionConfig[];
  currentSection: CurrentSection;
}

// ─── Results ────────────────────────────────────────────────────────────────

export interface StudentAnswer {
  id: string;
  questionId: string;
  questionType: SectionSubject;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface Result {
  id: string;
  studentId: string;
  testSessionId: string;
  attemptNumber: number;
  totalScore: number;
  vocabScore: number | null;
  grammarScore: number | null;
  vocabCorrect: number | null;
  vocabTotal: number | null;
  grammarCorrect: number | null;
  grammarTotal: number | null;
  submittedAt: string;
  isCompleted: boolean;
  testSession: TestSession;
  answers?: StudentAnswer[];
}

export interface LiveSession {
  id: string;
  studentId: string;
  testSessionId: string;
  pinCode: string;
  currentSubject: SectionSubject;
  sectionOrder: number;
  sectionDeadline: string;
  tabSwitchCount: number;
  lastActive: string;
  isActive: boolean;
  student: { fullName: string; username: string; phoneNumber?: string };
  testSession: { title: string; pinCode: string };
}

export interface SubmitAnswer {
  questionId: string;       // "exerciseId_questionNum"
  questionType: SectionSubject;
  selectedAnswer: string;
  questionText: string;
}
