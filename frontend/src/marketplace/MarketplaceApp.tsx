import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import MarketplaceNavbar from './components/MarketplaceNavbar';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CourseDetailPage from './pages/CourseDetailPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import CreateCoursePage from './pages/CreateCoursePage';
import StudentDashboardPage from './pages/StudentDashboardPage';

export default function MarketplaceApp() {
  return (
    <AuthProvider>
      <div style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <MarketplaceNavbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/course/:id" element={<CourseDetailPage />} />
          <Route path="/teacher" element={<TeacherDashboardPage />} />
          <Route path="/teacher/create" element={<CreateCoursePage />} />
          <Route
            path="/teacher/course/:id/edit"
            element={<CreateCoursePage />}
          />
          <Route path="/student" element={<StudentDashboardPage />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
