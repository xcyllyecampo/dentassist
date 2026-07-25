import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authUrl } from '../../lib/api';
import { playClick } from '../../lib/sounds';
import KioskLayout from './KioskLayout';
import { ClipboardCheck, ScanFace, Clock, FolderOpen, Sparkles, ArrowRight, CalendarPlus, LogOut } from 'lucide-react';

const FEATURES = [
  { id: 'queue', path: '/kiosk/queue', icon: Clock, label: 'Queue Status', subtitle: 'Your position & wait', gradient: 'from-amber-400 to-amber-500' },
  { id: 'oral', path: '/kiosk/oral-screening', icon: ScanFace, label: 'AI Oral Check', subtitle: 'Scan your mouth with AI', gradient: 'from-blue-400 to-blue-500' },
  { id: 'smile', path: '/kiosk/smile', icon: Sparkles, label: 'Smile Analysis', subtitle: 'See what AI finds', gradient: 'from-rose-400 to-rose-500' },
  { id: 'records', path: '/kiosk/records', icon: FolderOpen, label: 'My Records', subtitle: 'Appointments & history', gradient: 'from-violet-400 to-violet-500' },
];

export default function KioskHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <KioskLayout showBack={false}>
      <div className="flex flex-col min-h-[calc(100vh-80px)]">
        {/* Hero greeting */}
        <div className="text-center mb-8 kiosk-in" style={{ animationDelay: '0.05s' }}>
          <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-12 mx-auto object-contain drop-shadow-xl mb-4" />
          <div className="flex items-center justify-center gap-3 mb-1">
            {user?.avatar ? (
              <img src={authUrl(user.avatar)} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-teal-500/30" />
            ) : (
              <div className="w-10 h-10 bg-teal-500/20 border border-teal-500/30 rounded-full flex items-center justify-center text-teal-300 text-sm font-bold kiosk-display">
                {user?.name?.charAt(0)}
              </div>
            )}
            <div className="text-left">
              <p className="text-white/40 text-xs font-medium">{getGreeting()},</p>
              <h2 className="kiosk-display text-2xl text-white leading-tight">{user?.name?.split(' ')[0]}</h2>
            </div>
          </div>
          <p className="text-white/30 text-sm mt-3">How can we help you today?</p>
        </div>

        {/* Hero cards */}
        <div className="flex flex-col gap-3 mb-4">
          <button
            onClick={() => { playClick(); navigate('/kiosk/check-in'); }}
            className="kiosk-hero kiosk-in kiosk-touch group bg-gradient-to-br from-teal-600/80 to-teal-700/80 p-5 text-left flex items-center gap-4"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
              <ClipboardCheck size={28} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="kiosk-display text-lg text-white leading-tight">Walk-In Check-In</h3>
              <p className="text-teal-200/60 text-xs mt-0.5">Tap to join the queue</p>
            </div>
            <ArrowRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          <button
            onClick={() => { playClick(); navigate('/kiosk/book'); }}
            className="kiosk-hero kiosk-in kiosk-touch group bg-gradient-to-br from-violet-600/80 to-violet-700/80 p-5 text-left flex items-center gap-4"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
              <CalendarPlus size={28} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="kiosk-display text-lg text-white leading-tight">Book Appointment</h3>
              <p className="text-violet-200/60 text-xs mt-0.5">Schedule a visit in advance</p>
            </div>
            <ArrowRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {FEATURES.map((card, i) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => { playClick(); navigate(card.path); }}
                className="kiosk-card kiosk-in kiosk-touch group p-4 text-left flex flex-col items-center text-center"
                style={{ animationDelay: `${0.2 + i * 0.05}s` }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-2.5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h4 className="kiosk-heading text-white text-sm leading-tight mb-0.5">{card.label}</h4>
                <p className="text-white/30 text-[11px] leading-tight">{card.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="mt-auto pt-4 kiosk-in" style={{ animationDelay: '0.45s' }}>
          <button
            onClick={() => { playClick(); logout(); navigate('/login'); }}
            className="kiosk-touch w-full flex items-center justify-center gap-2 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-white/40 hover:text-white/60 text-xs font-medium transition-all"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </KioskLayout>
  );
}
