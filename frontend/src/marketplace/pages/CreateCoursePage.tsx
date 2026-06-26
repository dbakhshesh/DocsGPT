import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  apiCreateCourse,
  apiUpdateCourse,
  apiGetCourse,
  apiAddContent,
  apiDeleteContent,
  apiTogglePublish,
  apiGetCategories,
} from '../api';
import { useAuth } from '../AuthContext';
import type { Course, CourseContent } from '../types';

const CONTENT_TYPES = [
  { value: 'video', label: 'ویدیو', icon: '🎬' },
  { value: 'pdf', label: 'PDF / جزوه', icon: '📄' },
  { value: 'note', label: 'یادداشت', icon: '📝' },
];

export default function CreateCoursePage() {
  const { id } = useParams<{ id?: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<string[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '0',
    category: 'سایر',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');

  const [contentForm, setContentForm] = useState({
    title: '',
    content_type: 'pdf',
    description: '',
    is_preview: false,
  });
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [uploadingContent, setUploadingContent] = useState(false);
  const [contentErr, setContentErr] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'teacher') navigate('/marketplace/login');
  }, [user, navigate]);

  useEffect(() => {
    apiGetCategories()
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isEdit && id && token) {
      apiGetCourse(Number(id), token).then((c) => {
        setCourse(c);
        setForm({
          title: c.title,
          description: c.description,
          price: String(c.price),
          category: c.category,
        });
      });
    }
  }, [isEdit, id, token]);

  function update(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSaveErr('');
    setSaveMsg('');
    try {
      const payload = { ...form, price: Number(form.price) };
      if (isEdit && id) {
        const updated = await apiUpdateCourse(Number(id), payload, token);
        setCourse((prev) => (prev ? { ...prev, ...updated } : null));
        setSaveMsg('تغییرات ذخیره شد');
      } else {
        const created = await apiCreateCourse(payload, token);
        navigate(`/marketplace/teacher/course/${created.id}/edit`, {
          replace: true,
        });
      }
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContent(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setUploadingContent(true);
    setContentErr('');
    try {
      const fd = new FormData();
      fd.append('title', contentForm.title);
      fd.append('content_type', contentForm.content_type);
      fd.append('description', contentForm.description);
      fd.append('is_preview', String(contentForm.is_preview));
      fd.append('sort_order', String(course?.contents?.length ?? 0));
      if (contentFile) fd.append('file', contentFile);

      const newContent = await apiAddContent(Number(id), fd, token);
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              contents: [...(prev.contents ?? []), newContent as CourseContent],
              content_count: (prev.content_count ?? 0) + 1,
            }
          : null,
      );
      setContentForm({
        title: '',
        content_type: 'pdf',
        description: '',
        is_preview: false,
      });
      setContentFile(null);
    } catch (err: unknown) {
      setContentErr(err instanceof Error ? err.message : 'خطا در آپلود');
    } finally {
      setUploadingContent(false);
    }
  }

  async function handleDeleteContent(contentId: number) {
    if (!token || !confirm('حذف شود؟')) return;
    try {
      await apiDeleteContent(contentId, token);
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              contents: (prev.contents ?? []).filter((c) => c.id !== contentId),
              content_count: Math.max(0, (prev.content_count ?? 0) - 1),
            }
          : null,
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'خطا');
    }
  }

  async function handleTogglePublish() {
    if (!token || !id) return;
    try {
      const res = await apiTogglePublish(Number(id), token);
      setCourse((prev) =>
        prev ? { ...prev, is_published: res.is_published } : null,
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'خطا');
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 py-8 px-4"
      style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/marketplace/teacher"
            className="text-sm text-purple-600 hover:underline"
          >
            ← پنل استاد
          </Link>
          <h1 className="text-xl font-extrabold text-gray-900">
            {isEdit ? 'ویرایش دوره' : 'ایجاد دوره جدید'}
          </h1>
        </div>

        {/* Course info form */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-800">اطلاعات دوره</h2>
          <form onSubmit={handleSaveCourse} className="space-y-4">
            {saveMsg && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                ✅ {saveMsg}
              </div>
            )}
            {saveErr && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {saveErr}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                عنوان دوره *
              </label>
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                required
                placeholder="مثال: ریاضی دهم پیشرفته"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                توضیحات *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                required
                rows={4}
                placeholder="دوره را به طور کامل توضیح دهید…"
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  دسته‌بندی
                </label>
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  قیمت (تومان)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  placeholder="0 = رایگان"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
              >
                {saving ? 'در حال ذخیره…' : 'ذخیره اطلاعات'}
              </button>

              {isEdit && course && (
                <button
                  type="button"
                  onClick={handleTogglePublish}
                  className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-colors ${
                    course.is_published
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {course.is_published ? '⏸ پنهان‌کردن' : '🚀 انتشار دوره'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Content section - only in edit mode */}
        {isEdit && id && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-800">محتوای دوره</h2>

            {/* Existing content */}
            {course?.contents && course.contents.length > 0 && (
              <div className="mb-6 space-y-2">
                {course.contents.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {c.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {
                            CONTENT_TYPES.find(
                              (t) => t.value === c.content_type,
                            )?.label
                          }
                          {c.is_preview ? ' · پیش‌نمایش رایگان' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteContent(c.id)}
                      className="text-lg text-red-400 transition-colors hover:text-red-600"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add content form */}
            <form
              onSubmit={handleAddContent}
              className="space-y-4 border-t border-gray-100 pt-5"
            >
              <h3 className="text-sm font-bold text-gray-700">
                + افزودن محتوای جدید
              </h3>

              {contentErr && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {contentErr}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    عنوان *
                  </label>
                  <input
                    value={contentForm.title}
                    onChange={(e) =>
                      setContentForm((f) => ({ ...f, title: e.target.value }))
                    }
                    required
                    placeholder="جلسه اول: مقدمه"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    نوع محتوا
                  </label>
                  <select
                    value={contentForm.content_type}
                    onChange={(e) =>
                      setContentForm((f) => ({
                        ...f,
                        content_type: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                  >
                    {CONTENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  فایل (PDF / ویدیو)
                </label>
                <input
                  type="file"
                  accept=".pdf,.mp4,.mov,.avi,.webm,.docx,.pptx"
                  onChange={(e) => setContentFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:ml-3 file:rounded-lg file:border-0 file:bg-purple-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  توضیح (اختیاری)
                </label>
                <input
                  value={contentForm.description}
                  onChange={(e) =>
                    setContentForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="توضیح مختصر"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_preview"
                  checked={contentForm.is_preview}
                  onChange={(e) =>
                    setContentForm((f) => ({
                      ...f,
                      is_preview: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-purple-600"
                />
                <label
                  htmlFor="is_preview"
                  className="cursor-pointer text-sm text-gray-600"
                >
                  پیش‌نمایش رایگان (قابل مشاهده بدون خرید)
                </label>
              </div>

              <button
                type="submit"
                disabled={uploadingContent}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {uploadingContent ? 'در حال آپلود…' : '+ افزودن'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
