import RegisterForm from '../components/Auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <img
              src="/logo.png"
              alt="IELTS Imperia"
              className="h-12 w-auto object-contain brightness-0 invert"
            />
          </div>
          <h1 className="text-2xl font-black text-white">Hisob yaratish</h1>
          <p className="text-gray-400 mt-1.5 text-sm">Talaba sifatida ro'yxatdan o'ting</p>
        </div>
        <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
