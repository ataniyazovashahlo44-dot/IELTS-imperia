import prisma from '../config/database';
import { SectionSubject } from '../types';
import {
  loadExercisesFromGroups,
  loadAllExercises,
  selectRandomExercises,
  buildClientExercises,
} from '../utils/questionLoader';
import { validatePinAndGetSections } from './testService';

// In-memory store for per-student answer maps during a test
// Key: `${studentId}_${testSessionId}`, Value: { questionKey -> correctAnswer }
const activeAnswerMaps = new Map<string, Record<string, string>>();

function mapKey(studentId: string, testSessionId: string) {
  return `${studentId}_${testSessionId}`;
}

export function storeAnswerMap(studentId: string, testSessionId: string, map: Record<string, string>): void {
  const key = mapKey(studentId, testSessionId);
  const existing = activeAnswerMaps.get(key) || {};
  activeAnswerMaps.set(key, { ...existing, ...map });
}

export function getAnswerMap(studentId: string, testSessionId: string): Record<string, string> {
  return activeAnswerMaps.get(mapKey(studentId, testSessionId)) || {};
}

export function clearAnswerMap(studentId: string, testSessionId: string): void {
  activeAnswerMaps.delete(mapKey(studentId, testSessionId));
}

// ─── Join Test ────────────────────────────────────────────────────────────────

export async function joinTest(studentId: string, pin: string) {
  // Check if already in an active test
  const existing = await prisma.activeSession.findFirst({
    where: { studentId, isActive: true },
  });
  if (existing) throw new Error('You are already in an active test');

  const session = await validatePinAndGetSections(pin);
  const sections = session.sections;

  if (sections.length === 0) throw new Error('Test has no sections configured');

  // Check attempt count
  const previousAttempts = await prisma.result.count({
    where: { studentId, testSessionId: session.id },
  });
  if (previousAttempts >= session.maxAttempts) {
    throw new Error(`Maximum attempts (${session.maxAttempts}) reached for this test`);
  }

  // Select random exercises for ALL sections upfront
  const selectedExercisesMap: Record<string, string[]> = {};
  const allAnswerMaps: Record<string, string> = {};

  for (const sec of sections) {
    const variantGroups: string[] = JSON.parse(sec.variantGroups);

    // Load pool: if "full" flag or all groups selected, load all
    let pool;
    if (variantGroups.length === 5) {
      pool = loadAllExercises(sec.subject);
    } else {
      pool = loadExercisesFromGroups(sec.subject, variantGroups);
    }

    const selected = selectRandomExercises(pool, sec.numberOfExercises);
    selectedExercisesMap[String(sec.sectionOrder)] = selected.map(e => e.id);

    // Build client exercises and collect answer maps
    const { answerMap } = buildClientExercises(selected);
    Object.assign(allAnswerMaps, answerMap);
  }

  // Store all answer maps for this student+test
  storeAnswerMap(studentId, session.id, allAnswerMaps);

  const firstSection = sections[0];
  const sectionDeadline = new Date(Date.now() + firstSection.timeAllocated * 60 * 1000);

  // Create active session with all selected exercise IDs
  await prisma.activeSession.create({
    data: {
      studentId,
      testSessionId: session.id,
      pinCode: pin,
      currentSubject: firstSection.subject as SectionSubject,
      sectionOrder: firstSection.sectionOrder,
      sectionDeadline,
      selectedExercises: JSON.stringify(selectedExercisesMap),
    },
  });

  // Build client payload for first section
  const firstExerciseIds = selectedExercisesMap[String(firstSection.sectionOrder)];
  const firstClientExercises = getClientExercisesForSection(firstSection, firstExerciseIds);

  return {
    testSessionId: session.id,
    title: session.title,
    sections: sections.map(s => ({
      subject: s.subject,
      variantGroups: JSON.parse(s.variantGroups),
      numberOfExercises: s.numberOfExercises,
      timeAllocated: s.timeAllocated,
      sectionOrder: s.sectionOrder,
    })),
    currentSection: {
      subject: firstSection.subject,
      sectionOrder: firstSection.sectionOrder,
      deadline: sectionDeadline,
      exercises: firstClientExercises,
    },
  };
}

// ─── Advance to next section ──────────────────────────────────────────────────

export async function advanceSection(studentId: string, testSessionId: string) {
  const activeSession = await prisma.activeSession.findFirst({
    where: { studentId, testSessionId, isActive: true },
  });
  if (!activeSession) throw new Error('No active session found');

  const allSections = await prisma.testSection.findMany({
    where: { testSessionId },
    orderBy: { sectionOrder: 'asc' },
  });

  const nextSection = allSections.find(s => s.sectionOrder === activeSession.sectionOrder + 1);

  if (!nextSection) {
    // No more sections — session ended
    await prisma.activeSession.update({
      where: { id: activeSession.id },
      data: { isActive: false },
    });
    return null;
  }

  const sectionDeadline = new Date(Date.now() + nextSection.timeAllocated * 60 * 1000);

  await prisma.activeSession.update({
    where: { id: activeSession.id },
    data: {
      currentSubject: nextSection.subject as SectionSubject,
      sectionOrder: nextSection.sectionOrder,
      sectionDeadline,
    },
  });

  // Get pre-selected exercise IDs for this section
  const selectedExercisesMap: Record<string, string[]> = JSON.parse(activeSession.selectedExercises);
  const exerciseIds = selectedExercisesMap[String(nextSection.sectionOrder)] || [];
  const clientExercises = getClientExercisesForSection(nextSection, exerciseIds);

  return {
    subject: nextSection.subject,
    sectionOrder: nextSection.sectionOrder,
    deadline: sectionDeadline,
    exercises: clientExercises,
  };
}

// ─── Internal: build client exercises for a section from stored IDs ─────────

function getClientExercisesForSection(
  section: { subject: string; variantGroups: string },
  exerciseIds: string[]
): unknown[] {
  const variantGroups: string[] = JSON.parse(section.variantGroups);

  let pool;
  if (variantGroups.length === 5) {
    pool = loadAllExercises(section.subject);
  } else {
    pool = loadExercisesFromGroups(section.subject, variantGroups);
  }

  // Filter to only the selected exercise IDs (preserving order)
  const selectedExercises = exerciseIds
    .map(id => pool.find(e => e.id === id))
    .filter(Boolean) as import('../types').Exercise[];

  const { clientExercises } = buildClientExercises(selectedExercises);
  return clientExercises;
}

// ─── Tab switch recording ───────────────────────────────────────────────────

export async function recordTabSwitch(studentId: string, testSessionId: string): Promise<number> {
  const updated = await prisma.activeSession.updateMany({
    where: { studentId, testSessionId, isActive: true },
    data: { tabSwitchCount: { increment: 1 }, lastActive: new Date() },
  });

  if (updated.count === 0) return 0;

  const session = await prisma.activeSession.findFirst({
    where: { studentId, testSessionId, isActive: true },
  });
  return session?.tabSwitchCount || 0;
}
