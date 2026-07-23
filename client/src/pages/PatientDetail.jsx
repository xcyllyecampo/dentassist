import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api, { authUrl } from '../lib/api';
import Spinner from '../components/Spinner';
import { AlertTriangle, Award, Star, TrendingUp, Gift, Check, ArrowLeft, Plus, Pencil, Trash2, X, Save, Calendar, Stethoscope, Pill, Image, Smile } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { playClick, playSuccess, playError } from '../lib/sounds';

const TOOTH_STATUSES = ['HEALTHY', 'FILLING', 'CROWN', 'DECAYED', 'MISSING', 'IMPLANT', 'BRIDGE', 'TREATED'];
const STATUS_COLORS = {
  HEALTHY: 'bg-green-100 text-green-700 border-green-200',
  FILLING: 'bg-teal-100 text-teal-700 border-teal-200',
  CROWN: 'bg-purple-100 text-purple-700 border-purple-200',
  DECAYED: 'bg-red-100 text-red-700 border-red-200',
  MISSING: 'bg-gray-200 text-gray-500 border-gray-300',
  IMPLANT: 'bg-amber-100 text-amber-700 border-amber-200',
  BRIDGE: 'bg-pink-100 text-pink-700 border-pink-200',
  TREATED: 'bg-teal-100 text-teal-700 border-teal-200',
};

const PRESCRIPTION_FREQUENCY = ['Once daily', 'Twice daily', 'Three times daily', 'Every 4 hours', 'As needed', 'Before meals', 'After meals'];

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loyalty, setLoyalty] = useState(null);
  const [badges, setBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [awarding, setAwarding] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [editTreatment, setEditTreatment] = useState(null);
  const [treatmentForm, setTreatmentForm] = useState({ procedure: '', description: '', notes: '', cost: '', toothId: '' });

  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editPrescription, setEditPrescription] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({ medication: '', dosage: '', frequency: 'Once daily', duration: '', notes: '', treatmentId: '' });

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [toothNote, setToothNote] = useState('');

  const fetchPatient = () => {
    setLoading(true);
    setError(null);
    api.get(`/patients/${id}`)
      .then(res => setPatient(res.data))
      .catch(() => setError('Failed to load patient details'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPatient(); }, [id]);

  useEffect(() => {
    if (activeTab === 'rewards' && id) {
      api.get(`/loyalty/patient/${id}`).then(res => setLoyalty(res.data)).catch(() => {});
      api.get(`/badges/patient/${id}`).then(res => setBadges(res.data)).catch(() => {});
      api.get('/badges').then(res => setAllBadges(res.data)).catch(() => {});
    }
  }, [activeTab, id]);

  const awardBadge = async (badgeId) => {
    setAwarding(badgeId);
    try {
      await api.post('/badges/award', { patientId: id, badgeId });
      toast.success('Badge awarded!');
      const [loyaltyRes, badgesRes] = await Promise.all([
        api.get(`/loyalty/patient/${id}`),
        api.get(`/badges/patient/${id}`),
      ]);
      setLoyalty(loyaltyRes.data);
      setBadges(badgesRes.data);
    } catch (e) {
      toast.error('Failed to award badge');
    }
    setAwarding(null);
  };

  const updateToothStatus = async (toothNumber, status) => {
    playClick();
    try {
      await api.put(`/patients/${id}/teeth/${toothNumber}`, { status, notes: toothNote });
      toast.success(`Tooth #${toothNumber} updated to ${status}`);
      playSuccess();
      fetchPatient();
      setSelectedTooth(null);
      setToothNote('');
    } catch (e) {
      toast.error('Failed to update tooth');
      playError();
    }
  };

  const submitTreatment = async () => {
    playClick();
    try {
      const data = {
        ...treatmentForm,
        cost: treatmentForm.cost ? parseFloat(treatmentForm.cost) : null,
        toothId: treatmentForm.toothId || null,
      };
      if (editTreatment) {
        await api.put(`/treatments/${editTreatment.id}`, data);
        toast.success('Treatment updated');
      } else {
        await api.post('/treatments', { ...data, patientId: id });
        toast.success('Treatment added');
      }
      playSuccess();
      setShowTreatmentForm(false);
      setEditTreatment(null);
      setTreatmentForm({ procedure: '', description: '', notes: '', cost: '', toothId: '' });
      fetchPatient();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save treatment');
      playError();
    }
  };

  const deleteTreatment = async (treatmentId) => {
    if (!confirm('Delete this treatment?')) return;
    try {
      await api.delete(`/treatments/${treatmentId}`);
      toast.success('Treatment deleted');
      fetchPatient();
    } catch (e) {
      toast.error('Failed to delete treatment');
    }
  };

  const submitPrescription = async () => {
    playClick();
    try {
      if (editPrescription) {
        await api.put(`/prescriptions/${editPrescription.id}`, prescriptionForm);
        toast.success('Prescription updated');
      } else {
        await api.post('/prescriptions', { ...prescriptionForm, patientId: id });
        toast.success('Prescription added');
      }
      playSuccess();
      setShowPrescriptionForm(false);
      setEditPrescription(null);
      setPrescriptionForm({ medication: '', dosage: '', frequency: 'Once daily', duration: '', notes: '', treatmentId: '' });
      fetchPatient();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save prescription');
      playError();
    }
  };

  const deletePrescription = async (prescriptionId) => {
    if (!confirm('Delete this prescription?')) return;
    try {
      await api.delete(`/prescriptions/${prescriptionId}`);
      toast.success('Prescription deleted');
      fetchPatient();
    } catch (e) {
      toast.error('Failed to delete prescription');
    }
  };

  if (loading) return <Layout><Header title="Patient Detail" /><Spinner className="py-20" /></Layout>;
  if (error) return <Layout><Header title="Patient Detail" /><div className="p-6 text-center"><AlertTriangle size={36} className="mx-auto mb-3 text-red-400" /><p className="text-sm text-red-600 mb-3">{error}</p><button onClick={fetchPatient} className="text-sm text-[#0F766E] hover:text-[#064E3B] font-medium">Retry</button></div></Layout>;

  const tabs = ['overview', 'teeth', 'appointments', 'treatments', 'prescriptions', 'x-rays', 'rewards'];

  return (
    <Layout>
      <Header title={`Patient: ${patient.user?.name}`} />
      <div className="p-6">
        <button onClick={() => navigate('/records')}
          className="flex items-center gap-2 px-4 py-2 mb-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
          <ArrowLeft size={16} /> Back to Records
        </button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#99F6E4] text-[#064E3B] rounded-full flex items-center justify-center text-2xl font-bold">
              {patient.user?.name?.charAt(0)}
            </div>
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
                {selectedTooth && (
                  <button onClick={() => { setSelectedTooth(null); setToothNote(''); }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                    <X size={14} /> Clear selection
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">Click a tooth to update its status</p>
              <div className="grid grid-cols-8 gap-2 mb-4">
                {allTeeth.map(tooth => (
                  <div key={tooth.id}
                    onClick={() => { setSelectedTooth(tooth); setToothNote(tooth.notes || ''); playClick(); }}
                    className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-110 ${
                      selectedTooth?.toothNumber === tooth.toothNumber ? 'ring-2 ring-[#0F766E] ring-offset-2 scale-110' : ''
                    } ${STATUS_COLORS[tooth.status] || 'bg-[#F0FDFA] text-[#0D6D65] border border-slate-200'}`}>
                    <span>#{tooth.toothNumber}</span>
                    <span className="text-[10px] font-normal">{tooth.status}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 mb-4">
                <img src="/images/numbering of tooth.png" alt="Tooth Numbering Guide" className="w-full h-auto" />
              </div>
              <div className="flex flex-wrap gap-3 text-xs mb-4">
                {TOOTH_STATUSES.map(s => (
                  <span key={s} className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded border ${STATUS_COLORS[s]?.split(' ')[0]}`} /> {s}
                  </span>
                ))}
              </div>

              {selectedTooth && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
                  <h4 className="font-bold text-slate-900 mb-3">Tooth #{selectedTooth.toothNumber} — Current: {selectedTooth.status}</h4>
                  <textarea value={toothNote} onChange={(e) => setToothNote(e.target.value)}
                    placeholder="Notes (optional)" rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
                  <div className="flex flex-wrap gap-2">
                    {TOOTH_STATUSES.map(s => (
                      <button key={s} onClick={() => updateToothStatus(selectedTooth.toothNumber, s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          selectedTooth.status === s
                            ? 'bg-[#0F766E] text-white border-[#0F766E]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-[#0F766E] hover:text-[#0F766E]'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                        <button onClick={() => {
                          setEditTreatment(t);
                          setTreatmentForm({ procedure: t.procedure, description: t.description || '', notes: t.notes || '', cost: t.cost || '', toothId: t.toothId || '' });
                          setShowTreatmentForm(true);
                        }} className="p-1.5 text-gray-400 hover:text-[#0F766E] rounded-lg hover:bg-white transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteTreatment(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors">
                          <Trash2 size={14} />
                        </button>
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
                      <button onClick={() => setShowTreatmentForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
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
                        <button onClick={() => {
                          setEditPrescription(p);
                          setPrescriptionForm({ medication: p.medication, dosage: p.dosage, frequency: p.frequency, duration: p.duration, notes: p.notes || '', treatmentId: p.treatmentId || '' });
                          setShowPrescriptionForm(true);
                        }} className="p-1.5 text-gray-400 hover:text-[#0F766E] rounded-lg hover:bg-white transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deletePrescription(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors">
                          <Trash2 size={14} />
                        </button>
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
                      <button onClick={() => setShowPrescriptionForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
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

          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#0F766E] to-[#0F766E] rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2"><Star size={20} /><span className="font-medium">Loyalty Points</span></div>
                  <div className="text-3xl font-bold">{loyalty?.points || 0}</div>
                  <div className="text-[#F0FDFA] text-sm mt-1">Tier: {loyalty?.tier || 'Bronze'}</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2"><Award size={20} /><span className="font-medium">Badges Earned</span></div>
                  <div className="text-3xl font-bold">{badges.length}</div>
                  <div className="text-amber-100 text-sm mt-1">of {allBadges.length} available</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2"><TrendingUp size={20} /><span className="font-medium">Next Tier</span></div>
                  <div className="text-lg font-bold mt-1">
                    {loyalty?.tier === 'Bronze' ? 'Silver (50 pts)' : loyalty?.tier === 'Silver' ? 'Gold (200 pts)' : loyalty?.tier === 'Gold' ? 'Platinum (500 pts)' : 'Max Tier!'}
                  </div>
                  <div className="text-green-100 text-sm mt-1">
                    {loyalty?.tier !== 'Platinum' && `${Math.max(0, (loyalty?.tier === 'Bronze' ? 50 : loyalty?.tier === 'Silver' ? 200 : 500) - (loyalty?.points || 0))} pts to go`}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-3">Earned Badges</h3>
                {badges.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Award size={20} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium mb-1">No badges earned yet</p>
                    <p className="text-slate-400 text-xs">Badges are awarded as patients complete milestones</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {badges.map(pb => (
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
                    const earned = badges.some(pb => pb.badgeId === b.id);
                    return (
                      <button key={b.id} onClick={() => !earned && awardBadge(b.id)} disabled={earned || awarding === b.id}
                        className={`rounded-xl p-4 text-center transition-all ${earned ? 'bg-green-50 border-2 border-green-300 cursor-default' : 'bg-gray-50 border border-gray-200 hover:border-[#14B8A6] hover:bg-slate-50 cursor-pointer'}`}>
                        <div className="text-3xl mb-2">{b.icon}</div>
                        <div className="font-medium text-slate-900 text-sm">{b.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{b.description}</div>
                        {earned ? (
                          <div className="flex items-center justify-center gap-1 text-green-600 text-xs mt-2"><Check size={12} /> Earned</div>
                        ) : (
                          <div className="text-xs text-[#0F766E] mt-2">{b.threshold} pts</div>
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
