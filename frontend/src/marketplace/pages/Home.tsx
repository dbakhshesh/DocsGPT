import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGetCourses, apiGetCategories } from '../api';
import CourseCard from '../components/CourseCard';
import type { Course } from '../types';

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGetCategories()
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    apiGetCourses({
      category: selectedCategory || undefined,
      search: search || undefined,
    })
      .then(setCourses)
      .catch(() => setError('خطا در بارگذاری دوره‌ها'))
      .finally(() => setLoading(false));
  }, [selectedCategory, search]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}
    >
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-800 py-20 px-4 text-center text-white">
        <h1 className="mb-4 text-4xl font-extrabold">بازار محتوای آموزشی</h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-purple-200">
          هزاران دوره آموزشی از بهترین اساتید را کشف کنید و مهارت‌های جدید
          بیاموزید
        </p>
        {/* Search */}
        <div className="relative mx-auto max-w-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی دوره…"
            className="w-full rounded-2xl py-4 px-5 pr-14 text-base text-gray-800 shadow-lg outline-none focus:ring-2 focus:ring-purple-300"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">
            🔍
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Stats bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>
              🎓 <strong className="text-gray-800">{courses.length}</strong>{' '}
              دوره
            </span>
          </div>
          <Link
            to="/marketplace/register"
            className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-700"
          >
            + تدریس کنید
          </Link>
        </div>

        {/* Category filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-purple-600 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-purple-300'
            }`}
          >
            همه
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategory(cat === selectedCategory ? '' : cat)
              }
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-purple-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course grid */}
        {loading ? (
          <div className="flex animate-spin items-center justify-center py-24 text-4xl text-purple-600">
            ⏳
          </div>
        ) : error ? (
          <p className="py-20 text-center text-red-500">{error}</p>
        ) : courses.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-6xl">🎒</div>
            <p className="text-lg text-gray-500">دوره‌ای یافت نشد</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 text-sm text-purple-600 underline"
              >
                پاک‌کردن جستجو
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
