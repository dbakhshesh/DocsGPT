import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  apiGetTeacherCourses,
  apiGetTeacherStats,
  apiTogglePublish,
  apiDeleteCourse,
} from '../api';
import { useAuth } from '../AuthContext';
import type { Course, TeacherStats } from '../types';

export default function TeacherDashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/marketplace/login');
      return;
    }
    if (!token) return;
    Promise.all([apiGetTeacherCourses(token), apiGetTeacherStats(token)])
      .then(([c, s]) => {
        setCourses(c);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, [user, token, navigate]);

  async function handleToggle(courseId: number) {
    if (!token) return;
    try {
      const res = await apiTogglePublish(courseId, token);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, is_published: res.is_published } : c,
        ),
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'خطا');
    }
  }

  async function handleDelete(courseId: number, title: string) {
    if (!token || !confirm(`دوره «${title}» حذف شود؟`)) return;
    try {
      await apiDeleteCourse(courseId, token);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      if (stats) {
        setStats({ ...stats, total_courses: stats.total_courses - 1 });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'خطا');
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 animate-pulse items-center justify-center text-4xl">
        ⏳
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 py-8 px-4"
      style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">پنل استاد</h1>
            <p className="mt-1 text-sm text-gray-500">
              خوش آمدید، {user?.name}
            </p>
          </div>
          <Link
            to="/marketplace/teacher/create"
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
          >
            <span>+</span> دوره جدید
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: 'کل دوره‌ها',
                value: stats.total_courses,
                icon: '📚',
                color: 'bg-purple-50 text-purple-700',
              },
              {
                label: 'منتشر شده',
                value: stats.published_courses,
                icon: '✅',
                color: 'bg-green-50 text-green-700',
              },
              {
                label: 'کل دانشجویان',
                value: stats.total_enrollments,
                icon: '👥',
                color: 'bg-blue-50 text-blue-700',
              },
              {
                label: 'درآمد (تومان)',
                value: stats.total_revenue.toLocaleString('fa-IR'),
                icon: '💰',
                color: 'bg-yellow-50 text-yellow-700',
              },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
                <div className="mb-2 text-3xl">{s.icon}</div>
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="mt-1 text-sm font-medium opacity-80">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Courses */}
        {courses.length === 0 ? (
          <div className="rounded-2xl bg-white p-16 text-center shadow-sm">
            <div className="mb-4 text-6xl">📚</div>
            <p className="mb-6 text-lg text-gray-500">
              هنوز دوره‌ای ایجاد نکرده‌اید
            </p>
            <Link
              to="/marketplace/teacher/create"
              className="rounded-xl bg-purple-600 px-6 py-3 font-bold text-white transition-colors hover:bg-purple-700"
            >
              اولین دوره را ایجاد کنید
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="truncate text-base font-bold text-gray-900">
                        {course.title}
                      </h3>
                      <span
                        className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          course.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {course.is_published ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </div>
                    <p className="line-clamp-1 mb-3 text-sm text-gray-500">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
                      <span>📋 {course.content_count} جلسه</span>
                      <span>👥 {course.enrollment_count} دانشجو</span>
                      <span>
                        💰 {(course.total_revenue ?? 0).toLocaleString('fa-IR')}{' '}
                        تومان
                      </span>
                      <span>
                        🏷️{' '}
                        {course.price === 0
                          ? 'رایگان'
                          : `${course.price.toLocaleString('fa-IR')} تومان`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Link
                      to={`/marketplace/teacher/course/${course.id}/edit`}
                      className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                      ✏️ ویرایش
                    </Link>
                    <button
                      onClick={() => handleToggle(course.id)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        course.is_published
                          ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {course.is_published ? 'پنهان‌کردن' : '🚀 انتشار'}
                    </button>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* Content preview */}
                {course.contents && course.contents.length > 0 && (
                  <div className="mt-4 border-t border-gray-50 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {course.contents.slice(0, 5).map((c) => (
                        <span
                          key={c.id}
                          className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1 text-xs text-gray-500"
                        >
                          {c.content_type === 'video'
                            ? '🎬'
                            : c.content_type === 'pdf'
                            ? '📄'
                            : '📝'}{' '}
                          {c.title}
                        </span>
                      ))}
                      {(course.contents?.length ?? 0) > 5 && (
                        <span className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1 text-xs text-gray-400">
                          +{(course.contents?.length ?? 0) - 5} مورد دیگر
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
