import { useState } from 'react';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Camera, AlertTriangle, CheckCircle, Brain, Loader } from 'lucide-react';

export default function KioskOralScreening() {
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

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
    } catch (err) {
      toast.error('Error analyzing image. Please try again.');
    }
    setAnalyzing(false);
  };

  return (
    <KioskLayout title="Oral Screening">
      {/* Upload area */}
      {!preview && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-220px)]">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-8 border border-white/20">
            <Camera size={48} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 text-center">AI Oral Screening</h2>
          <p className="text-white/60 text-lg mb-10 text-center max-w-md">
            Take a clear photo of the inside of your mouth. Our AI will analyze it and highlight any areas of concern.
          </p>
          <label className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-5 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 cursor-pointer font-bold text-xl shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Camera size={24} /> Choose Photo
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      )}

      {/* Preview + results */}
      {preview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photo panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h3 className="text-white font-bold mb-4 text-lg">Your Photo</h3>
            <img src={preview} alt="Oral" className="w-full rounded-xl" />
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 transition-all"
            >
              {analyzing ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Brain size={20} />
                  Run AI Analysis
                </>
              )}
            </button>
          </div>

          {/* Results panel */}
          {result && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Analysis Results</h3>
                <span className={`text-xs px-3 py-1 rounded-full ${result.source === 'openai' ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                  {result.source === 'openai' ? 'AI-Powered' : 'Demo Mode'}
                </span>
              </div>

              {/* Score */}
              <div className="mb-6">
                <div className="text-white/50 text-sm mb-2">Overall Oral Health Score</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(result.overall_score || 0) > 80 ? 'bg-green-500' : (result.overall_score || 0) > 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${result.overall_score || 0}%` }} />
                  </div>
                  <span className="text-2xl font-bold text-white">{result.overall_score}/100</span>
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-3 mb-6">
                {result.areas?.map((area, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${
                    area.severity === 'none' ? 'bg-green-500/10 border-green-500/30' :
                    area.severity === 'mild' ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white text-sm">{area.region}</span>
                      <span className="text-white/40 text-xs">{(area.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-white/60 text-xs mt-1">{area.concern}</div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-bold mb-2 text-sm">Recommendations</h4>
                  <ul className="space-y-1.5">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                        <CheckCircle size={14} className="mt-0.5 text-green-400 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/30 text-xs text-red-300 mt-4">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {result.disclaimer || 'This is an AI-generated screening for demonstration purposes. Please consult a licensed dentist for professional evaluation.'}
              </div>
            </div>
          )}
        </div>
      )}
    </KioskLayout>
  );
}
