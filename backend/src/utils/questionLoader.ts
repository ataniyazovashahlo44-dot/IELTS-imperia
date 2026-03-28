import fs from 'fs';
import path from 'path';
import { Exercise, SectionSubject, VARIANT_GROUPS } from '../types';

const DB_DIR = path.resolve(__dirname, '../../question_database');

/**
 * Load all exercises from a single variant group folder.
 */
export function loadExercisesFromGroup(subject: string, group: string): Exercise[] {
  const subjectDir = subject.toLowerCase(); // "grammar" | "vocabulary"
  const dir = path.join(DB_DIR, subjectDir, group);

  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const exercises: Exercise[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const parsed = JSON.parse(raw) as Exercise;
      exercises.push(parsed);
    } catch (err) {
      console.error(`Failed to parse exercise file: ${subjectDir}/${group}/${file}`, err);
    }
  }

  return exercises;
}

/**
 * Load exercises from multiple variant groups (merged pool).
 */
export function loadExercisesFromGroups(subject: string, groups: string[]): Exercise[] {
  const all: Exercise[] = [];
  for (const group of groups) {
    all.push(...loadExercisesFromGroup(subject, group));
  }
  return all;
}

/**
 * Load exercises from ALL variant groups (Full MOC).
 */
export function loadAllExercises(subject: string): Exercise[] {
  return loadExercisesFromGroups(subject, [...VARIANT_GROUPS]);
}

/**
 * Fisher-Yates shuffle.
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Randomly select N unique exercises from a pool.
 */
export function selectRandomExercises(pool: Exercise[], count: number): Exercise[] {
  if (count >= pool.length) return shuffle(pool);
  return shuffle(pool).slice(0, count);
}

/**
 * Count available exercises for a given subject + variant groups.
 */
export function countAvailableExercises(subject: string, groups: string[]): number {
  return loadExercisesFromGroups(subject, groups).length;
}

/**
 * Build client-safe exercise payload (strip answers).
 * Returns: { clientExercises, answerMap }
 */
export function buildClientExercises(exercises: Exercise[]): {
  clientExercises: Array<{
    id: string;
    subject: SectionSubject;
    type: string;
    title: string;
    instruction: string;
    passage: string | null;
    questions: Array<Record<string, unknown>>;
    leftLabel?: string;
    rightLabel?: string;
    options?: Record<string, string>;
  }>;
  answerMap: Record<string, string>; // "exerciseId_questionId" -> correct answer
} {
  const clientExercises: Array<{
    id: string;
    subject: SectionSubject;
    type: string;
    title: string;
    instruction: string;
    passage: string | null;
    questions: Array<Record<string, unknown>>;
    leftLabel?: string;
    rightLabel?: string;
    options?: Record<string, string>;
  }> = [];
  const answerMap: Record<string, string> = {};

  for (const ex of exercises) {
    const clientQuestions: Array<Record<string, unknown>> = [];

    for (const q of ex.questions) {
      const answerKey = `${ex.id}_${q.id}`;

      // Store correct answer (handle multiple accepted answers for sentence_transformation)
      const anyQ = q as Record<string, unknown>;
      if (Array.isArray(anyQ.answers) && anyQ.answers.length > 0) {
        // Store first answer as primary, all as pipe-separated for multi-match
        answerMap[answerKey] = (anyQ.answers as string[]).join('|||');
      } else {
        answerMap[answerKey] = q.answer;
      }

      // Build client question (no answer fields)
      const clientQ: Record<string, unknown> = {
        id: q.id,
        text: q.text,
      };

      if (ex.type === 'mcq') {
        clientQ.options = (q as Record<string, unknown>).options;
      }

      if (ex.type === 'error_correction') {
        clientQ.errorWord = (q as Record<string, unknown>).errorWord;
      }

      if (ex.type === 'sentence_transformation') {
        clientQ.stem = (q as Record<string, unknown>).stem;
        clientQ.prompt = (q as Record<string, unknown>).prompt;
      }

      clientQuestions.push(clientQ);
    }

    const clientEx: {
      id: string;
      subject: SectionSubject;
      type: string;
      title: string;
      instruction: string;
      passage: string | null;
      image?: string;
      questions: Array<Record<string, unknown>>;
      leftLabel?: string;
      rightLabel?: string;
      options?: Record<string, string>;
    } = {
      id: ex.id,
      subject: ex.subject,
      type: ex.type,
      title: ex.title,
      instruction: ex.instruction,
      passage: ex.passage,
      questions: clientQuestions,
    };

    if (ex.image) clientEx.image = ex.image;

    // Matching-specific fields
    if (ex.type === 'matching') {
      clientEx.leftLabel = ex.leftLabel;
      clientEx.rightLabel = ex.rightLabel;
      clientEx.options = ex.options;
    }

    clientExercises.push(clientEx);
  }

  return { clientExercises, answerMap };
}
