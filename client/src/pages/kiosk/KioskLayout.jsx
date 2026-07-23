import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { playClick } from '../../lib/sounds';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#0D6D65] flex flex-col items-center">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0 w-full max-w-2xl">
        <div className="flex items-center gap-3">
          {showBack && !isHome && (
            <button
              onClick={() => { playClick(); navigate('/kiosk'); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors backdrop-blur-sm"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {isHome && <div />}
        </div>

      </header>

      {/* Title bar */}
      {title && (
        <div className="px-6 pb-3 shrink-0 w-full max-w-2xl">
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 pb-6 w-full max-w-2xl">
        {children}
      </main>
    </div>
  );
}
