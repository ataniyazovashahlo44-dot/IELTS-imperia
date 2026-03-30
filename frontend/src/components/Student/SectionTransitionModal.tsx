import { useEffect, useRef, useState } from 'react';
import { CurrentSection } from '../../types';

interface Props {
  section: CurrentSection;
  sectionNumber: number;
  totalSections: number;
  onStart: () => void;
}

const BREAK_SECONDS = 60;

const VOCAB_TIPS = [
  { icon: '📖', title: 'Gap fill', desc: 'Bo\'sh joyni to\'g\'ri so\'z bilan to\'ldiring.' },
  { icon: '🔤', title: 'MCQ', desc: 'To\'rtta variantdan eng to\'g\'risini tanlang.' },
  { icon: '✏️', title: 'Baholash', desc: 'Har to\'g\'ri javob — 1 ball. Noto\'g\'ri yoki bo\'sh — 0 ball.' },
  { icon: '⏱️', title: 'Vaqt', desc: 'Savol boshiga o\'rtacha 1.5 daqiqa ajratilgan.' },
];

const GRAMMAR_TIPS = [
  { icon: '📝', title: 'Gap fill', desc: 'Fe\'l shaklini yoki mos so\'zni kiritiing.' },
  { icon: '🔁', title: 'Error correction', desc: 'Noto\'g\'ri so\'zni topib, to\'g\'risini yozing. To\'g\'ri bo\'lsa ✓ yozing.' },
  { icon: '↔️', title: 'Sentence transformation', desc: 'Jumlani berilgan so\'z bilan qayta yozing.' },
  { icon: '✅', title: 'Baholash', desc: 'Har to\'g\'ri javob — 1 ball. Noto\'g\'ri yoki bo\'sh — 0 ball.' },
];

export default function SectionTransitionModal({ section, sectionNumber, totalSections, onStart }: Props) {
  const [seconds, setSeconds] = useState(BREAK_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [onStart]);

  const isPractice = section.sectionType === 'PRACTICE_TEST';
  const isVocab = section.subject === 'VOCABULARY';

  const questionCount = isPractice
    ? (section.questions?.length ?? 0)
    : (section.exercises?.length ?? 0);

  const countLabel = isPractice ? 'ta savol' : 'ta mashq';

  const progress = ((BREAK_SECONDS - seconds) / BREAK_SECONDS) * 100;

  const subjectColor = isVocab
    ? 'text-blue-500 dark:text-blue-400'
    : 'text-indigo-500 dark:text-indigo-400';

  const ringColor = isVocab ? 'stroke-blue-500' : 'stroke-indigo-500';
  const accentBg = isVocab ? 'bg-blue-500' : 'bg-indigo-500';
  const btnClass = isVocab
    ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'
    : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30';

  const tips = isVocab ? VOCAB_TIPS : GRAMMAR_TIPS;

  const size = 80;
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - (seconds / BREAK_SECONDS));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Top accent bar */}
        <div className={`h-1.5 w-full ${accentBg}`} />

        <div className="p-8 space-y-6">

          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Bo'lim {sectionNumber} / {totalSections}
                </span>
                {isPractice && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                    Practice Test
                  </span>
                )}
              </div>
              <h1 className={`text-6xl font-black tracking-tight leading-none ${subjectColor}`}>
                {isVocab ? 'Vocabulary' : 'Grammar'}
              </h1>
            </div>

            {/* Stats */}
            <div className="flex gap-3 shrink-0">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-5 py-3 text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                  {isPractice ? 'Savollar' : 'Mashqlar'}
                </p>
                <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">
                  {questionCount}
                  <span className="text-xs font-normal text-gray-400 ml-1">{countLabel}</span>
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-5 py-3 text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Vaqt</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">
                  {section.timeAllocated ?? Math.round((new Date(section.deadline).getTime() - Date.now()) / 60000)}
                  <span className="text-xs font-normal text-gray-400 ml-1">daqiqa</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick guide */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className={`px-4 py-2 ${isVocab ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-indigo-50 dark:bg-indigo-950/30'}`}>
              <p className={`text-xs font-black uppercase tracking-widest ${isVocab ? 'text-blue-500' : 'text-indigo-500'}`}>
                Qo'llanma
              </p>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-gray-100 dark:divide-gray-800">
              {tips.map((tip, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-2.5">
                  <span className="text-lg leading-none mt-0.5">{tip.icon}</span>
                  <div>
                    <p className="text-[12px] font-black text-gray-700 dark:text-gray-300 leading-tight">{tip.title}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-snug mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            Keyingi bo'lim boshlashdan oldin biroz dam oling.
          </p>

          {/* Countdown ring + button row */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-shrink-0">
              <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                  className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="6" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                  className={ringColor} strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={dash}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{seconds}</span>
              </div>
            </div>

            <button
              onClick={() => { clearInterval(intervalRef.current!); onStart(); }}
              className={`flex-1 py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-95 shadow-lg ${btnClass}`}
            >
              Boshlash →
            </button>
          </div>

          <button
            onClick={() => { clearInterval(intervalRef.current!); onStart(); }}
            className="w-full text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors py-1 font-semibold"
          >
            Skip the break
          </button>

        </div>
      </div>
    </div>
  );
}
