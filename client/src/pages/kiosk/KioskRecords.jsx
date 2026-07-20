import { useState, useEffect } from 'react';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { playClick } from '../../lib/sounds';
import Spinner from '../../components/Spinner';
import { AlertTriangle, Calendar, Stethoscope, Pill, X as XRayIcon, Circle, HelpCircle } from 'lucide-react';

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
  const [showToothGuide, setShowToothGuide] = useState(false);

  const fetchPatient = () => {
    setLoading(true);
    setError(null);
    api.get('/patients/me')
      .then(res => setPatient(res.data))
      .catch(() => setError('Failed to load your records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPatient(); }, []);

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
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {patient.user?.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{patient.user?.name}</h2>
            <p className="text-white/50 text-sm">{patient.user?.email}</p>
          </div>
          <div className="text-right text-sm text-white/60 space-y-1">
            <div>Blood Type: <span className="text-white font-medium">{patient.bloodType || 'N/A'}</span></div>
            <div>Allergies: <span className="text-amber-300 font-medium">{patient.allergies || 'None'}</span></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { playClick(); setActiveTab(tab.id); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        {activeTab === 'appointments' && (
          <div className="space-y-3">
            {patient.appointments?.length === 0 ? (
              <p className="text-white/40 text-center py-8">No appointments yet</p>
            ) : patient.appointments?.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <div className="text-white font-medium">{new Date(a.date).toLocaleDateString()} at {a.time}</div>
                  <div className="text-white/50 text-sm">{a.reason}</div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  a.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300 border border-green-500/40' :
                  a.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'treatments' && (
          <div className="space-y-3">
            {patient.treatments?.length === 0 ? (
              <p className="text-white/40 text-center py-8">No treatments yet</p>
            ) : patient.treatments?.map(t => (
              <div key={t.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
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
              <p className="text-white/40 text-center py-8">No prescriptions yet</p>
            ) : patient.prescriptions?.map(p => (
              <div key={p.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-white font-medium">{p.medication}</div>
                <div className="text-white/50 text-sm">{p.dosage} · {p.frequency} · {p.duration}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'teeth' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Interactive Tooth Chart</h3>
              <button onClick={() => { playClick(); setShowToothGuide(true); }}
                className="flex items-center gap-1 text-xs text-white/60 hover:text-white font-medium">
                <HelpCircle size={14} /> Tooth Guide
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {patient.teeth?.map(tooth => (
                <div key={tooth.id}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all hover:scale-110 ${
                    tooth.status === 'HEALTHY' ? 'bg-green-500/20 text-green-300 border border-green-500/40' :
                    tooth.status === 'FILLING' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                    tooth.status === 'CROWN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                    tooth.status === 'DECAYED' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                    tooth.status === 'MISSING' ? 'bg-white/5 text-white/30 border border-white/10' :
                    'bg-white/10 text-white/60 border border-white/10'
                  }`}>
                  <span>#{tooth.toothNumber}</span>
                  <span className="text-[9px] font-normal opacity-70">{tooth.status}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-xs text-white/60">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500/40 rounded" /> Healthy</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500/40 rounded" /> Filling</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500/40 rounded" /> Crown</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500/40 rounded" /> Decayed</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-white/10 rounded" /> Missing</span>
            </div>
          </div>
        )}
      </div>

      {showToothGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowToothGuide(false)}>
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-bold text-white">Tooth Numbering Guide</h3>
              <button onClick={() => setShowToothGuide(false)} className="text-white/40 hover:text-white transition-colors">
                <XRayIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <img src="/images/tooth.png" alt="Tooth Numbering Guide" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </KioskLayout>
  );
}
