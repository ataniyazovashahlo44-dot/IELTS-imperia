import prisma from '../config/database';
import { SubmitAnswer } from '../types';
import { getAnswerMap, clearAnswerMap } from './sessionService';
import { loadAllExercises, loadExercisesFromGroups, loadPracticeQuestionsFromGroups } from '../utils/questionLoader';

function gradeAnswer(selected: string, correct: string): boolean {
  if (!selected || !correct) return false;

  const sel = selected.trim().toLowerCase();
  const cor = correct.trim().toLowerCase();

  // Normalize checkmarks and spaces
  const normalize = (s: string) => s
    .replace(/[✔️✅☑️]/g, '✓')
    .replace(/\s+/g, ' ') // Only reduce multiple spaces to one
    .trim()
    .toLowerCase();

  const nSel = normalize(sel);

  // Handle multiple accepted answers (pipe-separated)
  if (cor.includes('|||')) {
    return cor.split('|||').some(c => nSel === normalize(c.trim().toLowerCase()));
  }

  return nSel === normalize(cor);
}

export async function submitTest(studentId: string, testSessionId: string, answers: SubmitAnswer[]) {
  const [activeSession, testSession] = await Promise.all([
    prisma.activeSession.findFirst({
      where: { studentId, testSessionId, isActive: true },
    }),
    prisma.testSession.findUnique({
      where: { id: testSessionId },
      include: { sections: true },
    }),
  ]);

  if (!testSession) throw new Error('Test topilmadi');
  if (!activeSession) throw new Error('Aktiv sessiya topilmadi. Test allaqachon yakunlangan bo\'lishi mumkin');

  let selectedExercisesMap: Record<string, string[]> = {};
  let selectedQuestionsMap: Record<string, string[]> = {};
  try {
    selectedExercisesMap = JSON.parse(activeSession.selectedExercises);
    selectedQuestionsMap = JSON.parse((activeSession as any).selectedQuestions || '{}');
  } catch {
    throw new Error('Sessiya ma\'lumotlari buzilgan');
  }

  // Build the master list of all required questions by loading them
  const requiredQuestions: { questionId: string, questionType: 'VOCABULARY' | 'GRAMMAR', questionText: string, exactAnswer: string }[] = [];

  for (const sec of testSession.sections) {
    const variantGroups: string[] = JSON.parse(sec.variantGroups);
    const sectionType = (sec as unknown as { sectionType?: string }).sectionType || 'EXERCISE';
    const ids = selectedExercisesMap[String(sec.sectionOrder)] || [];

    if (sectionType === 'PRACTICE_TEST') {
      // Practice test: each ID is a single question file
      const pool = loadPracticeQuestionsFromGroups(sec.subject, variantGroups);
      for (const qId of ids) {
        const q = pool.find(pq => pq.id === qId);
        if (q) {
          requiredQuestions.push({
            questionId: q.id,
            questionType: sec.subject as 'VOCABULARY' | 'GRAMMAR',
            questionText: q.text,
            exactAnswer: q.answer,
          });
        }
      }
    } else {
      // Regular exercise section
      let pool;
      if (variantGroups.length === 5) {
        pool = loadAllExercises(sec.subject);
      } else {
        pool = loadExercisesFromGroups(sec.subject, variantGroups);
      }

      for (const exId of ids) {
        const ex = pool.find(e => e.id === exId);
        if (ex) {
          for (const q of ex.questions) {
            const anyQ = q as Record<string, unknown>;
            const blankCount = (q.text || '').split('___').length - 1;

            const baseQuestionId = `${ex.id}_${q.id}`;
            const allowedQuestions = selectedQuestionsMap[String(sec.sectionOrder)];

            if (allowedQuestions && !allowedQuestions.includes(baseQuestionId)) {
              continue; // Skip grading trimmed questions
            }

            if (blankCount > 1 && Array.isArray(anyQ.answers) && (anyQ.answers as string[]).length > 1) {
              // Multi-blank: each blank is a separate graded question
              for (let b = 0; b < blankCount; b++) {
                const blankAnswer = (anyQ.answers as string[])[b] || '';
                requiredQuestions.push({
                  questionId: `${baseQuestionId}_b${b}`,
                  questionType: sec.subject as 'VOCABULARY' | 'GRAMMAR',
                  questionText: q.text || '',
                  exactAnswer: blankAnswer,
                });
              }
            } else {
              // Single blank or alternative answers
              let exactAnswer = '';
              if (Array.isArray(anyQ.answers) && (anyQ.answers as string[]).length > 0) {
                exactAnswer = (anyQ.answers as string[]).join('|||');
              } else {
                exactAnswer = q.answer || '';
              }
              requiredQuestions.push({
                questionId: baseQuestionId,
                questionType: sec.subject as 'VOCABULARY' | 'GRAMMAR',
                questionText: q.text || '',
                exactAnswer,
              });
            }
          }
        }
      }
    }
  }

  const userAnswersMap = new Map(answers.map(a => [a.questionId, a]));

  let vocabCorrect = 0, vocabTotal = 0;
  let grammarCorrect = 0, grammarTotal = 0;

  const studentAnswers = requiredQuestions.map(rq => {
    const userAns = userAnswersMap.get(rq.questionId);
    const selectedAnswer = userAns ? userAns.selectedAnswer : '';

    const correctAnswer = rq.exactAnswer;
    const displayCorrect = correctAnswer.includes('|||') ? correctAnswer.split('|||')[0] : correctAnswer;
    const isCorrect = selectedAnswer ? gradeAnswer(selectedAnswer, correctAnswer) : false;

    if (rq.questionType === 'VOCABULARY') {
      vocabTotal++;
      if (isCorrect) vocabCorrect++;
    } else {
      grammarTotal++;
      if (isCorrect) grammarCorrect++;
    }

    if (rq.questionId.includes('grammar_5_10_016')) {
      console.log(`[Debug Mapping] RQ_ID: ${rq.questionId}, Found in Map: ${!!userAns}, Selected: "${selectedAnswer}"`);
    }

    return {
      questionId: rq.questionId,
      questionType: rq.questionType,
      questionText: rq.questionText,
      selectedAnswer,
      correctAnswer: displayCorrect,
      isCorrect,
    };
  });

  const vocabScore = vocabTotal > 0 ? (vocabCorrect / vocabTotal) * 100 : null;
  const grammarScore = grammarTotal > 0 ? (grammarCorrect / grammarTotal) * 100 : null;

  const totalCorrect = vocabCorrect + grammarCorrect;
  const totalQuestions = vocabTotal + grammarTotal;
  const totalScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  // Calculate attempt number
  const previousAttempts = await prisma.result.count({
    where: { studentId, testSessionId },
  });

  const result = await prisma.result.create({
    data: {
      studentId,
      testSessionId,
      attemptNumber: previousAttempts + 1,
      totalScore,
      vocabScore,
      grammarScore,
      vocabCorrect: vocabTotal > 0 ? vocabCorrect : null,
      vocabTotal: vocabTotal > 0 ? vocabTotal : null,
      grammarCorrect: grammarTotal > 0 ? grammarCorrect : null,
      grammarTotal: grammarTotal > 0 ? grammarTotal : null,
      isCompleted: true,
      answers: {
        create: studentAnswers,
      },
    },
    include: { answers: true },
  });

  // Deactivate session
  if (activeSession) {
    await prisma.activeSession.update({
      where: { id: activeSession.id },
      data: { isActive: false },
    });
  }

  clearAnswerMap(studentId, testSessionId);
  return result;
}

export async function getStudentResults(studentId: string) {
  return prisma.result.findMany({
    where: { studentId },
    include: {
      testSession: {
        include: { sections: { orderBy: { sectionOrder: 'asc' } } },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });
}

export async function getResultDetail(resultId: string, studentId: string) {
  const result = await prisma.result.findFirst({
    where: { id: resultId, studentId },
    include: {
      testSession: { include: { sections: { orderBy: { sectionOrder: 'asc' } } } },
      answers: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!result) throw new Error('Result not found');
  return result;
}

export async function getAllResultsForAdmin(adminId: string) {
  return prisma.result.findMany({
    where: { testSession: { createdBy: adminId } },
    include: {
      student: { select: { id: true, fullName: true, username: true, phoneNumber: true } },
      testSession: { select: { id: true, title: true, pinCode: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });
}

export async function getStudentsForAdmin(adminId: string) {
  const sessions = await prisma.testSession.findMany({
    where: { createdBy: adminId },
    select: { id: true },
  });
  const sessionIds = sessions.map(s => s.id);

  return prisma.user.findMany({
    where: {
      role: 'STUDENT',
      results: { some: { testSessionId: { in: sessionIds } } },
    },
    include: {
      _count: { select: { results: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
