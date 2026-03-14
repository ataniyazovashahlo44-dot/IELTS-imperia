import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await register(form);
      setSuccess("Ro'yxatdan o'tildi! Login sahifasiga o'tilmoqda...");
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(axiosMsg || "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Full Name</label>
          <input type="text" value={form.fullName}
            onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
            className={inputClass} placeholder="Ism Familiya" required minLength={2} />
        </div>
        <div>
          <label className={labelClass}>Phone Number</label>
          <input type="tel" value={form.phoneNumber}
            onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
            className={inputClass} placeholder="+998 90 123 45 67" required />
        </div>
        <div>
          <label className={labelClass}>Username</label>
          <input type="text" value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            className={inputClass} placeholder="unique_username" required minLength={3}
            pattern="^[a-zA-Z0-9_]+$" title="Only letters, numbers, underscores" />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input type="password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            className={inputClass} placeholder="Kamida 6 ta belgi" required minLength={6} />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">
          {loading ? 'Yuklanmoqda...' : "Ro'yxatdan o'tish"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Hisobingiz bormi?{' '}
        <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Kirish</Link>
      </p>
    </div>
  );
}
