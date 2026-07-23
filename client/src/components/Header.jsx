import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, ChevronDown, Calendar, Clock, Users, Home, CheckCircle2 } from 'lucide-react';
import { playClick } from '../lib/sounds';

const typeIcons = { appointment: Calendar, queue: Clock, patient: Users, room: Home };
const typeColors = { appointment: 'text-emerald-500 bg-emerald-50', queue: 'text-amber-500 bg-amber-50', patient: 'text-[#0F766E] bg-teal-50', room: 'text-rose-500 bg-rose-50' };
const typeRoutes = { appointment: '/appointments', queue: '/queue', patient: '/patients', room: '/dashboard' };

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
}

function getDateGroup(date) {
  const now = new Date();
  const d = new Date(date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (itemDate.getTime() === today.getTime()) return 'Today';
  if (itemDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return 'Earlier';
}

export default function Header({ title, onMenuClick }) {
  const { user } = useAuth();
  const { notifications, unreadCount, counts, markAllAsRead, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef({});
  const tabContainerRef = useRef(null);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) { setNotifOpen(false); setNotifFilter('all'); }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotifClick = (n) => {
    playClick();
    if (!n.read) markAsRead(n.id);
    const route = typeRoutes[n.type];
    if (route) navigate(route);
    setNotifOpen(false);
  };

  const filteredNotifs = useMemo(() => {
    const list = notifFilter === 'all' ? notifications : notifications.filter(n => n.type === notifFilter);
    return list.slice(0, 30);
  }, [notifications, notifFilter]);

  const updateSlider = useCallback(() => {
    const activeTab = tabRefs.current[notifFilter];
    if (activeTab && tabContainerRef.current) {
      const containerRect = tabContainerRef.current.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      setSliderStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [notifFilter]);

  useEffect(() => {
    if (notifOpen) {
      requestAnimationFrame(updateSlider);
    }
  }, [notifOpen, updateSlider]);

  const groupedNotifs = useMemo(() => {
    const groups = {};
    filteredNotifs.forEach(n => {
      const group = getDateGroup(n.timestamp);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    });
    return groups;
  }, [filteredNotifs]);

  const roleColors = {
    ADMIN: 'bg-teal-50 text-[#0F766E]',
    DENTIST: 'bg-teal-50 text-[#0F766E]',
    ASSISTANT: 'bg-emerald-100 text-emerald-700',
    PATIENT: 'bg-amber-100 text-amber-700',
  };

  const filterTabs = [
    { key: 'all', label: 'All', count: unreadCount },
    { key: 'appointment', label: 'Appointments', count: counts.appointment || 0 },
    { key: 'queue', label: 'Queue', count: counts.queue || 0 },
    { key: 'room', label: 'Rooms', count: counts.room || 0 },
  ];

  return (
    <header className="sticky top-0 z-30 px-6 md:px-8 h-[72px] flex items-center"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '2px solid rgba(0,0,0,0.06)',
        boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
      }}>
      <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => { playClick(); onMenuClick?.(); }}
              className="md:hidden p-2 hover:bg-teal-50 rounded-xl text-[#374151] hover:text-[#0F766E] transition-all duration-200 shrink-0">
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-responsive-heading font-bold text-[#111827] tracking-tight leading-none truncate">{title}</h1>
            </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          {user?.role !== 'PATIENT' && (
          <div className="relative" ref={notifRef}>
            <button onClick={() => { playClick(); setNotifOpen(!notifOpen); }}
              className="relative p-2.5 hover:bg-teal-50 rounded-xl transition-all duration-200 text-[#374151] hover:text-[#0F766E] group active:scale-95">
              <Bell size={20} className={`transition-all duration-200 ${notifOpen ? 'rotate-12 scale-110 text-[#0F766E]' : ''}`} />
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-1.5 -right-1.5 w-[26px] h-[26px] bg-[#EF4444]/50 rounded-full animate-ring-expand" />
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-3 w-[380px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.1)] border border-slate-200 animate-scale-in z-50 overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#111827] text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={() => { playClick(); markAllAsRead(); }}
                        className="text-xs text-[#0F766E] hover:text-[#0D6D65] font-medium flex items-center gap-1 transition-colors">
                        <CheckCircle2 size={12} />
                        Mark all read
                      </button>
                    )}
                  </div>
                  {/* Filter tabs */}
                  <div ref={tabContainerRef} className="relative flex gap-1 bg-teal-50 rounded-lg p-0.5">
                    <div
                      className="absolute top-0.5 bottom-0.5 bg-[#0F766E] rounded-md shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      style={{ left: `${sliderStyle.left}px`, width: `${sliderStyle.width}px` }}
                    />
                    {filterTabs.map(tab => (
                      <button key={tab.key} ref={el => { tabRefs.current[tab.key] = el; }}
                        onClick={() => { playClick(); setNotifFilter(tab.key); }}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors duration-300 ${
                          notifFilter === tab.key
                            ? 'text-white'
                            : 'text-[#6B7280] hover:text-[#111827]'
                        }`}>
                        {tab.label}
                        {tab.count > 0 && (
                          <span className={`min-w-[14px] h-[14px] text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 transition-colors duration-300 ${
                            notifFilter === tab.key ? 'bg-white text-[#0F766E]' : 'bg-slate-300 text-slate-700'
                          }`}>
                            {tab.count > 9 ? '9+' : tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-[#6B7280]">You&apos;re all caught up!</p>
                      <p className="text-xs text-slate-400 mt-1">No notifications to show right now.</p>
                    </div>
                  ) : filteredNotifs.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-[#6B7280]">No {notifFilter === 'all' ? '' : notifFilter + ' '}notifications</p>
                      <p className="text-xs text-slate-400 mt-1">Nothing here yet for this category.</p>
                    </div>
                  ) : (
                    Object.entries(groupedNotifs).map(([group, items]) => (
                      <div key={group}>
                        <div className="px-4 py-2 bg-slate-50/80 border-y border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group}</span>
                        </div>
                        {items.map(n => {
                          const Icon = typeIcons[n.type] || Bell;
                          return (
                            <div key={n.id} onClick={() => handleNotifClick(n)}
                              className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-all duration-150 hover:bg-slate-50 active:bg-slate-100 ${
                                !n.read ? 'bg-[#0F766E]/[0.04]' : ''
                              }`}>
                              <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[n.type] || 'text-slate-400 bg-slate-50'}`}>
                                <Icon size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] leading-snug ${!n.read ? 'font-semibold text-[#111827]' : 'text-[#6B7280]'}`}>
                                  {n.message}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.timestamp)}</p>
                              </div>
                              {!n.read && <div className="w-2 h-2 bg-[#0F766E] rounded-full mt-2 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => { playClick(); setDropdownOpen(!dropdownOpen); }}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-teal-50 transition-all duration-200 group active:scale-95">
              <div className="w-9 h-9 bg-gradient-to-br from-[#0F766E] to-[#0D6D65] text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-[#0F766E]/20 group-hover:shadow-[#0F766E]/30 transition-shadow">
                {user?.name?.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-[#111827] leading-tight">{user?.name}</div>
                <div className="text-[11px] text-[#6B7280] leading-tight">{user?.role}</div>
              </div>
              <ChevronDown size={14} className={`text-[#6B7280] transition-all duration-200 ${dropdownOpen ? 'rotate-180 text-[#0F766E]' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.1)] border border-slate-200 py-2 animate-scale-in z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="font-semibold text-[#111827]">{user?.name}</div>
                  <div className="text-sm text-[#6B7280]">{user?.email}</div>
                  <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${roleColors[user?.role] || 'bg-slate-100 text-slate-600'}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
