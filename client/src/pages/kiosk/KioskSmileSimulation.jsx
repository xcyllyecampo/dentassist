import { useState, useEffect } from 'react';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { playClick, playSuccess, playError } from '../../lib/sounds';
import { Sparkles, Camera, Brain, AlertTriangle, CheckCircle, TrendingUp, Clock, Loader } from 'lucide-react';

const TREATMENT_TYPES = [
  { value: 'whitening', label: 'Teeth Whitening', icon: '✨', desc: 'Brighten your smile', gradient: 'from-amber-400 to-amber-500' },
  { value: 'veneers', label: 'Porcelain Veneers', icon: '🦷', desc: 'Perfect shape & color', gradient: 'from-blue-400 to-blue-500' },
  { value: 'alignment', label: 'Teeth Alignment', icon: '📐', desc: 'Straighter teeth', gradient: 'from-purple-400 to-purple-500' },
];

export default function KioskSmileSimulation() {
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [treatmentType, setTreatmentType] = useState('whitening');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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
      playSuccess();
    } catch (err) {
      toast.error('Error running simulation. Please try again.');
      playError();
    }
    setSimulating(false);
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setSimulating(false);
  };

  return (
    <KioskLayout title="Smile Simulation">
      {/* Upload area */}
      {!preview && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-5 border border-white/20">
            <Sparkles size={32} className="text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 text-center">Smile Analysis</h2>
          <p className="text-white/60 text-sm mb-6 text-center px-4">
            Upload a smile photo and see how different treatments could transform your smile.
          </p>

          {/* Treatment type selector */}
          <div className="grid grid-cols-3 gap-2 w-full mb-6">
            {TREATMENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => { playClick(); setTreatmentType(t.value); }}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  treatmentType === t.value
                    ? 'border-white/50 bg-white/15 scale-[1.03]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-xl mb-1">{t.icon}</div>
                <div className="font-bold text-white text-[11px] leading-tight">{t.label}</div>
                <div className="text-white/40 text-[9px] mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-4 rounded-2xl hover:from-rose-600 hover:to-rose-700 cursor-pointer font-bold text-lg shadow-xl shadow-rose-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={() => playClick()}>
            <Camera size={20} /> Choose Smile Photo
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      )}

      {/* Preview + results — stacked vertically */}
      {preview && (
        <div className="flex flex-col gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4">
            <h3 className="text-white font-bold mb-3 text-sm">Your Smile Photo</h3>
            <img src={preview} alt="Smile" className="w-full rounded-xl" />
            <button onClick={() => { playClick(); handleSimulate(); }} disabled={simulating}
              className="w-full mt-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 rounded-xl font-bold text-base hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all">
              {simulating ? <><Loader size={18} className="animate-spin" /> Simulating...</> : <><Sparkles size={18} /> Simulate {TREATMENT_TYPES.find(t => t.value === treatmentType)?.label}</>}
            </button>
          </div>

          {result && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm">Results</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${result.source === 'gemini' ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                  {result.source === 'gemini' ? 'AI-Powered' : 'Demo Mode'}
                </span>
              </div>

              {result.current_analysis && result.simulated_result && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-white/50">Smile Score</span>
                    <span className="text-white font-bold text-base">{result.current_analysis.smile_score} → {result.simulated_result.smile_score}</span>
                  </div>
                  <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="absolute h-full bg-white/20 rounded-full" style={{ width: `${result.current_analysis.smile_score}%` }} />
                    <div className="absolute h-full bg-gradient-to-r from-rose-400 to-green-400 rounded-full opacity-80" style={{ width: `${result.simulated_result.smile_score}%` }} />
                  </div>
                </div>
              )}

              {result.simulated_result?.description && (
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={14} className="text-rose-400" />
                    <span className="text-white font-bold text-xs">Expected Outcome</span>
                  </div>
                  <p className="text-white/70 text-xs">{result.simulated_result.description}</p>
                </div>
              )}

              {result.simulated_result?.changes?.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-white font-bold mb-1.5 text-xs">Expected Changes</h4>
                  <ul className="space-y-1">
                    {result.simulated_result.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-white/70">
                        <CheckCircle size={12} className="mt-0.5 text-green-400 shrink-0" />{change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.procedures?.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-white font-bold mb-1.5 text-xs">Recommended Procedures</h4>
                  {result.procedures.map((proc, i) => (
                    <div key={i} className="p-2.5 bg-white/5 rounded-xl border border-white/10 mb-1.5">
                      <div className="text-white font-medium text-xs">{proc.name}</div>
                      <div className="flex gap-3 mt-1 text-[10px] text-white/50">
                        <span className="flex items-center gap-1">{proc.cost}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{proc.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 p-2.5 bg-red-500/10 rounded-xl border border-red-500/30 text-[10px] text-red-300">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                {result.disclaimer || 'This is an AI-generated simulation for informational purposes. A licensed dentist must evaluate before any treatment.'}
              </div>

              <button onClick={handleReset} className="w-full mt-3 bg-white/10 border border-white/20 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                <Camera size={16} /> Upload Another Photo
              </button>
            </div>
          )}
        </div>
      )}
    </KioskLayout>
  );
}
