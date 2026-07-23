import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, Plus, Trash2, X, AlertTriangle, Clock } from 'lucide-react';
import { playClick, playSuccess, playError } from '../lib/sounds';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = [];
for (let h = 7; h <= 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

export default function DentistSchedules() {
  const { user } = useAuth();
  const toast = useToast();
  const [schedules, setSchedules] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ dentistId: '', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
  const isAdmin = user?.role === 'ADMIN';

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/dentist-schedules'),
      api.get('/dentist-schedules/dentists').catch(() => ({ data: [] })),
    ]).then(([schedRes, dentistsRes]) => {
      setSchedules(schedRes.data);
      const merged = dentistsRes.data || [];
      // Add any dentists from schedules that aren't in the dentists list
      schedRes.data.forEach(s => {
        if (s.user && !merged.find(d => d.id === s.user.id)) {
          merged.push({ id: s.user.id, name: s.user.name, avatar: s.user.avatar });
        }
      });
      setDentists(merged);
    }).catch(() => setError('Failed to load schedules')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    playClick();
    if (!form.dentistId) { toast.error('Select a dentist'); return; }
    try {
      await api.post('/dentist-schedules', form);
      toast.success('Schedule added');
      playSuccess();
      setShowForm(false);
      setForm({ dentistId: '', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to add schedule');
      playError();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this schedule?')) return;
    playClick();
    try {
      await api.delete(`/dentist-schedules/${id}`);
      toast.success('Schedule removed');
      fetchData();
    } catch (e) {
      toast.error('Failed to remove schedule');
    }
  };

  const grouped = {};
  schedules.forEach(s => {
    const id = s.userId;
    if (!grouped[id]) grouped[id] = { name: s.user?.name || 'Unknown', days: {} };
    if (!grouped[id].days[s.dayOfWeek]) grouped[id].days[s.dayOfWeek] = [];
    grouped[id].days[s.dayOfWeek].push(s);
  });

  if (loading) return <Layout><Header title="Dentist Schedules" /><Spinner className="py-20" /></Layout>;
  if (error) return (
    <Layout>
      <Header title="Dentist Schedules" />
      <div className="p-6 flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="text-red-500" size={48} />
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-[#004aad] text-white rounded-lg hover:bg-[#003782] transition-colors text-sm">Retry</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <Header title="Dentist Schedules" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Manage weekly working hours for each dentist</p>
          {isAdmin && (
            <button onClick={() => { playClick(); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#004aad] text-white text-sm font-medium rounded-lg hover:bg-[#003782] transition-colors">
              <Plus size={16} /> Add Schedule
            </button>
          )}
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium mb-1">No schedules configured yet</p>
            <p className="text-slate-400 text-sm">Add a schedule to set dentist availability</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dentistId, { name: dentistName, days }]) => (
              <div key={dentistId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  {(() => {
                    const dent = dentists.find(d => d.id === dentistId);
                    return dent?.avatar ? (
                      <img src={dent.avatar} alt={dentistName} className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200" />
                    ) : (
                      <div className="w-8 h-8 bg-[#c2d5f7] text-[#002d6b] rounded-full flex items-center justify-center text-sm font-bold">
                        {dentistName.charAt(0)}
                      </div>
                    );
                  })()}
                  <h3 className="font-bold text-slate-900 text-sm">{dentistName}</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map(day => {
                      const daySchedules = days[day] || [];
                      const isToday = new Date().getDay() === day;
                      return (
                        <div key={day} className={`rounded-lg border p-2 min-h-[80px] ${
                          isToday ? 'border-[#004aad] bg-[#f0f5ff]' : 'border-slate-200 bg-slate-50'
                        } ${daySchedules.length === 0 ? 'opacity-50' : ''}`}>
                          <div className={`text-xs font-bold mb-2 text-center ${isToday ? 'text-[#004aad]' : 'text-slate-600'}`}>
                            {SHORT_DAYS[day]}
                          </div>
                          {daySchedules.length === 0 ? (
                            <div className="text-[10px] text-gray-400 text-center mt-2">Off</div>
                          ) : (
                            <div className="space-y-1">
                              {daySchedules.map(s => (
                                <div key={s.id} className="group relative">
                                  <div className="text-[10px] text-center bg-green-50 text-green-700 border border-green-200 rounded px-1 py-0.5 flex items-center justify-center gap-1">
                                    <Clock size={8} />
                                    {s.startTime}–{s.endTime}
                                  </div>
                                  {isAdmin && (
                                    <button onClick={() => handleDelete(s.id)}
                                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <X size={8} />
                                    </button>
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
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">Add Schedule</h3>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dentist</label>
                  <select value={form.dentistId} onChange={(e) => setForm({ ...form, dentistId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004aad]">
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
                            ? 'bg-[#004aad] text-white border-[#004aad]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#004aad]'
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
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004aad]">
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                    <select value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004aad]">
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleAdd}
                  className="w-full py-2 bg-[#004aad] text-white text-sm font-medium rounded-lg hover:bg-[#003782] transition-colors flex items-center justify-center gap-2">
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
