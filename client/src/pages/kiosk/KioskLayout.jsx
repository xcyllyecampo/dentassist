import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { playClick } from '../../lib/sounds';
import { ArrowLeft } from 'lucide-react';

export default function KioskLayout({ children, showBack = true, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isHome = location.pathname === '/kiosk';

  return (
    <div className="min-h-screen kiosk-bg flex flex-col items-center relative overflow-hidden">
      <div className="kiosk-glow" style={{ top: '-120px', left: '50%', transform: 'translateX(-50%)' }} />
      <div className="kiosk-glow-2" style={{ bottom: '5%', left: '25%' }} />

      <header className="flex items-center justify-between px-5 py-3 shrink-0 w-full max-w-2xl relative z-10">
        <div className="flex items-center gap-3">
          {showBack && !isHome ? (
            <button
              onClick={() => { playClick(); navigate('/kiosk'); }}
              className="kiosk-touch flex items-center gap-1.5 px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white rounded-xl text-sm font-medium transition-all border border-white/[0.06]"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}
        </div>

        {user && !isHome && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500/20 border border-teal-500/30 rounded-full flex items-center justify-center text-teal-300 text-xs font-bold">
              {user.name?.charAt(0)}
            </div>
            <span className="text-white/50 text-xs font-medium">{user.name?.split(' ')[0]}</span>
          </div>
        )}
      </header>

      {title && (
        <div className="px-5 pb-2 shrink-0 w-full max-w-2xl relative z-10">
          <h1 className="kiosk-heading text-lg text-white">{title}</h1>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-5 pb-8 w-full max-w-2xl relative z-10 kiosk-scrollbar">
        {children}
      </main>
    </div>
  );
}
