import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import KioskLayout from './KioskLayout';
import { TREATMENTS } from '../../lib/treatments';
import { ClipboardCheck, ScanFace, Clock, FolderOpen, Sparkles, DollarSign, ArrowRight } from 'lucide-react';

const SIDE_CARDS = [
  { id: 'oral', path: '/kiosk/oral-screening', icon: ScanFace, label: 'Oral Screening', subtitle: 'AI photo analysis', gradient: 'from-emerald-500 to-emerald-600' },
  { id: 'queue', path: '/kiosk/queue', icon: Clock, label: 'Queue Status', subtitle: 'Your position & wait', gradient: 'from-amber-500 to-amber-600' },
  { id: 'records', path: '/kiosk/records', icon: FolderOpen, label: 'My Records', subtitle: 'Appointments & history', gradient: 'from-violet-500 to-violet-600' },
  { id: 'smile', path: '/kiosk/smile', icon: Sparkles, label: 'Smile Simulation', subtitle: 'Preview your makeover', gradient: 'from-rose-500 to-rose-600' },
];

export default function KioskHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <KioskLayout showBack={false}>
      <div className="flex flex-col gap-4">
        {/* Logo + greeting */}
        <div className="text-center mb-2">
          <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-14 mx-auto object-contain drop-shadow-xl mb-2" />
          <h2 className="text-2xl font-bold text-white mb-0.5">
            Welcome, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-white/50 text-sm">What would you like to do today?</p>
        </div>

        {/* Hero Walk-In card — full width, top */}
        <button
          onClick={() => navigate('/kiosk/check-in')}
          className="group w-full bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl border-2 border-blue-400/30 p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30 hover:border-blue-400/50 active:scale-[0.98] flex items-center gap-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10 w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm group-hover:scale-110 transition-transform shadow-xl">
            <ClipboardCheck size={32} className="text-white" />
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="text-2xl font-bold text-white leading-tight">WALK-IN<br />CHECK-IN</h3>
            <p className="text-blue-200/70 text-sm mt-1">Tap to join the queue</p>
          </div>
          <ArrowRight size={24} className="text-white/60 group-hover:translate-x-1 transition-transform relative z-10 shrink-0" />
        </button>

        {/* 4 service cards — 2×2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {SIDE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => navigate(card.path)}
                className="group bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-left transition-all duration-300 hover:scale-[1.03] hover:bg-white/15 hover:shadow-xl hover:border-white/30 active:scale-[0.98]"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h4 className="text-white font-bold text-xs leading-tight">{card.label}</h4>
                <p className="text-white/40 text-[10px] mt-0.5">{card.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Treatment Info Panel */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4">
          <h4 className="text-white font-bold text-xs mb-3 uppercase tracking-wider">Available Treatments</h4>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 kiosk-scrollbar">
            {TREATMENTS.map((t, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-xl shrink-0">{t.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-xs font-medium truncate">{t.name}</div>
                  <div className="text-green-400 text-[10px] font-medium">{t.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </KioskLayout>
  );
}
