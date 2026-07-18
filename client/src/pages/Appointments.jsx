import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Plus, ChevronLeft, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';

export default function Appointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState({ patientId: '', dentistId: '', roomId: '', date: '', time: '', duration: 30, reason: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    const dateStr = selectedDate.toISOString().split('T')[0];
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/appointments', { ...form, date: form.date || selectedDate.toISOString().split('T')[0] });
      setAppointments([...appointments, res.data]);
      setShowModal(false);
      setForm({ patientId: '', dentistId: '', roomId: '', date: '', time: '', duration: 30, reason: '', notes: '' });
      toast.success('Appointment booked');
    } catch (err) { toast.error(err.response?.data?.error || 'Error creating appointment'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await api.put(`/appointments/${id}`, { status });
      setAppointments(appointments.map(a => a.id === id ? res.data : a));
      toast.success('Status updated');
    } catch (err) { toast.error('Error updating appointment'); }
  };

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
            <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Retry</button>
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments for this day" description="Create a new appointment or navigate to a different day" />
        ) : (
        <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={prevDay} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20} /></button>
            <h2 className="text-lg font-bold text-slate-900">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
            <button onClick={nextDay} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20} /></button>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus size={16} /> New Appointment
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr] divide-x divide-slate-200">
            <div className="bg-slate-50">
              {timeSlots.map(time => (
                <div key={time} className="h-16 flex items-center justify-center text-xs text-indigo-600 font-medium border-b border-slate-200">
                  {time}
                </div>
              ))}
            </div>
            <div className="relative">
              {timeSlots.map(time => (
                <div key={time} className="h-16 border-b border-slate-100 px-2 py-1" />
              ))}
              {appointments.filter(a => timeSlots.includes(a.time)).map(appt => {
                const slotIndex = timeSlots.indexOf(appt.time);
                const top = slotIndex * 64;
                const height = Math.max(64, (appt.duration / 30) * 64);
                return (
                  <div key={appt.id}
                    className={`absolute left-1 right-1 rounded-lg p-2 text-xs cursor-pointer transition-shadow hover:shadow-md ${
                      appt.status === 'COMPLETED' ? 'bg-green-100 border border-green-300' :
                      appt.status === 'IN_PROGRESS' ? 'bg-amber-100 border border-amber-300' :
                      'bg-indigo-100 border border-indigo-300'
                    }`}
                    style={{ top: `${top}px`, height: `${height - 4}px` }}>
                    <div className="font-bold text-slate-900">{appt.patient?.user?.name}</div>
                    <div className="text-gray-600">{appt.reason}</div>
                    <div className="text-gray-500 mt-1">{appt.dentist?.name} {appt.room && `· Room ${appt.room.number}`}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">New Appointment</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                    <select required value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value="">Select Patient</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.user?.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dentist</label>
                    <select required value={form.dentistId} onChange={e => setForm({...form, dentistId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value="">Select Dentist</option>
                      {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                    <select value={form.roomId} onChange={e => setForm({...form, roomId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value="">Select Room</option>
                      {rooms.filter(r => r.status === 'AVAILABLE').map(r => <option key={r.id} value={r.id}>Room {r.number} - {r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <select required value={form.time} onChange={e => setForm({...form, time: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value="">Select Time</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={form.date || selectedDate.toISOString().split('T')[0]} onChange={e => setForm({...form, date: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <select value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <input type="text" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Regular checkup, tooth pain, etc." />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Book Appointment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
