import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { playClick } from '../../lib/sounds';
import KioskLayout from './KioskLayout';
import { ClipboardCheck, ScanFace, Clock, FolderOpen, Sparkles, ArrowRight, CalendarPlus, LogOut } from 'lucide-react';

const SIDE_CARDS = [
  { id: 'queue', path: '/kiosk/queue', icon: Clock, label: 'Queue Status', subtitle: 'Your position & wait', gradient: 'from-amber-500 to-amber-600' },
  { id: 'oral', path: '/kiosk/oral-screening', icon: ScanFace, label: 'AI Oral Check', subtitle: 'Scan your mouth with AI', gradient: 'from-emerald-500 to-emerald-600' },
  { id: 'smile', path: '/kiosk/smile', icon: Sparkles, label: 'Smile Analysis', subtitle: 'See what AI finds', gradient: 'from-rose-500 to-rose-600' },
  { id: 'records', path: '/kiosk/records', icon: FolderOpen, label: 'My Records', subtitle: 'Appointments & history', gradient: 'from-amber-400 to-yellow-500' },
  { id: 'logout', path: '', icon: LogOut, label: 'Logout', subtitle: 'Sign out of your account', gradient: 'from-slate-500 to-slate-600', action: 'logout' },
];

export default function KioskHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleCardClick = (card) => {
    playClick();
    if (card.action === 'logout') {
      logout();
      navigate('/login');
    } else {
      navigate(card.path);
    }
  };

  return (
    <KioskLayout showBack={false}>
      <div className="flex flex-col h-full min-h-[calc(100vh-140px)]">
        {/* Logo + greeting */}
        <div className="text-center mb-4">
          <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-14 mx-auto object-contain drop-shadow-xl mb-2" />
          <h2 className="text-3xl font-bold text-white mb-0.5">
            Welcome, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-white/50 text-base">What would you like to do today?</p>
        </div>

        {/* Split: Left Walk-In + Book | Right 4 cards stacked */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* LEFT: Two big cards stacked */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => { playClick(); navigate('/kiosk/check-in'); }}
              className="group bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl border-2 border-teal-400/30 p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/30 hover:border-teal-400/50 active:scale-[0.98] flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4 mx-auto backdrop-blur-sm group-hover:scale-110 transition-transform shadow-xl">
                  <ClipboardCheck size={40} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white leading-tight">WALK-IN</h3>
                <h3 className="text-3xl font-bold text-teal-200 leading-tight mb-2">CHECK-IN</h3>
                <p className="text-teal-200/70 text-sm mb-3">Tap here to join the queue</p>
                <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/20 rounded-xl text-white font-bold text-sm backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                  Get Started <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            <button
              onClick={() => { playClick(); navigate('/kiosk/book'); }}
              className="group bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl border-2 border-purple-400/30 p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-400/50 active:scale-[0.98] flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4 mx-auto backdrop-blur-sm group-hover:scale-110 transition-transform shadow-xl">
                  <CalendarPlus size={40} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white leading-tight">BOOK AN</h3>
                <h3 className="text-3xl font-bold text-purple-200 leading-tight mb-2">APPOINTMENT</h3>
                <p className="text-purple-200/70 text-sm mb-3">Schedule a visit in advance</p>
                <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/20 rounded-xl text-white font-bold text-sm backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                  Book Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>

          {/* RIGHT: 4 cards stacked vertically */}
          <div className="flex flex-col gap-3">
            {SIDE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                  <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className="group flex-1 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-left transition-all duration-300 hover:scale-[1.03] hover:bg-white/15 hover:shadow-xl hover:border-white/30 active:scale-[0.98] flex items-center gap-3"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={28} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-lg leading-tight">{card.label}</h4>
                    <p className="text-white/40 text-sm mt-0.5">{card.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </KioskLayout>
  );
}
