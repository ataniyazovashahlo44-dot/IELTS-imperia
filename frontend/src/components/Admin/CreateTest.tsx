import { useState } from 'react';
import { adminApi } from '../../services/api';
import { SectionSubject, VARIANT_GROUPS, VARIANT_GROUP_LABELS, VariantGroup } from '../../types';

interface SectionForm {
  subject: SectionSubject;
  variantGroups: string[];
  numberOfExercises: number;
  timeAllocated: number;
  sectionOrder: number;
}

interface Props { onSuccess: () => void; }

const inputClass = "w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";
const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wide";

export default function CreateTest({ onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [sections, setSections] = useState<SectionForm[]>([
    { subject: 'GRAMMAR', variantGroups: ['1_5'], numberOfExercises: 3, timeAllocated: 20, sectionOrder: 1 },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdPin, setCreatedPin] = useState('');

  const addSection = () => {
    const nextOrder = sections.length + 1;
    setSections(prev => [...prev, {
      subject: 'GRAMMAR',
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
      const res = await adminApi.createTest({ title, maxAttempts, sections });
      setCreatedPin(res.data.data.pinCode);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  if (createdPin) {
    return (
      <div className="text-center space-y-6 py-2">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">Test yaratildi!</p>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Bu PIN kodni o'quvchilarga ulashing:</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6">
          <p className="text-5xl font-mono font-black text-blue-700 dark:text-blue-300 tracking-widest">{createdPin}</p>
        </div>
        <button
          onClick={onSuccess}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
        >
          Tayyor
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Test Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Test nomi</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl outline-none transition focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          placeholder="e.g. Grammar Test — Week 3"
          required
        />
      </div>

      {/* Max Attempts */}
      <div>
        <label className={labelClass}>Qaytadan ishlash (max urinish)</label>
        <input
          type="number"
          min={1}
          max={100}
          value={maxAttempts}
          onChange={e => setMaxAttempts(parseInt(e.target.value) || 1)}
          className={inputClass}
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bo'limlar</label>
          <button
            type="button"
            onClick={addSection}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
          >
            + Bo'lim qo'shish
          </button>
        </div>

        {sections.map((section, idx) => (
          <div key={idx} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 space-y-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Bo'lim {section.sectionOrder}
              </span>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSection(idx)}
                  className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold transition-colors"
                >
                  O'chirish
                </button>
              )}
            </div>

            {/* Subject + Exercises + Time */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Turi</label>
                <select
                  value={section.subject}
                  onChange={e => updateSection(idx, 'subject', e.target.value)}
                  className={inputClass}
                >
                  <option value="GRAMMAR">Grammar</option>
                  <option value="VOCABULARY">Vocabulary</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Mashqlar soni</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={section.numberOfExercises}
                  onChange={e => updateSection(idx, 'numberOfExercises', parseInt(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Vaqt (min)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={section.timeAllocated}
                  onChange={e => updateSection(idx, 'timeAllocated', parseInt(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Variant Groups Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass}>Variant oralig'i</label>
                <button
                  type="button"
                  onClick={() => selectAllVariants(idx)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold uppercase tracking-wider"
                >
                  Full MOC
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {VARIANT_GROUPS.map(group => {
                  const isSelected = section.variantGroups.includes(group);
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => toggleVariantGroup(idx, group)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400'
                      }`}
                    >
                      {VARIANT_GROUP_LABELS[group as VariantGroup]}
                    </button>
                  );
                })}
              </div>
              {section.variantGroups.length === VARIANT_GROUPS.length && (
                <p className="text-[11px] text-blue-500 mt-1.5 font-medium">Full MOC — barcha variantlardan</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20 text-sm"
      >
        {loading ? 'Yaratilmoqda...' : 'Test yaratish va PIN generatsiya qilish'}
      </button>
    </form>
  );
}
