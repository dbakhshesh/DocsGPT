import { Link } from 'react-router-dom';
import type { Course } from '../types';

const CATEGORY_ICONS: Record<string, string> = {
  ریاضیات: '📐',
  فیزیک: '⚡',
  شیمی: '🧪',
  'زیست شناسی': '🧬',
  'برنامه نویسی': '💻',
  طراحی: '🎨',
  بازرگانی: '📊',
  'زبان انگلیسی': '🌍',
  تاریخ: '📜',
  جغرافیا: '🗺️',
  هنر: '🖌️',
  موسیقی: '🎵',
  ورزش: '⚽',
  سایر: '📚',
};

const CATEGORY_COLORS: Record<string, string> = {
  ریاضیات: 'bg-blue-100 text-blue-700',
  فیزیک: 'bg-yellow-100 text-yellow-700',
  شیمی: 'bg-green-100 text-green-700',
  'زیست شناسی': 'bg-emerald-100 text-emerald-700',
  'برنامه نویسی': 'bg-purple-100 text-purple-700',
  طراحی: 'bg-pink-100 text-pink-700',
  بازرگانی: 'bg-orange-100 text-orange-700',
  'زبان انگلیسی': 'bg-cyan-100 text-cyan-700',
  تاریخ: 'bg-amber-100 text-amber-700',
  جغرافیا: 'bg-teal-100 text-teal-700',
  هنر: 'bg-rose-100 text-rose-700',
  موسیقی: 'bg-violet-100 text-violet-700',
  ورزش: 'bg-lime-100 text-lime-700',
  سایر: 'bg-gray-100 text-gray-700',
};

interface Props {
  course: Course;
}

export default function CourseCard({ course }: Props) {
  const icon = CATEGORY_ICONS[course.category] ?? '📚';
  const colorClass =
    CATEGORY_COLORS[course.category] ?? 'bg-gray-100 text-gray-700';

  return (
    <Link to={`/marketplace/course/${course.id}`} dir="rtl">
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-lg">
        {/* Header */}
        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 text-6xl">
          {icon}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          {/* Category badge */}
          <span
            className={`self-start rounded-full px-3 py-0.5 text-xs font-semibold ${colorClass}`}
          >
            {course.category}
          </span>

          {/* Title */}
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-purple-700">
            {course.title}
          </h3>

          {/* Description */}
          <p className="line-clamp-2 flex-1 text-sm text-gray-500">
            {course.description}
          </p>

          {/* Teacher */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span>👨‍🏫</span>
            <span>{course.teacher_name}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>📋 {course.content_count} جلسه</span>
            <span>👥 {course.enrollment_count} دانشجو</span>
          </div>

          {/* Price */}
          <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
            {course.price === 0 ? (
              <span className="text-lg font-bold text-green-600">رایگان</span>
            ) : (
              <span className="text-lg font-bold text-purple-700">
                {course.price.toLocaleString('fa-IR')} تومان
              </span>
            )}
            <span className="rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white transition-colors group-hover:bg-purple-700">
              مشاهده
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
