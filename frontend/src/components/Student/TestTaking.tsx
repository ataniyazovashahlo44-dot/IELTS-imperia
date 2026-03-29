import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../../context/TestContext';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { studentApi } from '../../services/api';
import { connectSocket } from '../../services/socketClient';
import Timer from '../Common/Timer';
import ExerciseRenderer from './ExerciseRenderer';
import PracticeTestRenderer from './PracticeTestRenderer';
import { ClientExercise, ClientPracticeQuestion, SubmitAnswer } from '../../types';

export default function TestTaking() {
  const { phase, testSessionId, currentSection, title, sections, setAnswer, answers, getAllAnswers, goToNextSection } = useTest();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

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
        // Pass current answers when advancing to ensure they are saved in DB
        const res = await studentApi.advanceSection(testSessionId, getAllAnswers());
        goToNextSection(res.data.data);
      } else {
        const res = await studentApi.submitTest(testSessionId, getAllAnswers());
        if (res?.data?.data?.id) {
          navigate(`/student/results/${res.data.data.id}`, { replace: true });
        } else {
          navigate('/student/results', { replace: true });
        }
        goToNextSection(null);
      }
    } catch (err) {
      console.error('Submit/Advance error:', err);
      alert('Xatolik yuz berdi. Iltimos, internetingizni tekshirib qaytadan urinib ko\'ring.');
      // Do NOT navigate to results on failure, let student retry
    } finally {
      setSubmitting(false);
    }
  }, [testSessionId, submitting, currentSection, sections, getAllAnswers, goToNextSection, navigate]);

  // Periodic Auto-save (every 30 seconds)
  useEffect(() => {
    if (!testSessionId || phase !== 'in-section') return;
    const interval = setInterval(() => {
      studentApi.saveAnswers(testSessionId, getAllAnswers()).catch(e => console.warn('Autosave failed:', e));
    }, 30000);
    return () => clearInterval(interval);
  }, [testSessionId, getAllAnswers, phase]);

  useEffect(() => {
    if (phase === 'idle' && (!currentSection || !testSessionId)) {
      const timer = setTimeout(() => navigate('/student'), 100);
      return () => clearTimeout(timer);
    }
  }, [currentSection, testSessionId, navigate, phase]);

  if (!currentSection || !testSessionId) {
    return null;
  }

  const isPracticeTest = currentSection.sectionType === 'PRACTICE_TEST';
  const exercises = (!isPracticeTest ? (currentSection.exercises ?? []) : []) as ClientExercise[];
  const practiceQuestions = (isPracticeTest ? (currentSection.questions ?? []) : []) as ClientPracticeQuestion[];
  const currentExercise = !isPracticeTest ? exercises[currentExerciseIdx] : null;

  // Count answered questions
  const allQuestionIds = isPracticeTest
    ? practiceQuestions.map(q => q.id)
    : exercises.flatMap(ex => ex.questions.map(q => `${ex.id}_${q.id}`));
  const answeredCount = allQuestionIds.filter(id => answers[id]).length;
  const totalCount = allQuestionIds.length;

  const isLast = !sections.some(s => s.sectionOrder === (currentSection.sectionOrder) + 1);

  const subjectBadge = currentSection.subject === 'GRAMMAR'
    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';

  // Count answered per exercise for the part buttons (only for EXERCISE sections)
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
            <button
              onClick={() => setShowSettings(true)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
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

      {/* Main content */}
      <main className="flex-1 overflow-hidden" style={fontSize === 'large' ? { zoom: 1.15 } as React.CSSProperties : {}}>
        <div className="h-full relative overflow-hidden">
          {isPracticeTest ? (
            <PracticeTestRenderer
              key={`practice-${currentSection.sectionOrder}`}
              questions={practiceQuestions}
              subject={currentSection.subject}
              answers={answers}
              onAnswer={handleAnswer}
              onSubmit={submitSection}
              submitting={submitting}
              isLast={isLast}
            />
          ) : currentExercise ? (
            <ExerciseRenderer
              key={`${currentSection.sectionOrder}-${currentExerciseIdx}`}
              exercise={currentExercise}
              answers={answers}
              onAnswer={handleAnswer}
            />
          ) : null}
        </div>
      </main>

      {/* Bottom navigation — only for EXERCISE sections */}
      {!isPracticeTest && (
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-3 px-4 sm:px-6 flex justify-between items-center gap-2 z-40">
        {(
          // Exercise section: part navigation
          <>
            <button
              onClick={() => setCurrentExerciseIdx(i => Math.max(0, i - 1))}
              disabled={currentExerciseIdx === 0}
              className="flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 disabled:opacity-20 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              &lsaquo; Prev
            </button>

            <div className="flex-1 overflow-x-auto no-scrollbar flex items-center justify-start gap-1.5 px-2">
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
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-bold transition-all ${isCurrent
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
                className="flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Next &rsaquo;
              </button>
            ) : (
              <button
                onClick={submitSection}
                disabled={submitting}
                className="flex-shrink-0 px-4 py-1.5 sm:px-6 sm:py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 text-[11px] sm:text-xs shadow-md transition-all whitespace-nowrap"
              >
                {submitting ? 'Saving...' : isLast ? 'Submit ✓' : 'Next Section →'}
              </button>
            )}
          </>
        )}
      </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">Test Sozlamalari</h3>

            <div className="space-y-5">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Tungi rejim</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ko'zni toliqtirmaslik uchun</p>
                </div>
                <button
                  onClick={() => document.documentElement.classList.toggle('dark')}
                  className="w-12 h-6 bg-gray-200 dark:bg-emerald-600 rounded-full relative transition-colors"
                >
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 dark:translate-x-6 transition-transform shadow-sm" />
                </button>
              </div>

              {/* Font Size Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Matn o'lchami</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">O'qishga oson bo'lishi uchun</p>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1 w-24">
                  <button
                    onClick={() => setFontSize('normal')}
                    className={`px-2 py-1 flex-1 text-sm font-bold rounded-md transition-all ${fontSize === 'normal' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`px-2 py-1 flex-1 text-base font-black rounded-md transition-all ${fontSize === 'large' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    A+
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                {/* Fullscreen Toggle */}
                <button
                  onClick={() => {
                    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                    else document.exitFullscreen();
                  }}
                  className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  To'liq ekran rejimi
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
