import { useState } from 'react';
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

  // ── PIN screen ─────────────────────────────────────────────────────────────
  if (createdPin) {
    return (
      <div className="py-4 text-center space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Test muvaffaqiyatli yaratildi. PIN kodni o'quvchilarga yuboring:</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl py-8">
          <p className="text-6xl font-mono font-black tracking-[0.2em] text-gray-900 dark:text-white">{createdPin}</p>
        </div>
        <button
          onClick={onSuccess}
          className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Tayyor
        </button>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      {/* Test nomi + urinish */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Test nomi</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Masalan: Grammar — Unit 1–5"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Urinish</label>
          <input
            type="text"
            inputMode="numeric"
            value={maxAttempts === 0 ? '' : maxAttempts}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '');
              setMaxAttempts(v === '' ? 0 : Math.min(10, parseInt(v)));
            }}
            onBlur={e => { if (!e.target.value) setMaxAttempts(1); }}
            className="w-20 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-center text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Bo'limlar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bo'limlar</label>
          <button
            type="button"
            onClick={addSection}
            className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Qo'shish
          </button>
        </div>

        {sections.map((sec, idx) => (
          <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">

            {/* Section header row */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs font-black text-gray-400 dark:text-gray-500 w-5 text-center">{idx + 1}</span>

              {/* Subject */}
              <select
                value={sec.subject}
                onChange={e => update(idx, 'subject', e.target.value as 'GRAMMAR' | 'VOCABULARY')}
                className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none cursor-pointer"
              >
                <option value="GRAMMAR">Grammar</option>
                <option value="VOCABULARY">Vocabulary</option>
              </select>

              {/* Type toggle */}
              <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-0.5 ml-1">
                {(['EXERCISE', 'PRACTICE_TEST'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update(idx, 'sectionType', t)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${sec.sectionType === t
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                      }`}
                  >
                    {t === 'EXERCISE' ? 'Mashq' : 'Practice'}
                  </button>
                ))}
              </div>

              {/* Selection Mode toggle (Only for EXERCISE) */}
              {sec.sectionType === 'EXERCISE' && (
                <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-0.5 ml-1">
                  {(['BY_EXERCISE', 'BY_QUESTION'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => update(idx, 'selectionMode', m)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${sec.selectionMode === m
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                      {m === 'BY_EXERCISE' ? "To'liq" : 'Kesish'}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1" />

              {/* Question Count (Only if BY_QUESTION) */}
              {sec.sectionType === 'EXERCISE' && sec.selectionMode === 'BY_QUESTION' && (
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="text-xs text-blue-500 font-bold">SAVOL:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={sec.targetQuestionCount === 0 ? '' : sec.targetQuestionCount}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      update(idx, 'targetQuestionCount', v === '' ? 0 : Math.min(200, parseInt(v)));
                    }}
                    onBlur={e => { if (!e.target.value) update(idx, 'targetQuestionCount', 20); }}
                    className="w-12 text-center text-sm font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-800 rounded-lg py-1 outline-none focus:border-blue-400 transition"
                  />
                </div>
              )}

              {/* Count */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {sec.sectionType === 'PRACTICE_TEST' ? 'Savol:' : sec.selectionMode === 'BY_QUESTION' ? 'Eskiz:' : 'Mashq:'}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={sec.numberOfExercises === 0 ? '' : sec.numberOfExercises}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '');
                    update(idx, 'numberOfExercises', v === '' ? 0 : Math.min(200, parseInt(v)));
                  }}
                  onBlur={e => { if (!e.target.value) update(idx, 'numberOfExercises', 1); }}
                  className="w-12 text-center text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-1 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                />
              </div>

              {/* Time */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 dark:text-gray-500">Vaqt:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={sec.timeAllocated === 0 ? '' : sec.timeAllocated}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '');
                    update(idx, 'timeAllocated', v === '' ? 0 : Math.min(180, parseInt(v)));
                  }}
                  onBlur={e => { if (!e.target.value) update(idx, 'timeAllocated', 1); }}
                  className="w-12 text-center text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-1 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                />
                <span className="text-xs text-gray-400 dark:text-gray-500">min</span>
              </div>

              {/* Delete */}
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSection(idx)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition-colors ml-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Variants row */}
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap bg-white dark:bg-gray-900">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Variantlar:</span>
              {VARIANT_GROUPS.map(group => {
                const on = sec.variantGroups.includes(group);
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => toggleVariant(idx, group)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${on
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300'
                      }`}
                  >
                    {VARIANT_GROUP_LABELS[group as VariantGroup]}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => update(idx, 'variantGroups', [...VARIANT_GROUPS])}
                className="text-xs text-blue-400 hover:text-blue-500 font-semibold transition-colors ml-1"
              >
                Barchasi
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Yaratilmoqda...
          </>
        ) : 'Test yaratish va PIN olish'}
      </button>
    </form>
  );
}
