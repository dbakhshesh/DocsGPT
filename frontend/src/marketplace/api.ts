import type { Course, Purchase, TeacherStats } from './types';

const API_BASE = (import.meta.env.VITE_API_HOST || '') + '/marketplace/api';

function authHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'خطای سرور');
  return json as T;
}

// ── AUTH ─────────────────────────────────────────────────────────────

export async function apiRegister(payload: {
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'student';
  bio?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<{
    token: string;
    user: {
      id: number;
      email: string;
      name: string;
      role: 'teacher' | 'student';
    };
  }>(res);
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<{
    token: string;
    user: {
      id: number;
      email: string;
      name: string;
      role: 'teacher' | 'student';
      bio?: string;
    };
  }>(res);
}

// ── COURSES ───────────────────────────────────────────────────────────

export async function apiGetCourses(params?: {
  category?: string;
  search?: string;
}): Promise<Course[]> {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.search) q.set('search', params.search);
  const res = await fetch(`${API_BASE}/courses?${q}`);
  return handleResponse<Course[]>(res);
}

export async function apiGetCourse(
  id: number,
  token?: string | null,
): Promise<Course> {
  const res = await fetch(`${API_BASE}/courses/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse<Course>(res);
}

export async function apiCreateCourse(
  payload: {
    title: string;
    description: string;
    price: number;
    category: string;
  },
  token: string,
): Promise<Course> {
  const res = await fetch(`${API_BASE}/courses`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<Course>(res);
}

export async function apiUpdateCourse(
  id: number,
  payload: Partial<{
    title: string;
    description: string;
    price: number;
    category: string;
  }>,
  token: string,
): Promise<Course> {
  const res = await fetch(`${API_BASE}/courses/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<Course>(res);
}

export async function apiTogglePublish(
  id: number,
  token: string,
): Promise<{ is_published: boolean }> {
  const res = await fetch(`${API_BASE}/courses/${id}/publish`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<{ is_published: boolean }>(res);
}

export async function apiDeleteCourse(id: number, token: string) {
  const res = await fetch(`${API_BASE}/courses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse<{ status: string }>(res);
}

// ── CONTENT ───────────────────────────────────────────────────────────

export async function apiAddContent(
  courseId: number,
  formData: FormData,
  token: string,
) {
  const res = await fetch(`${API_BASE}/courses/${courseId}/content`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handleResponse<{
    id: number;
    title: string;
    content_type: string;
    file_path?: string;
  }>(res);
}

export async function apiDeleteContent(contentId: number, token: string) {
  const res = await fetch(`${API_BASE}/content/${contentId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse<{ status: string }>(res);
}

// ── PURCHASE ──────────────────────────────────────────────────────────

export async function apiPurchaseCourse(courseId: number, token: string) {
  const res = await fetch(`${API_BASE}/courses/${courseId}/purchase`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<{ status: string; message: string }>(res);
}

export async function apiGetPurchases(token: string): Promise<Purchase[]> {
  const res = await fetch(`${API_BASE}/student/purchases`, {
    headers: authHeaders(token),
  });
  return handleResponse<Purchase[]>(res);
}

// ── TEACHER ───────────────────────────────────────────────────────────

export async function apiGetTeacherCourses(token: string): Promise<Course[]> {
  const res = await fetch(`${API_BASE}/teacher/courses`, {
    headers: authHeaders(token),
  });
  return handleResponse<Course[]>(res);
}

export async function apiGetTeacherStats(token: string): Promise<TeacherStats> {
  const res = await fetch(`${API_BASE}/teacher/stats`, {
    headers: authHeaders(token),
  });
  return handleResponse<TeacherStats>(res);
}

export async function apiGetCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/categories`);
  return handleResponse<string[]>(res);
}
