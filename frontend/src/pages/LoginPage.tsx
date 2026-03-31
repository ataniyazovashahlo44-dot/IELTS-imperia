import LoginForm from '../components/Auth/LoginForm';
import Logo from '../components/Common/Logo';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo className="h-28" wrapDark />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Platformaga kirish</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Davom etish uchun tizimga kiring</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl dark:shadow-2xl border border-gray-100 dark:border-gray-800 p-8">
          <LoginForm />
        </div>
        <p className="text-center mt-8 text-xs text-gray-400 dark:text-gray-600 font-medium tracking-wide">
          Developed and powered by <span className="text-orange-500 dark:text-orange-400 font-bold">TriCorp agency</span>
        </p>
      </div>
    </div>
  );
}
