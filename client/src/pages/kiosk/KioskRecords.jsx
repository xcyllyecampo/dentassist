import { useState, useEffect } from 'react';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { playClick, playError } from '../../lib/sounds';
import Spinner from '../../components/Spinner';
import { AlertTriangle, Calendar, Stethoscope, Pill, Circle, XCircle, Clock, Loader } from 'lucide-react';

const TABS = [
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'treatments', label: 'Treatments', icon: Stethoscope },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'teeth', label: 'Teeth', icon: Circle },
];

export default function KioskRecords() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');
  const [cancellingId, setCancellingId] = useState(null);
  const toast = useToast();

  const fetchPatient = () => {
    setLoading(true);
    setError(null);
    api.get('/patients/me')
      .then(res => setPatient(res.data))
      .catch(() => setError('Failed to load your records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPatient(); }, []);

  const handleCancel = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? The time slot will become available for others.')) return;
    setCancellingId(apptId);
    try {
      await api.put('/appointments/' + apptId + '/cancel');
      setPatient(prev => ({
        ...prev,
        appointments: prev.appointments.map(a =>
          a.id === apptId ? { ...a, status: 'CANCELLED' } : a
        ),
      }));
      toast.success('Appointment cancelled successfully');
    } catch (err) {
      playError();
      toast.error(err.response?.data?.error || 'Failed to cancel appointment');
    }
    setCancellingId(null);
  };

  if (loading) return <KioskLayout title="My Records"><Spinner className="py-20" /></KioskLayout>;
  if (error) return (
    <KioskLayout title="My Records">
      <div className="text-center py-20">
        <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchPatient} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20">Retry</button>
      </div>
    </KioskLayout>
  );

  return (
    <KioskLayout title="My Records">
      {/* Patient info card */}
      <div className="kiosk-card p-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0">
            {patient.user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate">{patient.user?.name}</h2>
            <p className="text-white/50 text-xs truncate">{patient.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { playClick(); setActiveTab(tab.id); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="kiosk-card p-4">
        {activeTab === 'appointments' && (
          <div className="space-y-3">
            {patient.appointments?.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calendar size={20} className="text-white/30" />
                </div>
                <p className="text-white/50 font-medium mb-1">No appointments yet</p>
                <p className="text-white/30 text-xs">Book your first appointment to get started</p>
              </div>
            ) : patient.appointments?.map(a => (
              <div key={a.id} className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white font-medium">{new Date(a.date).toLocaleDateString()} at {a.time}</div>
                    <div className="text-white/50 text-sm">{a.reason}</div>
                    {a.dentist && (
                      <div className="flex items-center gap-1 text-white/40 text-xs mt-1">
                        <Stethoscope size={12} /> {a.dentist.name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
                      <button
                        onClick={() => handleCancel(a.id)}
                        disabled={cancellingId === a.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-all disabled:opacity-50"
                      >
                        {cancellingId === a.id ? (
                          <><Loader size={12} className="animate-spin" /> Cancelling...</>
                        ) : (
                          <><XCircle size={12} /> Cancel</>
                        )}
                      </button>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      a.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300 border border-green-500/40' :
                      a.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      a.status === 'CANCELLED' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                      'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    }`}>{a.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'treatments' && (
          <div className="space-y-3">
            {patient.treatments?.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Stethoscope size={20} className="text-white/30" />
                </div>
                <p className="text-white/50 font-medium mb-1">No treatments yet</p>
                <p className="text-white/30 text-xs">Your treatments will appear here after your first visit</p>
              </div>
            ) : patient.treatments?.map(t => (
              <div key={t.id} className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <div className="text-white font-medium">{t.procedure}</div>
                <div className="text-white/50 text-sm">{t.description} {t.dentist?.name && `· by ${t.dentist.name}`}</div>
                {t.cost && <div className="text-green-400 text-sm mt-1 font-medium">₱{t.cost}</div>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="space-y-3">
            {patient.prescriptions?.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Pill size={20} className="text-white/30" />
                </div>
                <p className="text-white/50 font-medium mb-1">No prescriptions yet</p>
                <p className="text-white/30 text-xs">Prescriptions from your dentist will show up here</p>
              </div>
            ) : patient.prescriptions?.map(p => (
              <div key={p.id} className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <div className="text-white font-medium">{p.medication}</div>
                <div className="text-white/50 text-sm">{p.dosage} · {p.frequency} · {p.duration}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'teeth' && (() => {
          const allTeeth = Array.from({ length: 32 }, (_, i) => {
            const dbTooth = patient.teeth?.find(t => t.toothNumber === i + 1);
            return dbTooth || { toothNumber: i + 1, status: 'HEALTHY', id: `default-${i + 1}` };
          });
          const getStatusStyle = (status) => {
            switch (status) {
              case 'HEALTHY': return 'bg-green-500/30 text-green-200 border border-green-500/50';
              case 'FILLING': return 'bg-blue-500/30 text-blue-200 border border-blue-500/50';
              case 'CROWN': return 'bg-violet-500/30 text-violet-200 border border-violet-500/50';
              case 'DECAYED': return 'bg-red-500/30 text-red-200 border border-red-500/50';
              case 'MISSING': return 'bg-white/5 text-white/30 border border-white/10';
              case 'IMPLANT': return 'bg-orange-500/30 text-orange-200 border border-orange-500/50';
              case 'BRIDGE': return 'bg-pink-500/30 text-pink-200 border border-pink-500/50';
              case 'TREATED': return 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50';
              default: return 'bg-white/10 text-white/60 border border-white/10';
            }
          };
          return (
          <div>
            <h3 className="text-white font-bold mb-2 text-sm">Interactive Tooth Chart</h3>
            <div className="mb-3">
              <div className="grid grid-cols-8 gap-1.5 mb-3">
                {allTeeth.map(tooth => (
                  <div key={tooth.id}
                    className={`h-11 min-w-0 rounded-lg flex items-center justify-center font-bold transition-all hover:scale-110 ${getStatusStyle(tooth.status)}`}>
                    <span className="text-xs">#{tooth.toothNumber}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10">
                <img src="/images/numbering of tooth.png" alt="Tooth Numbering Guide" className="w-full h-auto" />
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] text-white/60">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500/40 rounded" /> Healthy</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-teal-500/40 rounded" /> Filling</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-500/40 rounded" /> Crown</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500/40 rounded" /> Decayed</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white/10 rounded" /> Missing</span>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </KioskLayout>
  );
}
