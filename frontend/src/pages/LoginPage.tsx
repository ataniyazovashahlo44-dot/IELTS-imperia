import LoginForm from '../components/Auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <img
              src="/logo.png"
              alt="IELTS Imperia"
              className="h-12 w-auto object-contain brightness-0 invert"
            onError={e => {
              e.currentTarget.style.display = 'none';
              const fb = e.currentTarget.nextElementSibling as HTMLElement;
              if (fb) fb.style.display = 'flex';
            }}
          />
          <div style={{ display: 'none' }} className="items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
              <span className="text-white text-xl font-black">IE</span>
            </div>
          </div>
          </div>
          <h1 className="text-2xl font-black text-white">Platformaga kirish</h1>
          <p className="text-gray-400 mt-1.5 text-sm">Davom etish uchun tizimga kiring</p>
        </div>
        <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
