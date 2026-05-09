import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../services/api';
import { VARIANT_GROUPS, VARIANT_GROUP_LABELS, VariantGroup } from '../../types';

interface SectionForm {
  subject: 'GRAMMAR' | 'VOCABULARY';
  sectionType: 'EXERCISE' | 'PRACTICE_TEST';
  selectionMode: 'BY_EXERCISE' | 'BY_QUESTION';
  targetQuestionCount: number;
  variantGroups: string[];
  numberOfExercises: number;
  timeAllocated: number;
  sectionOrder: number;
}

interface Props { onSuccess: () => void; }

export default function CreateTest({ onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [sections, setSections] = useState<SectionForm[]>([
    { subject: 'GRAMMAR', sectionType: 'EXERCISE', selectionMode: 'BY_EXERCISE', targetQuestionCount: 20, variantGroups: ['1_5'], numberOfExercises: 3, timeAllocated: 20, sectionOrder: 1 },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdPin, setCreatedPin] = useState('');

  const addSection = () => {
    const order = sections.length + 1;
    setSections(prev => [...prev, {
      subject: 'GRAMMAR', sectionType: 'EXERCISE', selectionMode: 'BY_EXERCISE', targetQuestionCount: 20,
      variantGroups: ['1_5'], numberOfExercises: 3, timeAllocated: 20, sectionOrder: order,
    }]);
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sectionOrder: i + 1 })));
  };

  const update = <K extends keyof SectionForm>(idx: number, field: K, value: SectionForm[K]) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const toggleVariant = (idx: number, group: string) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const has = s.variantGroups.includes(group);
      if (has && s.variantGroups.length === 1) return s; // at least one
      return { ...s, variantGroups: has ? s.variantGroups.filter(g => g !== group) : [...s.variantGroups, group] };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminApi.createTest({
        title, maxAttempts,
        sections: sections.map(s => ({
          subject: s.subject, sectionType: s.sectionType,
          selectionMode: s.selectionMode,
          targetQuestionCount: s.sectionType === 'EXERCISE' && s.selectionMode === 'BY_QUESTION' ? s.targetQuestionCount : undefined,
          variantGroups: s.variantGroups, numberOfExercises: s.numberOfExercises,
          timeAllocated: s.timeAllocated, sectionOrder: s.sectionOrder,
        })),
      });
      setCreatedPin(res.data.data.pinCode);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Test yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (createdPin) {
    return (
      <div className="py-8 text-center space-y-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Test tayyor!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">PIN kodni o'quvchilarga yuboring</p>
          </div>
        </motion.div>

        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all rounded-full" />
          <div className="relative bg-white dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl py-10 shadow-2xl overflow-hidden">
            <p className="text-7xl font-mono font-black tracking-[0.25em] text-gray-900 dark:text-white mb-2 ml-4">
              {createdPin}
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              Live PIN Code
            </div>
          </div>
        </div>

        <button
          onClick={onSuccess}
          className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-xl shadow-gray-900/10 dark:shadow-white/10"
        >
          Panelga qaytish
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 py-2">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-3 space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Test nomi</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Masalan: Grammar — Diagnostic Test"
            required
            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500/50 dark:focus:border-blue-400/30 text-gray-900 dark:text-white font-bold transition-all outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Urinishlar</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={maxAttempts === 0 ? '' : maxAttempts}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '');
                setMaxAttempts(v === '' ? 0 : Math.min(10, parseInt(v)));
              }}
              onBlur={e => { if (!e.target.value) setMaxAttempts(1); }}
              className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500/50 dark:focus:border-blue-400/30 text-gray-900 dark:text-white font-black text-center outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Test Bo'limlari</h4>
          <button
            type="button"
            onClick={addSection}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black transition-all hover:bg-blue-600 hover:text-white"
          >
            <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            YANGI BO'LIM
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {sections.map((sec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-white/5 rounded-3xl p-5 shadow-xl shadow-gray-900/[0.02] dark:shadow-none hover:border-blue-500/30 transition-all overflow-hidden"
              >
                {/* ID Badge */}
                <div className="absolute top-0 left-0 px-4 py-1 bg-gray-100 dark:bg-white/5 text-[10px] font-black text-gray-400 dark:text-gray-500 rounded-br-2xl">
                  #{idx + 1}
                </div>

                {/* Delete button */}
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:text-gray-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}

                <div className="space-y-6 pt-3">
                  {/* Top row settings */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Subject Select */}
                    <div className="bg-gray-50 dark:bg-white/5 p-1 rounded-2xl flex">
                      {(['GRAMMAR', 'VOCABULARY'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update(idx, 'subject', s)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${sec.subject === s
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-500'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    {/* Type Toggle */}
                    <div className="bg-gray-50 dark:bg-white/5 p-1 rounded-2xl flex">
                      {(['EXERCISE', 'PRACTICE_TEST'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => update(idx, 'sectionType', t)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${sec.sectionType === t
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-500'}`}
                        >
                          {t === 'EXERCISE' ? 'MASHQ' : 'PRACTICE'}
                        </button>
                      ))}
                    </div>

                    {/* Mode Toggle (if EXERCISE) */}
                    {sec.sectionType === 'EXERCISE' && (
                      <div className="bg-blue-50/50 dark:bg-blue-500/5 p-1 rounded-2xl flex">
                        {(['BY_EXERCISE', 'BY_QUESTION'] as const).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => update(idx, 'selectionMode', m)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${sec.selectionMode === m
                              ? 'bg-white dark:bg-blue-500 text-blue-600 dark:text-white shadow-sm'
                              : 'text-gray-400 hover:text-gray-500'}`}
                          >
                            {m === 'BY_EXERCISE' ? 'TO\'LIQ' : 'KESISH'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inputs Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5 p-3 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                      <span className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {sec.sectionType === 'PRACTICE_TEST' ? 'Savollar soni' : sec.selectionMode === 'BY_QUESTION' ? 'Eskizlar' : 'Mashqlar soni'}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={sec.numberOfExercises === 0 ? '' : sec.numberOfExercises}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, '');
                            update(idx, 'numberOfExercises', v === '' ? 0 : Math.min(200, parseInt(v)));
                          }}
                          className="bg-transparent text-lg font-black text-gray-900 dark:text-white outline-none w-full"
                        />
                        <span className="text-[10px] font-black text-gray-300 dark:text-gray-600">Штук</span>
                      </div>
                    </div>

                    {sec.sectionType === 'EXERCISE' && sec.selectionMode === 'BY_QUESTION' && (
                      <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10">
                        <span className="block text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Savol nishoni</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={sec.targetQuestionCount === 0 ? '' : sec.targetQuestionCount}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '');
                              update(idx, 'targetQuestionCount', v === '' ? 0 : Math.min(200, parseInt(v)));
                            }}
                            className="bg-transparent text-lg font-black text-emerald-700 dark:text-emerald-300 outline-none w-full"
                          />
                          <span className="text-[10px] font-black text-emerald-400/60 font-mono">QTY</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 p-3 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                      <span className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Berilgan vaqt</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={sec.timeAllocated === 0 ? '' : sec.timeAllocated}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, '');
                            update(idx, 'timeAllocated', v === '' ? 0 : Math.min(180, parseInt(v)));
                          }}
                          className="bg-transparent text-lg font-black text-gray-900 dark:text-white outline-none w-full"
                        />
                        <span className="text-[10px] font-black text-gray-300 dark:text-gray-600">Мин</span>
                      </div>
                    </div>
                  </div>

                  {/* Variants Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Variant guruhlari</label>
                      <button
                        type="button"
                        onClick={() => update(idx, 'variantGroups', [...VARIANT_GROUPS])}
                        className="text-[10px] font-black text-blue-500 hover:text-blue-600 tracking-wider transition-colors"
                      >
                        BARCHASINI TANLASH
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {VARIANT_GROUPS.map(group => {
                        const active = sec.variantGroups.includes(group);
                        return (
                          <button
                            key={group}
                            type="button"
                            onClick={() => toggleVariant(idx, group)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${active
                              ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900 shadow-lg shadow-gray-900/10'
                              : 'bg-white dark:bg-gray-900/50 border-gray-100 dark:border-white/5 text-gray-400 dark:text-gray-500 hover:border-gray-200 dark:hover:border-white/20'}`}
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
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="relative group w-full py-5 rounded-3xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-sm transition-all hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 shadow-2xl shadow-gray-900/10 dark:shadow-white/5 overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                YARATILMOQDA...
              </>
            ) : (
              <>
                TEST YARATISH VA PIN OLISH
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </>
            )}
          </div>
          {!loading && <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />}
        </button>
      </div>
    </form>
  );
}
