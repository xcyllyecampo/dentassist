import { useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Sparkles, Camera, Brain, AlertTriangle, CheckCircle, TrendingUp, Clock, DollarSign, ArrowRight } from 'lucide-react';

const TREATMENT_TYPES = [
  { value: 'whitening', label: 'Teeth Whitening', icon: '✨', desc: 'Brighten your smile by several shades' },
  { value: 'veneers', label: 'Porcelain Veneers', icon: '🦷', desc: 'Perfect shape, color, and symmetry' },
  { value: 'alignment', label: 'Teeth Alignment', icon: '📐', desc: 'Straighten crooked or crowded teeth' },
];

function ScoreBar({ current, simulated, label }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-bold text-slate-900">{current} → {simulated}</span>
      </div>
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        <div className="absolute h-full bg-gray-400 rounded-full" style={{ width: `${current}%` }} />
        <div className="absolute h-full bg-gradient-to-r from-[#4a85d6] to-green-400 rounded-full opacity-70" style={{ width: `${simulated}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>Current</span>
        <span>Simulated</span>
      </div>
    </div>
  );
}

export default function SmileSimulation() {
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [treatmentType, setTreatmentType] = useState('whitening');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleSimulate = async () => {
    if (!selectedFile) return;
    setSimulating(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('treatment_type', treatmentType);
      const res = await api.post('/ai/smile/simulate', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
    } catch (err) {
      toast.error('Error running simulation. Make sure the AI service is running.');
    }
    setSimulating(false);
  };

  return (
    <Layout>
      <Header title="Smile Simulation" />
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="text-center mb-6">
            <Sparkles size={48} className="text-[#6b9ae8] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Virtual Smile Makeover</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Upload a smile photo and see how different treatments could transform your smile. Choose a treatment type below to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 max-w-2xl mx-auto">
            {TREATMENT_TYPES.map((t) => (
              <button key={t.value} onClick={() => setTreatmentType(t.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  treatmentType === t.value
                    ? 'border-[#1a5fb4] bg-slate-50 shadow-sm'
                    : 'border-gray-200 hover:border-[#6b9ae8] hover:bg-gray-50'
                }`}>
                <div className="text-2xl mb-1">{t.icon}</div>
                <div className="font-medium text-slate-900 text-sm">{t.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <label className="inline-flex items-center gap-2 bg-[#004aad] text-white px-6 py-3 rounded-lg hover:bg-[#003782] cursor-pointer font-medium">
              <Camera size={18} /> Choose Smile Photo
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        </div>

        {preview && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Your Smile Photo</h3>
              <img src={preview} alt="Smile" className="w-full rounded-lg" />
              <button onClick={handleSimulate} disabled={simulating}
                className="w-full mt-4 bg-gradient-to-r from-[#004aad] to-[#004aad] text-white py-3 rounded-lg font-medium hover:from-[#003782] hover:to-[#003782] disabled:opacity-50 flex items-center justify-center gap-2">
                <Sparkles size={18} />
                {simulating ? 'Simulating...' : `Simulate ${TREATMENT_TYPES.find(t => t.value === treatmentType)?.label}`}
              </button>
            </div>

            {result && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Simulation Results</h3>
                  <span className={`text-xs px-3 py-1 rounded-full ${result.source === 'openai' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {result.source === 'openai' ? 'AI-Powered' : 'Demo Mode'}
                  </span>
                </div>

                {result.current_analysis && result.simulated_result && (
                  <ScoreBar
                    current={result.current_analysis.smile_score}
                    simulated={result.simulated_result.smile_score}
                    label="Smile Score"
                  />
                )}

                {result.simulated_result?.description && (
                  <div className="p-4 bg-gradient-to-r from-[#f0f5ff] to-[#f0f5ff] rounded-lg border border-slate-200 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-[#004aad]" />
                      <span className="text-sm font-bold text-slate-900">Expected Outcome</span>
                    </div>
                    <p className="text-sm text-gray-700">{result.simulated_result.description}</p>
                    {result.simulated_result.estimated_shade_change && (
                      <p className="text-xs text-[#004aad] mt-1 font-medium">{result.simulated_result.estimated_shade_change}</p>
                    )}
                  </div>
                )}

                {result.simulated_result?.changes?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Expected Changes</h4>
                    <ul className="space-y-1">
                      {result.simulated_result.changes.map((change, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle size={14} className="mt-0.5 text-green-500 shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.current_analysis?.observations?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Current Observations</h4>
                    <div className="space-y-2">
                      {result.current_analysis.observations.map((obs, i) => (
                        <div key={i} className={`p-3 rounded-lg border text-sm ${
                          obs.severity === 'none' ? 'bg-green-50 border-green-200' :
                          obs.severity === 'mild' ? 'bg-amber-50 border-amber-200' :
                          'bg-red-50 border-red-200'
                        }`}>
                          <div className="font-medium text-slate-900">{obs.area}</div>
                          <div className="text-gray-600">{obs.finding}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.procedures?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Recommended Procedures</h4>
                    <div className="space-y-2">
                      {result.procedures.map((proc, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="font-medium text-slate-900 text-sm">{proc.name}</div>
                          <p className="text-xs text-gray-600 mt-0.5">{proc.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><DollarSign size={12} />{proc.cost}</span>
                            <span className="flex items-center gap-1"><Clock size={12} />{proc.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.timeline && (
                  <div className="p-3 bg-[#f0f5ff] rounded-lg border border-[#c2d5f7] mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-[#004aad]" />
                      <span className="text-sm font-bold text-[#001d4e]">Timeline</span>
                    </div>
                    <p className="text-sm text-gray-700">{result.timeline}</p>
                  </div>
                )}

                {result.maintenance && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
                    <div className="text-sm font-bold text-green-900 mb-1">Maintenance</div>
                    <p className="text-sm text-gray-700">{result.maintenance}</p>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {result.disclaimer || "This is an AI-generated simulation for informational purposes only. Actual results may vary. A licensed dentist must evaluate before any treatment."}
                </div>
              </div>
            )}
          </div>
        )}

        {!preview && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Sparkles size={48} className="text-[#6b9ae8] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">See Your Smile Transformation</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Upload a clear photo of your smile, choose a treatment type, and let our AI show you what your new smile could look like.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
