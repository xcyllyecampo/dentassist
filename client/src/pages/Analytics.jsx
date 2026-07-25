import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { SkeletonCard, SkeletonLine } from '../components/Skeleton';

const COLORS = ['#0F766E', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#0ea5e9'];

function AnalyticsSkeleton() {
  return (
    <Layout>
      <Header title="Clinic Analytics" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <SkeletonLine width="10rem" height="1rem" />
              <div className="bg-slate-100 rounded-lg mt-4 animate-pulse" style={{ height: 300 }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <SkeletonLine width="10rem" height="1rem" />
              <div className="bg-slate-100 rounded-lg mt-4 animate-pulse" style={{ height: 300 }} />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default function Analytics() {
  const [days] = useState(7);

  const { data: revenue = [], isLoading: revLoading } = useQuery({
    queryKey: ['analytics', 'revenue', days],
    queryFn: () => api.get(`/analytics/revenue?days=${days}`).then(r => r.data),
  });

  const { data: procedures = [], isLoading: procLoading } = useQuery({
    queryKey: ['analytics', 'procedures'],
    queryFn: () => api.get('/analytics/procedures').then(r => r.data),
  });

  const { data: returning = [], isLoading: retLoading } = useQuery({
    queryKey: ['analytics', 'returning-patients'],
    queryFn: () => api.get('/analytics/returning-patients').then(r => r.data),
  });

  const { data: daily = null, isLoading: dailyLoading, error: dailyError, refetch } = useQuery({
    queryKey: ['analytics', 'daily'],
    queryFn: () => api.get('/analytics/daily').then(r => r.data),
  });

  const { data: peakHours = [], isLoading: peakLoading } = useQuery({
    queryKey: ['analytics', 'peak-hours'],
    queryFn: () => api.get('/analytics/peak-hours').then(r => r.data),
  });

  const isLoading = revLoading || procLoading || retLoading || dailyLoading || peakLoading;

  if (isLoading) return <AnalyticsSkeleton />;
  if (dailyError) return (
    <Layout>
      <Header title="Clinic Analytics" />
      <div className="p-6 flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="text-red-500" size={48} />
        <p className="text-red-600 font-medium">Failed to load analytics</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D6D65] transition-colors text-sm">Retry</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <Header title="Clinic Analytics" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Patients" value={daily?.patientCount || 0} color="bg-[#0F766E]" />
          <StatCard icon={Calendar} label="Today's Appointments" value={daily?.appointmentCount || 0} color="bg-[#0F766E]" />
          <StatCard icon={TrendingUp} label="Completed Today" value={daily?.completedCount || 0} color="bg-emerald-500" />
          <StatCard icon={DollarSign} label="Today's Revenue" value={`₱${daily?.revenue || 0}`} color="bg-amber-500" />
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
                <Line type="monotone" dataKey="revenue" stroke="#0F766E" strokeWidth={2} dot={{ r: 4 }} />
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
                <Bar dataKey="visits" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Peak Hours (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="patients" radius={[4, 4, 0, 0]}>
                  {peakHours.map((entry, i) => <Cell key={i} fill={entry.patients >= 10 ? '#ef4444' : entry.patients >= 7 ? '#f59e0b' : '#10b981'} />)}
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
