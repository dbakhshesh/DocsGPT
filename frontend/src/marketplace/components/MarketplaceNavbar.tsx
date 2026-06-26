import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function MarketplaceNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/marketplace');
  }

  return (
    <nav className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between" dir="rtl">
          {/* Logo */}
          <Link
            to="/marketplace"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <span className="text-2xl">🎓</span>
            <span>آکادمی‌آنلاین</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link
              to="/marketplace"
              className="transition-colors hover:text-purple-200"
            >
              دوره‌ها
            </Link>

            {user && user.role === 'teacher' && (
              <>
                <Link
                  to="/marketplace/teacher"
                  className="transition-colors hover:text-purple-200"
                >
                  پنل استاد
                </Link>
                <Link
                  to="/marketplace/teacher/create"
                  className="transition-colors hover:text-purple-200"
                >
                  دوره جدید
                </Link>
              </>
            )}

            {user && user.role === 'student' && (
              <Link
                to="/marketplace/student"
                className="transition-colors hover:text-purple-200"
              >
                دوره‌های من
              </Link>
            )}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-purple-200">
                  {user.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-white/20 px-4 py-1.5 font-medium transition-colors hover:bg-white/30"
                >
                  خروج
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/marketplace/login"
                  className="rounded-lg border border-white/40 px-4 py-1.5 font-medium transition-colors hover:bg-white/10"
                >
                  ورود
                </Link>
                <Link
                  to="/marketplace/register"
                  className="rounded-lg bg-white px-4 py-1.5 font-bold text-purple-700 transition-colors hover:bg-purple-50"
                >
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
