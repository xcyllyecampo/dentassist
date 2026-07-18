import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import KioskLayout from './KioskLayout';
import { ClipboardCheck, ScanFace, Clock, FolderOpen, Sparkles, ArrowRight } from 'lucide-react';

const SIDE_CARDS = [
  { id: 'oral', path: '/kiosk/oral-screening', icon: ScanFace, label: 'Oral Health', subtitle: 'AI photo analysis', gradient: 'from-emerald-500 to-emerald-600' },
  { id: 'queue', path: '/kiosk/queue', icon: Clock, label: 'View Queue', subtitle: 'Your position & wait', gradient: 'from-amber-500 to-amber-600' },
  { id: 'records', path: '/kiosk/records', icon: FolderOpen, label: 'My Records', subtitle: 'Appointments & history', gradient: 'from-violet-500 to-violet-600' },
  { id: 'smile', path: '/kiosk/smile', icon: Sparkles, label: 'Smile Gallery', subtitle: 'Preview your makeover', gradient: 'from-rose-500 to-rose-600' },
];

export default function KioskHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <KioskLayout showBack={false}>
      <div className="flex flex-col h-full min-h-[calc(100vh-140px)]">
        {/* Logo + greeting */}
        <div className="text-center mb-4">
          <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-14 mx-auto object-contain drop-shadow-xl mb-2" />
          <h2 className="text-2xl font-bold text-white mb-0.5">
            Welcome, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-white/50 text-sm">What would you like to do today?</p>
        </div>

        {/* Split: Left Walk-In hero | Right 4 cards stacked */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* LEFT: Big Walk-In card */}
          <button
            onClick={() => navigate('/kiosk/check-in')}
            className="group bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl border-2 border-blue-400/30 p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30 hover:border-blue-400/50 active:scale-[0.98] flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4 mx-auto backdrop-blur-sm group-hover:scale-110 transition-transform shadow-xl">
                <ClipboardCheck size={40} className="text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white leading-tight">WALK-IN</h3>
              <h3 className="text-3xl font-bold text-blue-200 leading-tight mb-3">CHECK-IN</h3>
              <p className="text-blue-200/70 text-sm mb-4">
                Tap here to join the queue
              </p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 rounded-xl text-white font-bold text-sm backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                Get Started <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* RIGHT: 4 cards stacked vertically */}
          <div className="flex flex-col gap-3">
            {SIDE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => navigate(card.path)}
                  className="group flex-1 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-left transition-all duration-300 hover:scale-[1.03] hover:bg-white/15 hover:shadow-xl hover:border-white/30 active:scale-[0.98] flex items-center gap-3"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-sm leading-tight">{card.label}</h4>
                    <p className="text-white/40 text-[11px] mt-0.5">{card.subtitle}</p>
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
