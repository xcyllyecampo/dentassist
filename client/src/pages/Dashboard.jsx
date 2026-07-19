import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { Users, Calendar, Clock, TrendingUp, Activity, ArrowUpRight, Zap, Star } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { playClick } from '../lib/sounds';

const COLORS = ['#004aad', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout><Header title="Dashboard" /><Spinner className="py-20" /></Layout>;
  if (!data) return <Layout><Header title="Dashboard" /><div className="p-6 text-center text-red-500">Failed to load dashboard</div></Layout>;

  const roomStats = data.roomStatus.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const roomPie = Object.entries(roomStats).map(([name, value]) => ({ name, value }));

  return (
    <Layout>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-[#1a5fb4] via-[#1a5fb4] to-[#003782] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Star size={18} className="text-yellow-300" />
              <span className="text-white/70 text-sm font-medium">Good day!</span>
            </div>
            <h2 className="text-2xl font-bold">Welcome back to DentAssist</h2>
            <p className="text-white/70 text-sm mt-1">Here's what's happening at your clinic today.</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Patients" value={data.totalPatients} gradient="from-[#1a5fb4] to-[#004aad]" delay="0" />
          <StatCard icon={Calendar} label="Today's Appointments" value={data.todayAppointments.length} gradient="from-[#1a5fb4] to-[#003782]" delay="0.05" />
          <StatCard icon={Clock} label="In Queue" value={data.queueCount} gradient="from-amber-500 to-orange-500" delay="0.1" />
          <StatCard icon={TrendingUp} label="Today's Revenue" value={`₱${data.totalRevenue}`} gradient="from-emerald-500 to-teal-500" delay="0.15" />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 card-premium animate-slide-up stagger-1">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#e6efff] rounded-lg flex items-center justify-center">
                <Activity size={16} className="text-[#004aad]" />
              </div>
              Room Status
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={roomPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {roomPie.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {roomPie.map((r, i) => (
                <span key={r.name} className="text-xs flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {r.name} ({r.value})
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 card-premium animate-slide-up stagger-2">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#e6efff] rounded-lg flex items-center justify-center">
                <Calendar size={16} className="text-[#004aad]" />
              </div>
              Today's Appointments
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {data.todayAppointments.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">No appointments today</p>
              ) : data.todayAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-[#f0f5ff]/50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-[#1a5fb4] to-[#1a5fb4] text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-md shadow-[#c2d5f7]">
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
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 card-premium animate-slide-up stagger-3">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-emerald-600" />
              </div>
              Dentist Workload
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.dentists.map(d => ({ name: d.name.split(' ').pop(), appointments: data.todayAppointments.filter(a => a.dentistId === d.id).length }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="appointments" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#004aad" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 card-premium animate-slide-up stagger-4">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight size={16} className="text-amber-600" />
              </div>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction to="/patients" icon={Users} label="Add Patient" />
              <QuickAction to="/appointments" icon={Calendar} label="Book Appointment" />
              <QuickAction to="/xray" icon={Activity} label="Upload X-Ray" />
              <QuickAction to="/digital-twin" icon={Zap} label="Digital Twin" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, gradient, delay }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 card-premium animate-slide-up relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
      <div className="relative flex items-center gap-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={22} />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
          <div className="text-sm text-slate-500 font-medium">{label}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    SCHEDULED: 'bg-[#e6efff] text-[#003782]',
    CONFIRMED: 'bg-blue-100 text-blue-700',
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
      className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-[#f0f5ff] rounded-xl transition-all duration-200 group hover:shadow-md hover:shadow-[#e6efff]/50">
      <div className="w-9 h-9 bg-gradient-to-br from-[#1a5fb4] to-[#1a5fb4] text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-[#c2d5f7]">
        <Icon size={17} />
      </div>
      <span className="text-sm font-semibold text-slate-700 group-hover:text-[#003782] transition-colors">{label}</span>
    </Link>
  );
}
