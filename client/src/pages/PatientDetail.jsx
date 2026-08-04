import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api, { authUrl } from '../lib/api';
import { SkeletonLine, SkeletonCircle } from '../components/Skeleton';
import Tooltip from '../components/Tooltip';
import { AlertTriangle, Award, Star, TrendingUp, Gift, Check, ArrowLeft, Plus, Pencil, Trash2, X, Save, Calendar, Stethoscope, Pill, Image, Smile, Wallet, CreditCard } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { playClick, playSuccess, playError } from '../lib/sounds';
import { rankInfo } from '../lib/ranks';

const TOOTH_STATUSES = ['HEALTHY', 'FILLING', 'CROWN', 'DECAYED', 'MISSING', 'IMPLANT', 'BRIDGE', 'TREATED'];
const STATUS_COLORS = {
  HEALTHY: 'bg-green-200 text-green-800 border-green-300',
  FILLING: 'bg-blue-200 text-blue-800 border-blue-300',
  CROWN: 'bg-violet-200 text-violet-800 border-violet-300',
  DECAYED: 'bg-red-200 text-red-800 border-red-300',
  MISSING: 'bg-gray-300 text-gray-700 border-gray-400',
  IMPLANT: 'bg-orange-200 text-orange-800 border-orange-300',
  BRIDGE: 'bg-pink-200 text-pink-800 border-pink-300',
  TREATED: 'bg-emerald-200 text-emerald-800 border-emerald-300',
};

const STATUS_BUTTON_COLORS = {
  HEALTHY: { base: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200', active: 'bg-green-600 text-white border-green-600 shadow-green-200' },
  FILLING: { base: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200', active: 'bg-blue-600 text-white border-blue-600 shadow-blue-200' },
  CROWN: { base: 'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200', active: 'bg-violet-600 text-white border-violet-600 shadow-violet-200' },
  DECAYED: { base: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200', active: 'bg-red-600 text-white border-red-600 shadow-red-200' },
  MISSING: { base: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200', active: 'bg-gray-600 text-white border-gray-600 shadow-gray-200' },
  IMPLANT: { base: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200', active: 'bg-orange-600 text-white border-orange-600 shadow-orange-200' },
  BRIDGE: { base: 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200', active: 'bg-pink-600 text-white border-pink-600 shadow-pink-200' },
  TREATED: { base: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200', active: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200' },
};

const PRESCRIPTION_FREQUENCY = ['Once daily', 'Twice daily', 'Three times daily', 'Every 4 hours', 'As needed', 'Before meals', 'After meals'];

export default function PatientDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [awarding, setAwarding] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [editTreatment, setEditTreatment] = useState(null);
  const [treatmentForm, setTreatmentForm] = useState({ procedure: '', description: '', notes: '', cost: '', toothId: '' });

  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editPrescription, setEditPrescription] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({ medication: '', dosage: '', frequency: 'Once daily', duration: '', notes: '', treatmentId: '' });

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [toothNote, setToothNote] = useState('');

  const { data: patient, isLoading, isError, refetch } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/patients/${id}`).then(r => r.data),
  });

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty', id],
    queryFn: () => api.get(`/loyalty/patient/${id}`).then(r => r.data),
    enabled: activeTab === 'rewards' && !!id,
  });

  const { data: patientBadges = [] } = useQuery({
    queryKey: ['patient-badges', id],
    queryFn: () => api.get(`/badges/patient/${id}`).then(r => r.data),
    enabled: activeTab === 'rewards' && !!id,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/badges').then(r => r.data),
    enabled: activeTab === 'rewards' && !!id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['patient-payments', id],
    queryFn: () => api.get(`/payments/patient/${id}`).then(r => r.data),
    enabled: activeTab === 'payments' && !!id,
  });

  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'CASH', appointmentId: '' });

  const paymentMutation = useMutation({
    mutationFn: (body) => api.post('/payments', { ...body, patientId: id }),
    onSuccess: () => {
      toast.success('Payment recorded');
      playSuccess();
      setPaymentForm({ amount: '', method: 'CASH', appointmentId: '' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to record payment');
      playError();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-payments', id] });
    },
  });

  const toothMutation = useMutation({
    mutationFn: ({ toothNumber, status, notes }) =>
      api.put(`/patients/${id}/teeth/${toothNumber}`, { status, notes }),
    onMutate: async ({ toothNumber, status, notes }) => {
      await queryClient.cancelQueries({ queryKey: ['patient', id] });
      const previous = queryClient.getQueryData(['patient', id]);
      queryClient.setQueryData(['patient', id], (old) => {
        if (!old) return old;
        const existingIndex = (old.teeth || []).findIndex(t => t.toothNumber === toothNumber);
        const newTeeth = [...(old.teeth || [])];
        if (existingIndex >= 0) {
          newTeeth[existingIndex] = { ...newTeeth[existingIndex], status, notes };
        } else {
          newTeeth.push({ toothNumber, status, notes, id: `temp-${toothNumber}` });
        }
        return { ...old, teeth: newTeeth };
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['patient', id], context.previous);
      toast.error('Failed to update tooth');
      playError();
    },
    onSuccess: (data, variables) => {
      toast.success(`Tooth #${variables.toothNumber} updated to ${variables.status}`);
      playSuccess();
      setSelectedTooth(null);
      setToothNote('');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
  });

  const treatmentMutation = useMutation({
    mutationFn: ({ editId, data }) => {
      if (editId) return api.put(`/treatments/${editId}`, data);
      return api.post('/treatments', { ...data, patientId: id });
    },
    onMutate: async ({ editId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['patient', id] });
      const previous = queryClient.getQueryData(['patient', id]);
      queryClient.setQueryData(['patient', id], (old) => {
        if (!old) return old;
        if (editId) {
          return {
            ...old,
            treatments: (old.treatments || []).map(t =>
              t.id === editId ? { ...t, ...data } : t
            ),
          };
        }
        return {
          ...old,
          treatments: [{ id: `temp-${Date.now()}`, ...data, patientId: id, dentist: { name: 'You' } }, ...(old.treatments || [])],
        };
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['patient', id], context.previous);
      toast.error(err.response?.data?.error || 'Failed to save treatment');
      playError();
    },
    onSuccess: (data, variables) => {
      toast.success(variables.editId ? 'Treatment updated' : 'Treatment added');
      playSuccess();
      setShowTreatmentForm(false);
      setEditTreatment(null);
      setTreatmentForm({ procedure: '', description: '', notes: '', cost: '', toothId: '' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
  });

  const deleteTreatmentMutation = useMutation({
    mutationFn: (treatmentId) => api.delete(`/treatments/${treatmentId}`),
    onMutate: async (treatmentId) => {
      await queryClient.cancelQueries({ queryKey: ['patient', id] });
      const previous = queryClient.getQueryData(['patient', id]);
      queryClient.setQueryData(['patient', id], (old) => {
        if (!old) return old;
        return { ...old, treatments: (old.treatments || []).filter(t => t.id !== treatmentId) };
      });
      return { previous };
    },
    onError: (err, treatmentId, context) => {
      queryClient.setQueryData(['patient', id], context.previous);
      toast.error('Failed to delete treatment');
    },
    onSuccess: () => {
      toast.success('Treatment deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
  });

  const prescriptionMutation = useMutation({
    mutationFn: ({ editId, data }) => {
      if (editId) return api.put(`/prescriptions/${editId}`, data);
      return api.post('/prescriptions', { ...data, patientId: id });
    },
    onMutate: async ({ editId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['patient', id] });
      const previous = queryClient.getQueryData(['patient', id]);
      queryClient.setQueryData(['patient', id], (old) => {
        if (!old) return old;
        if (editId) {
          return {
            ...old,
            prescriptions: (old.prescriptions || []).map(p =>
              p.id === editId ? { ...p, ...data } : p
            ),
          };
        }
        return {
          ...old,
          prescriptions: [{ id: `temp-${Date.now()}`, ...data, patientId: id }, ...(old.prescriptions || [])],
        };
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['patient', id], context.previous);
      toast.error(err.response?.data?.error || 'Failed to save prescription');
      playError();
    },
    onSuccess: (data, variables) => {
      toast.success(variables.editId ? 'Prescription updated' : 'Prescription added');
      playSuccess();
      setShowPrescriptionForm(false);
      setEditPrescription(null);
      setPrescriptionForm({ medication: '', dosage: '', frequency: 'Once daily', duration: '', notes: '', treatmentId: '' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
  });

  const deletePrescriptionMutation = useMutation({
    mutationFn: (prescriptionId) => api.delete(`/prescriptions/${prescriptionId}`),
    onMutate: async (prescriptionId) => {
      await queryClient.cancelQueries({ queryKey: ['patient', id] });
      const previous = queryClient.getQueryData(['patient', id]);
      queryClient.setQueryData(['patient', id], (old) => {
        if (!old) return old;
        return { ...old, prescriptions: (old.prescriptions || []).filter(p => p.id !== prescriptionId) };
      });
      return { previous };
    },
    onError: (err, prescriptionId, context) => {
      queryClient.setQueryData(['patient', id], context.previous);
      toast.error('Failed to delete prescription');
    },
    onSuccess: () => {
      toast.success('Prescription deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
  });

  const awardBadgeMutation = useMutation({
    mutationFn: (badgeId) => api.post('/badges/award', { patientId: id, badgeId }),
    onSuccess: () => {
      toast.success('Badge awarded!');
      playSuccess();
    },
    onError: () => {
      toast.error('Failed to award badge');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty', id] });
      queryClient.invalidateQueries({ queryKey: ['patient-badges', id] });
    },
  });

  const handleToothUpdate = (toothNumber, status) => {
    playClick();
    toothMutation.mutate({ toothNumber, status, notes: toothNote });
  };

  const submitTreatment = () => {
    playClick();
    const data = {
      procedure: treatmentForm.procedure,
      description: treatmentForm.description,
      notes: treatmentForm.notes,
      cost: treatmentForm.cost ? parseFloat(treatmentForm.cost) : null,
      toothId: treatmentForm.toothId || null,
    };
    treatmentMutation.mutate({ editId: editTreatment?.id, data });
  };

  const handleDeleteTreatment = (treatmentId) => {
    if (!confirm('Delete this treatment?')) return;
    deleteTreatmentMutation.mutate(treatmentId);
  };

  const submitPrescription = () => {
    playClick();
    prescriptionMutation.mutate({ editId: editPrescription?.id, data: prescriptionForm });
  };

  const handleDeletePrescription = (prescriptionId) => {
    if (!confirm('Delete this prescription?')) return;
    deletePrescriptionMutation.mutate(prescriptionId);
  };

  const awardBadge = (badgeId) => {
    setAwarding(badgeId);
    awardBadgeMutation.mutate(badgeId);
    setAwarding(null);
  };

  if (isLoading) return (
    <Layout>
      <Header title="Patient Detail" />
      <div className="p-6 space-y-6">
        <SkeletonLine width="6rem" height="0.875rem" />
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <SkeletonCircle size="4rem" />
            <div className="space-y-2">
              <SkeletonLine width="10rem" height="1.25rem" />
              <SkeletonLine width="14rem" height="0.75rem" />
            </div>
            <div className="ml-auto space-y-2">
              <SkeletonLine width="6rem" height="0.75rem" />
              <SkeletonLine width="4rem" height="0.75rem" />
              <SkeletonLine width="8rem" height="0.75rem" />
            </div>
          </div>
        </div>
        <div className="flex gap-1 border-b border-slate-200">
          {Array.from({ length: 7 }, (_, i) => (
            <SkeletonLine key={i} width="4.5rem" height="2rem" className="rounded-t-lg" />
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonLine width="5rem" height="0.625rem" />
                <SkeletonLine width="10rem" height="0.875rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );

  if (isError) return (
    <Layout>
      <Header title="Patient Detail" />
      <div className="p-6 text-center">
        <AlertTriangle size={36} className="mx-auto mb-3 text-red-400" />
        <p className="text-sm text-red-600 mb-3">Failed to load patient details</p>
        <button onClick={refetch} className="text-sm text-[#0F766E] hover:text-[#064E3B] font-medium">Retry</button>
      </div>
    </Layout>
  );

  const tabs = ['overview', 'teeth', 'appointments', 'treatments', 'prescriptions', 'x-rays', 'payments', 'rewards'];

  return (
    <Layout>
      <Header title={`Patient: ${patient.user?.name}`} />
      <div className="p-6">
        <button onClick={() => navigate('/records')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0F766E] transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Records
        </button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            {patient.user?.avatar ? (
              <img src={authUrl(patient.user.avatar)} alt={patient.user?.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-[#99F6E4]" />
            ) : (
              <div className="w-16 h-16 bg-[#99F6E4] text-[#064E3B] rounded-full flex items-center justify-center text-2xl font-bold">
                {patient.user?.name?.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{patient.user?.name}</h2>
              <p className="text-sm text-gray-500">{patient.user?.email} · {patient.user?.phone || 'No phone'}</p>
            </div>
            <div className="ml-auto text-right text-sm text-gray-600">
              <div>Blood Type: <span className="font-medium">{patient.bloodType || 'N/A'}</span></div>
              <div>Gender: <span className="font-medium">{patient.gender || 'N/A'}</span></div>
              <div>Allergies: <span className="font-medium text-red-600">{patient.allergies || 'None'}</span></div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-slate-50 text-[#0D6D65] border-b-2 border-[#0F766E]' : 'text-gray-500 hover:text-[#0F766E]'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              <InfoItem label="Address" value={patient.address || 'N/A'} />
              <InfoItem label="Emergency Contact" value={patient.emergencyContact || 'N/A'} />
              <InfoItem label="Insurance" value={patient.insuranceInfo || 'N/A'} />
              <InfoItem label="Medical History" value={patient.medicalHistory || 'None'} />
            </div>
          )}

          {activeTab === 'teeth' && (() => {
            const allTeeth = Array.from({ length: 32 }, (_, i) => {
              const dbTooth = patient.teeth?.find(t => t.toothNumber === i + 1);
              return dbTooth || { toothNumber: i + 1, status: 'HEALTHY', id: `default-${i + 1}` };
            });
            return (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Interactive Tooth Chart</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Click a tooth to update its status</p>
              <div className="flex gap-2 items-start mb-4">
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-8 gap-1 mb-3">
                    {allTeeth.map(tooth => (
                      <div key={tooth.id}
                        onClick={() => { setSelectedTooth(tooth); setToothNote(tooth.notes || ''); playClick(); }}
                        className={`h-12 min-w-0 rounded-lg flex flex-col items-center justify-center font-bold cursor-pointer transition-all hover:scale-110 ${
                          selectedTooth?.toothNumber === tooth.toothNumber ? 'ring-2 ring-[#0F766E] ring-offset-2 scale-110' : ''
                        } ${STATUS_COLORS[tooth.status] || 'bg-[#F0FDFA] text-[#0D6D65] border border-slate-200'}`}>
                        <span className="text-xs leading-none">#{tooth.toothNumber}</span>
                        <span className="text-[9px] font-normal opacity-70 leading-none mt-0.5">{tooth.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] mb-3">
                    {TOOTH_STATUSES.map(s => (
                      <span key={s} className="flex items-center gap-1">
                        <span className={`w-3 h-3 rounded border ${STATUS_COLORS[s]?.split(' ')[0]}`} /> {s}
                      </span>
                    ))}
                  </div>
                  {selectedTooth && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${STATUS_COLORS[selectedTooth.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          #{selectedTooth.toothNumber}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Update Tooth Status</h4>
                          <p className="text-xs text-slate-400">Currently: {selectedTooth.status}</p>
                        </div>
                        <Tooltip content="Close">
                          <button onClick={() => { setSelectedTooth(null); setToothNote(''); }}
                            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                            <X size={16} />
                          </button>
                        </Tooltip>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {TOOTH_STATUSES.map(s => {
                          const colors = STATUS_BUTTON_COLORS[s];
                          const isActive = selectedTooth.status === s;
                          return (
                            <button key={s} onClick={() => handleToothUpdate(selectedTooth.toothNumber, s)}
                              className={`px-2 py-2 text-[11px] font-semibold rounded-xl border-2 transition-all duration-200 ${
                                isActive
                                  ? `${colors.active} shadow-md scale-[1.02]`
                                  : `${colors.base}`
                              }`}>
                              {s}
                            </button>
                          );
                        })}
                      </div>
                      <textarea value={toothNote} onChange={(e) => setToothNote(e.target.value)}
                        placeholder="Notes (optional)" rows={2}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent resize-none" />
                    </div>
                  )}
                </div>
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shrink-0 self-stretch">
                  <img src="/images/numbering of tooth.png" alt="Tooth Numbering Guide" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
            );
          })()}

          {activeTab === 'appointments' && (
            <div className="space-y-3">
              {patient.appointments?.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar size={20} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium mb-1">No appointments yet</p>
                  <p className="text-slate-400 text-xs">This patient has no appointment history</p>
                </div>
              ) :
                patient.appointments?.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{new Date(a.date).toLocaleDateString()} at {a.time}</div>
                      <div className="text-xs text-gray-500">{a.reason}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      a.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                      'bg-[#F0FDFA] text-[#0D6D65]'
                    }`}>{a.status}</span>
                  </div>
                ))
              }
            </div>
          )}

          {activeTab === 'treatments' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Treatments</h3>
                <button onClick={() => { setShowTreatmentForm(true); setEditTreatment(null); setTreatmentForm({ procedure: '', description: '', notes: '', cost: '', toothId: '' }); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0F766E] text-white text-sm rounded-lg hover:bg-[#0D6D65] transition-colors">
                  <Plus size={14} /> Add Treatment
                </button>
              </div>
              {patient.treatments?.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Stethoscope size={20} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium mb-1">No treatments yet</p>
                  <p className="text-slate-400 text-xs">Add a treatment record for this patient</p>
                </div>
              ) :
                <div className="space-y-3">
                  {patient.treatments?.map(t => (
                    <div key={t.id} className="p-3 bg-slate-50 rounded-lg flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{t.procedure}</div>
                        <div className="text-xs text-gray-500">{t.description} · by {t.dentist?.name}</div>
                        {t.tooth && <div className="text-xs text-gray-400 mt-1">Tooth #{t.tooth.toothNumber}</div>}
                        {t.notes && <div className="text-xs text-gray-500 mt-1 italic">{t.notes}</div>}
                        {t.cost && <div className="text-xs text-green-600 mt-1 font-medium">₱{t.cost}</div>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip content="Edit">
                          <button onClick={() => {
                            setEditTreatment(t);
                            setTreatmentForm({ procedure: t.procedure, description: t.description || '', notes: t.notes || '', cost: t.cost || '', toothId: t.toothId || '' });
                            setShowTreatmentForm(true);
                          }} className="p-1.5 text-gray-400 hover:text-[#0F766E] rounded-lg hover:bg-white transition-colors">
                            <Pencil size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete">
                          <button onClick={() => handleDeleteTreatment(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              }

              {showTreatmentForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowTreatmentForm(false)}>
                  <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-slate-900">{editTreatment ? 'Edit Treatment' : 'Add Treatment'}</h3>
                      <Tooltip content="Close">
                        <button onClick={() => setShowTreatmentForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                      </Tooltip>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Procedure *</label>
                        <select value={treatmentForm.procedure} onChange={(e) => setTreatmentForm({ ...treatmentForm, procedure: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]">
                          <option value="">Select procedure</option>
                          <option value="Dental Cleaning">Dental Cleaning</option>
                          <option value="Filling">Filling</option>
                          <option value="Root Canal">Root Canal</option>
                          <option value="Extraction">Extraction</option>
                          <option value="Crown">Crown</option>
                          <option value="Bridge">Bridge</option>
                          <option value="Implant">Implant</option>
                          <option value="Whitening">Whitening</option>
                          <option value="Veneer">Veneer</option>
                          <option value="Braces/Orthodontics">Braces/Orthodontics</option>
                          <option value="Dentures">Dentures</option>
                          <option value="Sealant">Sealant</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <input type="text" value={treatmentForm.description} onChange={(e) => setTreatmentForm({ ...treatmentForm, description: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Brief description" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cost (₱)</label>
                        <input type="number" value={treatmentForm.cost} onChange={(e) => setTreatmentForm({ ...treatmentForm, cost: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                        <textarea value={treatmentForm.notes} onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" rows={2} placeholder="Additional notes" />
                      </div>
                      <button onClick={submitTreatment}
                        disabled={!treatmentForm.procedure}
                        className="w-full py-2 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0D6D65] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                        <Save size={14} /> {editTreatment ? 'Update Treatment' : 'Add Treatment'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Prescriptions</h3>
                <button onClick={() => { setShowPrescriptionForm(true); setEditPrescription(null); setPrescriptionForm({ medication: '', dosage: '', frequency: 'Once daily', duration: '', notes: '', treatmentId: '' }); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0F766E] text-white text-sm rounded-lg hover:bg-[#0D6D65] transition-colors">
                  <Plus size={14} /> Add Prescription
                </button>
              </div>
              {patient.prescriptions?.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Pill size={20} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium mb-1">No prescriptions yet</p>
                  <p className="text-slate-400 text-xs">Prescriptions for this patient will appear here</p>
                </div>
              ) :
                <div className="space-y-3">
                  {patient.prescriptions?.map(p => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-lg flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{p.medication}</div>
                        <div className="text-xs text-gray-500">{p.dosage} · {p.frequency} · {p.duration}</div>
                        {p.treatment && <div className="text-xs text-gray-400 mt-1">Linked to: {p.treatment.procedure}</div>}
                        {p.notes && <div className="text-xs text-gray-500 mt-1 italic">{p.notes}</div>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip content="Edit">
                          <button onClick={() => {
                            setEditPrescription(p);
                            setPrescriptionForm({ medication: p.medication, dosage: p.dosage, frequency: p.frequency, duration: p.duration, notes: p.notes || '', treatmentId: p.treatmentId || '' });
                            setShowPrescriptionForm(true);
                          }} className="p-1.5 text-gray-400 hover:text-[#0F766E] rounded-lg hover:bg-white transition-colors">
                            <Pencil size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete">
                          <button onClick={() => handleDeletePrescription(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              }

              {showPrescriptionForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowPrescriptionForm(false)}>
                  <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-slate-900">{editPrescription ? 'Edit Prescription' : 'Add Prescription'}</h3>
                      <Tooltip content="Close">
                        <button onClick={() => setShowPrescriptionForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                      </Tooltip>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Medication *</label>
                        <input type="text" value={prescriptionForm.medication} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="e.g. Amoxicillin 500mg" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Dosage *</label>
                          <input type="text" value={prescriptionForm.dosage} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="e.g. 1 tablet" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Duration *</label>
                          <input type="text" value={prescriptionForm.duration} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="e.g. 7 days" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Frequency *</label>
                        <select value={prescriptionForm.frequency} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]">
                          {PRESCRIPTION_FREQUENCY.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                        <textarea value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" rows={2} placeholder="Special instructions" />
                      </div>
                      <button onClick={submitPrescription}
                        disabled={!prescriptionForm.medication || !prescriptionForm.dosage || !prescriptionForm.duration}
                        className="w-full py-2 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0D6D65] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                        <Save size={14} /> {editPrescription ? 'Update Prescription' : 'Add Prescription'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'x-rays' && (
            <div>
              {patient.xrayImages?.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Image size={20} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium mb-1">No X-ray images yet</p>
                  <p className="text-slate-400 text-xs">Upload images from the X-Ray Analysis module</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patient.xrayImages?.map(img => (
                    <div key={img.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <div className="aspect-square bg-gray-100">
                        <img src={authUrl(`/${img.filePath}`)} alt="X-Ray" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">{new Date(img.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs px-2 py-0.5 bg-[#F0FDFA] text-[#0D6D65] rounded-full">{img.fileType}</span>
                        </div>
                        {img.analysis?.findings?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {img.analysis.findings.slice(0, 2).map((f, i) => (
                              <div key={i} className="text-xs p-2 bg-amber-50 rounded border border-amber-100">
                                <div className="font-medium text-amber-800">{f.area}</div>
                                <div className="text-gray-600 truncate">{f.description}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Wallet size={16} className="text-[#0F766E]" /> Record Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Amount (₱)</label>
                    <input type="number" min="0" step="0.01" value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E]/30 focus:outline-none"
                      placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Method</label>
                    <select value={paymentForm.method}
                      onChange={(e) => setPaymentForm(p => ({ ...p, method: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#0F766E]/30 focus:outline-none">
                      {['CASH', 'GCASH', 'CARD', 'HMO', 'PHILHEALTH'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Appointment (optional)</label>
                    <select value={paymentForm.appointmentId}
                      onChange={(e) => setPaymentForm(p => ({ ...p, appointmentId: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#0F766E]/30 focus:outline-none">
                      <option value="">None</option>
                      {patient.appointments?.map(a => (
                        <option key={a.id} value={a.id}>{new Date(a.date).toLocaleDateString()} — {a.reason}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => paymentMutation.mutate({ amount: parseFloat(paymentForm.amount), method: paymentForm.method, appointmentId: paymentForm.appointmentId || undefined })}
                    disabled={paymentMutation.isPending || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0D6D65] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <CreditCard size={14} /> {paymentMutation.isPending ? 'Saving...' : 'Record'}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-3">Payment History</h3>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Wallet size={20} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium mb-1">No payments recorded</p>
                    <p className="text-slate-400 text-xs">Recorded payments will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-3 font-semibold">Date</th>
                          <th className="px-4 py-3 font-semibold">Method</th>
                          <th className="px-4 py-3 font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-700">{new Date(p.paidAt).toLocaleDateString()} {new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full bg-[#F0FDFA] text-[#0D6D65] text-xs font-medium">{p.method}</span>
                            </td>
                            <td className="px-4 py-3 font-medium text-green-600">₱{p.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#0F766E] to-[#0F766E] rounded-xl p-5 text-white flex items-center gap-4">
                  <img src={rankInfo(loyalty?.tier).image} alt={rankInfo(loyalty?.tier).label} className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Star size={20} /><span className="font-medium">Loyalty Points</span></div>
                    <div className="text-3xl font-bold">{loyalty?.points || 0}</div>
                    <div className="text-[#F0FDFA] text-sm mt-1">Tier: {loyalty?.tier || 'Bronze'}</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2"><Award size={20} /><span className="font-medium">Badges Earned</span></div>
                  <div className="text-3xl font-bold">{patientBadges.length}</div>
                  <div className="text-amber-100 text-sm mt-1">of {allBadges.length} available</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2"><TrendingUp size={20} /><span className="font-medium">Next Tier</span></div>
                  <div className="text-lg font-bold mt-1">
                    {loyalty?.nextTier ? `${loyalty.nextTier} (${loyalty.nextTier === 'Silver' ? 50 : loyalty.nextTier === 'Gold' ? 200 : 500} pts)` : 'Max Tier!'}
                  </div>
                  <div className="text-green-100 text-sm mt-1">
                    {loyalty?.pointsToNextTier > 0 && `${loyalty.pointsToNextTier} pts to go`}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-3">Earned Badges</h3>
                {patientBadges.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Award size={20} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium mb-1">No badges earned yet</p>
                    <p className="text-slate-400 text-xs">Badges are awarded as patients complete milestones</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {patientBadges.map(pb => (
                      <div key={pb.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-2">{pb.badge.icon}</div>
                        <div className="font-medium text-slate-900 text-sm">{pb.badge.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{pb.badge.description}</div>
                        <div className="text-xs text-amber-600 mt-2">{new Date(pb.earnedAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-3">Award Badge</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {allBadges.map(b => {
                    const earned = patientBadges.some(pb => pb.badgeId === b.id);
                    return (
                      <button key={b.id} onClick={() => !earned && awardBadge(b.id)} disabled={earned || awarding === b.id}
                        className={`rounded-xl p-4 text-center transition-all ${earned ? 'bg-green-50 border-2 border-green-300 cursor-default' : 'bg-gray-50 border border-gray-200 hover:border-[#14B8A6] hover:bg-slate-50 cursor-pointer'}`}>
                        <div className="text-3xl mb-2">{b.icon}</div>
                        <div className="font-medium text-slate-900 text-sm">{b.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{b.description}</div>
                        {earned ? (
                          <div className="flex items-center justify-center gap-1 text-green-600 text-xs mt-2"><Check size={12} /> Earned</div>
                        ) : (
                          <div className="text-xs text-[#0F766E] mt-2">{b.points || b.threshold} pts</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loyalty?.transactions?.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">Transaction History</h3>
                  <div className="space-y-2">
                    {loyalty.transactions.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Gift size={14} className="text-[#0F766E]" />
                          <span className="text-sm text-slate-900">{t.description}</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">+{t.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-slate-900 mt-1">{value}</div>
    </div>
  );
}
