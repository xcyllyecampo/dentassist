import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { Users, Calendar, Clock, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout><Header title="Dashboard" /><div className="p-6 text-center">Loading...</div></Layout>;
  if (!data) return <Layout><Header title="Dashboard" /><div className="p-6 text-center text-red-500">Failed to load dashboard</div></Layout>;

  const roomStats = data.roomStatus.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const roomPie = Object.entries(roomStats).map(([name, value]) => ({ name, value }));

  return (
    <Layout>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Patients" value={data.totalPatients} color="bg-sky-500" />
          <StatCard icon={Calendar} label="Today's Appointments" value={data.todayAppointments.length} color="bg-indigo-500" />
          <StatCard icon={Clock} label="In Queue" value={data.queueCount} color="bg-amber-500" />
          <StatCard icon={TrendingUp} label="Today's Revenue" value={`$${data.totalRevenue}`} color="bg-emerald-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-sky-100">
            <h3 className="font-bold text-sky-900 mb-4">Room Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={roomPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {roomPie.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {roomPie.map((r, i) => (
                <span key={r.name} className="text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {r.name} ({r.value})
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-sky-100">
            <h3 className="font-bold text-sky-900 mb-4">Today's Appointments</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {data.todayAppointments.length === 0 ? (
                <p className="text-gray-400 text-sm">No appointments today</p>
              ) : data.todayAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-200 text-sky-800 rounded-full flex items-center justify-center font-bold text-sm">
                      {appt.time}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-sky-900">{appt.patient?.user?.name}</div>
                      <div className="text-xs text-gray-500">{appt.reason} · {appt.dentist?.name}</div>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-sky-100">
            <h3 className="font-bold text-sky-900 mb-4">Dentist Workload</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.dentists.map(d => ({ name: d.name.split(' ').pop(), appointments: data.todayAppointments.filter(a => a.dentistId === d.id).length }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="appointments" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-sky-100">
            <h3 className="font-bold text-sky-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction to="/patients" icon={Users} label="Add Patient" />
              <QuickAction to="/appointments" icon={Calendar} label="Book Appointment" />
              <QuickAction to="/xray" icon={Activity} label="Upload X-Ray" />
              <QuickAction to="/digital-twin" icon={AlertCircle} label="View Digital Twin" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-sky-100 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} text-white rounded-xl flex items-center justify-center`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-2xl font-bold text-sky-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    SCHEDULED: 'bg-sky-100 text-sky-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function QuickAction({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-3 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors">
      <Icon size={20} className="text-sky-600" />
      <span className="text-sm font-medium text-sky-900">{label}</span>
    </Link>
  );
}
