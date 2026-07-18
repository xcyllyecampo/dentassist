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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-16 mx-auto object-contain drop-shadow-xl mb-3" />
          <h2 className="text-3xl font-bold text-white mb-1">
            Welcome, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-white/50 text-lg">What would you like to do today?</p>
        </div>

        {/* Main split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: Hero Walk-In Card */}
          <div className="lg:col-span-5">
            <button
              onClick={() => navigate('/kiosk/check-in')}
              className="group w-full h-full min-h-[360px] bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl border-2 border-blue-400/30 p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30 hover:border-blue-400/50 active:scale-[0.98] flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

              <div className="relative z-10">
                <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-6 mx-auto backdrop-blur-sm group-hover:scale-110 transition-transform shadow-xl">
                  <ClipboardCheck size={48} className="text-white" />
                </div>
                <h3 className="text-4xl font-bold text-white mb-3">WALK-IN</h3>
                <h3 className="text-4xl font-bold text-blue-200 mb-4">CHECK-IN</h3>
                <p className="text-blue-200/70 text-lg mb-6 max-w-xs mx-auto">
                  Tap here to join the queue and choose your treatment
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 rounded-xl text-white font-bold text-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                  Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* 4 smaller cards in 2x2 grid */}
            <div className="grid grid-cols-2 gap-4">
              {SIDE_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    onClick={() => navigate(card.path)}
                    className="group bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-5 text-left transition-all duration-300 hover:scale-[1.03] hover:bg-white/15 hover:shadow-xl hover:border-white/30 active:scale-[0.98]"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <h4 className="text-white font-bold text-sm mb-0.5">{card.label}</h4>
                    <p className="text-white/40 text-xs">{card.subtitle}</p>
                  </button>
                );
              })}
            </div>

            {/* Treatment Info Panel */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-5 flex-1 min-h-0">
              <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Available Treatments</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1 kiosk-scrollbar">
                {TREATMENTS.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-2xl shrink-0">{t.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-sm font-medium truncate">{t.name}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400 flex items-center gap-0.5"><DollarSign size={10} />{t.cost}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </KioskLayout>
  );
}
