import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { SkeletonPage } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import api, { authUrl } from '../lib/api';
import { Search, Activity, AlertTriangle, Award, Calendar, Stethoscope, FileText, ArrowRight, Users, ShieldCheck, Sparkles } from 'lucide-react';

const TIER_COLORS = {
  Bronze: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  Silver: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', dot: 'bg-slate-400' },
  Gold: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  Platinum: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
};

export default function Records() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: patients = [], isLoading, error, refetch } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then(r => r.data),
  });

  const { data: patientBadges = {} } = useQuery({
    queryKey: ['patient-badges-list', patients.map(p => p.id).join(',')],
    queryFn: async () => {
      const badgeMap = {};
      await Promise.all(
        patients.map(p =>
          api.get(`/badges/patient/${p.id}`)
            .then(r => { badgeMap[p.id] = r.data || []; })
            .catch(() => { badgeMap[p.id] = []; })
        )
      );
      return badgeMap;
    },
    enabled: patients.length > 0,
  });

  const filtered = patients.filter(p =>
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.phone?.includes(search)
  );

  const totalBadges = Object.values(patientBadges).reduce((sum, b) => sum + b.length, 0);
  const patientsWithBadges = Object.values(patientBadges).filter(b => b.length > 0).length;

  return (
    <Layout>
      <Header title="Digital Patient Records" />
      {isLoading ? (
        <SkeletonPage stats={3} rows={6} />
      ) : error ? (
        <div className="p-6">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <p className="text-red-600 font-medium mb-4">Failed to load patients</p>
            <button onClick={refetch} className="px-5 py-2.5 bg-[#0F766E] text-white rounded-xl text-sm font-semibold hover:bg-[#0D6D65] transition-colors shadow-sm">Retry</button>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6 animate-fade-in">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{patients.length}</div>
                <div className="text-xs text-slate-400 font-medium">Total Patients</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Award size={20} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{totalBadges}</div>
                <div className="text-xs text-slate-400 font-medium">Badges Earned</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{patientsWithBadges}</div>
                <div className="text-xs text-slate-400 font-medium">Awarded Patients</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#14B8A6] focus:outline-none shadow-sm transition-all placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs font-medium transition-colors">
                Clear
              </button>
            )}
          </div>

          {/* Patient grid */}
          {filtered.length === 0 ? (
            <EmptyState icon={Activity} title="No patients found" description="Try a different search or add patients" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => {
                const badges = patientBadges[p.id] || [];
                return (
                  <div key={p.id}
                    onClick={() => navigate(`/patients/${p.id}`)}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-slate-200/60 hover:border-[#14B8A6]/40 transition-all duration-300 hover:-translate-y-0.5">

                    {/* Header gradient strip */}
                    <div className="h-1.5 bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#99F6E4] group-hover:from-[#14B8A6] group-hover:to-[#0F766E] transition-all duration-300" />

                    <div className="p-5">
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3 mb-4">
                        {p.user?.avatar ? (
                          <img src={authUrl(p.user.avatar)} alt={p.user.name}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-[#99F6E4] transition-all" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-teal-500/20">
                            {p.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate group-hover:text-[#0F766E] transition-colors">{p.user?.name}</div>
                          <div className="text-xs text-slate-400 truncate">{p.user?.email}</div>
                        </div>
                      </div>

                      {/* Info chips */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 font-medium">
                          <Activity size={10} /> {p.bloodType || 'N/A'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 font-medium">
                          {p.gender || 'N/A'}
                        </span>
                        {p.allergies && p.allergies !== 'None' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-600 font-medium">
                            <AlertTriangle size={10} /> Allergies
                          </span>
                        )}
                      </div>

                      {/* Reward badges */}
                      {badges.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Award size={12} className="text-amber-500" />
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reward Badges</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {badges.slice(0, 4).map(pb => (
                              <span key={pb.id} className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-lg text-[11px] text-amber-700 font-medium">
                                <span>{pb.badge?.icon}</span> {pb.badge?.name}
                              </span>
                            ))}
                            {badges.length > 4 && (
                              <span className="inline-flex items-center px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500 font-medium">
                                +{badges.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-[#0F766E] font-semibold group-hover:text-[#14B8A6] transition-colors flex items-center gap-1">
                          View Records <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <div className="flex items-center gap-1">
                          <Stethoscope size={10} className="text-slate-300" />
                          <span className="text-[10px] text-slate-300 font-medium">{p.appointments?.length || 0} visits</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
