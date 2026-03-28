import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

// ─── Sozlamalar bo'limlari ────────────────────────────────────────────────────

type Tab = 'profile' | 'security' | 'platform' | 'danger';

const TABS: { id: Tab; label: string; icon: string }[] = [
  {
    id: 'profile',
    label: 'Profil',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    id: 'security',
    label: 'Xavfsizlik',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    id: 'platform',
    label: 'Platform',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  },
  {
    id: 'danger',
    label: 'Xavfli zona',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
];

// ─── Asosiy komponent ─────────────────────────────────────────────────────────

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Sozlamalar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platforma va hisob sozlamalarini boshqaring</p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              } ${tab.id === 'danger' && activeTab !== 'danger' ? 'hover:text-red-600 dark:hover:text-red-400' : ''}`}
          >
            <svg className={`w-4 h-4 ${tab.id === 'danger' ? 'text-red-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'profile' && <ProfileSection />}
      {activeTab === 'security' && <SecuritySection />}
      {activeTab === 'platform' && <PlatformSection />}
      {activeTab === 'danger' && <DangerSection />}
    </div>
  );
}

// ─── Profil bo'limi ───────────────────────────────────────────────────────────

function ProfileSection() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    username: user?.username ?? '',
  });

  const handleSave = () => {
    // Hozircha faqat UI demo — API endpoint bo'lsa ulash mumkin
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card title="Profil ma'lumotlari" description="Shaxsiy ma'lumotlaringizni yangilang">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          label="To'liq ism"
          value={form.fullName}
          onChange={v => setForm(f => ({ ...f, fullName: v }))}
          placeholder="Ism Familiya"
        />
        <Field
          label="Foydalanuvchi nomi"
          value={form.username}
          onChange={v => setForm(f => ({ ...f, username: v }))}
          placeholder="username"
          prefix="@"
          disabled
          hint="Foydalanuvchi nomini o'zgartirib bo'lmaydi"
        />
        <Field
          label="Telefon raqam"
          value={form.phoneNumber}
          onChange={v => setForm(f => ({ ...f, phoneNumber: v }))}
          placeholder="+998 90 123 45 67"
          type="tel"
        />
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Rol</label>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Admin</span>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
        >
          Saqlash
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Saqlandi
          </span>
        )}
      </div>
    </Card>
  );
}

// ─── Xavfsizlik bo'limi ───────────────────────────────────────────────────────

function SecuritySection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleChange = (e: { password: string; newPassword: string; }) => {
    // placeholder — real API call kerak bo'lsa shu yerga
  };

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword) {
      setErrMsg("Barcha maydonlarni to'ldiring"); setStatus('error'); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setErrMsg("Yangi parollar mos emas"); setStatus('error'); return;
    }
    if (form.newPassword.length < 6) {
      setErrMsg("Parol kamida 6 ta belgi bo'lishi kerak"); setStatus('error'); return;
    }
    setStatus('loading');
    setErrMsg('');
    try {
      // API endpoint: POST /api/auth/change-password (agar mavjud bo'lsa)
      await new Promise(r => setTimeout(r, 800)); // demo
      setStatus('success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setErrMsg("Hozircha parol o'zgartirishni API qo'llab-quvvatlamaydi");
      setStatus('error');
    }
  };

  return (
    <Card title="Parol va xavfsizlik" description="Hisob xavfsizligini boshqaring">
      <div className="space-y-4 max-w-md">
        <PasswordField
          label="Joriy parol"
          value={form.currentPassword}
          onChange={v => { setForm(f => ({ ...f, currentPassword: v })); setStatus('idle'); }}
          placeholder="••••••••"
        />
        <PasswordField
          label="Yangi parol"
          value={form.newPassword}
          onChange={v => { setForm(f => ({ ...f, newPassword: v })); setStatus('idle'); }}
          placeholder="••••••••"
          hint="Kamida 6 ta belgi"
        />
        <PasswordField
          label="Yangi parolni tasdiqlang"
          value={form.confirmPassword}
          onChange={v => { setForm(f => ({ ...f, confirmPassword: v })); setStatus('idle'); }}
          placeholder="••••••••"
        />

        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-sm text-red-700 dark:text-red-400">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errMsg}
          </div>
        )}
        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Parol muvaffaqiyatli o'zgartirildi
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={status === 'loading'}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          {status === 'loading' && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          Parolni yangilash
        </button>
      </div>

      {/* Info box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl flex gap-3">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Parol o'zgartirilgandan so'ng tizimga qayta kirish talab qilinadi. Parolingizni xavfsiz saqlang va boshqalar bilan ulashmang.
        </p>
      </div>
    </Card>
  );
}

// ─── Platform sozlamalari bo'limi ─────────────────────────────────────────────

function PlatformSection() {
  const [config, setConfig] = useState({
    tabSwitchLimit: 3,
    sessionTimeoutMinutes: 5,
    autoDeactivateTests: true,
    showResultsImmediately: true,
    allowLateJoin: false,
    maxStudentsPerTest: 100,
    defaultVocabTime: 15,
    defaultGrammarTime: 20,
    requirePinForJoin: true,
    notifyOnSubmit: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggle = (key: keyof typeof config) => {
    setConfig(c => ({ ...c, [key]: !c[key] }));
    setSaved(false);
  };

  const setNum = (key: keyof typeof config, val: number) => {
    setConfig(c => ({ ...c, [key]: val }));
    setSaved(false);
  };

  return (
    <div className="space-y-5">
      {/* Test xavfsizligi */}
      <Card title="Test xavfsizligi" description="O'quvchilar harakati cheklovlari">
        <div className="space-y-5">
          <NumberSetting
            label="Tab almashtirish chegarasi"
            description="O'quvchi necha marta boshqa tabga o'tsa, test avtomatik yakunlanadi"
            value={config.tabSwitchLimit}
            min={1} max={10}
            onChange={v => setNum('tabSwitchLimit', v)}
          />
          <NumberSetting
            label="Sessiya vaqt chegarasi (daqiqa)"
            description="O'quvchi necha daqiqa harakatsiz bo'lsa, sessiya tugaydi"
            value={config.sessionTimeoutMinutes}
            min={1} max={60}
            onChange={v => setNum('sessionTimeoutMinutes', v)}
          />
          <ToggleSetting
            label="PIN bilan kirish majburiy"
            description="O'quvchilar testga faqat PIN orqali kirishi mumkin"
            value={config.requirePinForJoin}
            onChange={() => toggle('requirePinForJoin')}
          />
          <ToggleSetting
            label="Kechikib kirishga ruxsat"
            description="Test boshlanganidan keyin ham o'quvchilar kira olsin"
            value={config.allowLateJoin}
            onChange={() => toggle('allowLateJoin')}
          />
        </div>
      </Card>

      {/* Natijalar */}
      <Card title="Natijalar va hisobotlar" description="Test yakunlangandan keyingi xatti-harakatlar">
        <div className="space-y-5">
          <ToggleSetting
            label="Natijalarni darhol ko'rsatish"
            description="O'quvchi testni topshirgandan so'ng natijalarini ko'rishi mumkin"
            value={config.showResultsImmediately}
            onChange={() => toggle('showResultsImmediately')}
          />
          <ToggleSetting
            label="Topshirilganda xabarnoma"
            description="Har bir topshirilganda admin paneliga xabarnoma yuborilsin"
            value={config.notifyOnSubmit}
            onChange={() => toggle('notifyOnSubmit')}
          />
          <ToggleSetting
            label="Test avtomatik deaktivatsiya"
            description="Barcha o'quvchi topshirgandan so'ng test avtomatik nofaol bo'lsin"
            value={config.autoDeactivateTests}
            onChange={() => toggle('autoDeactivateTests')}
          />
        </div>
      </Card>

      {/* Standart qiymatlar */}
      <Card title="Standart qiymatlar" description="Yangi test yaratiladigan standart sozlamalar">
        <div className="space-y-5">
          <NumberSetting
            label="Standart Vocabulary vaqti (daqiqa)"
            description="Yangi test uchun Vocabulary bo'limining standart vaqt limiti"
            value={config.defaultVocabTime}
            min={5} max={120}
            onChange={v => setNum('defaultVocabTime', v)}
          />
          <NumberSetting
            label="Standart Grammar vaqti (daqiqa)"
            description="Yangi test uchun Grammar bo'limining standart vaqt limiti"
            value={config.defaultGrammarTime}
            min={5} max={120}
            onChange={v => setNum('defaultGrammarTime', v)}
          />
          <NumberSetting
            label="Bir testdagi maksimal o'quvchilar"
            description="Bir vaqtda testda qatnasha oladigan maximum o'quvchi soni"
            value={config.maxStudentsPerTest}
            min={1} max={1000}
            onChange={v => setNum('maxStudentsPerTest', v)}
          />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
        >
          Sozlamalarni saqlash
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Saqlandi
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Xavfli zona ─────────────────────────────────────────────────────────────

function DangerSection() {
  const [confirmText, setConfirmText] = useState('');
  const CONFIRM_WORD = 'TASDIQLASH';

  return (
    <Card title="Xavfli zona" description="Bu amalar qaytarib bo'lmaydi — ehtiyot bo'ling">
      <div className="space-y-4">
        {/* Warning banner */}
        <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            Quyidagi amallar barcha ma'lumotlarni qaytarib bo'lmaydigan tarzda o'chiradi. Davom etishdan oldin ikki marta o'ylab ko'ring.
          </p>
        </div>

        {/* Danger actions */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          <DangerItem
            title="Barcha natijalarni o'chirish"
            description="Barcha o'quvchilarning test natijalari butunlay o'chiriladi. Testlar saqlanib qoladi."
            buttonLabel="Natijalarni tozalash"
          />
          <DangerItem
            title="Barcha testlarni o'chirish"
            description="Barcha testlar (va ularga tegishli natijalar) o'chiriladi."
            buttonLabel="Testlarni tozalash"
          />
          <DangerItem
            title="Barcha o'quvchillarni o'chirish"
            description="Barcha o'quvchi hisoblari va natijalari o'chiriladi."
            buttonLabel="O'quvchilarni o'chirish"
          />
        </div>

        {/* Confirm delete zone */}
        <div className="mt-6 p-5 border border-red-200 dark:border-red-800/40 rounded-xl bg-red-50/50 dark:bg-red-950/20 space-y-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Amalni tasdiqlash uchun quyidagi so'zni kiriting:{' '}
            <code className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-mono text-xs">{CONFIRM_WORD}</code>
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value.toUpperCase())}
            placeholder={CONFIRM_WORD}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800/40 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
          />
          <button
            disabled={confirmText !== CONFIRM_WORD}
            onClick={() => alert("Bu funksiya hozircha demo rejimda ishlaydi")}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Tasdiqlash va o'chirish
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Yordamchi komponentlar ───────────────────────────────────────────────────

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800">
        <h2 className="font-bold text-gray-900 dark:text-white text-base">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, prefix, disabled, hint, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; prefix?: string; disabled?: boolean; hint?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${prefix ? 'pl-8' : 'px-4'} pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {show ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </>
            )}
          </svg>
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function ToggleSetting({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
      </button>
    </div>
  );
}

function NumberSetting({ label, description, value, onChange, min, max }: {
  label: string; description: string; value: number;
  onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold transition-colors"
        >−</button>
        <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold transition-colors"
        >+</button>
      </div>
    </div>
  );
}

function DangerItem({ title, description, buttonLabel }: {
  title: string; description: string; buttonLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-gray-900">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => alert("Tasdiqlash oynasidan foydalaning")}
        className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
