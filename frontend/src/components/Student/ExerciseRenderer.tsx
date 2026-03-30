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

// ── Dialogue formatter ────────────────────────────────────────────────────────
// Detects "1 A:", "2 B:", "Teacher:", "Student:", "A:", "B:" patterns
// and splits the raw text into speaker turns for clean display.
function isDialogue(text: string): boolean {
  return /\b\d+\s+[A-Z]:\s|\b[A-Z][a-z]+:\s|(?<![A-Za-z])([A-Z]):\s/.test(text);
}

interface SpeakerLine {
  speaker: string;   // e.g. "1 A", "B", "Teacher"
  text: string;
}

function parseDialogue(raw: string): SpeakerLine[] | null {
  if (!isDialogue(raw)) return null;

  // Split on patterns like "1 A: ", "2 B: ", "A: ", "B: ", "Teacher: ", "Student: "
  const re = /(\d+\s+[A-Z]:|[A-Z][a-z]{2,}:|[A-Z]:)\s/g;

  const lines: SpeakerLine[] = [];
  let lastIndex = 0;
  let lastSpeaker = '';
  let match: RegExpExecArray | null;

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

  return lines.length > 1 ? lines : null;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExerciseRenderer({ exercise, answers, onAnswer, isFlagged = false, onToggleFlag }: Props) {
  const getAnswer = (qId: number) => answers[`${exercise.id}_${qId}`]?.selectedAnswer || '';

  const recordAnswer = (q: ClientQuestion, value: string) => {
    onAnswer({
      questionId: `${exercise.id}_${q.id}`,
      questionType: exercise.subject.toUpperCase() as 'GRAMMAR' | 'VOCABULARY',
      selectedAnswer: value,
      questionText: q.text,
    });
  };

  const subjectLabel = exercise.subject.toUpperCase();

  // ── Render passage (left panel) ─────────────────────────────────────────────
  const hasInlineMarkers = exercise.passage ? /\[\d+\]/.test(exercise.passage) : false;
  const isDialogueWithBlanks = exercise.type === 'gap_fill' && !hasInlineMarkers &&
    !!exercise.passage && exercise.passage.includes('___') && parseDialogue(exercise.passage) !== null;

  const renderPassage = () => {
    if (!exercise.passage) return null;

    const text = exercise.passage;

    // [N] markers in passage — gap_fill embeds inputs, other types embed styled badges
    if (hasInlineMarkers) {
      if (exercise.type === 'gap_fill') {
        const dialogLines = parseDialogue(text.replace(/\[\d+\]/g, '___'));
        if (dialogLines) {
          return <DialoguePassageWithInputs passage={text} questions={exercise.questions} getAnswer={getAnswer} recordAnswer={recordAnswer} />;
        }

        // Normal inline gap_fill — replace [N] with input (no number badge; passage text already has the number)
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let partKey = 0;

        exercise.questions.forEach(q => {
          const marker = `[${q.id}]`;
          const idx = text.indexOf(marker, lastIndex);
          if (idx === -1) return;
          if (idx > lastIndex) {
            parts.push(<span key={`t-${partKey++}`} className="font-serif">{text.slice(lastIndex, idx)}</span>);
          }
          const val = getAnswer(q.id);
          parts.push(
            <input
              key={`inp-${q.id}`}
              type="text"
              value={val}
              onChange={e => recordAnswer(q, e.target.value)}
              className={`border-b-2 bg-transparent font-serif px-1 mx-1 w-64 text-[15px] focus:outline-none transition-colors inline-block align-baseline
                ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                focus:border-orange-500`}
              placeholder=" "
            />
          );
          lastIndex = idx + marker.length;
        });
        parts.push(<span key="end" className="font-serif">{text.slice(lastIndex)}</span>);
        return (
          <div className="font-serif text-gray-800 dark:text-gray-200 leading-[2.4] text-[16px]">
            {parts}
          </div>
        );
      }

      // Non-gap_fill (e.g. MCQ) with [N] markers — replace with styled orange badge, no input
      const markerRe2 = /\[(\d+)\]/g;
      const badgeParts: React.ReactNode[] = [];
      let li2 = 0;
      let bm: RegExpExecArray | null;
      let bKey = 0;
      while ((bm = markerRe2.exec(text)) !== null) {
        if (bm.index > li2) badgeParts.push(<span key={`t${bKey++}`} className="font-serif">{text.slice(li2, bm.index)}</span>);
        badgeParts.push(
          <span key={`b${bm[1]}`} className="inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 text-[11px] font-black align-middle select-none">
            {bm[1]}
          </span>
        );
        li2 = bm.index + bm[0].length;
      }
      if (li2 < text.length) badgeParts.push(<span key="end" className="font-serif">{text.slice(li2)}</span>);
      return (
        <div className="font-serif text-gray-800 dark:text-gray-200 leading-[1.9] text-[16px] whitespace-pre-wrap">
          {badgeParts}
        </div>
      );
    }

    // No [N] markers (or non-gap_fill) — render passage
    // Check for dialogue format
    const dialogLines = parseDialogue(text);
    if (dialogLines) {
      // gap_fill with ___ blanks in dialogue → embed inputs inline
      if (exercise.type === 'gap_fill' && text.includes('___')) {
        const sortedQs = [...exercise.questions].sort((a, b) => a.id - b.id);
        const lineBlankMaps: ClientQuestion[][] = (() => {
          let idx = 0;
          return dialogLines.map(line => {
            const count = (line.text.match(/___/g) || []).length;
            const qs: ClientQuestion[] = [];
            for (let b = 0; b < count; b++) {
              if (sortedQs[idx]) qs.push(sortedQs[idx]);
              idx++;
            }
            return qs;
          });
        })();

        // Render a text segment, styling (hint) patterns as orange badges
        const renderWithHints = (str: string, keyPrefix: string) => {
          const hintRe = /\(([^)]+)\)/g;
          const nodes: React.ReactNode[] = [];
          let li = 0;
          let hm: RegExpExecArray | null;
          while ((hm = hintRe.exec(str)) !== null) {
            if (hm.index > li) nodes.push(<span key={`${keyPrefix}t${li}`}>{str.slice(li, hm.index)}</span>);
            nodes.push(
              <span key={`${keyPrefix}h${hm.index}`} className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 text-[13px] font-semibold whitespace-nowrap align-middle">
                {hm[1]}
              </span>
            );
            li = hm.index + hm[0].length;
          }
          if (li < str.length) nodes.push(<span key={`${keyPrefix}end`}>{str.slice(li)}</span>);
          return nodes;
        };

        return (
          <div className="space-y-3">
            {dialogLines.map((line, i) => {
              const lineQs = lineBlankMaps[i];
              const parts = line.text.split('___');
              return (
                <div key={i} className="flex gap-3">
                  <span className="text-xs font-black text-orange-500 dark:text-orange-400 uppercase tracking-wide flex-shrink-0 w-20 pt-0.5 text-right">
                    {line.speaker}
                  </span>
                  <p className="font-serif text-gray-800 dark:text-gray-200 leading-[2.2] text-[15px] flex-1">
                    {parts.map((part, j) => {
                      if (j === 0) return <React.Fragment key={j}>{renderWithHints(part, `${i}-${j}-`)}</React.Fragment>;
                      const q = lineQs[j - 1];
                      if (!q) return <React.Fragment key={j}>{renderWithHints(part, `${i}-${j}-`)}</React.Fragment>;
                      const val = getAnswer(q.id);
                      return (
                        <span key={j}>
                          <span className="inline-flex items-center gap-1 mx-1">
                            <span className="text-[10px] font-black text-orange-500 dark:text-orange-400 leading-none select-none bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 rounded shrink-0">
                              {q.id}
                            </span>
                            <input
                              type="text"
                              value={val}
                              onChange={e => recordAnswer(q, e.target.value)}
                              className={`border-b-2 bg-transparent font-serif px-1 w-72 text-[15px] focus:outline-none transition-colors inline-block
                                ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                                focus:border-orange-500`}
                              placeholder=" "
                            />
                          </span>
                          {renderWithHints(part, `${i}-${j}-`)}
                        </span>
                      );
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {dialogLines.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-xs font-black text-orange-500 dark:text-orange-400 uppercase tracking-wide flex-shrink-0 w-20 pt-0.5 text-right">
                {line.speaker}
              </span>
              <p className="font-serif text-gray-800 dark:text-gray-200 leading-relaxed text-[16px] flex-1">
                {line.text}
              </p>
            </div>
          ))}
        </div>
      );
    }

    // Render (N verb) hint markers as styled badges in gap_fill passages
    if (exercise.type === 'gap_fill') {
      const hintRe = /\((\d+)\s+([^)]+)\)/g;
      const passageParts: React.ReactNode[] = [];
      let li = 0;
      let hm: RegExpExecArray | null;
      let hasHints = false;
      while ((hm = hintRe.exec(text)) !== null) {
        hasHints = true;
        if (hm.index > li) passageParts.push(<span key={`t${li}`}>{text.slice(li, hm.index)}</span>);
        passageParts.push(
          <span key={`h${hm.index}`} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 text-[13px] font-semibold whitespace-nowrap align-middle">
            <span className="text-[10px] font-black text-orange-400 dark:text-orange-500 leading-none">{hm[1]}</span>
            <span>{hm[2]}</span>
          </span>
        );
        li = hm.index + hm[0].length;
      }
      if (hasHints) {
        if (li < text.length) passageParts.push(<span key="end">{text.slice(li)}</span>);
        return (
          <div className="font-serif text-gray-800 dark:text-gray-200 leading-[2.2] text-[16px]">
            {passageParts}
          </div>
        );
      }
    }

    return (
      <div className="font-serif text-gray-800 dark:text-gray-200 leading-relaxed text-[16px] whitespace-pre-wrap">
        {text}
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
              const cleanText = q.text.replace(new RegExp(`^${q.id}\\.\\s*`), '');
              const parts = cleanText.split('___');
              const blankCount = parts.length - 1;
              // multi-blank: _b0, _b1, ... | single: original key
              const getBlank = (b: number) =>
                blankCount > 1
                  ? answers[`${exercise.id}_${q.id}_b${b}`]?.selectedAnswer || ''
                  : getAnswer(q.id);
              const recordBlank = (b: number, value: string) => {
                if (blankCount > 1) {
                  onAnswer({
                    questionId: `${exercise.id}_${q.id}_b${b}`,
                    questionType: exercise.subject.toUpperCase() as 'GRAMMAR' | 'VOCABULARY',
                    selectedAnswer: value,
                    questionText: q.text,
                  });
                } else {
                  recordAnswer(q, value);
                }
              };

              return (
                <div key={q.id} className="py-1">
                  {blankCount >= 1 ? (
                    <p className="text-[16px] font-serif text-gray-800 dark:text-gray-200 leading-[2.2]">
                      {parts.map((part, i) => {
                        const blankIdx = i - 1;
                        const val = i > 0 ? getBlank(blankIdx) : '';
                        return (
                          <span key={i}>
                            {i > 0 && (
                              <span className="inline-flex items-center gap-1 mx-1">
                                <span className="text-[10px] font-black text-orange-500 dark:text-orange-400 leading-none select-none bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 rounded shrink-0">
                                  {blankCount > 1 ? `${q.id}${String.fromCharCode(96 + i)}` : q.id}
                                </span>
                                <input
                                  type="text"
                                  value={val}
                                  onChange={e => recordBlank(blankIdx, e.target.value)}
                                  className={`border-b-2 bg-transparent font-serif px-1 text-[16px] focus:outline-none transition-colors w-64
                                    ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                                    focus:border-orange-500`}
                                  placeholder=" "
                                />
                              </span>
                            )}
                            {part}
                          </span>
                        );
                      })}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-orange-500 dark:text-orange-400 select-none bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 rounded shrink-0">{q.id}</span>
                      {cleanText && (
                        <span className="font-serif text-gray-800 dark:text-gray-200 text-[15px]">{cleanText}</span>
                      )}
                      <input
                        type="text"
                        value={getAnswer(q.id)}
                        onChange={e => recordAnswer(q, e.target.value)}
                        className={`border-b-2 bg-transparent font-serif px-1 flex-1 min-w-[220px] text-[16px] focus:outline-none transition-colors
                          ${getAnswer(q.id) ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                          focus:border-orange-500`}
                        placeholder="Your answer..."
                      />
                    </div>
                  )}
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
                            ${sel ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'border-gray-200 dark:border-gray-700 text-gray-400 group-hover:border-gray-400'}`}>
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
                        ${chosen ? 'border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}
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

              const parts = errorWord
                ? q.text.split(errorWord).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="underline decoration-red-400 decoration-2 text-red-600 dark:text-red-400 font-bold mx-0.5">
                          {errorWord}
                        </span>
                      )}
                    </span>
                  ))
                : [<span key={0}>{q.text}</span>];

              return (
                <div key={q.id} className="space-y-3 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-bold text-gray-500 flex-shrink-0 mt-0.5 w-5">{q.id}.</span>
                    <p className="text-[15px] font-serif text-gray-800 dark:text-gray-200 leading-relaxed flex-1">
                      {parts}
                    </p>
                  </div>
                  <div className="pl-8 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Correction:</span>
                    <input
                      type="text"
                      value={val}
                      onChange={e => recordAnswer(q, e.target.value)}
                      className={`border-b-2 bg-transparent font-serif px-1 text-[15px] focus:outline-none transition-colors flex-1 min-w-[320px] py-1
                        ${val ? 'border-emerald-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                        focus:border-emerald-500`}
                      placeholder="Write the correct form..."
                    />
                    <button
                      type="button"
                      onClick={() => recordAnswer(q, '✓')}
                      className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 whitespace-nowrap"
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

              const promptParts = prompt.split('___');
              const promptContent = promptParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < promptParts.length - 1 && (
                    <input
                      type="text"
                      value={val}
                      onChange={e => recordAnswer(q, e.target.value)}
                      className={`border-b-2 bg-transparent font-serif px-1 mx-1 text-[15px] focus:outline-none transition-colors w-[500px] py-0.5 inline-block
                        ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
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
                      <p className="text-[15px] font-serif text-gray-600 dark:text-gray-400 italic leading-relaxed">
                        {stem}
                      </p>
                      <p className="text-[15px] font-serif text-gray-800 dark:text-gray-200 leading-relaxed">
                        {prompt ? promptContent : (
                          <input
                            type="text"
                            value={val}
                            onChange={e => recordAnswer(q, e.target.value)}
                            className={`border-b-2 bg-transparent font-serif px-1 text-[15px] focus:outline-none transition-colors w-full py-0.5
                              ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
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
              <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                  <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1.5">
                    {subjectLabel} · {exercise.type.replace('_', ' ').toUpperCase()}
                    {exercise.type === 'gap_fill' && !hasInlineMarkers && !isDialogueWithBlanks && (
                      <span className="ml-2 text-[11px] normal-case font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                        o'qing
                      </span>
                    )}
                  </p>
                  <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">
                    {exercise.title}
                  </h2>
                </div>
                {onToggleFlag && (
                  <button
                    type="button"
                    onClick={onToggleFlag}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0 mt-1 ${
                      isFlagged
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-amber-300 hover:text-amber-500'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill={isFlagged ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    {isFlagged ? 'Belgilangan' : 'Belgilash'}
                  </button>
                )}
              </div>
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
            {!hasLeftPanel && (
              <div className="mb-8 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                    {subjectLabel} · {exercise.type.replace('_', ' ').toUpperCase()}
                  </p>
                  <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">
                    {exercise.title}
                  </h2>
                </div>
                {onToggleFlag && (
                  <button
                    type="button"
                    onClick={onToggleFlag}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0 mt-1 ${
                      isFlagged
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-amber-300 hover:text-amber-500'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill={isFlagged ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    {isFlagged ? 'Belgilangan' : 'Belgilash'}
                  </button>
                )}
              </div>
            )}
            {renderQuestions()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dialogue passage with embedded inputs ─────────────────────────────────────
// Used when a gap_fill passage is also a dialogue

interface DialoguePassageWithInputsProps {
  passage: string;
  questions: ClientQuestion[];
  getAnswer: (id: number) => string;
  recordAnswer: (q: ClientQuestion, value: string) => void;
}

function DialoguePassageWithInputs({ passage, questions, getAnswer, recordAnswer }: DialoguePassageWithInputsProps) {
  // Split the full passage by speaker turns
  const re = /(\d+\s+[A-Z]:|[A-Z][a-z]{2,}:|[A-Z]:)\s/g;
  const segments: { speaker: string; raw: string }[] = [];
  let lastIndex = 0;
  let lastSpeaker = '';
  let match: RegExpExecArray | null;

  while ((match = re.exec(passage)) !== null) {
    if (lastSpeaker !== '' && match.index > lastIndex) {
      segments.push({ speaker: lastSpeaker, raw: passage.slice(lastIndex, match.index).trimEnd() });
    } else if (lastSpeaker === '' && match.index > 0) {
      // text before first speaker — treat as intro
      segments.push({ speaker: '', raw: passage.slice(0, match.index).trim() });
    }
    lastSpeaker = match[1].replace(':', '').trim();
    lastIndex = match.index + match[0].length;
  }
  if (lastSpeaker !== '' && lastIndex <= passage.length) {
    segments.push({ speaker: lastSpeaker, raw: passage.slice(lastIndex).trim() });
  }

  const qMap = new Map(questions.map(q => [q.id, q]));

  function renderSegmentText(raw: string) {
    const parts: React.ReactNode[] = [];
    const markerRe = /\[(\d+)\]/g;
    let li = 0;
    let m: RegExpExecArray | null;
    while ((m = markerRe.exec(raw)) !== null) {
      if (m.index > li) parts.push(<span key={`t${li}`}>{raw.slice(li, m.index)}</span>);
      const qId = parseInt(m[1]);
      const q = qMap.get(qId);
      if (q) {
        const val = getAnswer(qId);
        parts.push(
          <span key={`i${qId}`} className="inline-flex items-center gap-1 mx-1">
            <span className="text-[10px] font-black text-orange-500 dark:text-orange-400 select-none bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 rounded shrink-0">{qId}</span>
            <input
              type="text"
              value={val}
              onChange={e => recordAnswer(q, e.target.value)}
              className={`border-b-2 bg-transparent font-serif px-1 w-48 text-[15px] focus:outline-none transition-colors inline-block
                ${val ? 'border-orange-500 text-gray-900 dark:text-gray-100' : 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'}
                focus:border-orange-500`}
            />
          </span>
        );
      }
      li = m.index + m[0].length;
    }
    if (li < raw.length) parts.push(<span key={`tend`}>{raw.slice(li)}</span>);
    return parts;
  }

  return (
    <div className="space-y-4">
      {segments.map((seg, i) => (
        <div key={i} className={`flex gap-3 ${seg.speaker ? '' : 'mb-4'}`}>
          {seg.speaker && (
            <span className="text-xs font-black text-orange-500 dark:text-orange-400 uppercase tracking-wide flex-shrink-0 w-16 text-right pt-0.5">
              {seg.speaker}:
            </span>
          )}
          <p className={`font-serif text-gray-800 dark:text-gray-200 leading-relaxed text-[15px] flex-1 ${!seg.speaker ? 'text-gray-500 italic' : ''}`}>
            {renderSegmentText(seg.raw)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Shared instruction box ────────────────────────────────────────────────────
function InstructionBox({ text }: { text: string }) {
  return (
    <div className="p-4 border-l-4 border-orange-400 bg-orange-50/40 dark:bg-orange-950/20 mb-2">
      <p className="text-sm font-serif italic text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
        {text}
      </p>
    </div>
  );
}
