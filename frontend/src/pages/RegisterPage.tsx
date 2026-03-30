import RegisterForm from '../components/Auth/RegisterForm';
import Logo from '../components/Common/Logo';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo className="h-20" wrapDark />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Hisob yaratish</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Talaba sifatida ro'yxatdan o'ting</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl dark:shadow-2xl border border-gray-100 dark:border-gray-800 p-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
