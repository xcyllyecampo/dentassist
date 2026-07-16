import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, Clock, Activity,
  Stethoscope, Image, MessageCircle, BarChart3, Box,
  Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/queue', icon: Clock, label: 'Queue' },
  { to: '/records', icon: Activity, label: 'Records' },
  { to: '/xray', icon: Image, label: 'X-Ray Analysis' },
  { to: '/oral-screening', icon: Stethoscope, label: 'Oral Screening' },
  { to: '/treatment-support', icon: Settings, label: 'Treatment Support' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/digital-twin', icon: Box, label: 'Digital Twin' },
  { to: '/ai-assistant', icon: MessageCircle, label: 'AI Assistant' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`fixed left-0 top-0 h-full bg-sky-900 text-white transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between border-b border-sky-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦷</span>
            <span className="font-bold text-lg">DentAssist</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-sky-700 rounded">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${isActive ? 'bg-sky-700 text-white' : 'text-sky-200 hover:bg-sky-800 hover:text-white'}`
            }
          >
            <Icon size={20} />
            {!collapsed && <span className="text-sm">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sky-700">
        {!collapsed && (
          <div className="text-xs text-sky-300 mb-2">
            <div className="font-medium text-white">{user?.name}</div>
            <div>{user?.role}</div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sky-200 hover:bg-sky-800 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
