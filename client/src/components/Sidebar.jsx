import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard, Users, Calendar, Clock, Activity,
  Stethoscope, Image, BarChart3, CalendarClock,
  Settings, LogOut, ChevronLeft, ChevronRight, Sparkles, ShieldCheck
} from 'lucide-react';
import { playClick, playWhoosh } from '../lib/sounds';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/patients', icon: Users, label: 'Patients', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'], badge: 'patient' },
  { to: '/appointments', icon: Calendar, label: 'Appointments', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'], badge: 'appointment' },
  { to: '/queue', icon: Clock, label: 'Queue', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'], badge: 'queue' },
  { to: '/records', icon: Activity, label: 'Records', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/xray', icon: Image, label: 'X-Ray Analysis', roles: ['ADMIN', 'DENTIST'] },
  { to: '/oral-screening', icon: Stethoscope, label: 'Oral Screening', roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/smile-simulation', icon: Sparkles, label: 'Smile Simulation', roles: ['ADMIN', 'DENTIST'] },
  { to: '/treatment-support', icon: Settings, label: 'Treatment Support', roles: ['ADMIN', 'DENTIST'] },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['ADMIN', 'DENTIST'] },
  { to: '/schedules', icon: CalendarClock, label: 'Dentist Schedules', roles: ['ADMIN'] },
  { to: '/admin/manage-users', icon: ShieldCheck, label: 'Manage Users', roles: ['ADMIN'] },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const { counts } = useNotifications();
  const location = useLocation();

  if (user?.role === 'PATIENT') return null;

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  const handleCollapse = () => {
    playWhoosh();
    setCollapsed(!collapsed);
  };

  const sidebarContent = (isMobile = false) => (
    <>
      {/* Branding section */}
      <div className="relative border-b border-white/[0.08]">
        {(!collapsed || isMobile) ? (
          <div className="flex items-center pt-4 pb-5 px-5">
            <div className="flex-1 flex items-center justify-start">
              <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-[44px] w-auto object-contain" />
            </div>
            {!isMobile && (
              <button onClick={handleCollapse}
                className="shrink-0 p-2 rounded-lg transition-colors bg-white/[0.06] hover:bg-white/15 text-teal-200/60 hover:text-white absolute right-3 top-3">
                {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            )}
          </div>
        ) : (
          <div className="relative flex items-center justify-center h-14">
            {!isMobile && (
              <button onClick={handleCollapse}
                className="shrink-0 p-2 rounded-lg transition-colors bg-white/[0.06] hover:bg-white/15 text-teal-200/60 hover:text-white">
                {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 overflow-y-auto px-2 space-y-0.5">
        {filteredNav.map(({ to, icon: Icon, label, badge }) => {
          const isActive = location.pathname === to;
          const badgeCount = badge ? (counts[badge] || 0) : 0;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-white/[0.1] text-white'
                  : 'text-teal-200/50 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-[#14B8A6] to-[#0F766E] rounded-r-full" />
              )}
              <div className="relative">
                <Icon size={18} className={isActive ? 'text-teal-200' : 'text-teal-300/40 group-hover:text-teal-200/70'} />
                {badgeCount > 0 && !collapsed && (
                  <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
                {badgeCount > 0 && collapsed && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </div>
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
            <div className="text-[11px] text-teal-300/40 uppercase tracking-wider font-medium">{user?.role}</div>
          </div>
        )}
        <button
          onClick={() => { playClick(); logout(); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-teal-300/40 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
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
      <aside className={`hidden md:flex fixed left-0 top-0 h-full bg-gradient-to-b from-[#134E4A] via-[#0F766E] to-[#115E59] text-white transition-all duration-300 ease-out z-50 flex-col ${collapsed ? 'w-16' : 'w-[264px]'}`}
        style={{ borderRight: '1px solid rgba(20, 184, 166, 0.08)' }}>
        {sidebarContent()}
      </aside>

      {/* Mobile */}
      <aside className={`md:hidden fixed left-0 top-0 h-full bg-gradient-to-b from-[#134E4A] via-[#0F766E] to-[#115E59] text-white transition-all duration-300 ease-out z-50 flex flex-col ${mobileOpen ? 'w-[264px]' : 'w-0'} overflow-hidden`}
        style={{ borderRight: '1px solid rgba(20, 184, 166, 0.08)' }}>
        <div className="min-w-[264px] flex flex-col h-full">
          {sidebarContent(true)}
        </div>
      </aside>
    </>
  );
}
