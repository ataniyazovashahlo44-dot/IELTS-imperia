import React from 'react';
import { ClientExercise, ClientQuestion, SubmitAnswer } from '../../types';
import { uploadsURL } from '../../services/api';

interface Props {
  exercise: ClientExercise;
  answers: Record<string, SubmitAnswer>;
  onAnswer: (answer: SubmitAnswer) => void;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
}

// ── Shared Components ────────────────────────────────────────────────────────
const QuestionBadge = ({ id }: { id: number | string }) => (
  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-[11px] font-black select-none shrink-0 align-middle shadow-sm shadow-orange-500/20">
    {id}
  </span>
);

function InstructionBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="p-5 border-l-4 border-orange-500 bg-orange-50/30 dark:bg-orange-950/20 rounded-r-2xl mb-8">
      <p className="text-[15px] font-serif italic text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
        {text}
      </p>
    </div>
  );
}

// ── Dialogue Utils ────────────────────────────────────────────────────────────
interface SpeakerLine {
  speaker: string;
  text: string;
}

function parseDialogue(raw: string | undefined | null): SpeakerLine[] | null {
  if (!raw) return null;
  const re = /(\d+\s+[A-Z]:|[A-Z][a-z]{2,}:|[A-Z]:)\s/g;
  const matches = raw.match(re);
  if (!matches || matches.length < 2) return null;

  const lines: SpeakerLine[] = [];
  let lastIndex = 0;
  let lastSpeaker = '';
  let match: RegExpExecArray | null;

  try {
    re.lastIndex = 0;
    while ((match = re.exec(raw)) !== null) {
      if (lastSpeaker && match.index > lastIndex) {
        lines.push({ speaker: lastSpeaker, text: raw.slice(lastIndex, match.index).trim() });
      }
      lastSpeaker = match[1].replace(':', '').trim();
      lastIndex = match.index + match[0].length;
    }
    if (lastSpeaker && lastIndex < raw.length) {
      lines.push({ speaker: lastSpeaker, text: raw.slice(lastIndex).trim() });
    }
  } catch (e) {
    console.error("Dialogue parse error:", e);
    return null;
  }
  return lines.length >= 2 ? lines : null;
}

// ── Contextual Components ─────────────────────────────────────────────────────
function DialoguePassageWithInputs({ lines, questions, getAnswer, recordAnswer }: {
  lines: SpeakerLine[];
  questions: ClientQuestion[];
  getAnswer: (id: number) => string;
  recordAnswer: (q: ClientQuestion, v: string) => void;
}) {
  const sortedQs = [...(questions || [])].sort((a, b) => (a?.id || 0) - (b?.id || 0));

  const lineBlankMaps: ClientQuestion[][] = (() => {
    let qIdx = 0;
    return lines.map(line => {
      const markerCount = (line.text?.match(/___|\[\d+\]/g) || []).length;
      const qs: ClientQuestion[] = [];
      for (let b = 0; b < markerCount; b++) {
        if (sortedQs[qIdx]) qs.push(sortedQs[qIdx]);
        qIdx++;
      }
      return qs;
    });
  })();

  const renderContent = (str: string, lineQs: ClientQuestion[]) => {
    const hintRe = /\(([^)]+)\)/g;
    const markerRe = /(?:(\d+)\s+)?(?:\[(\d+)\]|___)/g;

    let parts: React.ReactNode[] = [];
    let qPtr = 0;
    let lastIndex = 0;
    let partKey = 0;
    let match;

    while ((match = markerRe.exec(str || '')) !== null) {
      const matchIndex = match.index;

      // Add text before the marker
      if (matchIndex > lastIndex) {
        const txt = str.slice(lastIndex, matchIndex);
        const hintNodes: React.ReactNode[] = [];
        let li = 0;
        let hMatch;
        hintRe.lastIndex = 0;
        while ((hMatch = hintRe.exec(txt)) !== null) {
          if (hMatch.index > li) hintNodes.push(<span key={`t${li}`}>{txt.slice(li, hMatch.index)}</span>);
          hintNodes.push(
            <span key={`h${hMatch.index}`} className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 text-[13px] font-semibold align-middle whitespace-nowrap">
              {hMatch[1]}
            </span>
          );
          li = hMatch.index + hMatch[0].length;
        }
        if (li < txt.length) hintNodes.push(<span key="end">{txt.slice(li)}</span>);
        parts.push(<span key={`seg-${partKey++}`}>{hintNodes}</span>);
      }

      const q = lineQs[qPtr++];
      if (q) {
        const precedingNum = match[1];
        if (precedingNum && parseInt(precedingNum) !== q.id) {
          parts.push(<span key={`pfx-${partKey++}`} className="font-serif">{precedingNum} </span>);
        }

        const val = getAnswer(q.id);
        parts.push(
          <span key={`q-${q.id}`} className="inline-flex items-center gap-2 mx-1 align-baseline relative top-[2px]">
            <QuestionBadge id={q.id} />
            <input
              type="text"
              value={val}
              onChange={e => recordAnswer(q, e.target.value)}
              className={`border-b-2 bg-transparent font-serif px-1 w-96 text-[15px] focus:outline-none transition-colors 
                    ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                    focus:border-orange-500`}
            />
          </span>
        );
      } else {
        parts.push(<span key={`m-${partKey++}`} className="text-gray-400">{match[0]}</span>);
      }

      lastIndex = matchIndex + match[0].length;
    }

    // Add remaining text after the last marker
    if (lastIndex < str.length) {
      const txt = str.slice(lastIndex);
      const hintNodes: React.ReactNode[] = [];
      let li = 0;
      let hMatch;
      hintRe.lastIndex = 0;
      while ((hMatch = hintRe.exec(txt)) !== null) {
        if (hMatch.index > li) hintNodes.push(<span key={`t${li}`}>{txt.slice(li, hMatch.index)}</span>);
        hintNodes.push(
          <span key={`h${hMatch.index}`} className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 text-[13px] font-semibold align-middle whitespace-nowrap">
            {hMatch[1]}
          </span>
        );
        li = hMatch.index + hMatch[0].length;
      }
      if (li < txt.length) hintNodes.push(<span key="end">{txt.slice(li)}</span>);
      parts.push(<span key={`seg-${partKey++}`}>{hintNodes}</span>);
    }

    return parts;
  };

  return (
    <div className="space-y-6">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-4">
          <span className="text-sm font-black text-orange-500 dark:text-orange-400 uppercase tracking-widest flex-shrink-0 w-20 pt-1 text-right">
            {line.speaker}:
          </span>
          <p className="font-serif text-gray-800 dark:text-gray-200 leading-[2.6] text-[17px] flex-1">
            {renderContent(line.text, lineBlankMaps[i])}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ExerciseRenderer({ exercise, answers, onAnswer, isFlagged = false, onToggleFlag }: Props) {
  if (!exercise) return null;

  const getAnswer = (qId: number) => answers[`${exercise.id}_${qId}`]?.selectedAnswer || '';
  const recordAnswer = (q: ClientQuestion, value: string) => {
    if (!q) return;
    onAnswer({
      questionId: `${exercise.id}_${q.id}`,
      questionType: (exercise.subject?.toUpperCase() as any) || 'GRAMMAR',
      selectedAnswer: value,
      questionText: q.text,
    });
  };

  const subjectLabel = exercise.subject?.toUpperCase() || 'GRAMMAR';
  const hasInlineMarkers = !!exercise.passage && /\[\d+\]/.test(exercise.passage);
  const dialogueLines = parseDialogue(exercise.passage);
  const isDialogue = !!dialogueLines;

  const renderPassage = () => {
    if (!exercise.passage) return null;
    const text = exercise.passage;

    // A. Dialogue
    if (isDialogue && exercise.type === 'gap_fill') {
      return (
        <DialoguePassageWithInputs
          lines={dialogueLines!}
          questions={exercise.questions || []}
          getAnswer={getAnswer}
          recordAnswer={recordAnswer}
        />
      );
    }

    // B. Inline Markers ([1], [2], ...)
    if (hasInlineMarkers && exercise.type === 'gap_fill') {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let partKey = 0;
      const markerRegex = /(?:(\d+)\s+)?\[(\d+)\]/g;
      let match;

      while ((match = markerRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const precedingNum = match[1];
        const qIdStr = match[2];
        const qId = parseInt(qIdStr);
        const matchIndex = match.index;

        if (matchIndex > lastIndex) {
          parts.push(<span key={`t-${partKey++}`} className="font-serif">{text.slice(lastIndex, matchIndex)}</span>);
        }

        const q = (exercise.questions || []).find(qu => qu.id === qId);
        if (q) {
          if (precedingNum && parseInt(precedingNum) !== qId) {
            parts.push(<span key={`pfx-${partKey++}`} className="font-serif">{precedingNum} </span>);
          }
          const val = getAnswer(qId);
          parts.push(
            <span key={`input-grp-${qId}`} className="inline-flex items-center gap-2 mx-1 align-baseline relative top-[2px]">
              <QuestionBadge id={qId} />
              <input
                type="text"
                value={val}
                onChange={e => recordAnswer(q, e.target.value)}
                className={`border-b-2 bg-transparent font-serif px-1 w-96 text-[16px] focus:outline-none transition-colors 
                  ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                  focus:border-orange-500`}
                placeholder=" "
              />
            </span>
          );
        } else {
          parts.push(<span key={`m-${partKey++}`} className="text-gray-400">{fullMatch}</span>);
        }
        lastIndex = matchIndex + fullMatch.length;
      }
      parts.push(<span key="end" className="font-serif">{text.slice(lastIndex)}</span>);

      return (
        <div className="font-serif text-gray-800 dark:text-gray-200 leading-[2.8] text-[17px] whitespace-pre-wrap">
          {parts}
        </div>
      );
    }

    // D. MCQ passage — mask answers with inline inputs
    if (exercise.type === 'mcq') {
      const questions = [...(exercise.questions || [])].sort((a, b) => a.id - b.id);
      let sections: Array<{ type: 'text', content: string } | { type: 'input', q: ClientQuestion }> = [{ type: 'text', content: text }];

      for (const q of questions) {
        // Get before/after surrounding the blank from q.text
        const parts = (q.text || '').split('___');
        if (parts.length < 2) continue;
        const before = parts[0].replace(/^\.\.\./, '').trim();
        const after = parts[parts.length - 1].replace(/\.$/, '').replace(/,$/, '').trim();

        // Find any option value currently visible in passage and replace it
        const allOptionValues = Object.values(q.options || {}) as string[];

        const newSections: typeof sections = [];
        for (const sec of sections) {
          if (sec.type !== 'text') { newSections.push(sec); continue; }
          let replaced = false;
          for (const optVal of allOptionValues) {
            // Build a regex that finds the answer surrounded by its context
            const before3 = before.slice(-30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
            const after3 = after.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
            const escapedOpt = optVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pat = before3
              ? new RegExp(`(${before3}\\s*)${escapedOpt}(\\s*${after3 || ''})`)
              : new RegExp(`${escapedOpt}(\\s*${after3})`);
            const m = sec.content.match(pat);
            if (m && m.index !== undefined) {
              const startIdx = m.index + (before3 ? m[1].length : 0);
              const endIdx = startIdx + optVal.length;
              const before_text = sec.content.slice(0, startIdx);
              const after_text = sec.content.slice(endIdx);
              newSections.push({ type: 'text', content: before_text });
              newSections.push({ type: 'input', q });
              newSections.push({ type: 'text', content: after_text });
              replaced = true;
              break;
            }
          }
          if (!replaced) newSections.push(sec);
        }
        sections = newSections;
      }

      return (
        <div className="font-serif text-gray-800 dark:text-gray-200 leading-[2.8] text-[17px] whitespace-pre-wrap">
          {sections.map((sec, i) => {
            if (sec.type === 'text') return <span key={`t-${i}`}>{sec.content}</span>;
            const q = sec.q;
            const val = getAnswer(q.id);
            return (
              <span key={`inp-${q.id}`} className="inline-flex items-center gap-2 mx-1 align-baseline relative top-[2px]">
                <QuestionBadge id={q.id} />
                <span className={`border-b-2 font-serif px-1 min-w-[120px] inline-block text-[15px] text-center
                  ${val ? 'border-orange-500 text-orange-700 dark:text-orange-300 font-semibold' : 'border-gray-400 dark:border-gray-500 text-transparent select-none'}`}>
                  {val || '　　　　　　'}
                </span>
              </span>
            );
          })}
        </div>
      );
    }

    // C. Static Text
    return (
      <div className="font-serif text-gray-800 dark:text-gray-200 leading-[2.2] text-[17px] whitespace-pre-wrap">
        {text}
      </div>
    );
  };

  const renderQuestions = () => {
    const questions = exercise.questions || [];
    switch (exercise.type) {
      case 'mcq':
        return (
          <div className="space-y-8">
            {questions.map((q) => (
              <div key={q.id} className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <QuestionBadge id={q.id} />
                  <p className="text-gray-800 dark:text-gray-200 font-serif text-lg leading-relaxed pt-0.5">
                    {q.text}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 ml-12">
                  {Object.entries(q.options || {}).map(([optKey, optValue]) => {
                    const isSelected = getAnswer(q.id) === optKey;
                    return (
                      <button
                        key={optKey}
                        onClick={() => recordAnswer(q, optKey)}
                        className={`group flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                          ${isSelected
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                            : 'border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 bg-gray-50/50 dark:bg-gray-900/30'}`}
                      >
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold
                          ${isSelected
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 text-gray-400 group-hover:border-orange-300'}`}
                        >
                          {optKey}
                        </span>
                        <span className={`font-serif ${isSelected ? 'text-orange-900 dark:text-orange-100' : 'text-gray-700 dark:text-gray-300'}`}>
                          {optValue as string}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );

      case 'gap_fill':
        // If passage handled it, don't show questions again
        if (hasInlineMarkers || isDialogue) return null;
        return (
          <div className="space-y-6">
            {questions.map(q => {
              const cleanText = q.text?.replace(/^\d+\.\s*/, '') || '';
              const parts = cleanText.split('___');
              const val = getAnswer(q.id);
              return (
                <div key={q.id} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="flex items-start gap-4">
                    <QuestionBadge id={q.id} />
                    <div className="flex-1">
                      {parts.length > 1 ? (
                        <p className="font-serif text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                          {parts[0]}
                          <input
                            type="text"
                            value={val}
                            onChange={e => recordAnswer(q, e.target.value)}
                            className={`border-b-2 bg-transparent font-serif px-2 mx-1 w-96 focus:outline-none transition-colors
                              ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                              focus:border-orange-500`}
                          />
                          {parts[1]}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-serif text-gray-800 dark:text-gray-200 text-lg">{cleanText}</p>
                          <input
                            type="text"
                            value={val}
                            onChange={e => recordAnswer(q, e.target.value)}
                            className={`border-b-2 bg-transparent font-serif px-2 w-full max-w-xl focus:outline-none transition-colors
                              ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                              focus:border-orange-500`}
                            placeholder="Type your answer here..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'error_correction':
        return (
          <div className="space-y-6">
            {questions.map(q => {
              const val = getAnswer(q.id);
              return (
                <div key={q.id} className="py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="flex items-start gap-4">
                    <QuestionBadge id={q.id} />
                    <div className="flex-1 space-y-4">
                      <p className="font-serif text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                        {q.text}
                      </p>
                      <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-24 flex-shrink-0">Correction:</span>
                        <input
                          type="text"
                          value={val}
                          onChange={e => recordAnswer(q, e.target.value)}
                          className={`flex-1 border-b-2 bg-transparent font-serif px-2 focus:outline-none transition-colors
                              ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                              focus:border-orange-500`}
                          placeholder="To'g'ri shaklni yozing..."
                        />
                        <button
                          type="button"
                          onClick={() => recordAnswer(q, val === '✓' ? '' : '✓')}
                          title="Bu gap to'g'ri (✓)"
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all select-none ${val === '✓'
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                            }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Correct
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'tfng':
      case 'matching':
        return (
          <div className="space-y-6">
            {questions.map(q => (
              <div key={q.id} className="p-5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                <div className="flex gap-4 mb-4">
                  <QuestionBadge id={q.id} />
                  <p className="text-gray-800 dark:text-gray-200 font-serif text-lg">
                    {q.text}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 ml-11">
                  {exercise.type === 'tfng' ? (
                    ['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => recordAnswer(q, opt)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all
                          ${getAnswer(q.id) === opt
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:border-orange-200'}`}
                      >
                        {opt}
                      </button>
                    ))
                  ) : (
                    Object.entries(exercise.options || q.options || {}).map(([optKey, optValue]) => (
                      <button
                        key={optKey}
                        onClick={() => recordAnswer(q, optKey)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all
                          ${getAnswer(q.id) === optKey
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:border-orange-200'}`}
                      >
                        {optKey}: {optValue as string}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'sentence_transformation':
        return (
          <div className="space-y-6">
            {questions.map(q => {
              const val = getAnswer(q.id);
              const parts = (q.prompt || q.text || '').split('___');
              return (
                <div key={q.id} className="py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="flex items-start gap-4">
                    <QuestionBadge id={q.id} />
                    <div className="flex-1 space-y-3">
                      {q.stem && (
                        <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                          <p className="font-serif italic text-gray-700 dark:text-gray-300 text-[17px]">
                            {q.stem}
                          </p>
                        </div>
                      )}

                      {parts.length > 1 ? (
                        <p className="font-serif text-gray-800 dark:text-gray-200 text-lg leading-relaxed pt-2">
                          {parts[0]}
                          <input
                            type="text"
                            value={val}
                            onChange={e => recordAnswer(q, e.target.value)}
                            className={`border-b-2 bg-transparent font-serif px-2 mx-1 w-96 focus:outline-none transition-colors
                              ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                              focus:border-orange-500`}
                          />
                          {parts[1]}
                        </p>
                      ) : (
                        <div className="space-y-2 pt-2">
                          <p className="font-serif text-gray-800 dark:text-gray-200 text-lg">{q.prompt || q.text}</p>
                          <input
                            type="text"
                            value={val}
                            onChange={e => recordAnswer(q, e.target.value)}
                            className={`border-b-2 bg-transparent font-serif px-2 w-full max-w-xl focus:outline-none transition-colors
                              ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                              focus:border-orange-500`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      default:
        return <p className="text-gray-500 text-sm italic">Type "{exercise.type}" support is pending.</p>;
    }
  };

  const hasLeftPanel = (!!exercise.passage || !!exercise.image);
  const isTwoPanel = (exercise.type === 'mcq' || exercise.type === 'tfng' || exercise.type === 'matching' || exercise.type === 'error_correction' || exercise.type === 'sentence_transformation' || (exercise.type === 'gap_fill' && !hasInlineMarkers && !isDialogue)) && hasLeftPanel;
  const passageHandlesAnswers = exercise.type === 'gap_fill' && !!exercise.passage && (hasInlineMarkers || isDialogue);

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 bg-[#FDFDFD] dark:bg-gray-950 overflow-hidden">
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 shadow-2xl border-x border-gray-100 dark:border-gray-800 overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {isTwoPanel ? (
            <div className="flex-1 flex overflow-hidden">
              <div className="w-1/2 border-r border-gray-100 dark:border-gray-800 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-gray-900/50 p-6 lg:p-10">
                {headerBlock(exercise, isFlagged, onToggleFlag, subjectLabel)}
                <InstructionBox text={exercise.instruction} />
                {exercise.image && (
                  <div className="mb-10 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg">
                    <img src={`${uploadsURL}/${exercise.image}`} alt={exercise.title} className="w-full h-auto" />
                  </div>
                )}
                <div className="prose dark:prose-invert max-w-none">
                  {renderPassage()}
                </div>
              </div>
              <div className="w-1/2 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-white dark:bg-gray-900">
                {renderQuestions()}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 max-w-4xl mx-auto w-full">
              {headerBlock(exercise, isFlagged, onToggleFlag, subjectLabel)}
              <InstructionBox text={exercise.instruction} />
              {exercise.image && (
                <div className="mb-10 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg">
                  <img src={`${uploadsURL}/${exercise.image}`} alt={exercise.title} className="w-full h-auto" />
                </div>
              )}
              <div className="space-y-12">
                {renderPassage()}
                {(!passageHandlesAnswers) && renderQuestions()}
                <div className="h-24" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function headerBlock(ex: ClientExercise, isFlagged: boolean, onToggleFlag: any, label: string) {
  return (
    <div className="flex items-start justify-between gap-3 mb-8">
      <div>
        <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">
          {label} · {(ex.type || '').toUpperCase().replace('_', ' ')}
        </p>
        <h2 className="text-2xl font-serif font-black text-gray-900 dark:text-white leading-tight">
          {ex.title}
        </h2>
      </div>
      {onToggleFlag && (
        <button
          onClick={onToggleFlag}
          className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all font-bold text-xs
            ${isFlagged
              ? 'border-orange-500 bg-orange-500 text-white'
              : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'}`}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          {isFlagged ? 'Belgilangan' : 'Belgilash'}
        </button>
      )}
    </div>
  );
}
