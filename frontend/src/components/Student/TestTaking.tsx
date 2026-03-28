import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../../context/TestContext';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { studentApi } from '../../services/api';
import { connectSocket } from '../../services/socketClient';
import Timer from '../Common/Timer';
import ExerciseRenderer from './ExerciseRenderer';
import { ClientExercise, SubmitAnswer } from '../../types';

export default function TestTaking() {
  const { testSessionId, currentSection, title, sections, setAnswer, answers, getAllAnswers, goToNextSection } = useTest();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);

  useAntiCheat(testSessionId, true);

  useEffect(() => {
    if (!testSessionId) return;
    const socket = connectSocket();
    socket.emit('join_test_room', testSessionId);
    const interval = setInterval(() => socket.emit('heartbeat', { testSessionId }), 15000);
    return () => clearInterval(interval);
  }, [testSessionId]);

  // Reset exercise index when section changes
  useEffect(() => {
    setCurrentExerciseIdx(0);
  }, [currentSection?.sectionOrder]);

  const handleAnswer = useCallback((answer: SubmitAnswer) => {
    setAnswer(answer.questionId, answer);
  }, [setAnswer]);

  const submitSection = useCallback(async () => {
    if (!testSessionId || submitting) return;
    setSubmitting(true);
    try {
      const ord = currentSection?.sectionOrder ?? 1;
      const hasNext = sections.some(s => s.sectionOrder === ord + 1);
      if (hasNext) {
        const res = await studentApi.advanceSection(testSessionId);
        goToNextSection(res.data.data);
      } else {
        await studentApi.submitTest(testSessionId, getAllAnswers());
        goToNextSection(null);
        navigate('/student/results');
      }
    } catch {
      goToNextSection(null);
      navigate('/student/results');
    } finally {
      setSubmitting(false);
    }
  }, [testSessionId, submitting, currentSection, sections, getAllAnswers, goToNextSection, navigate]);

  if (!currentSection || !testSessionId) {
    navigate('/student');
    return null;
  }

  const exercises = currentSection.exercises as ClientExercise[];
  const currentExercise = exercises[currentExerciseIdx];

  // Count answered questions across all exercises in this section
  const allQuestionIds = exercises.flatMap(ex =>
    ex.questions.map(q => `${ex.id}_${q.id}`)
  );
  const answeredCount = allQuestionIds.filter(id => answers[id]).length;
  const totalCount = allQuestionIds.length;

  const isLast = !sections.some(s => s.sectionOrder === (currentSection.sectionOrder) + 1);

  const subjectBadge = currentSection.subject === 'GRAMMAR'
    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';

  // Count answered per exercise for the part buttons
  const exerciseAnsweredCounts = exercises.map(ex => {
    const ids = ex.questions.map(q => `${ex.id}_${q.id}`);
    return ids.filter(id => answers[id]).length;
  });

  return (
    <div className="h-screen flex flex-col bg-[#FDFDFD] dark:bg-gray-950 transition-colors font-sans overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 z-50">
        <div className="max-w-full mx-auto grid grid-cols-3 items-center">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white flex items-center">
              <span className="text-red-600 mr-0.5 transform -translate-y-1">♛</span>
              IELTS Imperia
            </span>
          </div>

          {/* Status badge */}
          <div className="flex justify-center">
            <div className={`flex items-center px-3 py-1 rounded-md border ${subjectBadge} border-current/20`}>
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {answeredCount}/{totalCount} answered
              </span>
            </div>
          </div>

          {/* Timer + Skip */}
          <div className="flex items-center justify-end gap-4">
            {/* Settings icon */}
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button
              onClick={submitSection}
              disabled={submitting}
              className="px-4 py-1.5 border border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg text-sm font-bold hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              {isLast ? 'Finish' : 'Skip'}
            </button>

            <Timer deadline={currentSection.deadline} onExpire={submitSection} />
          </div>
        </div>
      </div>

      {/* Main content — exercise renderer */}
      <main className="flex-1 overflow-hidden">
        {currentExercise && (
          <ExerciseRenderer
            key={`${currentSection.sectionOrder}-${currentExerciseIdx}`}
            exercise={currentExercise}
            answers={answers}
            onAnswer={handleAnswer}
          />
        )}
      </main>

      {/* Bottom navigation — Part buttons */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-3 px-6 flex justify-center items-center gap-2 z-40">
        <button
          onClick={() => setCurrentExerciseIdx(i => Math.max(0, i - 1))}
          disabled={currentExerciseIdx === 0}
          className="px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 disabled:opacity-20 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          &lsaquo; Prev
        </button>

        <div className="flex gap-1.5">
          {exercises.map((ex, i) => {
            const answered = exerciseAnsweredCounts[i];
            const total = ex.questions.length;
            const isCurrent = i === currentExerciseIdx;
            const isComplete = answered === total && total > 0;

            return (
              <button
                key={ex.id}
                onClick={() => setCurrentExerciseIdx(i)}
                title={`${answered}/${total} answered`}
                className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-[#E31E24] border-[#E31E24] text-white shadow-md'
                    : isComplete
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                {i + 1}-Part
              </button>
            );
          })}
        </div>

        {currentExerciseIdx < exercises.length - 1 ? (
          <button
            onClick={() => setCurrentExerciseIdx(i => Math.min(exercises.length - 1, i + 1))}
            className="px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Next &rsaquo;
          </button>
        ) : (
          <button
            onClick={submitSection}
            disabled={submitting}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 text-xs shadow-md transition-all"
          >
            {submitting ? 'Saving...' : isLast ? 'Submit ✓' : 'Next Section →'}
          </button>
        )}
      </div>
    </div>
  );
}
