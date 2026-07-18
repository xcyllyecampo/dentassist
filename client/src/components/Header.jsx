import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { playClick } from '../lib/sounds';

export default function Header({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    playClick();
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const roleColors = {
    ADMIN: 'bg-violet-100 text-violet-700',
    DENTIST: 'bg-sky-100 text-sky-700',
    ASSISTANT: 'bg-emerald-100 text-emerald-700',
    PATIENT: 'bg-amber-100 text-amber-700',
  };

  return (
    <header className="glass sticky top-0 z-30 border-b border-white/20 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { playClick(); onMenuClick?.(); }}
            className="md:hidden p-2 hover:bg-indigo-50 rounded-xl text-indigo-600 transition-colors">
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-slate-400 hover:text-indigo-600 group">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button onClick={() => { playClick(); setDropdownOpen(!dropdownOpen); }}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-100 transition-all duration-200 group">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md shadow-indigo-200">
                {user?.name?.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{user?.role}</div>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 animate-scale-in z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="font-semibold text-slate-900">{user?.name}</div>
                  <div className="text-sm text-slate-500">{user?.email}</div>
                  <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${roleColors[user?.role] || 'bg-slate-100 text-slate-600'}`}>
                    {user?.role}
                  </span>
                </div>
                <div className="py-1">
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                    <LogOut size={16} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
