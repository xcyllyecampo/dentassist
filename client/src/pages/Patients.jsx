import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api, { authUrl } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { Plus, Search, Users, UserPlus, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function Patients() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', dob: '', gender: '', bloodType: '', allergies: '', medicalHistory: '' });

  const { data: patients = [], isLoading, error, refetch } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/patients', data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['patients'] });
      const previous = queryClient.getQueryData(['patients']);
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData(['patients'], (old) => [
        { id: tempId, user: { name: newData.name, email: newData.email, phone: newData.phone, avatar: null }, gender: newData.gender, bloodType: newData.bloodType, createdAt: new Date().toISOString() },
        ...(old || []),
      ]);
      return { previous };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', dob: '', gender: '', bloodType: '', allergies: '', medicalHistory: '' });
      toast.success('Patient created successfully');
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['patients'], context.previous);
      toast.error(err.response?.data?.error || 'Error creating patient');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const filtered = patients.filter(p =>
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return [
      { label: 'Total Patients', value: patients.length, icon: Users, gradient: 'from-[#0F766E] to-[#0D6D65]' },
      { label: 'New This Month', value: patients.filter(p => new Date(p.createdAt) > thirtyDaysAgo).length, icon: UserPlus, gradient: 'from-blue-500 to-blue-600' },
    ];
  }, [patients]);

  return (
    <Layout>
      <Header title="Patients" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 card-premium">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500 font-medium">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search + Add */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#14B8A6]" size={16} />
            <input
              type="text" placeholder="Search by name or email..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-[#0F766E] focus:outline-none w-80 bg-white transition-all"
            />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-premium flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
            <Plus size={16} /> Add Patient
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : error ? (
            <div className="py-12 text-center">
              <AlertTriangle size={36} className="mx-auto mb-3 text-red-400" />
              <p className="text-sm text-red-600 mb-3">Failed to load patients</p>
              <button onClick={() => refetch()} className="text-sm text-[#0F766E] hover:text-[#064E3B] font-medium">Retry</button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gender</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Blood</th>
                  <th className="text-right px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon={Users} title={search ? "No patients match your search" : "No patients yet"} description={search ? "Try a different search term" : "Add your first patient to get started"} /></td></tr>
                ) : filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.user?.avatar ? (
                          <img src={authUrl(p.user.avatar)} alt={p.user.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-[#0F766E] to-[#0D6D65] text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md shadow-[#0F766E]/10">
                            {p.user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{p.user?.name}</span>
                            {p.createdAt && (Date.now() - new Date(p.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-teal-50 text-[#0F766E] border border-teal-200">New</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{p.user?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.user?.phone || '—'}</td>
                    <td className="px-4 py-4">
                      {p.gender ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          p.gender === 'Male' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          p.gender === 'Female' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>{p.gender}</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {p.bloodType ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">{p.bloodType}</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/patients/${p.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F766E]/5 hover:bg-[#0F766E]/10 text-[#0F766E] rounded-lg text-xs font-semibold transition-colors">
                        View <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-[#0F766E] to-[#0D6D65] px-6 py-4">
                <h2 className="text-lg font-bold text-white">Add New Patient</h2>
                <p className="text-teal-100 text-xs mt-0.5">Fill in the patient details below</p>
              </div>
              <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Full Name" required value={form.name} onChange={v => setForm({...form, name: v})} />
                    <Input label="Email" type="email" required value={form.email} onChange={v => setForm({...form, email: v})} />
                    <Input label="Phone" value={form.phone} onChange={v => setForm({...form, phone: v})} />
                    <Input label="Date of Birth" type="date" required value={form.dob} onChange={v => setForm({...form, dob: v})} />
                    <Select label="Gender" value={form.gender} onChange={v => setForm({...form, gender: v})} options={['Male', 'Female', 'Other']} />
                    <Select label="Blood Type" value={form.bloodType} onChange={v => setForm({...form, bloodType: v})} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
                  </div>
                  <TextArea label="Allergies" value={form.allergies} onChange={v => setForm({...form, allergies: v})} />
                  <TextArea label="Medical History" value={form.medicalHistory} onChange={v => setForm({...form, medicalHistory: v})} />
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                    <button type="submit" disabled={createMutation.isPending} className="btn-premium px-5 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50">{createMutation.isPending ? 'Creating...' : 'Create Patient'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Input({ label, type = 'text', required, value, onChange }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-[#0F766E] focus:outline-none bg-slate-50/50 transition-all" />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-[#0F766E] focus:outline-none bg-slate-50/50 transition-all">
        <option value="">Select</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0F766E] focus:border-[#0F766E] focus:outline-none bg-slate-50/50 transition-all resize-none" />
    </div>
  );
}
