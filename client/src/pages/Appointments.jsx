import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { playClick } from '../lib/sounds';
import { Plus, ChevronLeft, ChevronRight, Calendar, AlertTriangle, X, CheckCircle, Clock, Play, Ban, Trash2, Edit3, UserX, CalendarDays, LayoutList } from 'lucide-react';

const STATUS_CONFIG = {
  SCHEDULED:     { label: 'Scheduled',     color: 'bg-teal-100 text-teal-700 border-teal-200' },
  CONFIRMED:     { label: 'Confirmed',     color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  IN_PROGRESS:   { label: 'In Progress',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
  COMPLETED:     { label: 'Completed',     color: 'bg-green-100 text-green-700 border-green-200' },
  CANCELLED:     { label: 'Cancelled',     color: 'bg-red-100 text-red-700 border-red-200' },
  NO_SHOW:       { label: 'No Show',       color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const NEXT_STATUS = {
  SCHEDULED:   [{ status: 'CONFIRMED', label: 'Confirm', icon: CheckCircle, color: 'bg-indigo-600 hover:bg-indigo-700' }],
  CONFIRMED:   [{ status: 'IN_PROGRESS', label: 'Check In', icon: Play, color: 'bg-amber-600 hover:bg-amber-700' }],
  IN_PROGRESS: [{ status: 'COMPLETED', label: 'Complete', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' }],
  COMPLETED:   [],
  CANCELLED:   [],
  NO_SHOW:     [],
};

export default function Appointments() {
  const toast = useToast();
  const { user } = useAuth();
  const canDelete = user?.role === 'ADMIN' || user?.role === 'ASSISTANT';
  const canEdit = ['ADMIN', 'ASSISTANT', 'DENTIST'].includes(user?.role);
  const [appointments, setAppointments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day');
  const [monthAppointments, setMonthAppointments] = useState([]);
  const [form, setForm] = useState({ patientId: '', dentistId: '', roomId: '', date: '', time: '', duration: 30, reason: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    const dateStr = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    Promise.all([
      api.get(`/appointments?date=${dateStr}`),
      api.get('/patients'),
      api.get('/dashboard'),
      api.get('/rooms'),
    ]).then(([appts, pts, dash, rms]) => {
      setAppointments(appts.data);
      setPatients(pts.data);
      setDentists(dash.data.dentists);
      setRooms(rms.data);
    }).catch(() => setError('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (viewMode === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      api.get(`/appointments/month?year=${year}&month=${month}`)
        .then(res => setMonthAppointments(res.data))
        .catch(() => setMonthAppointments([]));
    }
  }, [viewMode, selectedDate, appointments]);

  const getMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const getAppointmentsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthAppointments.filter(a => a.date?.split('T')[0] === dateStr);
  };

  useEffect(() => {
    if (selected) {
      const updated = appointments.find(a => a.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [appointments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/appointments', { ...form, date: form.date || new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0] });
      setAppointments([...appointments, res.data]);
      setShowCreateModal(false);
      setForm({ patientId: '', dentistId: '', roomId: '', date: '', time: '', duration: 30, reason: '', notes: '' });
      toast.success('Appointment booked');
    } catch (err) { toast.error(err.response?.data?.error || 'Error creating appointment'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await api.put(`/appointments/${id}`, { status });
      setAppointments(prev => prev.map(a => a.id === id ? res.data : a));
      toast.success(`Appointment ${status.toLowerCase().replace('_', ' ')}`);
    } catch (err) { toast.error('Error updating appointment'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(appointments.filter(a => a.id !== id));
      setSelected(null);
      toast.success('Appointment deleted');
    } catch (err) { toast.error('Error deleting appointment'); }
  };

  const handleEditSave = async () => {
    try {
      const res = await api.put(`/appointments/${selected.id}`, editForm);
      setAppointments(appointments.map(a => a.id === selected.id ? res.data : a));
      setEditMode(false);
      toast.success('Appointment updated');
    } catch (err) { toast.error('Error updating appointment'); }
  };

  const openDetail = (appt) => { setSelected(appt); setEditMode(false); setEditForm({}); };
  const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
  const nextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };

  const timeSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];

  return (
    <Layout>
      <Header title="Appointments" />
      <div className="p-6">
        {loading ? (
          <Spinner className="py-20" />
        ) : error ? (
          <div className="text-center py-20">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
            <h3 className="text-sm font-medium text-gray-700 mb-2">{error}</h3>
            <button onClick={fetchData} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D6D65] text-sm font-medium">Retry</button>
          </div>
        ) : (
        <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => { playClick(); const d = new Date(selectedDate); viewMode === 'month' ? d.setMonth(d.getMonth() - 1) : d.setDate(d.getDate() - 1); setSelectedDate(d); }}
              className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20} /></button>
            <h2 className="text-lg font-bold text-slate-900">
              {viewMode === 'month'
                ? selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                : selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
            <button onClick={() => { playClick(); const d = new Date(selectedDate); viewMode === 'month' ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 1); setSelectedDate(d); }}
              className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20} /></button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button onClick={() => setViewMode('day')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'day' ? 'bg-white text-[#0F766E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <LayoutList size={14} /> Day
              </button>
              <button onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'month' ? 'bg-white text-[#0F766E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <CalendarDays size={14} /> Month
              </button>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-[#0F766E] text-white px-4 py-2 rounded-lg hover:bg-[#0D6D65] text-sm font-medium">
              <Plus size={16} /> New Appointment
            </button>
          </div>
        </div>

        {viewMode === 'month' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="p-3 text-center text-xs font-bold text-slate-600 uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {getMonthDays().map((day, i) => {
                const dayAppts = getAppointmentsForDay(day);
                const isToday = day && new Date().toDateString() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toDateString();
                return (
                  <div key={i}
                    onClick={() => { if (day) { playClick(); setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)); setViewMode('day'); }}}
                    className={`min-h-[90px] border-b border-r border-slate-100 p-2 ${day ? 'cursor-pointer hover:bg-slate-50' : 'bg-slate-50/50'} ${isToday ? 'bg-teal-50/50' : ''}`}>
                    {day && (
                      <>
                        <div className={`text-xs font-bold mb-1 ${isToday ? 'text-[#0F766E] bg-teal-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>{day}</div>
                        <div className="space-y-0.5">
                          {dayAppts.slice(0, 3).map(a => (
                            <div key={a.id} onClick={e => { e.stopPropagation(); openDetail(a); }}
                              className={`text-[9px] px-1.5 py-0.5 rounded truncate ${
                                a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                a.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                                a.status === 'CANCELLED' ? 'bg-red-50 text-red-500 line-through' :
                                'bg-teal-100 text-teal-700'
                              }`}>
                              {a.time} {a.patient?.user?.name?.split(' ')[0]}
                            </div>
                          ))}
                          {dayAppts.length > 3 && <div className="text-[9px] text-gray-400">+{dayAppts.length - 3} more</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments for this day" description="Create a new appointment or navigate to a different day" />
        ) : (
          <>
          {/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="grid grid-cols-[80px_1fr] divide-x divide-slate-200">
              <div className="bg-slate-50">
                {timeSlots.map(time => (
                  <div key={time} className="h-16 flex items-center justify-center text-xs text-[#0F766E] font-medium border-b border-slate-200">
                    {time}
                  </div>
                ))}
              </div>
              <div className="relative">
                {timeSlots.map(time => (
                  <div key={time} className="h-16 border-b border-slate-100 px-2 py-1" />
                ))}
                {appointments.map(appt => {
                  const slotIndex = timeSlots.indexOf(appt.time);
                  const top = slotIndex * 64;
                  const height = Math.max(64, (appt.duration / 30) * 64);
                  return (
                    <div key={appt.id}
                      onClick={() => openDetail(appt)}
                      className={`absolute left-1 right-1 rounded-lg p-2 text-xs cursor-pointer transition-shadow hover:shadow-md ${
                        appt.status === 'COMPLETED' ? 'bg-green-100 border border-green-300' :
                        appt.status === 'IN_PROGRESS' ? 'bg-amber-100 border border-amber-300' :
                        appt.status === 'CANCELLED' ? 'bg-red-50 border border-red-200 opacity-60' :
                        'bg-[#F0FDFA] border border-[#14B8A6]'
                      }`}
                      style={{ top: `${top}px`, height: `${height - 4}px` }}>
                      <div className="font-bold text-slate-900 truncate">{appt.patient?.user?.name}</div>
                      <div className="text-gray-600 truncate">{appt.reason}</div>
                      <div className="text-gray-500 mt-1 truncate">{appt.dentist?.name} {appt.room && `· R${appt.room.number}`}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* List View */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Today's Appointments ({appointments.length})</h3>
            {appointments.map(appt => {
              const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.SCHEDULED;
              const nextActions = NEXT_STATUS[appt.status] || [];
              return (
                <div key={appt.id} onClick={() => openDetail(appt)}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="w-14 text-center shrink-0">
                    <div className="text-sm font-bold text-[#0F766E]">{appt.time}</div>
                    <div className="text-[10px] text-gray-500">{appt.duration}m</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm">{appt.patient?.user?.name}</div>
                    <div className="text-xs text-gray-600 truncate">{appt.reason} · {appt.dentist?.name} {appt.room && `· Room ${appt.room.number}`}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-medium shrink-0 ${cfg.color}`}>{cfg.label}</span>
                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    {nextActions.map(action => (
                      <button key={action.status} onClick={() => handleStatusUpdate(appt.id, action.status)}
                        className={`flex items-center gap-1 text-white text-[10px] px-3 py-1.5 rounded-lg font-medium ${action.color}`}>
                        <action.icon size={12} /> {action.label}
                      </button>
                    ))}
                    {canDelete && appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                      <button onClick={() => handleDelete(appt.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
        </>
      )}

        {/* Detail / Edit Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">
                  {editMode ? 'Edit Appointment' : 'Appointment Details'}
                </h2>
                <div className="flex items-center gap-2">
                  {canEdit && !editMode && (
                    <button onClick={() => { setEditMode(true); setEditForm({ date: selected.date?.split('T')[0], time: selected.time, duration: selected.duration, reason: selected.reason, notes: selected.notes || '', dentistId: selected.dentistId, roomId: selected.roomId }); }}
                      className="p-2 text-[#0F766E] hover:bg-[#F0FDFA] rounded-lg"><Edit3 size={16} /></button>
                  )}
                  {canDelete && selected.status !== 'COMPLETED' && (
                    <button onClick={() => handleDelete(selected.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  )}
                  <button onClick={() => { setSelected(null); setEditMode(false); }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {editMode ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input type="date" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                        <select value={editForm.time || ''} onChange={e => setEditForm({...editForm, time: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none">
                          <option value="">Select Time</option>
                          {['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dentist</label>
                        <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto">
                          {dentists.map(d => (
                            <button key={d.id} type="button" onClick={() => setEditForm({...editForm, dentistId: d.id})}
                              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                                editForm.dentistId === d.id
                                  ? 'border-[#0F766E] bg-[#F0FDFA] ring-1 ring-[#0F766E]'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}>
                              {d.avatar ? (
                                <img src={d.avatar} alt={d.name} className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 bg-[#0F766E] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                  {d.name?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-slate-900 truncate">{d.name}</span>
                              {editForm.dentistId === d.id && <div className="ml-auto w-2 h-2 rounded-full bg-[#0F766E]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                        <select value={editForm.roomId || ''} onChange={e => setEditForm({...editForm, roomId: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none">
                          <option value="">Select Room</option>
                          {rooms.filter(r => r.status === 'AVAILABLE' || r.id === selected.roomId).map(r => (
                            <option key={r.id} value={r.id}>Room {r.number} - {r.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <select value={editForm.duration || 30} onChange={e => setEditForm({...editForm, duration: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none">
                          <option value={15}>15 min</option><option value={30}>30 min</option>
                          <option value={45}>45 min</option><option value={60}>60 min</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select value={editForm.status || selected.status} onChange={e => setEditForm({...editForm, status: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none">
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                      <input type="text" value={editForm.reason || ''} onChange={e => setEditForm({...editForm, reason: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setEditMode(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                      <button onClick={handleEditSave} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D6D65] text-sm font-medium">Save Changes</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#0F766E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {selected.patient?.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{selected.patient?.user?.name}</div>
                        <div className="text-sm text-gray-500">{selected.patient?.user?.email}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-gray-500 mb-1">Date & Time</div>
                        <div className="font-medium text-slate-900">{new Date(selected.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {selected.time}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-gray-500 mb-1">Duration</div>
                        <div className="font-medium text-slate-900">{selected.duration} minutes</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-gray-500 mb-1">Dentist</div>
                        <div className="font-medium text-slate-900">{selected.dentist?.name || 'Unassigned'}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-gray-500 mb-1">Room</div>
                        <div className="font-medium text-slate-900">{selected.room ? `Room ${selected.room.number} — ${selected.room.name}` : 'No room assigned'}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 text-sm">
                      <div className="text-gray-500 mb-1">Reason</div>
                      <div className="font-medium text-slate-900">{selected.reason || '—'}</div>
                    </div>

                    {selected.notes && (
                      <div className="bg-slate-50 rounded-lg p-3 text-sm">
                        <div className="text-gray-500 mb-1">Notes</div>
                        <div className="font-medium text-slate-900">{selected.notes}</div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`text-xs px-3 py-1 rounded-full border font-medium ${STATUS_CONFIG[selected.status]?.color}`}>
                        {STATUS_CONFIG[selected.status]?.label}
                      </span>
                    </div>

                    {/* Status Action Buttons */}
                    {(NEXT_STATUS[selected.status] || []).length > 0 && (
                      <div className="flex gap-3 pt-2 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                        {NEXT_STATUS[selected.status].map(action => (
                          <button key={action.status} onClick={() => handleStatusUpdate(selected.id, action.status)}
                            className={`flex-1 flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-lg text-sm font-medium ${action.color}`}>
                            <action.icon size={16} /> {action.label}
                          </button>
                        ))}
                        {(selected.status === 'SCHEDULED' || selected.status === 'CONFIRMED') && (
                          <button onClick={() => handleStatusUpdate(selected.id, 'NO_SHOW')}
                            className="flex items-center justify-center gap-2 text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium">
                            <UserX size={16} /> No Show
                          </button>
                        )}
                        {(selected.status === 'SCHEDULED' || selected.status === 'CONFIRMED') && (
                          <button onClick={() => handleStatusUpdate(selected.id, 'CANCELLED')}
                            className="flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-lg text-sm font-medium">
                            <Ban size={16} /> Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-slate-900 mb-4">New Appointment</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                    <select required value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none">
                      <option value="">Select Patient</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.user?.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dentist</label>
                    <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto">
                      {dentists.map(d => (
                        <button key={d.id} type="button" onClick={() => setForm({...form, dentistId: d.id})}
                          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                            form.dentistId === d.id
                              ? 'border-[#0F766E] bg-[#F0FDFA] ring-1 ring-[#0F766E]'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}>
                          {d.avatar ? (
                            <img src={d.avatar} alt={d.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 bg-[#0F766E] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                              {d.name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-slate-900 truncate">{d.name}</span>
                          {form.dentistId === d.id && <div className="ml-auto w-2 h-2 rounded-full bg-[#0F766E]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                    <select value={form.roomId} onChange={e => setForm({...form, roomId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none">
                      <option value="">Select Room</option>
                      {rooms.filter(r => r.status === 'AVAILABLE').map(r => <option key={r.id} value={r.id}>Room {r.number} - {r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <select required value={form.time} onChange={e => setForm({...form, time: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none">
                      <option value="">Select Time</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={form.date || new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0]} onChange={e => setForm({...form, date: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <select value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none">
                      <option value={15}>15 min</option><option value={30}>30 min</option>
                      <option value={45}>45 min</option><option value={60}>60 min</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <input type="text" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                    placeholder="Regular checkup, tooth pain, etc." />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D6D65] text-sm font-medium">Book Appointment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
