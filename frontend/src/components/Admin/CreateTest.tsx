import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../services/api';
import { VARIANT_GROUPS, VARIANT_GROUP_LABELS, VariantGroup } from '../../types';

interface SectionForm {
  subject: 'GRAMMAR' | 'VOCABULARY';
  sectionType: 'EXERCISE' | 'PRACTICE_TEST';
  /** 'BY_EXERCISE' → admin sets number of exercises,
   *  'BY_QUESTION' → admin sets total question count */
  selectionMode: 'BY_EXERCISE' | 'BY_QUESTION';
  targetQuestionCount: number;  // used only when selectionMode === 'BY_QUESTION'
  variantGroups: string[];
  numberOfExercises: number;    // used only when selectionMode === 'BY_EXERCISE'
  timeAllocated: number;
  sectionOrder: number;
}

interface Props { onSuccess: () => void; }

export default function CreateTest({ onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [sections, setSections] = useState<SectionForm[]>([
    {
      subject: 'GRAMMAR',
      sectionType: 'EXERCISE',
      selectionMode: 'BY_QUESTION',
      targetQuestionCount: 20,
      variantGroups: ['1_5'],
      numberOfExercises: 50,
      timeAllocated: 20,
      sectionOrder: 1,
    },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdPin, setCreatedPin] = useState('');

  const addSection = () => {
    const order = sections.length + 1;
    setSections(prev => [...prev, {
      subject: 'GRAMMAR',
      sectionType: 'EXERCISE',
      selectionMode: 'BY_QUESTION',
      targetQuestionCount: 20,
      variantGroups: ['1_5'],
      numberOfExercises: 50,
      timeAllocated: 20,
      sectionOrder: order,
    }]);
  };

  const removeSection = (idx: number) =>
    setSections(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sectionOrder: i + 1 })));

  const update = <K extends keyof SectionForm>(idx: number, field: K, value: SectionForm[K]) =>
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  // When switching to BY_QUESTION, auto-set a large pool so user only needs to pick question count
  const setSelectionMode = (idx: number, mode: 'BY_EXERCISE' | 'BY_QUESTION') => {
    setSections(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      return {
        ...s,
        selectionMode: mode,
        numberOfExercises: mode === 'BY_QUESTION' ? 50 : s.numberOfExercises,
      };
    }));
  };

  const toggleVariant = (idx: number, group: string) =>
    setSections(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const has = s.variantGroups.includes(group);
      if (has && s.variantGroups.length === 1) return s;
      return { ...s, variantGroups: has ? s.variantGroups.filter(g => g !== group) : [...s.variantGroups, group] };
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminApi.createTest({
        title,
        maxAttempts,
        sections: sections.map(s => ({
          subject: s.subject,
          sectionType: s.sectionType,
          selectionMode: s.selectionMode,
          targetQuestionCount:
            s.sectionType === 'EXERCISE' && s.selectionMode === 'BY_QUESTION'
              ? s.targetQuestionCount
              : undefined,
          variantGroups: s.variantGroups,
          numberOfExercises: s.numberOfExercises,
          timeAllocated: s.timeAllocated,
          sectionOrder: s.sectionOrder,
        })),
      });
      setCreatedPin(res.data.data.pinCode);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Test yaratishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  // ── PIN success screen ────────────────────────────────────────────────────
  if (createdPin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-6 flex flex-col items-center gap-8"
      >
        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-gray-900 dark:text-white">Test muvaffaqiyatli yaratildi</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Quyidagi PIN kodni o'quvchilarga yuboring</p>
        </div>

        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl py-8 flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-700">
          <p className="text-5xl font-mono font-black tracking-[0.3em] text-gray-900 dark:text-white">{createdPin}</p>
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PIN kodi</span>
        </div>

        <button
          onClick={onSuccess}
          className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm transition-opacity hover:opacity-90"
        >
          Tayyor
        </button>
      </motion.div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 px-4 py-3 rounded-xl"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Test nomi + urinish */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Test nomi</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Masalan: Grammar — Unit 1–5"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition"
          />
        </div>
        <div className="w-24 space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Urinishlar</label>
          <input
            type="text"
            inputMode="numeric"
            value={maxAttempts === 0 ? '' : maxAttempts}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '');
              setMaxAttempts(v === '' ? 0 : Math.min(10, parseInt(v)));
            }}
            onBlur={() => { if (!maxAttempts) setMaxAttempts(1); }}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-center text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition"
          />
        </div>
      </div>

      {/* Bo'limlar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Bo'limlar</span>
          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Bo'lim qo'shish
          </button>
        </div>

        <AnimatePresence initial={false}>
          {sections.map((sec, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800/50"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {idx + 1}-bo'lim
                </span>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Row 1: Fan turi + Bo'lim turi */}
                <div className="flex flex-wrap gap-3">
                  {/* Fan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Fan</label>
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {(['GRAMMAR', 'VOCABULARY'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update(idx, 'subject', s)}
                          className={`px-3 py-1.5 text-xs font-medium transition-all ${sec.subject === s
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                          {s === 'GRAMMAR' ? 'Grammar' : 'Vocabulary'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bo'lim turi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tur</label>
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {(['EXERCISE', 'PRACTICE_TEST'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => update(idx, 'sectionType', t)}
                          className={`px-3 py-1.5 text-xs font-medium transition-all ${sec.sectionType === t
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                          {t === 'EXERCISE' ? 'Mashq' : 'Practice'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 2: Savollar / Mashqlar sonini tanlash */}
                {sec.sectionType === 'EXERCISE' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Har o'quvchiga berilsin:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Option A: Mashqlar soni */}
                      <button
                        type="button"
                        onClick={() => setSelectionMode(idx, 'BY_EXERCISE')}
                        className={`rounded-lg p-3 text-left border transition-all ${sec.selectionMode === 'BY_EXERCISE'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${sec.selectionMode === 'BY_EXERCISE' ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {sec.selectionMode === 'BY_EXERCISE' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          </div>
                          <span className={`text-xs font-semibold ${sec.selectionMode === 'BY_EXERCISE' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            Mashqlar soni
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 pl-5">
                          Nechta mashq berilishini belgilaydi
                        </p>
                      </button>

                      {/* Option B: Savollar soni */}
                      <button
                        type="button"
                        onClick={() => setSelectionMode(idx, 'BY_QUESTION')}
                        className={`rounded-lg p-3 text-left border transition-all ${sec.selectionMode === 'BY_QUESTION'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${sec.selectionMode === 'BY_QUESTION' ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {sec.selectionMode === 'BY_QUESTION' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          </div>
                          <span className={`text-xs font-semibold ${sec.selectionMode === 'BY_QUESTION' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            Savollar soni
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 pl-5">
                          Nechta savol bo'lishini belgilaydi
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Row 3: Raqamli inputlar */}
                <div className="flex flex-wrap gap-4 items-end">
                  {/* Asosiy son (mashq yoki savol) */}
                  {sec.sectionType === 'EXERCISE' ? (
                    sec.selectionMode === 'BY_EXERCISE' ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mashqlar soni</label>
                        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 w-32">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={sec.numberOfExercises === 0 ? '' : sec.numberOfExercises}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '');
                              update(idx, 'numberOfExercises', v === '' ? 0 : Math.min(200, parseInt(v)));
                            }}
                            onBlur={() => { if (!sec.numberOfExercises) update(idx, 'numberOfExercises', 1); }}
                            className="bg-transparent text-sm font-semibold text-gray-900 dark:text-white outline-none w-full text-center"
                          />
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">ta</span>
                        </div>
                      </div>
                    ) : (
                      /* BY_QUESTION: admin only enters question count; numberOfExercises auto = 50 */
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Savollar soni</label>
                        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 w-32">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={sec.targetQuestionCount === 0 ? '' : sec.targetQuestionCount}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '');
                              update(idx, 'targetQuestionCount', v === '' ? 0 : Math.min(200, parseInt(v)));
                            }}
                            onBlur={() => { if (!sec.targetQuestionCount) update(idx, 'targetQuestionCount', 20); }}
                            className="bg-transparent text-sm font-semibold text-gray-900 dark:text-white outline-none w-full text-center"
                          />
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">ta</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Savollar soni</label>
                      <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 w-32">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={sec.numberOfExercises === 0 ? '' : sec.numberOfExercises}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, '');
                            update(idx, 'numberOfExercises', v === '' ? 0 : Math.min(200, parseInt(v)));
                          }}
                          onBlur={() => { if (!sec.numberOfExercises) update(idx, 'numberOfExercises', 1); }}
                          className="bg-transparent text-sm font-semibold text-gray-900 dark:text-white outline-none w-full text-center"
                        />
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">ta</span>
                      </div>
                    </div>
                  )}

                  {/* Vaqt */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Vaqt</label>
                    <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 w-28">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={sec.timeAllocated === 0 ? '' : sec.timeAllocated}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '');
                          update(idx, 'timeAllocated', v === '' ? 0 : Math.min(180, parseInt(v)));
                        }}
                        onBlur={() => { if (!sec.timeAllocated) update(idx, 'timeAllocated', 1); }}
                        className="bg-transparent text-sm font-semibold text-gray-900 dark:text-white outline-none w-full text-center"
                      />
                      <span className="text-xs text-gray-400 dark:text-gray-500">min</span>
                    </div>
                  </div>
                </div>

                {/* Row 4: Variantlar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Variantlar (Unit guruhlar)</label>
                    <button
                      type="button"
                      onClick={() => update(idx, 'variantGroups', [...VARIANT_GROUPS])}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Barchasini tanlash
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIANT_GROUPS.map(group => {
                      const active = sec.variantGroups.includes(group);
                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => toggleVariant(idx, group)}
                          className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${active
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                        >
                          {VARIANT_GROUP_LABELS[group as VariantGroup]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Yaratilmoqda...
          </>
        ) : (
          'Test yaratish va PIN olish'
        )}
      </button>
    </form>
  );
}
