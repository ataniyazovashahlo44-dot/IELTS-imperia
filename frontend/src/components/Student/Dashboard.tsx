import { useEffect, useState } from 'react';
import { studentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import TestJoin from './TestJoin';
import Modal from '../Common/Modal';

interface RecentResult {
  id: string; totalScore: number; vocabScore: number | null;
  grammarScore: number | null; submittedAt: string;
  testSession: { title: string };
}
interface DashboardData { totalTests: number; recentResults: RecentResult[]; }

function scoreColor(s: number) {
  return s >= 80 ? 'text-emerald-500 dark:text-emerald-400' : s >= 60 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400';
}
function scoreBg(s: number) {
  return s >= 80
    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
    : s >= 60
    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
    : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    studentApi.getDashboard().then(res => setData(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const avgScore = data?.recentResults?.length
    ? data.recentResults.reduce((s, r) => s + r.totalScore, 0) / data.recentResults.length
    : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Xush kelibsiz, <span className="text-gray-900 dark:text-white font-medium">{user?.fullName}</span></p>
        </div>
        <button
          onClick={() => setShowJoin(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Testni boshlash
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Jami testlar</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{data?.totalTests ?? 0}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">bajarilgan</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">O'rtacha ball</p>
          <p className={`text-3xl font-black ${avgScore != null ? scoreColor(avgScore) : 'text-gray-300 dark:text-gray-600'}`}>
            {avgScore != null ? `${avgScore.toFixed(0)}%` : '—'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">so'nggi testlar</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Holat</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Faol</p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">test uchun tayyor</p>
        </div>
      </div>

      {/* Recent results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">So'nggi natijalar</h2>
          {(data?.recentResults?.length ?? 0) > 0 && (
            <a href="/student/results" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-500 transition-colors">
              Barchasini ko'rish →
            </a>
          )}
        </div>

        {(data?.recentResults?.length ?? 0) === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-semibold text-gray-500 dark:text-gray-400">Hali testlar yo'q</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">PIN kod kiritib testni boshlang</p>
            <button
              onClick={() => setShowJoin(true)}
              className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Testni boshlash
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {data!.recentResults.map((r, i) => (
              <a
                key={r.id}
                href={`/student/results/${r.id}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group ${i !== data!.recentResults.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${scoreBg(r.totalScore)}`}>
                  <span className={`text-sm font-black ${scoreColor(r.totalScore)}`}>{r.totalScore.toFixed(0)}%</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{r.testSession.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {r.vocabScore != null && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Vocab: <span className={`font-bold ${scoreColor(r.vocabScore)}`}>{r.vocabScore.toFixed(0)}%</span>
                      </span>
                    )}
                    {r.grammarScore != null && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Grammar: <span className={`font-bold ${scoreColor(r.grammarScore)}`}>{r.grammarScore.toFixed(0)}%</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(r.submittedAt).toLocaleDateString('uz-UZ')}
                  </p>
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-gray-400 transition-colors mt-1 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Test PIN kodini kiriting">
        <TestJoin onClose={() => setShowJoin(false)} />
      </Modal>
    </div>
  );
}
