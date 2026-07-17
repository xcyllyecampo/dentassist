import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { AlertTriangle, Award, Star, TrendingUp, Gift, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';

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

  if (loading) return <Layout><Header title="Patient Detail" /><Spinner className="py-20" /></Layout>;
  if (error) return <Layout><Header title="Patient Detail" /><div className="p-6 text-center"><AlertTriangle size={36} className="mx-auto mb-3 text-red-400" /><p className="text-sm text-red-600 mb-3">{error}</p><button onClick={fetchPatient} className="text-sm text-sky-600 hover:text-sky-800 font-medium">Retry</button></div></Layout>;

  const tabs = ['overview', 'teeth', 'appointments', 'treatments', 'prescriptions', 'x-rays', 'rewards'];

  return (
    <Layout>
      <Header title={`Patient: ${patient.user?.name}`} />
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sky-200 text-sky-800 rounded-full flex items-center justify-center text-2xl font-bold">
              {patient.user?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-sky-900">{patient.user?.name}</h2>
              <p className="text-sm text-gray-500">{patient.user?.email} · {patient.user?.phone || 'No phone'}</p>
            </div>
            <div className="ml-auto text-right text-sm text-gray-600">
              <div>Blood Type: <span className="font-medium">{patient.bloodType || 'N/A'}</span></div>
              <div>Gender: <span className="font-medium">{patient.gender || 'N/A'}</span></div>
              <div>Allergies: <span className="font-medium text-red-600">{patient.allergies || 'None'}</span></div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-sky-100">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors ${activeTab === tab ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600' : 'text-gray-500 hover:text-sky-600'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              <InfoItem label="Address" value={patient.address || 'N/A'} />
              <InfoItem label="Emergency Contact" value={patient.emergencyContact || 'N/A'} />
              <InfoItem label="Insurance" value={patient.insuranceInfo || 'N/A'} />
              <InfoItem label="Medical History" value={patient.medicalHistory || 'None'} />
            </div>
          )}

          {activeTab === 'teeth' && (
            <div>
              <h3 className="font-bold text-sky-900 mb-4">Interactive Tooth Chart</h3>
              <div className="grid grid-cols-8 gap-2">
                {patient.teeth?.map(tooth => (
                  <div key={tooth.id}
                    className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-110 ${
                      tooth.status === 'HEALTHY' ? 'bg-green-100 text-green-700 border border-green-200' :
                      tooth.status === 'FILLING' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      tooth.status === 'CROWN' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                      tooth.status === 'DECAYED' ? 'bg-red-100 text-red-700 border border-red-200' :
                      tooth.status === 'MISSING' ? 'bg-gray-200 text-gray-500 border border-gray-300' :
                      'bg-sky-100 text-sky-700 border border-sky-200'
                    }`}>
                    <span>#{tooth.toothNumber}</span>
                    <span className="text-[10px] font-normal">{tooth.status}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-200 rounded" /> Healthy</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded" /> Filling</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-200 rounded" /> Crown</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 rounded" /> Decayed</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-300 rounded" /> Missing</span>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-3">
              {patient.appointments?.length === 0 ? <p className="text-gray-400">No appointments yet</p> :
                patient.appointments?.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-sky-900">{new Date(a.date).toLocaleDateString()} at {a.time}</div>
                      <div className="text-xs text-gray-500">{a.reason}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      a.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                      'bg-sky-100 text-sky-700'
                    }`}>{a.status}</span>
                  </div>
                ))
              }
            </div>
          )}

          {activeTab === 'treatments' && (
            <div className="space-y-3">
              {patient.treatments?.length === 0 ? <p className="text-gray-400">No treatments yet</p> :
                patient.treatments?.map(t => (
                  <div key={t.id} className="p-3 bg-sky-50 rounded-lg">
                    <div className="text-sm font-medium text-sky-900">{t.procedure}</div>
                    <div className="text-xs text-gray-500">{t.description} · by {t.dentist?.name}</div>
                    {t.cost && <div className="text-xs text-green-600 mt-1">${t.cost}</div>}
                  </div>
                ))
              }
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-3">
              {patient.prescriptions?.length === 0 ? <p className="text-gray-400">No prescriptions yet</p> :
                patient.prescriptions?.map(p => (
                  <div key={p.id} className="p-3 bg-sky-50 rounded-lg">
                    <div className="text-sm font-medium text-sky-900">{p.medication}</div>
                    <div className="text-xs text-gray-500">{p.dosage} · {p.frequency} · {p.duration}</div>
                  </div>
                ))
              }
            </div>
          )}

          {activeTab === 'x-rays' && (
            <div>
              {patient.xrayImages?.length === 0 ? (
                <p className="text-gray-400">No X-ray images yet. Upload from the X-Ray Analysis module.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patient.xrayImages?.map(img => (
                    <div key={img.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <div className="aspect-square bg-gray-100">
                        <img src={`/${img.filePath}`} alt="X-Ray" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">{new Date(img.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">{img.fileType}</span>
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
                <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2"><Star size={20} /><span className="font-medium">Loyalty Points</span></div>
                  <div className="text-3xl font-bold">{loyalty?.points || 0}</div>
                  <div className="text-sky-100 text-sm mt-1">Tier: {loyalty?.tier || 'Bronze'}</div>
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
                <h3 className="font-bold text-sky-900 mb-3">Earned Badges</h3>
                {badges.length === 0 ? (
                  <p className="text-gray-400 text-sm">No badges earned yet</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {badges.map(pb => (
                      <div key={pb.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-2">{pb.badge.icon}</div>
                        <div className="font-medium text-sky-900 text-sm">{pb.badge.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{pb.badge.description}</div>
                        <div className="text-xs text-amber-600 mt-2">{new Date(pb.earnedAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-sky-900 mb-3">Award Badge</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {allBadges.map(b => {
                    const earned = badges.some(pb => pb.badgeId === b.id);
                    return (
                      <button key={b.id} onClick={() => !earned && awardBadge(b.id)} disabled={earned || awarding === b.id}
                        className={`rounded-xl p-4 text-center transition-all ${earned ? 'bg-green-50 border-2 border-green-300 cursor-default' : 'bg-gray-50 border border-gray-200 hover:border-sky-400 hover:bg-sky-50 cursor-pointer'}`}>
                        <div className="text-3xl mb-2">{b.icon}</div>
                        <div className="font-medium text-sky-900 text-sm">{b.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{b.description}</div>
                        {earned ? (
                          <div className="flex items-center justify-center gap-1 text-green-600 text-xs mt-2"><Check size={12} /> Earned</div>
                        ) : (
                          <div className="text-xs text-sky-600 mt-2">{b.threshold} pts</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loyalty?.transactions?.length > 0 && (
                <div>
                  <h3 className="font-bold text-sky-900 mb-3">Transaction History</h3>
                  <div className="space-y-2">
                    {loyalty.transactions.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Gift size={14} className="text-sky-600" />
                          <span className="text-sm text-sky-900">{t.description}</span>
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
      <div className="text-sm text-sky-900 mt-1">{value}</div>
    </div>
  );
}
