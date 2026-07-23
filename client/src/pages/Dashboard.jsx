import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import ClinicScene3D from '../components/ClinicScene3D';
import Spinner from '../components/Spinner';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { Users, Calendar, Clock, TrendingUp, Activity, ArrowUpRight, Zap, Star, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { playClick } from '../lib/sounds';

const ROOM_COLORS = {
  AVAILABLE: '#10b981',
  OCCUPIED: '#ef4444',
  CLEANING: '#3b82f6',
  MAINTENANCE: '#f59e0b',
};
const ROOM_LABELS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
};

export default function Dashboard() {
  const [dashData, setDashData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [queue, setQueue] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/rooms'),
      api.get('/queue'),
    ]).then(([d, r, q]) => {
      setDashData(d.data);
      setRooms(r.data);
      setQueue(q.data);
    }).catch(() => {}).finally(() => setLoading(false));

    const socket = getSocket();
    socket.emit('join-twin');
    socket.emit('join-queue');

    const onRoomUpdate = ({ roomId, status }) => {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
      setLastUpdate(new Date());
    };
    const onQueueUpdate = () => {
      api.get('/queue').then(res => { setQueue(res.data); setLastUpdate(new Date()); });
    };

    socket.on('room-update', onRoomUpdate);
    socket.on('queue-update', onQueueUpdate);

    return () => {
      socket.off('room-update', onRoomUpdate);
      socket.off('queue-update', onQueueUpdate);
    };
  }, []);

  if (loading) return <Layout><Header title="Dashboard" /><Spinner className="py-20" /></Layout>;

  const waiting = queue.filter(e => e.status === 'WAITING');
  const inProgress = queue.filter(e => e.status === 'IN_PROGRESS');

  return (
    <Layout>
      <Header title="Dashboard" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-[#0F766E] via-[#0F766E] to-[#0D6D65] rounded-2xl p-5 md:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Star size={18} className="text-yellow-300" />
              <span className="text-white/70 text-sm font-medium">Good day!</span>
            </div>
            <h2 className="text-responsive-heading font-bold">Welcome back to DentAssist</h2>
            <p className="text-white/70 text-sm mt-1">Here's what's happening at your clinic today.</p>
          </div>
        </div>

        {/* Stat cards */}
        {dashData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard icon={Users} label="Total Patients" value={dashData.totalPatients} gradient="from-[#0F766E] to-[#0F766E]" delay="0" />
            <StatCard icon={Calendar} label="Today's Appointments" value={dashData.todayAppointments.length} gradient="from-[#0F766E] to-[#0D6D65]" delay="0.05" />
            <StatCard icon={Clock} label="In Queue" value={dashData.queueCount} gradient="from-amber-500 to-orange-500" delay="0.1" />
            <StatCard icon={TrendingUp} label="Today's Revenue" value={`₱${Number(dashData.totalRevenue).toLocaleString()}`} gradient="from-emerald-500 to-teal-500" delay="0.15" />
          </div>
        )}

        {/* 3D Viewport + Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-slate-900">Live — Real-time 3D Clinic View</span>
                </div>
                <span className="text-[10px] text-gray-400">Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <div className="h-[280px] md:h-[400px] lg:h-[480px] bg-gradient-to-b from-[#F0FDFA] to-[#F0FDFA]">
                <ClinicScene3D rooms={rooms} queue={queue} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} />
              </div>
              <div className="flex items-center gap-6 px-4 py-3 border-t border-slate-200 bg-gray-50">
                {Object.entries(ROOM_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-600">{ROOM_LABELS[status]}</span>
                  </div>
                ))}
                <span className="text-[10px] text-gray-400 ml-auto">Click rooms for details • Drag to rotate • Scroll to zoom</span>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Live Queue
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {waiting.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Clock size={18} className="text-slate-300" />
                    </div>
                    <p className="text-gray-400 text-xs">No patients waiting</p>
                  </div>
                ) : waiting.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <div className="w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">{entry.position}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">{entry.patient?.user?.name}</div>
                      <div className="text-[10px] text-gray-500">~{entry.estimatedWait} min wait</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
                Currently Serving
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {inProgress.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <CheckCircle size={18} className="text-slate-300" />
                    </div>
                    <p className="text-gray-400 text-xs">No patients in service</p>
                  </div>
                ) : inProgress.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="w-6 h-6 bg-[#99F6E4] text-[#064E3B] rounded-full flex items-center justify-center text-xs font-bold">{entry.position}</div>
                    <div className="text-xs font-medium text-slate-900 truncate">{entry.patient?.user?.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Room Status</h3>
              <div className="space-y-2">
                {Object.entries(ROOM_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs text-gray-600">{ROOM_LABELS[status]}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{rooms.filter(r => r.status === status).length}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Total Rooms</span>
                  <span className="text-sm font-bold text-slate-900">{rooms.length}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-medium text-gray-500">Utilization</span>
                  <span className="text-sm font-bold text-slate-900">
                    {rooms.length > 0 ? Math.round((rooms.filter(r => r.status === 'OCCUPIED').length / rooms.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Queue Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-amber-700">{waiting.length}</div>
                  <div className="text-[10px] text-amber-600">Waiting</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#0D6D65]">{inProgress.length}</div>
                  <div className="text-[10px] text-[#0F766E]">In Service</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        {dashData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 card-premium animate-slide-up stagger-1">
              <h3 className="font-bold text-slate-900 mb-3 md:mb-4 flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-[#F0FDFA] rounded-lg flex items-center justify-center">
                  <Calendar size={14} className="text-[#0F766E]" />
                </div>
                Today's Appointments
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {dashData.todayAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Calendar size={20} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">No appointments today</p>
                    <p className="text-slate-300 text-xs mt-1">Enjoy your free day!</p>
                  </div>
                ) : dashData.todayAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-[#F0FDFA]/50 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-[#0F766E] to-[#0F766E] text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-md shadow-[#99F6E4]">
                        {appt.time}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{appt.patient?.user?.name}</div>
                        <div className="text-xs text-slate-500">{appt.reason} · {appt.dentist?.name}</div>
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 card-premium animate-slide-up stagger-2">
              <h3 className="font-bold text-slate-900 mb-3 md:mb-4 flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Zap size={14} className="text-emerald-600" />
                </div>
                Dentist Workload
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dashData.dentists.map(d => ({ name: d.name.split(' ').pop(), appointments: dashData.todayAppointments.filter(a => a.dentistId === d.id).length }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F766E" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 card-premium animate-slide-up stagger-3">
          <h3 className="font-bold text-slate-900 mb-3 md:mb-4 flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <ArrowUpRight size={14} className="text-amber-600" />
            </div>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <QuickAction to="/patients" icon={Users} label="Add Patient" />
            <QuickAction to="/appointments" icon={Calendar} label="Book Appointment" />
            <QuickAction to="/xray" icon={Activity} label="Upload X-Ray" />
          </div>
        </div>

        {/* Room Detail Modal */}
        {selectedRoom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRoom(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ROOM_COLORS[selectedRoom.status] }} />
                <h2 className="text-lg font-bold text-slate-900">Room {selectedRoom.number} — {selectedRoom.name}</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="text-sm font-bold" style={{ color: ROOM_COLORS[selectedRoom.status] }}>{ROOM_LABELS[selectedRoom.status]}</span>
                </div>
                {selectedRoom.appointments?.length > 0 && (
                  <>
                    <div className="border-t border-gray-100 pt-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Current Appointment</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Patient</span>
                      <span className="text-sm font-medium text-slate-900">{selectedRoom.appointments[0].patient?.user?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Dentist</span>
                      <span className="text-sm font-medium text-slate-900">{selectedRoom.appointments[0].dentist?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Procedure</span>
                      <span className="text-sm font-medium text-slate-900">{selectedRoom.appointments[0].reason}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Time</span>
                      <span className="text-sm font-medium text-slate-900">{selectedRoom.appointments[0].time}</span>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setSelectedRoom(null)} className="w-full mt-6 bg-[#0F766E] text-white py-2 rounded-lg text-sm hover:bg-[#0D6D65] transition-colors">Close</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 card-premium animate-slide-up relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
      <div className="relative flex items-center gap-3 md:gap-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${gradient} text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={18} className="md:size-[22px]" />
        </div>
        <div className="min-w-0">
          <div className="text-responsive-value font-bold text-slate-900 tracking-tight">{value}</div>
          <div className="text-xs md:text-sm text-slate-500 font-medium truncate">{label}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    SCHEDULED: 'bg-[#F0FDFA] text-[#0D6D65]',
    CONFIRMED: 'bg-teal-100 text-teal-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
    NO_SHOW: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${colors[status] || 'bg-slate-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function QuickAction({ to, icon: Icon, label }) {
  return (
    <Link to={to} onClick={() => playClick()}
      className="flex items-center gap-3 p-3 md:p-3.5 bg-slate-50 hover:bg-[#F0FDFA] rounded-xl transition-all duration-200 group hover:shadow-md hover:shadow-[#F0FDFA]/50">
      <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-[#0F766E] to-[#0F766E] text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-[#99F6E4]">
        <Icon size={15} className="md:size-[17px]" />
      </div>
      <span className="text-xs md:text-sm font-semibold text-slate-700 group-hover:text-[#0D6D65] transition-colors">{label}</span>
    </Link>
  );
}
