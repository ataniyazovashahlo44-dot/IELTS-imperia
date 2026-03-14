import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/api';
import { Result } from '../../types';
import Loading from '../Common/Loading';

function scoreColor(s: number) {
  return s >= 80 ? 'text-emerald-600 dark:text-emerald-400' : s >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
}
function scoreBorder(s: number) {
  return s >= 80
    ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
    : s >= 60
    ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10'
    : 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10';
}
function scoreBarColor(s: number) {
  return s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500';
}

export default function MyResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    studentApi.getResults().then(res => setResults(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Mening natijalarim</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{results.length} ta test bajarilgan</p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-14 text-center">
          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="font-semibold text-gray-500 dark:text-gray-400">Hali natijalar yo'q</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Test bajargandan so'ng natijalar bu yerda ko'rinadi</p>
          <button
            onClick={() => navigate('/student')}
            className="mt-5 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors"
          >
            Dashboardga qaytish
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Test nomi</span>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Vocab</span>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Grammar</span>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Umumiy</span>
          </div>

          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => navigate(`/student/results/${r.id}`)}
              className={`w-full grid grid-cols-[1fr_80px_80px_80px] gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group ${i !== results.length - 1 ? 'border-b border-gray-100 dark:border-gray-800/60' : ''}`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{r.testSession.title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {new Date(r.submittedAt).toLocaleDateString('uz-UZ')}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center">
                {r.vocabScore != null ? (
                  <span className={`text-sm font-bold ${scoreColor(r.vocabScore)}`}>{r.vocabScore.toFixed(0)}%</span>
                ) : <span className="text-gray-300 dark:text-gray-700 text-sm">—</span>}
              </div>
              <div className="flex flex-col items-center justify-center">
                {r.grammarScore != null ? (
                  <span className={`text-sm font-bold ${scoreColor(r.grammarScore)}`}>{r.grammarScore.toFixed(0)}%</span>
                ) : <span className="text-gray-300 dark:text-gray-700 text-sm">—</span>}
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <span className={`text-sm font-black ${scoreColor(r.totalScore)}`}>{r.totalScore.toFixed(0)}%</span>
                <div className={`h-1 w-10 rounded-full overflow-hidden border ${scoreBorder(r.totalScore)}`}>
                  <div className={`h-full ${scoreBarColor(r.totalScore)}`} style={{ width: `${r.totalScore}%` }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
