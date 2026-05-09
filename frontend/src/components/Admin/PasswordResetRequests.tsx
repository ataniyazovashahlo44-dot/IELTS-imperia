import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

interface ResetRequest {
    id: string;
    student: { fullName: string; username: string };
    resetCode: string;
    expiresAt: string;
    isUsed: boolean;
    createdAt: string;
}

export default function PasswordResetRequests() {
    const [requests, setRequests] = useState<ResetRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await adminApi.getResetRequests();
            setRequests(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        const iv = setInterval(fetchRequests, 10000);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">Parol So'rovlari</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">O'quvchilar tomonidan kelib tushgan parol tiklash so'rovlari ro'yxati</p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl dark:shadow-2xl overflow-hidden p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-48 space-y-3">
                        <div className="w-8 h-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                        <span className="text-gray-400 text-sm font-semibold">Yuklanmoqda...</span>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex justify-center items-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
                        </div>
                        <p className="text-gray-500 font-medium">Hozircha parol tiklash so'rovlari yo'q</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-100 dark:border-gray-800">
                                    <th className="py-4 px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">O'quvchi</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Username</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tasdiqlash Kodi</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Amal qilish vaqti</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => {
                                    const hrs = Math.round((new Date(req.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60));
                                    return (
                                        <tr key={req.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-gray-900 dark:text-gray-100">{req.student.fullName}</div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium">@{req.student.username}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-xl font-mono text-xl font-black tracking-widest shadow-sm group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                                    {req.resetCode}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                                    {hrs > 0 ? `${hrs} soat qoldi` : 'Muddati tugagan'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
