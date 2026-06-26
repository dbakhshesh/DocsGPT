export interface User {
  id: number;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  bio?: string;
}

export interface CourseContent {
  id: number;
  title: string;
  content_type: 'video' | 'pdf' | 'note';
  description?: string;
  is_preview: boolean;
  file_path?: string;
  sort_order: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  teacher_name: string;
  teacher_bio?: string;
  teacher_id?: number;
  content_count: number;
  enrollment_count: number;
  is_published?: boolean;
  has_purchased?: boolean;
  total_revenue?: number;
  created_at: string;
  contents?: CourseContent[];
}

export interface Purchase {
  purchase_id: number;
  purchased_at: string;
  amount_paid: number;
  course: Course;
}

export interface TeacherStats {
  total_courses: number;
  published_courses: number;
  total_enrollments: number;
  total_revenue: number;
}
