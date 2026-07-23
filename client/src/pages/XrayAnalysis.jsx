import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Upload, Brain, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

export default function XrayAnalysis() {
  const toast = useToast();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [directAnalysis, setDirectAnalysis] = useState(null);
  const [directPreview, setDirectPreview] = useState(null);

  useEffect(() => { api.get('/patients').then(res => setPatients(res.data)).catch(() => toast.error('Failed to load patients')); }, []);

  useEffect(() => {
    if (selectedPatient) {
      api.get(`/xray/patient/${selectedPatient}`).then(res => setImages(res.data)).catch(() => setImages([]));
    }
  }, [selectedPatient]);

  useEffect(() => {
    return () => {
      if (directPreview) URL.revokeObjectURL(directPreview);
    };
  }, [directPreview]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedPatient) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('patientId', selectedPatient);
    formData.append('fileType', 'xray');
    try {
      const res = await api.post('/xray/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImages([res.data, ...images]);
      toast.success('X-ray uploaded');
    } catch (err) { toast.error('Error uploading image'); }
    setUploading(false);
  };

  const handleDirectAnalyze = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (directPreview) URL.revokeObjectURL(directPreview);
    setDirectPreview(URL.createObjectURL(file));
    setAnalyzing('direct');
    setDirectAnalysis(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/ai/xray/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDirectAnalysis({ ...res.data, fileName: file.name });
    } catch (err) { toast.error('Error analyzing image. Make sure the AI service is running.'); }
    setAnalyzing(null);
  };

  const handleAnalyze = async (imageId) => {
    setAnalyzing(imageId);
    try {
      const res = await api.post(`/xray/analyze/${imageId}`);
      setImages(images.map(img => img.id === imageId ? res.data : img));
    } catch (err) { toast.error('Error analyzing image'); }
    setAnalyzing(null);
  };

  return (
    <Layout>
      <Header title="X-Ray Analysis" />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none w-64">
            <option value="">Select Patient (for saved images)</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.user?.name}</option>)}
          </select>

          {selectedPatient && (
            <label className="flex items-center gap-2 bg-[#0F766E] text-white px-4 py-2 rounded-lg hover:bg-[#0D6D65] cursor-pointer text-sm font-medium">
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload X-Ray'}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>

        <div className="bg-gradient-to-r from-[#F0FDFA] to-[#F0FDFA] rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#0F766E] text-white rounded-xl flex items-center justify-center">
              <Brain size={28} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">Quick AI Analysis</h3>
              <p className="text-sm text-gray-600">Upload an X-ray directly for instant AI analysis (no patient record needed)</p>
            </div>
            <label className="flex items-center gap-2 bg-[#0F766E] text-white px-6 py-3 rounded-lg hover:bg-[#0D6D65] cursor-pointer text-sm font-medium">
              <Upload size={16} /> {analyzing === 'direct' ? 'Analyzing...' : 'Choose X-Ray File'}
              <input type="file" accept="image/*" onChange={handleDirectAnalyze} className="hidden" disabled={analyzing} />
            </label>
          </div>
        </div>

        {analyzing === 'direct' && directPreview && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Loader size={20} className="animate-spin text-[#0F766E]" />
              <h3 className="font-bold text-slate-900">Analyzing X-Ray...</h3>
            </div>
            <div className="relative">
              <img src={directPreview} alt="X-Ray" className="w-full max-h-80 object-contain rounded-lg border border-slate-200" />
              <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Brain size={40} className="text-[#0F766E] mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-medium text-slate-700">AI is examining your X-ray...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {directAnalysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Uploaded X-Ray — {directAnalysis.fileName}</h3>
              <img src={directPreview} alt="X-Ray" className="w-full rounded-lg border border-slate-200" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">AI Analysis Result</h3>
                <span className={`text-xs px-3 py-1 rounded-full ${directAnalysis.source === 'gemini' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {directAnalysis.source === 'gemini' ? 'DentAssist AI Vision' : 'Demo Mode'}
                </span>
              </div>

            {directAnalysis.overall_assessment && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-[#064E3B] mb-4">
                <strong>Assessment:</strong> {directAnalysis.overall_assessment}
              </div>
            )}

            <div className="space-y-3 mb-4">
              {directAnalysis.findings?.map((finding, i) => (
                <div key={i} className={`p-4 rounded-lg border ${
                  finding.severity === 'severe' ? 'bg-red-50 border-red-200' :
                  finding.severity === 'moderate' ? 'bg-amber-50 border-amber-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900">{finding.area}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        finding.severity === 'severe' ? 'bg-red-200 text-red-800' :
                        finding.severity === 'moderate' ? 'bg-amber-200 text-amber-800' :
                        'bg-green-200 text-green-800'
                      }`}>{finding.severity}</span>
                      <span className="text-xs text-gray-500">{(finding.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{finding.description}</p>
                </div>
              ))}
            </div>

            {directAnalysis.recommendations?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {directAnalysis.recommendations.map((rec, i) => (
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
              {directAnalysis.disclaimer || "This is an AI-generated analysis and should NOT be considered a definitive diagnosis. All findings must be verified by a licensed dentist."}
            </div>
          </div>
          </div>
        )}

        {!selectedPatient && !directAnalysis && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Brain size={48} className="text-[#14B8A6] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">AI Dental X-Ray Assistant</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Upload an X-ray image using the button above for instant AI analysis, or select a patient to manage their saved X-ray records.
              The AI will identify possible cavities, bone loss, and impacted teeth.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {images.map((img) => (
            <div key={img.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                <img src={`/${img.filePath}`} alt="X-Ray" className="w-full h-full object-cover" />
                {img.analysis && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Brain size={12} /> Analyzed
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{new Date(img.createdAt).toLocaleDateString()}</span>
                  <span className="text-xs px-2 py-1 bg-[#F0FDFA] text-[#0D6D65] rounded-full">{img.fileType}</span>
                </div>
                <button onClick={() => handleAnalyze(img.id)} disabled={analyzing === img.id}
                  className="w-full flex items-center justify-center gap-2 bg-[#0F766E] text-white py-2 rounded-lg hover:bg-[#0D6D65] text-sm font-medium disabled:opacity-50">
                  <Brain size={16} />
                  {analyzing === img.id ? 'Analyzing...' : img.analysis ? 'Re-analyze' : 'Analyze with AI'}
                </button>
                {img.analysis && (
                  <div className="mt-3 space-y-2">
                    {img.analysis.findings?.map((finding, i) => (
                      <div key={i} className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                        <div className="font-medium text-amber-800">{finding.area}</div>
                        <div className="text-gray-600">{finding.description}</div>
                        <div className="text-amber-600 mt-1">Confidence: {(finding.confidence * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                    {img.analysis.disclaimer && (
                      <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        {img.analysis.disclaimer}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
