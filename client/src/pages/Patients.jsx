import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { Plus, Search, Eye, Trash2, Users, AlertTriangle } from 'lucide-react';

export default function Patients() {
  const toast = useToast();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', dob: '', gender: '', bloodType: '', allergies: '', medicalHistory: '' });

  const fetchPatients = () => {
    setLoading(true);
    setError(null);
    api.get('/patients')
      .then(res => setPatients(res.data))
      .catch(() => setError('Failed to load patients'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/patients', form);
      setPatients([res.data, ...patients]);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', dob: '', gender: '', bloodType: '', allergies: '', medicalHistory: '' });
      toast.success('Patient created successfully');
    } catch (err) { toast.error(err.response?.data?.error || 'Error creating patient'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this patient?')) return;
    try {
      await api.delete(`/patients/${id}`);
      setPatients(patients.filter(p => p.id !== id));
      toast.success('Patient deleted');
    } catch (err) { toast.error('Error deleting patient'); }
  };

  const filtered = patients.filter(p =>
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <Header title="Patients" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a85d6]" size={16} />
            <input
              type="text" placeholder="Search patients..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#004aad] focus:outline-none w-80"
            />
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#004aad] text-white px-4 py-2 rounded-lg hover:bg-[#003782] transition-colors text-sm font-medium">
            <Plus size={16} /> Add Patient
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          {loading ? (
            <Spinner className="py-20" />
          ) : error ? (
            <div className="py-12 text-center">
              <AlertTriangle size={36} className="mx-auto mb-3 text-red-400" />
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button onClick={fetchPatients} className="text-sm text-[#004aad] hover:text-[#002d6b] font-medium">Retry</button>
            </div>
          ) : (
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50 text-slate-900 text-sm">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Name</th>
                <th className="text-left px-6 py-3 font-medium">Email</th>
                <th className="text-left px-6 py-3 font-medium">Phone</th>
                <th className="text-left px-6 py-3 font-medium">Gender</th>
                <th className="text-left px-6 py-3 font-medium">Blood Type</th>
                <th className="text-right px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Users} title={search ? "No patients match your search" : "No patients yet"} description={search ? "Try a different search term" : "Add your first patient to get started"} /></td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#c2d5f7] text-[#002d6b] rounded-full flex items-center justify-center text-sm font-bold">
                        {p.user?.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{p.user?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.user?.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.user?.phone || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.gender || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.bloodType || 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/patients/${p.id}`} className="inline-flex items-center gap-1 text-[#004aad] hover:text-[#002d6b] text-sm mr-3">
                      <Eye size={14} /> View
                    </Link>
                  {user?.role === 'ADMIN' && (
                    <button onClick={() => handleDelete(p.id)} className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-sm">
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Patient</h2>
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
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#004aad] text-white rounded-lg hover:bg-[#003782] text-sm font-medium">Create Patient</button>
                </div>
              </form>
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#004aad] focus:outline-none" />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#004aad] focus:outline-none">
        <option value="">Select</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#004aad] focus:outline-none" />
    </div>
  );
}
