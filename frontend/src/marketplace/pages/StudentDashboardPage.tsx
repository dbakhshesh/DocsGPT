import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGetPurchases } from '../api';
import { useAuth } from '../AuthContext';
import type { Purchase } from '../types';

export default function StudentDashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/marketplace/login');
      return;
    }
    if (!token) return;
    apiGetPurchases(token)
      .then(setPurchases)
      .finally(() => setLoading(false));
  }, [user, token, navigate]);

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
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">دوره‌های من</h1>
          <p className="mt-1 text-sm text-gray-500">
            خوش آمدید، {user?.name} · {purchases.length} دوره
          </p>
        </div>

        {purchases.length === 0 ? (
          <div className="rounded-2xl bg-white p-16 text-center shadow-sm">
            <div className="mb-4 text-6xl">🎒</div>
            <p className="mb-6 text-lg text-gray-500">
              هنوز دوره‌ای خریداری نکرده‌اید
            </p>
            <Link
              to="/marketplace"
              className="rounded-xl bg-purple-600 px-6 py-3 font-bold text-white transition-colors hover:bg-purple-700"
            >
              مشاهده دوره‌ها
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {purchases.map((p) => (
              <Link
                key={p.purchase_id}
                to={`/marketplace/course/${p.course.id}`}
                className="group flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="inline-block rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                        {p.course.category}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 font-bold text-gray-900 transition-colors group-hover:text-purple-700">
                      {p.course.title}
                    </h3>
                  </div>
                  <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xl">
                    ✅
                  </div>
                </div>

                <p className="line-clamp-2 text-sm text-gray-500">
                  {p.course.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>👨‍🏫 {p.course.teacher_name}</span>
                  <span>📋 {p.course.content_count} جلسه</span>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-xs text-gray-400">
                    خریداری شده در{' '}
                    {new Date(p.purchased_at).toLocaleDateString('fa-IR')}
                  </span>
                  <span className="text-xs font-semibold text-purple-700">
                    {p.amount_paid === 0
                      ? 'رایگان'
                      : `${p.amount_paid.toLocaleString('fa-IR')} تومان`}
                  </span>
                </div>

                <div className="rounded-xl bg-purple-600 py-2 text-center text-sm font-bold text-white transition-colors group-hover:bg-purple-700">
                  مشاهده محتوا →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
