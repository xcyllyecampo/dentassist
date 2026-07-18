import { useState } from 'react';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Camera, Brain, AlertTriangle, CheckCircle, TrendingUp, Clock, DollarSign, Loader } from 'lucide-react';

const TREATMENT_TYPES = [
  { value: 'whitening', label: 'Teeth Whitening', icon: '✨', desc: 'Brighten your smile by several shades', gradient: 'from-amber-400 to-amber-500' },
  { value: 'veneers', label: 'Porcelain Veneers', icon: '🦷', desc: 'Perfect shape, color, and symmetry', gradient: 'from-blue-400 to-blue-500' },
  { value: 'alignment', label: 'Teeth Alignment', icon: '📐', desc: 'Straighten crooked or crowded teeth', gradient: 'from-purple-400 to-purple-500' },
];

export default function KioskSmileSimulation() {
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
      toast.error('Error running simulation. Please try again.');
    }
    setSimulating(false);
  };

  return (
    <KioskLayout title="Smile Simulation">
      {/* Upload area */}
      {!preview && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-220px)]">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-8 border border-white/20">
            <Sparkles size={48} className="text-rose-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 text-center">Smile Simulation</h2>
          <p className="text-white/60 text-lg mb-10 text-center max-w-md">
            Upload a smile photo and see how different treatments could transform your smile.
          </p>

          {/* Treatment type selector */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl w-full mb-8">
            {TREATMENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTreatmentType(t.value)}
                className={`p-5 rounded-2xl border-2 text-center transition-all ${
                  treatmentType === t.value
                    ? 'border-white/50 bg-white/15 scale-[1.03]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-3xl mb-2">{t.icon}</div>
                <div className="font-bold text-white text-sm">{t.label}</div>
                <div className="text-white/40 text-xs mt-1">{t.desc}</div>
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-8 py-5 rounded-2xl hover:from-rose-600 hover:to-rose-700 cursor-pointer font-bold text-xl shadow-xl shadow-rose-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Camera size={24} /> Choose Smile Photo
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      )}

      {/* Preview + results */}
      {preview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h3 className="text-white font-bold mb-4 text-lg">Your Smile Photo</h3>
            <img src={preview} alt="Smile" className="w-full rounded-xl" />
            <button onClick={handleSimulate} disabled={simulating}
              className="w-full mt-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white py-4 rounded-xl font-bold text-lg hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20 transition-all">
              {simulating ? <><Loader size={20} className="animate-spin" /> Simulating...</> : <><Sparkles size={20} /> Simulate {TREATMENT_TYPES.find(t => t.value === treatmentType)?.label}</>}
            </button>
          </div>

          {result && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 max-h-[calc(100vh-220px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Results</h3>
                <span className={`text-xs px-3 py-1 rounded-full ${result.source === 'openai' ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                  {result.source === 'openai' ? 'AI-Powered' : 'Demo Mode'}
                </span>
              </div>

              {result.current_analysis && result.simulated_result && (
                <div className="mb-5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/50">Smile Score</span>
                    <span className="text-white font-bold text-lg">{result.current_analysis.smile_score} → {result.simulated_result.smile_score}</span>
                  </div>
                  <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
                    <div className="absolute h-full bg-white/20 rounded-full" style={{ width: `${result.current_analysis.smile_score}%` }} />
                    <div className="absolute h-full bg-gradient-to-r from-rose-400 to-green-400 rounded-full opacity-80" style={{ width: `${result.simulated_result.smile_score}%` }} />
                  </div>
                </div>
              )}

              {result.simulated_result?.description && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-rose-400" />
                    <span className="text-white font-bold text-sm">Expected Outcome</span>
                  </div>
                  <p className="text-white/70 text-sm">{result.simulated_result.description}</p>
                </div>
              )}

              {result.simulated_result?.changes?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-bold mb-2 text-sm">Expected Changes</h4>
                  <ul className="space-y-1.5">
                    {result.simulated_result.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                        <CheckCircle size={14} className="mt-0.5 text-green-400 shrink-0" />{change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.procedures?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-bold mb-2 text-sm">Recommended Procedures</h4>
                  {result.procedures.map((proc, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 mb-2">
                      <div className="text-white font-medium text-sm">{proc.name}</div>
                      <div className="flex gap-4 mt-1 text-xs text-white/50">
                        <span className="flex items-center gap-1"><DollarSign size={12} />{proc.cost}</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{proc.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/30 text-xs text-red-300 mt-4">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {result.disclaimer || 'This is an AI-generated simulation for informational purposes. A licensed dentist must evaluate before any treatment.'}
              </div>
            </div>
          )}
        </div>
      )}
    </KioskLayout>
  );
}
