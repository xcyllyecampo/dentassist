import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import Spinner from '../components/Spinner';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#0ea5e9'];

export default function Analytics() {
  const [revenue, setRevenue] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [returning, setReturning] = useState([]);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/analytics/revenue?days=7'),
      api.get('/analytics/procedures'),
      api.get('/analytics/returning-patients'),
      api.get('/analytics/daily'),
    ]).then(([rev, proc, ret, day]) => {
      setRevenue(rev.data);
      setProcedures(proc.data);
      setReturning(ret.data);
      setDaily(day.data);
    }).catch(() => setError('Failed to load analytics')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Layout><Header title="Clinic Analytics" /><Spinner className="py-20" /></Layout>;
  if (error) return (
    <Layout>
      <Header title="Clinic Analytics" />
      <div className="p-6 flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="text-red-500" size={48} />
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">Retry</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <Header title="Clinic Analytics" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Patients" value={daily?.patientCount || 0} color="bg-indigo-500" />
          <StatCard icon={Calendar} label="Today's Appointments" value={daily?.appointmentCount || 0} color="bg-indigo-500" />
          <StatCard icon={TrendingUp} label="Completed Today" value={daily?.completedCount || 0} color="bg-emerald-500" />
          <StatCard icon={DollarSign} label="Today's Revenue" value={`$${daily?.revenue || 0}`} color="bg-amber-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Revenue (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Most Common Procedures</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={procedures} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {procedures.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Returning Patients</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={returning}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="visits" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Peak Hours (Simulated)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { hour: '9 AM', patients: 4 }, { hour: '10 AM', patients: 8 }, { hour: '11 AM', patients: 12 },
                { hour: '12 PM', patients: 6 }, { hour: '1 PM', patients: 5 }, { hour: '2 PM', patients: 10 },
                { hour: '3 PM', patients: 9 }, { hour: '4 PM', patients: 7 }, { hour: '5 PM', patients: 3 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="patients" radius={[4, 4, 0, 0]}>
                  {[4,8,12,6,5,10,9,7,3].map((v, i) => <Cell key={i} fill={v >= 10 ? '#ef4444' : v >= 7 ? '#f59e0b' : '#10b981'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} text-white rounded-xl flex items-center justify-center`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}
