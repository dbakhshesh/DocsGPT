import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiLogin } from '../api';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiLogin(email, password);
      login(token, user);
      navigate(
        user.role === 'teacher'
          ? '/marketplace/teacher'
          : '/marketplace/student',
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 px-4"
      style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-5xl">🎓</span>
          <h1 className="mt-3 text-2xl font-extrabold text-gray-900">
            ورود به آکادمی‌آنلاین
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            به دنیای یادگیری خوش آمدید
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                ایمیل
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                رمز عبور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="رمز عبور"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
            >
              {loading ? 'در حال ورود…' : 'ورود به حساب'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            حساب ندارید؟{' '}
            <Link
              to="/marketplace/register"
              className="font-bold text-purple-600 hover:underline"
            >
              ثبت‌نام کنید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
