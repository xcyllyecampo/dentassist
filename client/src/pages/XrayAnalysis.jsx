import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { Upload, Brain, AlertTriangle } from 'lucide-react';

export default function XrayAnalysis() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);

  useEffect(() => { api.get('/patients').then(res => setPatients(res.data)); }, []);

  useEffect(() => {
    if (selectedPatient) {
      api.get(`/xray/patient/${selectedPatient}`).then(res => setImages(res.data));
    }
  }, [selectedPatient]);

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
    } catch (err) { alert('Error uploading image'); }
    setUploading(false);
  };

  const handleAnalyze = async (imageId) => {
    setAnalyzing(imageId);
    try {
      const res = await api.post(`/xray/analyze/${imageId}`);
      setImages(images.map(img => img.id === imageId ? res.data : img));
    } catch (err) { alert('Error analyzing image'); }
    setAnalyzing(null);
  };

  return (
    <Layout>
      <Header title="X-Ray Analysis" />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
            className="px-4 py-2 border border-sky-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none w-64">
            <option value="">Select Patient</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.user?.name}</option>)}
          </select>

          {selectedPatient && (
            <label className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 cursor-pointer text-sm font-medium">
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload X-Ray'}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>

        {!selectedPatient && (
          <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-12 text-center">
            <Brain size={48} className="text-sky-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-sky-900 mb-2">AI Dental X-Ray Assistant</h3>
            <p className="text-gray-500 text-sm">Select a patient to view and analyze their X-ray images. The AI will highlight possible cavities, bone loss, and impacted teeth.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {images.map((img) => (
            <div key={img.id} className="bg-white rounded-xl shadow-sm border border-sky-100 overflow-hidden">
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
                  <span className="text-xs px-2 py-1 bg-sky-100 text-sky-700 rounded-full">{img.fileType}</span>
                </div>
                <button onClick={() => handleAnalyze(img.id)} disabled={analyzing === img.id}
                  className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700 text-sm font-medium disabled:opacity-50">
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
                    <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      {img.analysis.disclaimer}
                    </div>
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
