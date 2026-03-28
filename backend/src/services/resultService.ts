import prisma from '../config/database';
import { SubmitAnswer } from '../types';
import { getAnswerMap, clearAnswerMap } from './sessionService';

function gradeAnswer(selected: string, correct: string): boolean {
  const sel = selected.trim().toLowerCase();

  // Handle multiple accepted answers (pipe-separated)
  if (correct.includes('|||')) {
    return correct.split('|||').some(c => sel === c.trim().toLowerCase());
  }

  return sel === correct.trim().toLowerCase();
}

export async function submitTest(studentId: string, testSessionId: string, answers: SubmitAnswer[]) {
  const activeSession = await prisma.activeSession.findFirst({
    where: { studentId, testSessionId, isActive: true },
  });

  const answerMap = getAnswerMap(studentId, testSessionId);

  let vocabCorrect = 0, vocabTotal = 0;
  let grammarCorrect = 0, grammarTotal = 0;

  const studentAnswers = answers.map(ans => {
    const correctAnswer = answerMap[ans.questionId] || '';
    // For multi-answer, use first answer as display
    const displayCorrect = correctAnswer.includes('|||') ? correctAnswer.split('|||')[0] : correctAnswer;
    const isCorrect = gradeAnswer(ans.selectedAnswer, correctAnswer);

    if (ans.questionType === 'VOCABULARY') {
      vocabTotal++;
      if (isCorrect) vocabCorrect++;
    } else {
      grammarTotal++;
      if (isCorrect) grammarCorrect++;
    }

    return {
      questionId: ans.questionId,
      questionType: ans.questionType,
      questionText: ans.questionText,
      selectedAnswer: ans.selectedAnswer,
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
