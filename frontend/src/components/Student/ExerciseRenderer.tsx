import React from 'react';
import { ClientExercise, ClientQuestion, SubmitAnswer } from '../../types';
import { uploadsURL } from '../../services/api';

interface Props {
  exercise: ClientExercise;
  answers: Record<string, SubmitAnswer>;
  onAnswer: (answer: SubmitAnswer) => void;
}

export default function ExerciseRenderer({ exercise, answers, onAnswer }: Props) {
  const getAnswer = (qId: number) => answers[`${exercise.id}_${qId}`]?.selectedAnswer || '';

  const recordAnswer = (q: ClientQuestion, value: string) => {
    onAnswer({
      questionId: `${exercise.id}_${q.id}`,
      questionType: exercise.subject.toUpperCase() as any,
      selectedAnswer: value,
      questionText: q.text,
    });
  };

  // ── Render passage (left panel) ─────────────────────────────────────────────
  const renderPassage = () => {
    if (!exercise.passage) return null;

    if (exercise.type === 'gap_fill') {
      // Render passage with inline inputs for each blank marker ___
      // Blanks are numbered in text as [1], [2], etc.
      const parts: React.ReactNode[] = [];
      let text = exercise.passage;
      let lastIndex = 0;

      exercise.questions.forEach(q => {
        const marker = `[${q.id}]`;
        const idx = text.indexOf(marker, lastIndex);
        if (idx === -1) return;

        if (idx > lastIndex) {
          parts.push(
            <span key={`t-${q.id}`} className="font-serif">
              {text.slice(lastIndex, idx)}
            </span>
          );
        }

        const val = getAnswer(q.id);
        parts.push(
          <span key={`inp-${q.id}`} className="inline-flex items-baseline gap-0.5 mx-0.5">
            <span className="text-gray-400 text-xs font-serif select-none">{q.id}</span>
            <input
              type="text"
              value={val}
              onChange={e => recordAnswer(q, e.target.value)}
              className={`border-b-2 bg-transparent font-serif px-1 w-64 text-[15px] focus:outline-none transition-all
                ${val
                  ? 'border-orange-400 text-gray-900 dark:text-gray-100'
                  : 'border-gray-300 dark:border-gray-600 text-gray-400'
                }
                focus:border-orange-500`}
              placeholder=""
            />
          </span>
        );

        lastIndex = idx + marker.length;
      });

      parts.push(
        <span key="end" className="font-serif">{text.slice(lastIndex)}</span>
      );

      return (
        <div className="font-serif text-gray-800 dark:text-gray-200 leading-[1.9] text-[16px]">
          {parts}
        </div>
      );
    }

    // Default passage — plain text with paragraph styling
    return (
      <div className="font-serif text-gray-800 dark:text-gray-200 leading-relaxed text-[16px] whitespace-pre-wrap">
        {exercise.passage}
      </div>
    );
  };

  // ── Render questions (right panel) ──────────────────────────────────────────
  const renderQuestions = () => {
    switch (exercise.type) {

      // ── GAP FILL ─────────────────────────────────────────────────────────────
      case 'gap_fill':
        return (
          <div className="space-y-6">
            <InstructionBox text={exercise.instruction} />
            {exercise.questions.map(q => {
              const val = getAnswer(q.id);
              const parts = q.text.split('___');

              return (
                <div key={q.id} className="flex items-start gap-3">
                  <span className="text-sm font-serif font-bold text-gray-900 dark:text-gray-100 flex-shrink-0 mt-0.5 w-5">
                    {q.id}.
                  </span>
                  <div className="flex-1">
                    <p className="text-[16px] font-serif text-gray-800 dark:text-gray-200 leading-relaxed inline">
                      {parts.map((part, i) => (
                        <span key={i}>
                          {part}
                          {i < parts.length - 1 && (
                            <input
                              type="text"
                              value={val}
                              onChange={e => recordAnswer(q, e.target.value)}
                              className={`border-b-2 bg-transparent font-serif px-1 mx-1 w-64 text-center text-[16px] focus:outline-none transition-all py-0.5 inline-block
                                ${val
                                  ? 'border-orange-400 text-gray-900 dark:text-gray-100 font-medium'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-400'
                                }
                                focus:border-orange-500`}
                              placeholder="..."
                            />
                          )}
                        </span>
                      ))}
                    </p>
                    {/* Fallback if question text does not contain ___ */}
                    {parts.length === 1 && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={val}
                          onChange={e => recordAnswer(q, e.target.value)}
                          className={`border-b-2 bg-transparent font-serif px-1 w-full text-[16px] focus:outline-none transition-all py-0.5
                            ${val
                              ? 'border-orange-400 text-gray-900 dark:text-gray-100'
                              : 'border-gray-300 dark:border-gray-600'
                            }
                            focus:border-orange-500`}
                          placeholder="Your answer..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );

      // ── MCQ ───────────────────────────────────────────────────────────────────
      case 'mcq':
        return (
          <div className="space-y-8">
            <InstructionBox text={exercise.instruction} />
            {exercise.questions.map(q => {
              const chosen = getAnswer(q.id);
              const opts = q.options || {};
              return (
                <div key={q.id} className="space-y-4">
                  <p className="text-[16px] font-serif font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                    <span className="mr-3 font-bold text-gray-500">{q.id}</span>
                    {q.text}
                  </p>
                  <div className="space-y-3 pl-6">
                    {Object.entries(opts).map(([key, value]) => {
                      const sel = chosen === key;
                      return (
                        <label key={key} className="relative group flex items-center gap-4 cursor-pointer transition-all">
                          <input
                            type="radio"
                            name={`${exercise.id}_${q.id}`}
                            value={key}
                            checked={sel}
                            onChange={() => recordAnswer(q, key)}
                            className="sr-only"
                          />
                          <span className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all
                            ${sel
                              ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                              : 'border-gray-200 dark:border-gray-700 text-gray-400 group-hover:border-gray-400'
                            }`}>
                            {key}
                          </span>
                          <span className={`text-[15px] font-serif transition-colors ${sel ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                            {value}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );

      // ── TRUE / FALSE / NOT GIVEN ───────────────────────────────────────────
      case 'tfng':
        return (
          <div className="space-y-6">
            <InstructionBox text={exercise.instruction} />
            {exercise.questions.map(q => {
              const chosen = getAnswer(q.id);
              return (
                <div key={q.id} className="space-y-3">
                  <p className="text-[15px] font-serif text-gray-800 dark:text-gray-200 leading-snug">
                    <span className="font-bold text-gray-500 mr-2">{q.id}</span>
                    {q.text}
                  </p>
                  <div className="flex gap-2 pl-5">
                    {(['TRUE', 'FALSE', 'NOT GIVEN'] as const).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => recordAnswer(q, opt)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${chosen === opt
                          ? opt === 'TRUE'
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                            : opt === 'FALSE'
                              ? 'bg-red-500 border-red-500 text-white shadow-md'
                              : 'bg-orange-500 border-orange-500 text-white shadow-md'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );

      // ── MATCHING ──────────────────────────────────────────────────────────────
      case 'matching': {
        const matchOptions = exercise.options || {};
        return (
          <div className="space-y-5">
            <InstructionBox text={exercise.instruction} />

            {/* Options reference box */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                {exercise.rightLabel || 'Options'}
              </p>
              <div className="space-y-1.5">
                {Object.entries(matchOptions).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm font-serif">
                    <span className="font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">{key}.</span>
                    <span className="text-gray-600 dark:text-gray-400">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions with dropdowns */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {exercise.leftLabel || 'Match each item'}
              </p>
              {exercise.questions.map(q => {
                const chosen = getAnswer(q.id);
                return (
                  <div key={q.id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-shrink-0 w-5">{q.id}.</span>
                    <span className="text-[15px] font-serif text-gray-700 dark:text-gray-300 flex-1">{q.text}</span>
                    <select
                      value={chosen}
                      onChange={e => recordAnswer(q, e.target.value)}
                      className={`border rounded-lg px-3 py-1.5 text-sm font-bold bg-white dark:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[80px]
                        ${chosen
                          ? 'border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-400'
                        }`}
                    >
                      <option value="" disabled>--</option>
                      {Object.keys(matchOptions).map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // ── ERROR CORRECTION ──────────────────────────────────────────────────────
      case 'error_correction':
        return (
          <div className="space-y-6">
            <InstructionBox text={exercise.instruction} />
            {exercise.questions.map(q => {
              const val = getAnswer(q.id);
              const errorWord = q.errorWord || '';

              // Highlight the error word in the sentence
              const parts = q.text.split(errorWord);
              const highlightedText = parts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < parts.length - 1 && (
                    <span className="underline decoration-red-400 decoration-2 text-red-600 dark:text-red-400 font-bold mx-0.5">
                      {errorWord}
                    </span>
                  )}
                </span>
              ));

              return (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-bold text-gray-500 flex-shrink-0 mt-0.5">{q.id}.</span>
                    <p className="text-[15px] font-serif text-gray-800 dark:text-gray-200 leading-relaxed">
                      {highlightedText}
                    </p>
                  </div>
                  <div className="pl-5 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium">Correction:</span>
                    <input
                      type="text"
                      value={val}
                      onChange={e => recordAnswer(q, e.target.value)}
                      className={`border-b-2 bg-transparent font-serif px-1 text-[15px] focus:outline-none transition-all w-40 py-0.5
                        ${val
                          ? 'border-emerald-400 text-gray-900 dark:text-gray-100'
                          : 'border-gray-300 dark:border-gray-600 text-gray-400'
                        }
                        focus:border-emerald-500`}
                      placeholder="Correct word..."
                    />
                    <button
                      type="button"
                      onClick={() => recordAnswer(q, '✓')}
                      className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-md transition-colors border border-gray-200 dark:border-gray-700 whitespace-nowrap shadow-sm"
                    >
                      Correct ✓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      // ── SENTENCE TRANSFORMATION ───────────────────────────────────────────────
      case 'sentence_transformation':
        return (
          <div className="space-y-8">
            <InstructionBox text={exercise.instruction} />
            {exercise.questions.map(q => {
              const val = getAnswer(q.id);
              const stem = q.stem || q.text;
              const prompt = q.prompt || '';

              // Render prompt with inline input replacing ___
              const promptParts = prompt.split('___');
              const promptContent = promptParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < promptParts.length - 1 && (
                    <input
                      type="text"
                      value={val}
                      onChange={e => recordAnswer(q, e.target.value)}
                      className={`border-b-2 bg-transparent font-serif px-1 mx-1 text-[15px] focus:outline-none transition-all w-[300px] py-0.5 inline-block
                        ${val
                          ? 'border-orange-400 text-gray-900 dark:text-gray-100'
                          : 'border-gray-300 dark:border-gray-600 text-gray-400'
                        }
                        focus:border-orange-500`}
                      placeholder="..."
                    />
                  )}
                </span>
              ));

              return (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-bold text-gray-500 flex-shrink-0 mt-0.5">{q.id}.</span>
                    <div className="flex-1 space-y-3">
                      {/* Original sentence */}
                      <p className="text-[15px] font-serif text-gray-600 dark:text-gray-400 italic leading-relaxed">
                        {stem}
                      </p>
                      {/* Prompt with blank */}
                      <p className="text-[15px] font-serif text-gray-800 dark:text-gray-200 leading-relaxed">
                        {prompt ? promptContent : (
                          <input
                            type="text"
                            value={val}
                            onChange={e => recordAnswer(q, e.target.value)}
                            className={`border-b-2 bg-transparent font-serif px-1 text-[15px] focus:outline-none transition-all w-full py-0.5
                              ${val
                                ? 'border-orange-400 text-gray-900 dark:text-gray-100'
                                : 'border-gray-300 dark:border-gray-600'
                              }
                              focus:border-orange-500`}
                            placeholder="Rewrite the sentence..."
                          />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      default:
        return <p className="text-gray-500 text-sm">Unknown question type: {exercise.type}</p>;
    }
  };

  const hasPassage = !!exercise.passage;
  const hasImage = !!exercise.image;
  const hasLeftPanel = hasPassage || hasImage;

  return (
    <div className="flex-1 h-full overflow-hidden bg-white dark:bg-gray-900">
      <div className="flex h-full overflow-hidden">

        {/* Left panel — passage or image */}
        {hasLeftPanel && (
          <div className="w-1/2 overflow-y-auto p-12 pr-16 border-r border-gray-100 dark:border-gray-800 custom-scrollbar">
            <div className="max-w-3xl ml-auto">
              <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6">
                {exercise.subject === 'GRAMMAR' ? 'GRAMMAR' : 'VOCABULARY'} · {exercise.type.replace('_', ' ').toUpperCase()}
              </p>
              <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-6">
                {exercise.title}
              </h2>

              {/* Image (chart, diagram, etc.) */}
              {hasImage && (
                <div className="mb-6">
                  <img
                    src={uploadsURL(exercise.image!)}
                    alt="Exercise visual"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm object-contain bg-white"
                    style={{ maxHeight: '420px' }}
                  />
                </div>
              )}

              {/* Passage text */}
              {hasPassage && (
                <div className="selection:bg-orange-100 dark:selection:bg-orange-950/40">
                  {renderPassage()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right panel — questions */}
        <div className={`${hasLeftPanel ? 'w-1/2' : 'w-full'} overflow-y-auto p-12 ${hasLeftPanel ? 'pl-16' : 'max-w-3xl mx-auto'} custom-scrollbar`}>
          <div className={hasLeftPanel ? 'max-w-3xl' : 'max-w-2xl mx-auto'}>
            {/* Title + instruction when no left panel */}
            {!hasLeftPanel && (
              <div className="mb-8">
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                  {exercise.subject} · {exercise.type.replace('_', ' ').toUpperCase()}
                </p>
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">
                  {exercise.title}
                </h2>
              </div>
            )}

            {renderQuestions()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared instruction box component ─────────────────────────────────────────
function InstructionBox({ text }: { text: string }) {
  return (
    <div className="p-4 border-l-4 border-orange-400 bg-orange-50/40 dark:bg-orange-950/20 mb-2">
      <p className="text-sm font-serif italic text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
        {text}
      </p>
    </div>
  );
}
