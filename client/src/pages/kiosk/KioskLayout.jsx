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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#003782] flex flex-col items-center">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0 w-full max-w-md">
        <div className="flex items-center gap-3">
          {showBack && !isHome && (
            <button
              onClick={() => navigate('/kiosk')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors backdrop-blur-sm"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {isHome && <div />}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl text-sm font-medium transition-colors backdrop-blur-sm"
        >
          <LogOut size={14} /> Logout
        </button>
      </header>

      {/* Title bar */}
      {title && (
        <div className="px-4 pb-3 shrink-0 w-full max-w-md">
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
      )}

      {/* Content — centered vertical column */}
      <main className="flex-1 overflow-y-auto px-4 pb-6 w-full max-w-md">
        {children}
      </main>
    </div>
  );
}
