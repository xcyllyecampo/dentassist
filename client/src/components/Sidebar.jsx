import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, Clock, Activity,
  Stethoscope, Image, BarChart3, Box,
  Settings, LogOut, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { playClick, playWhoosh } from '../lib/sounds';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/queue', icon: Clock, label: 'Queue' },
  { to: '/records', icon: Activity, label: 'Records' },
  { to: '/xray', icon: Image, label: 'X-Ray Analysis' },
  { to: '/oral-screening', icon: Stethoscope, label: 'Oral Screening' },
  { to: '/smile-simulation', icon: Sparkles, label: 'Smile Simulation' },
  { to: '/treatment-support', icon: Settings, label: 'Treatment Support' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/digital-twin', icon: Box, label: 'Digital Twin' },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleNavClick = () => {
    playClick();
    if (mobileOpen) setMobileOpen(false);
  };

  const handleCollapse = () => {
    playWhoosh();
    setCollapsed(!collapsed);
  };

  const sidebarContent = (isMobile = false) => (
    <>
      <div className={`p-4 flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-between'} border-b border-white/10`}>
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-indigo-500/30">
              🦷
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">DentAssist</div>
              <div className="text-[10px] text-indigo-300/60 font-medium tracking-wide uppercase">AI Dental Clinic</div>
            </div>
          </div>
        )}
        {!isMobile && (
          <button onClick={handleCollapse}
            className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-300/60 hover:text-white transition-colors">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <nav className="flex-1 py-3 overflow-y-auto px-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white'
                  : 'text-indigo-300/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-full" />
              )}
              <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-indigo-400/40 group-hover:text-indigo-300'} />
              {(!collapsed || isMobile) && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        {(!collapsed || isMobile) && (
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
            <div className="text-[11px] text-indigo-300/50 uppercase tracking-wider font-medium">{user?.role}</div>
          </div>
        )}
        <button
          onClick={() => { playClick(); logout(); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-indigo-300/50 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          <LogOut size={17} />
          {(!collapsed || isMobile) && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-full bg-gradient-to-b from-[#0c0f1a] via-[#111827] to-[#0f172a] text-white transition-all duration-300 ease-out z-50 flex-col ${collapsed ? 'w-16' : 'w-64'}`}
        style={{ borderRight: '1px solid rgba(99, 102, 241, 0.08)' }}>
        {sidebarContent()}
      </aside>

      {/* Mobile */}
      <aside className={`md:hidden fixed left-0 top-0 h-full bg-gradient-to-b from-[#0c0f1a] via-[#111827] to-[#0f172a] text-white transition-all duration-300 ease-out z-50 flex flex-col ${mobileOpen ? 'w-64' : 'w-0'} overflow-hidden`}
        style={{ borderRight: '1px solid rgba(99, 102, 241, 0.08)' }}>
        <div className="min-w-[16rem] flex flex-col h-full">
          {sidebarContent(true)}
        </div>
      </aside>
    </>
  );
}
