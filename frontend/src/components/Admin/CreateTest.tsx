import { useState } from 'react';
import { adminApi } from '../../services/api';
import { SectionSubject, SectionType, VARIANT_GROUPS, VARIANT_GROUP_LABELS, VariantGroup } from '../../types';

interface SectionForm {
  subject: SectionSubject;
  sectionType: SectionType;
  variantGroups: string[];
  numberOfExercises: number;
  timeAllocated: number;
  sectionOrder: number;
}

interface Props { onSuccess: () => void; }

const SUBJECT_COLORS: Record<SectionSubject, string> = {
  GRAMMAR: 'from-indigo-500 to-purple-600',
  VOCABULARY: 'from-blue-500 to-cyan-600',
};

const SUBJECT_LABELS: Record<SectionSubject, string> = {
  GRAMMAR: 'Grammar',
  VOCABULARY: 'Vocabulary',
};

export default function CreateTest({ onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [sections, setSections] = useState<SectionForm[]>([
    { subject: 'GRAMMAR', sectionType: 'EXERCISE', variantGroups: ['1_5'], numberOfExercises: 3, timeAllocated: 20, sectionOrder: 1 },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdPin, setCreatedPin] = useState('');

  const addSection = () => {
    const nextOrder = sections.length + 1;
    setSections(prev => [...prev, {
      subject: 'GRAMMAR',
      sectionType: 'EXERCISE',
      variantGroups: ['1_5'],
      numberOfExercises: 3,
      timeAllocated: 20,
      sectionOrder: nextOrder,
    }]);
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sectionOrder: i + 1 })));
  };

  const updateSection = (idx: number, field: keyof SectionForm, value: unknown) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const toggleVariantGroup = (idx: number, group: string) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const groups = s.variantGroups.includes(group)
        ? s.variantGroups.filter(g => g !== group)
        : [...s.variantGroups, group];
      return { ...s, variantGroups: groups.length > 0 ? groups : s.variantGroups };
    }));
  };

  const selectAllVariants = (idx: number) => {
    setSections(prev => prev.map((s, i) =>
      i === idx ? { ...s, variantGroups: [...VARIANT_GROUPS] } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title,
        maxAttempts,
        sections: sections.map(s => ({
          subject: s.subject,
          sectionType: s.sectionType,
          variantGroups: s.variantGroups,
          numberOfExercises: s.numberOfExercises,
          timeAllocated: s.timeAllocated,
          sectionOrder: s.sectionOrder,
        })),
      };
      const res = await adminApi.createTest(payload);
      setCreatedPin(res.data.data.pinCode);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Test yaratishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // ─── PIN success screen ───────────────────────────────────────────────────
  if (createdPin) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div>
          <p className="text-xl font-black text-gray-900 dark:text-white">Test muvaffaqiyatli yaratildi!</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Quyidagi PIN kodni o'quvchilarga ulashing</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-2 border-blue-200 dark:border-blue-800 rounded-3xl p-8">
          <div className="absolute top-2 right-2 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full opacity-50" />
          <div className="absolute bottom-2 left-2 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full opacity-50" />
          <p className="text-6xl font-mono font-black text-blue-700 dark:text-blue-300 tracking-[0.3em] relative z-10">{createdPin}</p>
          <p className="text-xs text-blue-400 dark:text-blue-500 mt-2 font-medium relative z-10">PIN KOD</p>
        </div>
        <button
          onClick={onSuccess}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 text-sm"
        >
          Tayyor
        </button>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-2xl text-sm">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Test nomi + max urinish */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 block">Test nomi</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Masalan: Vocabulary Practice — Unit 1-5"
            required
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 block">Max urinish</label>
          <input
            type="number"
            min={1}
            max={100}
            value={maxAttempts}
            onChange={e => setMaxAttempts(parseInt(e.target.value) || 1)}
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center font-bold"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Bo'limlar · {sections.length}
          </span>
          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Bo'lim qo'shish
          </button>
        </div>

        {sections.map((section, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

            {/* Section header */}
            <div className={`flex items-center justify-between px-4 py-2.5 bg-gradient-to-r ${SUBJECT_COLORS[section.subject]} bg-opacity-10`}>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-white text-[10px] font-black">
                  {section.sectionOrder}
                </span>
                <span className="text-xs font-bold text-white">
                  {SUBJECT_LABELS[section.subject]} · {section.sectionType === 'PRACTICE_TEST' ? 'Practice Test' : 'Exercise'}
                </span>
              </div>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSection(idx)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="p-4 space-y-3.5 bg-white dark:bg-gray-900">

              {/* Section type toggle */}
              <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => updateSection(idx, 'sectionType', 'EXERCISE')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-all ${
                    section.sectionType === 'EXERCISE'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Mashq
                </button>
                <div className="w-px bg-gray-200 dark:bg-gray-700" />
                <button
                  type="button"
                  onClick={() => updateSection(idx, 'sectionType', 'PRACTICE_TEST')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-all ${
                    section.sectionType === 'PRACTICE_TEST'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Practice Test
                </button>
              </div>

              {/* Subject / Count / Time */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">Fan</label>
                  <select
                    value={section.subject}
                    onChange={e => updateSection(idx, 'subject', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="GRAMMAR">Grammar</option>
                    <option value="VOCABULARY">Vocabulary</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">
                    {section.sectionType === 'PRACTICE_TEST' ? 'Savollar' : 'Mashqlar'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={section.numberOfExercises}
                    onChange={e => updateSection(idx, 'numberOfExercises', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">Vaqt (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={section.timeAllocated}
                    onChange={e => updateSection(idx, 'timeAllocated', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center"
                  />
                </div>
              </div>

              {/* Variant groups */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Variant oralig'i</label>
                  <button
                    type="button"
                    onClick={() => selectAllVariants(idx)}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-wider transition-colors"
                  >
                    To'liq MOC
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {VARIANT_GROUPS.map(group => {
                    const isSelected = section.variantGroups.includes(group);
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => toggleVariantGroup(idx, group)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/30'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        {VARIANT_GROUP_LABELS[group as VariantGroup]}
                      </button>
                    );
                  })}
                </div>
                {section.variantGroups.length === VARIANT_GROUPS.length && (
                  <p className="text-[10px] text-blue-500 mt-1.5 font-semibold">Barcha variantlardan (Full MOC)</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 text-sm flex items-center justify-center gap-2"
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
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Test yaratish va PIN olish
          </>
        )}
      </button>
    </form>
  );
}
