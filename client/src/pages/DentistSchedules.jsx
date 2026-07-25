import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { SkeletonLine, SkeletonCircle } from '../components/Skeleton';
import Tooltip from '../components/Tooltip';
import api, { authUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, Plus, Trash2, X, AlertTriangle, Clock, Stethoscope } from 'lucide-react';
import { playClick, playSuccess, playError } from '../lib/sounds';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = [];
for (let h = 7; h <= 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  const colors = [
    'from-teal-500 to-emerald-600',
    'from-cyan-500 to-teal-600',
    'from-emerald-500 to-teal-600',
    'from-teal-600 to-cyan-600',
    'from-teal-400 to-emerald-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function DentistSchedules() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedDentist, setSelectedDentist] = useState(null);
  const dentistRefs = useRef({});
  const dentistContainerRef = useRef(null);
  const [sliderStyle, setSliderStyle] = useState({ top: 0, height: 0 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ dentistId: '', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
  const isAdmin = user?.role === 'ADMIN';

  const { data: schedules = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['dentist-schedules'],
    queryFn: () => api.get('/dentist-schedules').then(r => r.data),
  });

  const { data: rawDentists = [] } = useQuery({
    queryKey: ['dentists'],
    queryFn: () => api.get('/dentist-schedules/dentists').then(r => r.data).catch(() => []),
  });

  const dentists = (() => {
    const merged = [...rawDentists];
    schedules.forEach(s => {
      if (s.user && !merged.find(d => d.id === s.user.id)) {
        merged.push({ id: s.user.id, name: s.user.name, avatar: s.user.avatar });
      }
    });
    return merged;
  })();

  useEffect(() => {
    if (dentists.length > 0 && !selectedDentist) {
      setSelectedDentist(dentists[0].id);
    }
  }, [dentists, selectedDentist]);

  const updateSlider = useCallback(() => {
    const activeEl = dentistRefs.current[selectedDentist];
    if (activeEl && dentistContainerRef.current) {
      const containerRect = dentistContainerRef.current.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      setSliderStyle({
        top: elRect.top - containerRect.top,
        height: elRect.height,
      });
    }
  }, [selectedDentist]);

  useEffect(() => {
    requestAnimationFrame(updateSlider);
  }, [updateSlider]);

  const addMutation = useMutation({
    mutationFn: (formData) => api.post('/dentist-schedules', formData),
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: ['dentist-schedules'] });
      const previous = queryClient.getQueryData(['dentist-schedules']);
      const dentist = dentists.find(d => d.id === formData.dentistId);
      queryClient.setQueryData(['dentist-schedules'], (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          ...formData,
          userId: formData.dentistId,
          user: dentist ? { id: dentist.id, name: dentist.name, avatar: dentist.avatar } : null,
        },
      ]);
      return { previous };
    },
    onError: (err, formData, context) => {
      queryClient.setQueryData(['dentist-schedules'], context.previous);
      toast.error(err.response?.data?.error || 'Failed to add schedule');
      playError();
    },
    onSuccess: () => {
      toast.success('Schedule added');
      playSuccess();
      setShowForm(false);
      setForm({ dentistId: '', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dentist-schedules'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (schedId) => api.delete(`/dentist-schedules/${schedId}`),
    onMutate: async (schedId) => {
      await queryClient.cancelQueries({ queryKey: ['dentist-schedules'] });
      const previous = queryClient.getQueryData(['dentist-schedules']);
      queryClient.setQueryData(['dentist-schedules'], (old = []) => old.filter(s => s.id !== schedId));
      return { previous };
    },
    onError: (err, schedId, context) => {
      queryClient.setQueryData(['dentist-schedules'], context.previous);
      toast.error('Failed to remove schedule');
    },
    onSuccess: () => {
      toast.success('Schedule removed');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dentist-schedules'] });
    },
  });

  const handleAdd = () => {
    playClick();
    if (!form.dentistId) { toast.error('Select a dentist'); return; }
    addMutation.mutate(form);
  };

  const handleDelete = (schedId) => {
    if (!confirm('Remove this schedule?')) return;
    playClick();
    deleteMutation.mutate(schedId);
  };

  if (isLoading) return (
    <Layout>
      <Header title="Dentist Schedules" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <SkeletonLine width="12rem" height="1rem" />
            <SkeletonLine width="16rem" height="0.75rem" />
          </div>
        </div>
        <div className="flex gap-6">
          <div className="w-64 shrink-0 space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
                <SkeletonCircle size="3rem" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine width="70%" height="0.875rem" />
                  <SkeletonLine width="50%" height="0.625rem" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <SkeletonCircle size="2.5rem" />
              <div className="space-y-1.5">
                <SkeletonLine width="8rem" height="1rem" />
                <SkeletonLine width="6rem" height="0.625rem" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="rounded-xl border-2 border-slate-100 p-3 min-h-[140px]">
                  <SkeletonLine width="2rem" height="0.625rem" className="mx-auto mb-3" />
                  <div className="space-y-1.5">
                    <SkeletonLine height="1.5rem" />
                    <SkeletonLine height="1.5rem" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );

  if (isError) return (
    <Layout>
      <Header title="Dentist Schedules" />
      <div className="p-6 flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="text-red-500" size={48} />
        <p className="text-red-600 font-medium">Failed to load schedules</p>
        <button onClick={refetch} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D6D65] transition-colors text-sm">Retry</button>
      </div>
    </Layout>
  );

  const grouped = {};
  schedules.forEach(s => {
    const id = s.userId;
    if (!grouped[id]) grouped[id] = { name: s.user?.name || 'Unknown', days: {} };
    if (!grouped[id].days[s.dayOfWeek]) grouped[id].days[s.dayOfWeek] = [];
    grouped[id].days[s.dayOfWeek].push(s);
  });

  const totalSlots = Object.values(grouped).reduce((acc, d) => {
    return acc + Object.values(d.days).reduce((a, slots) => a + slots.length, 0);
  }, 0);

  const activeDentist = dentists.find(d => d.id === selectedDentist);
  const activeDays = grouped[selectedDentist]?.days || {};

  return (
    <Layout>
      <Header title="Dentist Schedules" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Manage weekly working hours for each dentist</p>
            <p className="text-xs text-slate-400 mt-1">{Object.keys(grouped).length} dentists · {totalSlots} schedule slots</p>
          </div>
          {isAdmin && (
            <button onClick={() => { playClick(); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0F766E] text-white text-sm font-semibold rounded-xl hover:bg-[#0D6D65] transition-all shadow-sm shadow-teal-500/20 active:scale-95">
              <Plus size={16} /> Add Schedule
            </button>
          )}
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Calendar size={36} className="text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold text-lg mb-1">No schedules configured yet</p>
            <p className="text-slate-400 text-sm">Add a schedule to set dentist availability</p>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Left sidebar - Dentist tabs */}
            <div ref={dentistContainerRef} className="w-64 shrink-0 space-y-2 relative">
              <div
                className="absolute left-0 right-0 bg-[#0F766E]/10 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
                style={{ top: sliderStyle.top, height: sliderStyle.height }}
              />
              {Object.entries(grouped).map(([dentistId, { name: dentistName, days }]) => {
                const dent = dentists.find(d => d.id === dentistId);
                const slotCount = Object.values(days).reduce((a, s) => a + s.length, 0);
                const isActive = selectedDentist === dentistId;
                return (
                  <button
                    key={dentistId}
                    ref={el => { dentistRefs.current[dentistId] = el; }}
                    onClick={() => { playClick(); setSelectedDentist(dentistId); }}
                    className={`relative w-full text-left rounded-2xl p-4 transition-all duration-200 ${
                      isActive
                        ? 'bg-white shadow-lg shadow-teal-500/10 border-2 border-[#0F766E]/30 ring-1 ring-[#0F766E]/10'
                        : 'bg-white/60 border-2 border-transparent hover:bg-white hover:shadow-md hover:shadow-slate-200/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {dent?.avatar ? (
                        <img src={authUrl(dent.avatar)} alt={dentistName}
                          className={`w-12 h-12 rounded-xl object-cover ring-2 transition-all ${
                            isActive ? 'ring-[#0F766E]/30' : 'ring-slate-200'
                          }`} />
                      ) : (
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarColor(dentistName)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                          {getInitials(dentistName)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold text-sm truncate transition-colors ${
                          isActive ? 'text-[#0F766E]' : 'text-slate-700'
                        }`}>{dentistName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {slotCount} {slotCount === 1 ? 'slot' : 'slots'} · {Object.keys(days).length} days
                        </div>
                      </div>
                      {isActive && <div className="w-2 h-2 rounded-full bg-[#0F766E] shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right content - Schedule grid */}
            <div className="flex-1 min-w-0">
              {activeDentist ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  {/* Dentist header bar */}
                  <div className="px-6 py-4 bg-gradient-to-r from-[#F0FDFA] to-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center">
                        <Stethoscope size={18} className="text-[#0F766E]" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900">{activeDentist.name}</h2>
                        <p className="text-xs text-slate-400">Weekly schedule overview</p>
                      </div>
                    </div>
                  </div>

                  {/* Day grid */}
                  <div className="p-5">
                    <div className="grid grid-cols-7 gap-3">
                      {[0, 1, 2, 3, 4, 5, 6].map(day => {
                        const daySchedules = activeDays[day] || [];
                        const isToday = new Date().getDay() === day;
                        const hasSlots = daySchedules.length > 0;
                        return (
                          <div key={day} className={`rounded-xl border-2 p-3 min-h-[140px] transition-all ${
                            isToday
                              ? 'border-[#0F766E]/40 bg-[#F0FDFA] shadow-sm shadow-teal-500/10'
                              : hasSlots
                                ? 'border-slate-200 bg-white hover:border-slate-300'
                                : 'border-dashed border-slate-200 bg-slate-50/50'
                          }`}>
                            <div className={`text-center mb-3 ${isToday ? 'relative' : ''}`}>
                              <div className={`text-xs font-bold uppercase tracking-wider ${
                                isToday ? 'text-[#0F766E]' : hasSlots ? 'text-slate-500' : 'text-slate-400'
                              }`}>
                                {SHORT_DAYS[day]}
                              </div>
                              {isToday && (
                                <div className="text-[10px] font-semibold text-[#0F766E] bg-[#0F766E]/10 rounded-full px-2 py-0.5 mt-1 inline-block">
                                  Today
                                </div>
                              )}
                            </div>

                            {!hasSlots ? (
                              <div className="flex items-center justify-center h-[70px]">
                                <span className="text-[11px] text-slate-300 font-medium">Off</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {daySchedules.map(s => (
                                  <div key={s.id} className="group relative">
                                    <div className="text-xs text-center bg-[#0F766E]/8 text-[#0F766E] border border-[#0F766E]/15 rounded-lg px-2 py-1.5 font-medium flex items-center justify-center gap-1.5">
                                      <Clock size={10} className="shrink-0 opacity-60" />
                                      <span>{s.startTime} – {s.endTime}</span>
                                    </div>
                                    {isAdmin && (
                                      <Tooltip content="Remove schedule">
                                        <button onClick={() => handleDelete(s.id)}
                                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-sm">
                                          <X size={10} />
                                        </button>
                                      </Tooltip>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                  <p className="text-slate-400 text-sm">Select a dentist to view their schedule</p>
                </div>
              )}
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-slate-900">Add Schedule</h3>
                <Tooltip content="Close">
                  <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                </Tooltip>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dentist</label>
                  <select value={form.dentistId} onChange={(e) => setForm({ ...form, dentistId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]">
                    <option value="">Select dentist</option>
                    {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Day of Week</label>
                  <div className="grid grid-cols-7 gap-1">
                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                      <button key={day} onClick={() => setForm({ ...form, dayOfWeek: day })}
                        className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                          form.dayOfWeek === day
                            ? 'bg-[#0F766E] text-white border-[#0F766E]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F766E]'
                        }`}>
                        {SHORT_DAYS[day]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                    <select value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]">
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                    <select value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]">
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleAdd}
                  className="w-full py-2.5 bg-[#0F766E] text-white text-sm font-semibold rounded-lg hover:bg-[#0D6D65] transition-colors flex items-center justify-center gap-2">
                  <Plus size={14} /> Add Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
