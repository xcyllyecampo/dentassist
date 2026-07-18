import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, LogOut } from 'lucide-react';

export default function KioskLayout({ children, showBack = true, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isHome = location.pathname === '/kiosk';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#003782] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          {showBack && !isHome && (
            <button
              onClick={() => navigate('/kiosk')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors backdrop-blur-sm"
            >
              <ArrowLeft size={18} /> Back to Home
            </button>
          )}
          {isHome && <div />}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-white/70 text-sm hidden sm:inline">Welcome, <span className="text-white font-medium">{user?.name}</span></span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl text-sm font-medium transition-colors backdrop-blur-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Title bar */}
      {title && (
        <div className="px-6 pb-4 shrink-0">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 pb-8">
        {children}
      </main>
    </div>
  );
}
