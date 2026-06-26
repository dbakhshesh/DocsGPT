import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRegister } from '../api';
import { useAuth } from '../AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'teacher' | 'student',
    bio: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiRegister(form);
      login(token, user);
      navigate(
        user.role === 'teacher'
          ? '/marketplace/teacher'
          : '/marketplace/student',
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت‌نام');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 px-4 py-10"
      style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-5xl">🎓</span>
          <h1 className="mt-3 text-2xl font-extrabold text-gray-900">
            ثبت‌نام در آکادمی‌آنلاین
          </h1>
          <p className="mt-1 text-sm text-gray-500">حساب جدید ایجاد کنید</p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Role selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                نقش شما
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => update('role', 'student')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    form.role === 'student'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">👨‍🎓</span>
                  <span className="text-sm font-semibold">دانشجو</span>
                  <span className="text-center text-xs opacity-70">
                    خرید و یادگیری دوره
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => update('role', 'teacher')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    form.role === 'teacher'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">👨‍🏫</span>
                  <span className="text-sm font-semibold">استاد</span>
                  <span className="text-center text-xs opacity-70">
                    تدریس و فروش محتوا
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                placeholder="علی احمدی"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                ایمیل
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
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
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                placeholder="حداقل ۶ کاراکتر"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            {form.role === 'teacher' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  بیوگرافی (اختیاری)
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  placeholder="معرفی مختصر از تخصص شما…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
            >
              {loading ? 'در حال ثبت‌نام…' : 'ایجاد حساب'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            حساب دارید؟{' '}
            <Link
              to="/marketplace/login"
              className="font-bold text-purple-600 hover:underline"
            >
              وارد شوید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
