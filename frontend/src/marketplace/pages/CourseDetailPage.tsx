import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiGetCourse, apiPurchaseCourse } from '../api';
import { useAuth } from '../AuthContext';
import type { Course } from '../types';

const API_BASE = import.meta.env.VITE_API_HOST || '';

const CONTENT_ICONS: Record<string, string> = {
  video: '🎬',
  pdf: '📄',
  note: '📝',
};

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    apiGetCourse(Number(id), token)
      .then(setCourse)
      .catch(() => setError('دوره یافت نشد'))
      .finally(() => setLoading(false));
  }, [id, token]);

  async function handlePurchase() {
    if (!user) {
      navigate('/marketplace/login');
      return;
    }
    if (!token || !course) return;
    setPurchasing(true);
    setError('');
    try {
      const res = await apiPurchaseCourse(course.id, token);
      setSuccessMsg(res.message);
      const updated = await apiGetCourse(course.id, token);
      setCourse(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در خرید');
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 animate-pulse items-center justify-center text-4xl">
        ⏳
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-red-500">{error}</p>
        <Link
          to="/marketplace"
          className="mt-4 inline-block text-purple-600 underline"
        >
          بازگشت به دوره‌ها
        </Link>
      </div>
    );
  }

  if (!course) return null;

  const isOwner = user?.id === course.teacher_id;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 py-8 px-4"
      style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}
    >
      <div className="mx-auto max-w-5xl">
        <Link
          to="/marketplace"
          className="mb-6 inline-flex items-center gap-2 text-sm text-purple-600 hover:underline"
        >
          ← بازگشت به دوره‌ها
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Header */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <span className="mb-4 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                {course.category}
              </span>
              <h1 className="mb-3 text-2xl font-extrabold text-gray-900">
                {course.title}
              </h1>
              <p className="leading-relaxed text-gray-600">
                {course.description}
              </p>

              <div className="mt-5 flex items-center gap-6 text-sm text-gray-500">
                <span>👨‍🏫 {course.teacher_name}</span>
                <span>📋 {course.content_count} جلسه</span>
                <span>👥 {course.enrollment_count} دانشجو</span>
              </div>
            </div>

            {/* Teacher info */}
            {course.teacher_bio && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-base font-bold text-gray-800">
                  درباره استاد
                </h2>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-2xl">
                    👨‍🏫
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {course.teacher_name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {course.teacher_bio}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content list */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-gray-800">
                سرفصل‌های دوره
              </h2>
              {course.contents && course.contents.length > 0 ? (
                <div className="space-y-2">
                  {course.contents.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {c.title}
                          </p>
                          {c.description && (
                            <p className="text-xs text-gray-400">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{CONTENT_ICONS[c.content_type] ?? '📄'}</span>
                        {c.is_preview && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            رایگان
                          </span>
                        )}
                        {(course.has_purchased || isOwner) && c.file_path && (
                          <a
                            href={`${API_BASE}${c.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 transition-colors hover:bg-purple-200"
                          >
                            دانلود
                          </a>
                        )}
                        {!course.has_purchased && !isOwner && !c.is_preview && (
                          <span className="text-gray-300">🔒</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-gray-400">
                  محتوایی هنوز اضافه نشده است
                </p>
              )}
            </div>
          </div>

          {/* Sidebar - Purchase card */}
          <div>
            <div className="sticky top-6 rounded-2xl bg-white p-6 shadow-lg">
              <div className="mb-6 text-center">
                {course.price === 0 ? (
                  <div className="text-3xl font-extrabold text-green-600">
                    رایگان
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-extrabold text-purple-700">
                      {course.price.toLocaleString('fa-IR')}
                    </div>
                    <div className="mt-1 text-sm text-gray-400">تومان</div>
                  </div>
                )}
              </div>

              {successMsg && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-700">
                  ✅ {successMsg}
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                  {error}
                </div>
              )}

              {isOwner ? (
                <Link
                  to={`/marketplace/teacher/course/${course.id}/edit`}
                  className="block w-full rounded-xl bg-indigo-600 py-3 text-center font-bold text-white transition-colors hover:bg-indigo-700"
                >
                  ✏️ ویرایش دوره
                </Link>
              ) : course.has_purchased ? (
                <div className="text-center">
                  <div className="mb-3 text-base font-bold text-green-600">
                    ✅ این دوره خریداری شده
                  </div>
                  <p className="text-sm text-gray-500">
                    به تمام محتوا دسترسی دارید
                  </p>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full rounded-xl bg-purple-600 py-3 font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
                >
                  {purchasing
                    ? 'در حال پردازش…'
                    : course.price === 0
                    ? '🎁 ثبت‌نام رایگان'
                    : '🛒 خرید دوره'}
                </button>
              )}

              <div className="mt-5 space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <span>دسترسی دائمی</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📱</span>
                  <span>قابل استفاده در همه دستگاه‌ها</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>پرداخت امن</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
