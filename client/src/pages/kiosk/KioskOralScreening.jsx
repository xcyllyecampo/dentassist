import { useState, useEffect } from 'react';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { playClick, playSuccess, playError } from '../../lib/sounds';
import { Camera, AlertTriangle, CheckCircle, Brain, Loader } from 'lucide-react';

export default function KioskOralScreening() {
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
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

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.post('/ai/oral/screen', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      playSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error analyzing image. Please try again.');
      playError();
    }
    setAnalyzing(false);
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setAnalyzing(false);
  };

  return (
    <KioskLayout title="Oral Screening">
      {/* Upload area */}
      {!preview && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-5 border border-white/20">
            <Camera size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 text-center">AI Oral Check</h2>
          <p className="text-white/60 text-sm mb-8 text-center px-4">
            Take a clear photo of the inside of your mouth. Our AI will analyze it and highlight any areas of concern.
          </p>
          <label className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 cursor-pointer font-bold text-lg shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={() => playClick()}>
            <Camera size={20} /> Choose Photo
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      )}

      {/* Preview + results — stacked vertically */}
      {preview && (
        <div className="flex flex-col gap-4">
          {/* Photo panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4">
            <h3 className="text-white font-bold mb-3 text-sm">Your Photo</h3>
            <img src={preview} alt="Oral" className="w-full max-h-[340px] object-contain rounded-xl" />
            <button
              onClick={() => { playClick(); handleAnalyze(); }}
              disabled={analyzing}
              className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-bold text-base hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              {analyzing ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Brain size={18} />
                  Run AI Analysis
                </>
              )}
            </button>
          </div>

          {/* Results panel */}
          {result && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm">Analysis Results</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${result.source === 'gemini' ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                  {result.source === 'gemini' ? 'AI-Powered' : 'Demo Mode'}
                </span>
              </div>

              {/* Score */}
              <div className="mb-4">
                <div className="text-white/50 text-xs mb-1.5">Overall Oral Health Score</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(result.overall_score || 0) > 80 ? 'bg-green-500' : (result.overall_score || 0) > 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${result.overall_score || 0}%` }} />
                  </div>
                  <span className="text-lg font-bold text-white">{result.overall_score}/100</span>
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-2 mb-4">
                {result.areas?.map((area, i) => (
                  <div key={i} className={`p-2.5 rounded-xl border ${
                    area.severity === 'none' ? 'bg-green-500/10 border-green-500/30' :
                    area.severity === 'mild' ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white text-xs">{area.region}</span>
                      <span className="text-white/40 text-[10px]">{(area.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-white/60 text-[11px] mt-0.5">{area.concern}</div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-white font-bold mb-1.5 text-xs">Recommendations</h4>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-white/70">
                        <CheckCircle size={12} className="mt-0.5 text-green-400 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-start gap-2 p-2.5 bg-red-500/10 rounded-xl border border-red-500/30 text-[10px] text-red-300">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                {result.disclaimer || 'This is an AI-generated screening for demonstration purposes. Please consult a licensed dentist for professional evaluation.'}
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
