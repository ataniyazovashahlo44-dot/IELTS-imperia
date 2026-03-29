import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/api';
import { useTest } from '../../context/TestContext';
import { SS_PIN, SS_ANSWERS } from '../../context/TestContext';

interface Props { onClose: () => void; }

export default function TestJoin({ onClose }: Props) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { initTest } = useTest();
  const navigate = useNavigate();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputs.current[0]?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);
  const pin = digits.join('');

  const handleDigit = (idx: number, value: string) => {
    const v = value.replace(/D/g, '').slice(0, 1);
    setDigits(prev => { const d = [...prev]; d[idx] = v; return d; });
    if (v && idx < 3) inputs.current[idx + 1]?.focus();
  };
  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData('text').replace(/D/g, '').slice(0, 4);
    if (p.length === 4) { setDigits(p.split('')); inputs.current[3]?.focus(); }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) { setError('Please enter all 4 digits'); return; }
    setError(''); setLoading(true);
    try {
      const res = await studentApi.joinTest(pin);
      // Save PIN for auto-rejoin on refresh; clear stale answers from any prior test
      try {
        sessionStorage.removeItem(SS_ANSWERS);
        sessionStorage.setItem(SS_PIN, pin);
      } catch {}
      initTest(res.data.data); onClose(); navigate('/student/test');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid PIN or test not available');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
      </div>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">Enter the 4-digit PIN from your instructor</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      <div className="flex justify-center gap-3">
        {digits.map((d, i) => (
          <input key={i} ref={el => { inputs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
            className={`w-14 h-16 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all bg-gray-50 dark:bg-gray-800 ${d ? 'border-blue-500 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/20' : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'} focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20`}
          />
        ))}
      </div>

      <div className="flex justify-center gap-2">
        {digits.map((d, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-200 ${d ? 'bg-blue-500 scale-110' : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>

      <button type="submit" disabled={loading || pin.length !== 4}
        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]">
        {loading ? <span className="flex items-center justify-center gap-2"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Joining...</span> : 'Start Test →'}
      </button>
    </form>
  );
}