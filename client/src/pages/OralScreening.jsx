import { useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Camera, AlertTriangle, CheckCircle, Brain } from 'lucide-react';

export default function OralScreening() {
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
      toast.error('Error analyzing image. Make sure the AI service is running.');
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
    <Layout>
      <Header title="AI Oral Screening" />
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="text-center">
            <Camera size={48} className="text-[#6b9ae8] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Upload Mouth Photo for Screening</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              Take a clear photo of the inside of your mouth. The AI will analyze it and highlight any areas of concern.
            </p>
            <label className="inline-flex items-center gap-2 bg-[#004aad] text-white px-6 py-3 rounded-lg hover:bg-[#003782] cursor-pointer font-medium">
              <Camera size={18} /> Choose Photo
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        </div>

        {preview && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Uploaded Photo</h3>
              <img src={preview} alt="Oral photo" className="w-full rounded-lg" />
              <button onClick={handleAnalyze} disabled={analyzing}
                className="w-full mt-4 bg-[#004aad] text-white py-3 rounded-lg font-medium hover:bg-[#003782] disabled:opacity-50 flex items-center justify-center gap-2">
                <Brain size={18} />
                {analyzing ? 'Analyzing with AI...' : 'Run AI Analysis'}
              </button>
            </div>

            {result && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Analysis Results</h3>
                  <span className={`text-xs px-3 py-1 rounded-full ${result.source === 'gemini' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {result.source === 'gemini' ? 'DentAssist AI Vision' : 'Demo Mode'}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Overall Oral Health Score</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${(result.overall_score || 0) > 80 ? 'bg-green-500' : (result.overall_score || 0) > 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${result.overall_score || 0}%` }} />
                    </div>
                    <span className="text-lg font-bold text-slate-900">{result.overall_score}/100</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {result.areas?.map((area, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${
                      area.severity === 'none' ? 'bg-green-50 border-green-200' :
                      area.severity === 'mild' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-slate-900">{area.region}</span>
                        <span className="text-xs text-gray-500">{(area.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{area.concern}</div>
                    </div>
                  ))}
                </div>

                {result.recommendations?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle size={14} className="mt-0.5 text-green-500 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {result.disclaimer || "This is an AI-generated screening and is NOT a medical diagnosis. Please consult a licensed dentist for professional evaluation."}
                </div>

                <button onClick={handleReset} className="w-full mt-4 bg-white border border-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <Camera size={16} /> Upload Another Photo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
