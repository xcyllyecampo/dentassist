import { useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Stethoscope, AlertTriangle, CheckCircle, Brain } from 'lucide-react';

const SYMPTOMS = [
  { id: 'toothache', label: 'Toothache', severity: 'high' },
  { id: 'sensitivity', label: 'Sensitivity', severity: 'moderate' },
  { id: 'bleeding_gums', label: 'Bleeding Gums', severity: 'moderate' },
  { id: 'swelling', label: 'Swelling', severity: 'high' },
  { id: 'bad_breath', label: 'Bad Breath', severity: 'low' },
  { id: 'broken_tooth', label: 'Broken Tooth', severity: 'high' },
  { id: 'jaw_pain', label: 'Jaw Pain', severity: 'moderate' },
  { id: 'loose_tooth', label: 'Loose Tooth', severity: 'high' },
];

export default function TreatmentSupport() {
  const toast = useToast();
  const [symptoms, setSymptoms] = useState([]);
  const [examination, setExamination] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (id) => {
    setSymptoms(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleAnalyze = async () => {
    if (symptoms.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/ai/treatment/suggest', {
        symptoms,
        examination_findings: examination,
        patient_age: patientAge ? parseInt(patientAge) : 0,
        patient_gender: patientGender,
        medical_history: medicalHistory,
      });
      setResults(res.data);
    } catch (err) {
      toast.error('Error getting suggestions. Make sure the AI service is running.');
    }
    setLoading(false);
  };

  return (
    <Layout>
      <Header title="Treatment Recommendation Support" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Stethoscope size={18} /> Patient Information
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Age</label>
                <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#004aad] focus:outline-none"
                  placeholder="e.g. 35" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={patientGender} onChange={e => setPatientGender(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#004aad] focus:outline-none">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
              <input type="text" value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#004aad] focus:outline-none"
                placeholder="e.g. Diabetes, allergies, current medications" />
            </div>

            <h4 className="text-sm font-bold text-slate-900 mb-3">Symptoms</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {SYMPTOMS.map(({ id, label, severity }) => (
                <button key={id} onClick={() => toggleSymptom(id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-all ${
                    symptoms.includes(id)
                      ? 'bg-[#e6efff] border-[#4a85d6] text-[#002d6b]'
                      : 'bg-white border-slate-200 text-gray-600 hover:bg-slate-50'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{label}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      severity === 'high' ? 'bg-red-500' : severity === 'moderate' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Examination Findings</label>
              <textarea value={examination} onChange={e => setExamination(e.target.value)} rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#004aad] focus:outline-none"
                placeholder="e.g., Visible cavity on tooth #19, gum inflammation, etc." />
            </div>

            <button onClick={handleAnalyze} disabled={symptoms.length === 0 || loading}
              className="w-full bg-[#004aad] text-white py-3 rounded-lg font-medium hover:bg-[#003782] disabled:opacity-50 flex items-center justify-center gap-2">
              <Brain size={18} />
              {loading ? 'Analyzing...' : 'Analyze & Suggest Treatments'}
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Recommendation Results</h3>
              {results && (
                <span className={`text-xs px-3 py-1 rounded-full ${results.source === 'openai' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {results.source === 'openai' ? 'GPT-4' : 'Rule-Based'}
                </span>
              )}
            </div>

            {!results ? (
              <div className="text-center py-12 text-slate-500">
                <Stethoscope size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-sm">Select symptoms and click Analyze to see treatment recommendations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.red_flags?.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-900/40 border border-red-700 text-sm text-red-300">
                    <div className="font-bold mb-1">Red Flags:</div>
                    <ul className="list-disc list-inside">
                      {results.red_flags.map((flag, i) => <li key={i}>{flag}</li>)}
                    </ul>
                  </div>
                )}

                {results.diagnoses?.map((diagnosis, i) => (
                  <div key={i}>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">{diagnosis.name}</div>
                    <div className="space-y-2">
                      {diagnosis.treatments?.map((t, j) => (
                        <div key={j} className={`p-3 rounded-lg border ${
                          t.priority === 'urgent' ? 'bg-red-900/30 border-red-700' :
                          t.priority === 'recommended' ? 'bg-green-900/30 border-green-700' :
                          'bg-slate-800 border-slate-700'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={14} className={t.priority === 'urgent' ? 'text-red-400' : 'text-green-400'} />
                            <span className="font-medium text-sm text-white">{t.name}</span>
                            {t.priority === 'urgent' && <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">Urgent</span>}
                          </div>
                          <div className="text-xs text-slate-300 ml-6">{t.description}</div>
                          <div className="flex gap-4 mt-1 ml-6 text-xs text-slate-400">
                            <span>Cost: {t.cost_range}</span>
                            <span>Duration: {t.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {results.additional_tests?.length > 0 && (
                  <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="text-xs font-bold text-slate-300 mb-1">Additional Tests Recommended:</div>
                    <ul className="text-xs text-slate-400 list-disc list-inside">
                      {results.additional_tests.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-red-900/20 rounded-lg border border-red-800 text-xs text-red-400 mt-4">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {results.disclaimer || 'This is a clinical decision support tool. The final treatment decision must be made by the licensed dentist.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
