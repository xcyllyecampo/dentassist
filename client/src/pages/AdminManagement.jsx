import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import api from '../lib/api';
import { UserPlus, Search, Edit2, Trash2, X, Camera, Users, Shield, Stethoscope, ChevronDown, Eye, EyeOff, Image, Power, Info } from 'lucide-react';
import { playClick, playSuccess, playError } from '../lib/sounds';

const ROLE_TABS = [
  { key: 'ALL', label: 'All Users', icon: Users },
  { key: 'PATIENT', label: 'Patients', icon: Users },
  { key: 'STAFF', label: 'Staff', icon: Shield },
];

const ROLES = [
  { value: 'ADMIN', label: 'Admin', color: 'bg-rose-100 text-rose-700' },
  { value: 'DENTIST', label: 'Dentist', color: 'bg-[#e6efff] text-[#003782]' },
  { value: 'ASSISTANT', label: 'Assistant', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'PATIENT', label: 'Patient', color: 'bg-amber-100 text-amber-700' },
];

const AVATAR_COLORS = [
  'from-[#1a5fb4] to-[#003782]',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AdminManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toggleConfirm, setToggleConfirm] = useState(null);
  const [error, setError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin-users').then(res => setUsers(res.data)).catch(() => setError('Failed to load users')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    if (activeTab === 'STAFF') {
      if (!['ADMIN', 'DENTIST', 'ASSISTANT'].includes(u.role)) return false;
    } else if (activeTab !== 'ALL') {
      if (u.role !== activeTab) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
    }
    return true;
  });

  const handleDelete = async (user) => {
    playClick();
    try {
      await api.delete(`/admin-users/${user.id}`);
      playSuccess();
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setDeleteConfirm(null);
    } catch (err) {
      playError();
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (user) => {
    playClick();
    try {
      const res = await api.put(`/admin-users/${user.id}/toggle-active`);
      playSuccess();
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: res.data.active } : u));
    } catch (err) {
      playError();
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleSave = (savedUser) => {
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === savedUser.id ? { ...u, ...savedUser } : u));
    } else {
      setUsers(prev => [savedUser, ...prev]);
    }
    setModalOpen(false);
    setEditUser(null);
  };

  const counts = {
    ALL: users.length,
    PATIENT: users.filter(u => u.role === 'PATIENT').length,
    STAFF: users.filter(u => ['ADMIN', 'DENTIST', 'ASSISTANT'].includes(u.role)).length,
  };

  return (
    <Layout>
      <Header title="User Management" />
      <div className="p-6 space-y-6 animate-fade-in">
        {error && (
          <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-xl border border-rose-100 flex items-center gap-2">
            <span>⚠</span> {error}
            <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-600"><X size={14} /></button>
          </div>
        )}

        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manage Users</h2>
            <p className="text-sm text-slate-500 mt-0.5">{users.length} total users · {counts.STAFF} staff · {counts.PATIENT} patients</p>
          </div>
          <button onClick={() => { playClick(); setEditUser(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1a5fb4] to-[#003782] text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#c2d5f7]/50 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            <UserPlus size={16} /> Add User
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {ROLE_TABS.map(tab => (
            <button key={tab.key} onClick={() => { playClick(); setActiveTab(tab.key); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white text-[#004aad] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}>
              <tab.icon size={15} />
              {tab.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-[#004aad] text-white' : 'bg-slate-200 text-slate-500'
              }`}>{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004aad]/20 focus:border-[#4a85d6] outline-none transition-all" />
        </div>

        {/* Table */}
        {loading ? (
          <Spinner className="py-20" />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Users size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No users found</p>
            <p className="text-sm text-slate-400 mt-1">{search ? 'Try a different search term' : 'Add your first user to get started'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">User</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(user => {
                    const roleInfo = ROLES.find(r => r.value === user.role);
                    return (
                      <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${user.active === false ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name}
                                className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100" />
                            ) : (
                              <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(user.name)} text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md`}>
                                {user.name?.charAt(0)?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                              {user.patient && (
                                <div className="text-[11px] text-slate-400">
                                  {user.patient.gender ? `${user.patient.gender} · ` : ''}{user.patient.bloodType || ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600">{user.email}</td>
                        <td className="px-5 py-3 text-sm text-slate-600">{user.phone || '—'}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${roleInfo?.color || 'bg-slate-100 text-slate-600'}`}>
                              {user.role}
                            </span>
                            {user.active === false && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-400">
                                Inactive
                              </span>
                            )}
                          </div>
                          {user.lastEditedAt && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 italic">
                              <Info size={10} />
                              Last edited by: {user.lastEditedBy} · {new Date(user.lastEditedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {new Date(user.lastEditedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {user.role === 'DENTIST' && (
                              <button onClick={() => { playClick(); setToggleConfirm(user); }}
                                className={`p-2 rounded-lg transition-colors ${user.active === false ? 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-500' : 'hover:bg-amber-50 text-slate-400 hover:text-amber-500'}`}
                                title={user.active === false ? 'Activate dentist' : 'Deactivate dentist'}>
                                <Power size={15} />
                              </button>
                            )}
                            <button onClick={() => { playClick(); setEditUser(user); setModalOpen(true); }}
                              className="p-2 hover:bg-[#f0f5ff] rounded-lg text-slate-400 hover:text-[#004aad] transition-colors"
                              title="Edit user">
                              <Edit2 size={15} />
                            </button>
                            {user.role !== 'DENTIST' && (
                              <button onClick={() => { playClick(); setDeleteConfirm(user); }}
                                className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                                title="Delete user">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {modalOpen && (
          <UserModal user={editUser} onClose={() => { setModalOpen(false); setEditUser(null); }} onSave={handleSave} />
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={24} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Delete User</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Active Confirmation */}
        {toggleConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setToggleConfirm(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${toggleConfirm.active === false ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                  <Power size={24} className={toggleConfirm.active === false ? 'text-emerald-500' : 'text-amber-500'} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{toggleConfirm.active === false ? 'Activate User' : 'Deactivate User'}</h3>
                <p className="text-sm text-slate-500 mt-2">
                  {toggleConfirm.active === false
                    ? <>Are you sure you want to activate <strong>{toggleConfirm.name}</strong>? They will regain full access to the system.</>
                    : <>Are you sure you want to deactivate <strong>{toggleConfirm.name}</strong>? They will be hidden from the kiosk dentist selection and won't be able to log in.</>
                  }
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setToggleConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => { handleToggleActive(toggleConfirm); setToggleConfirm(null); }}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors ${toggleConfirm.active === false ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                  {toggleConfirm.active === false ? 'Activate' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user;
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'PATIENT',
    password: '',
    dob: user?.patient?.dob ? new Date(user.patient.dob).toISOString().split('T')[0] : '',
    gender: user?.patient?.gender || '',
    bloodType: user?.patient?.bloodType || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('role', form.role);
      if (form.phone) fd.append('phone', form.phone);
      if (form.password) fd.append('password', form.password);
      if (form.role === 'PATIENT') {
        if (form.dob) fd.append('dob', form.dob);
        if (form.gender) fd.append('gender', form.gender);
        if (form.bloodType) fd.append('bloodType', form.bloodType);
      }
      if (avatarFile) fd.append('avatar', avatarFile);

      let res;
      if (isEdit) {
        res = await api.put(`/admin-users/${user.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/admin-users', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      playSuccess();
      onSave(res.data);
    } catch (err) {
      playError();
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-xl border border-rose-100 flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-200" />
              ) : (
                <div className={`w-20 h-20 bg-gradient-to-br ${getAvatarColor(form.name)} text-white rounded-2xl flex items-center justify-center text-2xl font-bold`}>
                  {form.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </div>
            <div>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold text-[#004aad] hover:text-[#003782] transition-colors">
                {avatarPreview ? 'Change Photo' : 'Upload Photo'}
              </button>
              <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG · Max 5MB</p>
              {avatarPreview && (
                <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  className="text-[11px] text-rose-500 hover:text-rose-600 mt-0.5 transition-colors">
                  Remove photo
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name */}
          <Input label="Full Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Juan Dela Cruz" />

          {/* Email */}
          <Input label="Email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />

          {/* Phone */}
          <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="09171234567" />

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004aad]/20 focus:border-[#4a85d6] outline-none transition-all">
              <option value="PATIENT">Patient</option>
              <option value="DENTIST">Dentist</option>
              <option value="ASSISTANT">Assistant</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              {isEdit ? 'New Password (leave blank to keep)' : 'Password'}
            </label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required={!isEdit}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004aad]/20 focus:border-[#4a85d6] outline-none transition-all pr-10"
                placeholder={isEdit ? '••••••••' : 'Default: password123'} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Patient-only fields */}
          {form.role === 'PATIENT' && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Birthday</label>
                <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004aad]/20 focus:border-[#4a85d6] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004aad]/20 focus:border-[#4a85d6] outline-none transition-all">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Blood Type</label>
                <select value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004aad]/20 focus:border-[#4a85d6] outline-none transition-all">
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Consent (edit only) */}
          {isEdit && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <input
                type="checkbox"
                id="edit-consent"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="edit-consent" className="text-xs text-amber-800 leading-relaxed">
                I confirm that I have permission to edit this user's information and understand the changes will be logged.
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || (isEdit && !consentChecked)}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#1a5fb4] to-[#003782] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
      <input {...props} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004aad]/20 focus:border-[#4a85d6] outline-none transition-all" />
    </div>
  );
}
