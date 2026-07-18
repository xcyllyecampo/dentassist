import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, Clock, Activity,
  Stethoscope, Image, BarChart3, Box,
  Settings, LogOut, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { playClick, playWhoosh } from '../lib/sounds';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/patients', icon: Users, label: 'Patients', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/appointments', icon: Calendar, label: 'Appointments', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/queue', icon: Clock, label: 'Queue', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/records', icon: Activity, label: 'Records', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/xray', icon: Image, label: 'X-Ray Analysis', roles: ['ADMIN', 'DENTIST'] },
  { to: '/oral-screening', icon: Stethoscope, label: 'Oral Screening', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/smile-simulation', icon: Sparkles, label: 'Smile Simulation', roles: ['ADMIN', 'DENTIST'] },
  { to: '/treatment-support', icon: Settings, label: 'Treatment Support', roles: ['ADMIN', 'DENTIST'] },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['ADMIN', 'DENTIST'] },
  { to: '/digital-twin', icon: Box, label: 'Digital Twin', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (user?.role === 'PATIENT') return null;

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

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
            <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="w-[72px] h-[72px] rounded-xl object-contain" />
            <div>
              <div className="font-bold text-white text-sm tracking-tight">DentAssist</div>
              <div className="text-[10px] text-[#6b9ae8]/60 font-medium tracking-wide uppercase">AI Dental Clinic</div>
            </div>
          </div>
        )}
        {!isMobile && (
          <button onClick={handleCollapse}
            className="p-1.5 hover:bg-white/10 rounded-lg text-[#6b9ae8]/60 hover:text-white transition-colors">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <nav className="flex-1 py-3 overflow-y-auto px-2 space-y-0.5">
        {filteredNav.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-[#1a5fb4]/20 to-[#1a5fb4]/10 text-white'
                  : 'text-[#6b9ae8]/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-[#4a85d6] to-[#1a5fb4] rounded-r-full" />
              )}
              <Icon size={18} className={isActive ? 'text-[#4a85d6]' : 'text-[#4a85d6]/40 group-hover:text-[#6b9ae8]'} />
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
            <div className="text-[11px] text-[#6b9ae8]/50 uppercase tracking-wider font-medium">{user?.role}</div>
          </div>
        )}
        <button
          onClick={() => { playClick(); logout(); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-[#6b9ae8]/50 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
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
        style={{ borderRight: '1px solid rgba(0, 74, 173, 0.08)' }}>
        {sidebarContent()}
      </aside>

      {/* Mobile */}
      <aside className={`md:hidden fixed left-0 top-0 h-full bg-gradient-to-b from-[#0c0f1a] via-[#111827] to-[#0f172a] text-white transition-all duration-300 ease-out z-50 flex flex-col ${mobileOpen ? 'w-64' : 'w-0'} overflow-hidden`}
        style={{ borderRight: '1px solid rgba(0, 74, 173, 0.08)' }}>
        <div className="min-w-[16rem] flex flex-col h-full">
          {sidebarContent(true)}
        </div>
      </aside>
    </>
  );
}
