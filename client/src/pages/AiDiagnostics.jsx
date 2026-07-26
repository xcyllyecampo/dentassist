import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api, { authUrl } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { playHover, playReveal } from '../lib/sounds';
import {
  Camera, Brain, AlertTriangle, CheckCircle, Loader, Image, Upload,
  Sparkles, Stethoscope, TrendingUp, Clock, ScanFace, Pill, ArrowLeft
} from 'lucide-react';

const CARDS = [
  { id: 'xray', label: 'X-Ray Analysis', subtitle: 'AI-powered cavity, bone loss & impacted tooth detection from dental radiographs', icon: Image, gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0e7490 50%, #06b6d4 100%)', image: '/images/xray-bg.png' },
  { id: 'oral', label: 'Oral Screening', subtitle: 'Instant oral health assessment with AI vision — identify gum disease, lesions & more', icon: ScanFace, gradient: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)', image: '/images/oral-bg.png' },
  { id: 'smile', label: 'Smile Simulation', subtitle: 'Visualize your smile transformation — whitening, veneers & alignment previews', icon: Sparkles, gradient: 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a78bfa 100%)', image: '/images/smile-bg.png' },
  { id: 'treatment', label: 'Treatment Support', subtitle: 'Symptom-based diagnosis with AI treatment recommendations, costs & timelines', icon: Pill, gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)', image: '/images/treatment-bg.png' },
];

const TREATMENT_TYPES = [
  { value: 'whitening', label: 'Teeth Whitening', icon: '✨', desc: 'Brighten your smile by several shades' },
  { value: 'veneers', label: 'Porcelain Veneers', icon: '🦷', desc: 'Perfect shape, color, and symmetry' },
  { value: 'alignment', label: 'Teeth Alignment', icon: '📐', desc: 'Straighten crooked or crowded teeth' },
];

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

function ScoreBar({ current, simulated, label }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-bold text-slate-900">{current} → {simulated}</span>
      </div>
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        <div className="absolute h-full bg-gray-400 rounded-full" style={{ width: `${current}%` }} />
        <div className="absolute h-full bg-gradient-to-r from-[#14B8A6] to-green-400 rounded-full opacity-70" style={{ width: `${simulated}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>Current</span>
        <span>Simulated</span>
      </div>
    </div>
  );
}

function Disclaimer({ text }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      {text}
    </div>
  );
}

function ServiceCard({ card, onReveal }) {
  const cardRef = useRef(null);
  const bgRef = useRef(null);
  const lastHovered = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || !bgRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
    bgRef.current.style.transform = `translate(${-x}px, ${-y}px) scale(1.08)`;
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (lastHovered.current !== card.id) {
      lastHovered.current = card.id;
      playHover();
    }
  }, [card.id]);

  const handleMouseLeave = useCallback(() => {
    if (bgRef.current) bgRef.current.style.transform = 'translate(0, 0) scale(1.08)';
  }, []);

  const handleClick = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    onReveal(card, { top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  }, [card, onReveal]);

  const Icon = card.icon;

  return (
    <div
      ref={cardRef}
      className="ai-service-card"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={bgRef}
        className="ai-card-bg"
        style={{ backgroundImage: card.image ? `url(${card.image})` : card.gradient, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="ai-card-overlay" />
      <div className="ai-card-content">
        <div className="ai-card-icon-wrap">
          <Icon size={24} className="text-white" />
        </div>
        <h3 className="ai-card-title">{card.label}</h3>
        <p className="ai-card-subtitle">{card.subtitle}</p>
      </div>
    </div>
  );
}

export default function AiDiagnostics() {
  const [view, setView] = useState('grid');
  const [revealCard, setRevealCard] = useState(null);
  const [cardRect, setCardRect] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [panelReady, setPanelReady] = useState(false);
  const toast = useToast();
  const overlayRef = useRef(null);

  const handleReveal = useCallback((card, rect) => {
    setRevealCard(card);
    setCardRect(rect);
    setView('tool');
    setExpanded(false);
    setPanelReady(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExpanded(true);
        playReveal();
        setTimeout(() => setPanelReady(true), 200);
      });
    });
  }, []);

  const handleBack = useCallback(() => {
    setPanelReady(false);
    setExpanded(false);
    setTimeout(() => {
      setView('grid');
      setRevealCard(null);
      setCardRect(null);
    }, 500);
  }, []);

  useEffect(() => {
    if (view === 'tool') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [view]);

  const bgStyle = revealCard
    ? { backgroundImage: revealCard.image ? `url(${revealCard.image})` : revealCard.gradient, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  const initialTransform = cardRect
    ? {
        transform: `translate(${cardRect.left}px, ${cardRect.top}px) scale(${cardRect.width / window.innerWidth}, ${cardRect.height / window.innerHeight})`,
        transformOrigin: 'top left',
      }
    : {};

  return (
    <>
      <Layout>
        <Header title="AI Diagnostics" subtitle="Select an AI-powered tool to get started" />
        <div className="p-4 md:p-6">
          <div className="ai-cards-grid">
            {CARDS.map((card) => (
              <ServiceCard key={card.id} card={card} onReveal={handleReveal} />
            ))}
          </div>
        </div>
      </Layout>

      {view === 'tool' && revealCard && (
        <div
          ref={overlayRef}
          className={`ai-reveal-overlay ${expanded ? 'expanded' : ''}`}
          style={expanded ? bgStyle : { ...bgStyle, ...initialTransform }}
        >
          <div className="ai-reveal-dark" />
          <button className="ai-reveal-back" onClick={handleBack}>
            <ArrowLeft size={16} /> Back to tools
          </button>
          <div className="ai-reveal-title">{revealCard.label}</div>
          <div className={`ai-reveal-panel ${panelReady ? '' : 'pointer-events-none'}`}>
            {revealCard.id === 'xray' && <XrayTab toast={toast} />}
            {revealCard.id === 'oral' && <OralTab toast={toast} />}
            {revealCard.id === 'smile' && <SmileTab toast={toast} />}
            {revealCard.id === 'treatment' && <TreatmentTab toast={toast} />}
          </div>
        </div>
      )}
    </>
  );
}

function XrayTab({ toast }) {
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
    return () => { if (directPreview) URL.revokeObjectURL(directPreview); };
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
    } catch (err) { toast.error('Error analyzing image. Please try again.'); }
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
    <>
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
            <img src={directPreview} alt="X-Ray" className="w-full max-h-[400px] object-contain rounded-lg border border-slate-200" />
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
            <img src={directPreview} alt="X-Ray" className="w-full max-h-[400px] object-contain rounded-lg border border-slate-200" />
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
            <Disclaimer text={directAnalysis.disclaimer || "This is an AI-generated analysis and should NOT be considered a definitive diagnosis. All findings must be verified by a licensed dentist."} />
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
              <img src={authUrl(`/${img.filePath}`)} alt="X-Ray" className="w-full h-full object-cover" />
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
                    <Disclaimer text={img.analysis.disclaimer} />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function OralTab({ toast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
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
    } catch (err) {
      toast.error('Error analyzing image. Please try again.');
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
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
        <div className="text-center">
          <Camera size={48} className="text-[#14B8A6] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Upload Mouth Photo for Screening</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Take a clear photo of the inside of your mouth. The AI will analyze it and highlight any areas of concern.
          </p>
          <label className="inline-flex items-center gap-2 bg-[#0F766E] text-white px-6 py-3 rounded-lg hover:bg-[#0D6D65] cursor-pointer font-medium">
            <Camera size={18} /> Choose Photo
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      </div>

      {preview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Uploaded Photo</h3>
            <img src={preview} alt="Oral photo" className="w-full max-h-[400px] object-contain rounded-lg" />
            <button onClick={handleAnalyze} disabled={analyzing}
              className="w-full mt-4 bg-[#0F766E] text-white py-3 rounded-lg font-medium hover:bg-[#0D6D65] disabled:opacity-50 flex items-center justify-center gap-2">
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

              <Disclaimer text={result.disclaimer || "This is an AI-generated screening and is NOT a medical diagnosis. Please consult a licensed dentist for professional evaluation."} />

              <button onClick={handleReset} className="w-full mt-4 bg-white border border-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Camera size={16} /> Upload Another Photo
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function SmileTab({ toast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [treatmentType, setTreatmentType] = useState('whitening');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
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
    } catch (err) {
      toast.error('Error running simulation. Please try again.');
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
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
        <div className="text-center mb-6">
          <Sparkles size={48} className="text-[#14B8A6] mx-auto mb-4" />
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
                  ? 'border-[#0F766E] bg-slate-50 shadow-sm'
                  : 'border-gray-200 hover:border-[#14B8A6] hover:bg-gray-50'
              }`}>
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="font-medium text-slate-900 text-sm">{t.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <label className="inline-flex items-center gap-2 bg-[#0F766E] text-white px-6 py-3 rounded-lg hover:bg-[#0D6D65] cursor-pointer font-medium">
            <Camera size={18} /> Choose Smile Photo
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      </div>

      {preview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Your Smile Photo</h3>
            <img src={preview} alt="Smile" className="w-full max-h-[400px] object-contain rounded-lg" />
            <button onClick={handleSimulate} disabled={simulating}
              className="w-full mt-4 bg-gradient-to-r from-[#0F766E] to-[#0F766E] text-white py-3 rounded-lg font-medium hover:from-[#0D6D65] hover:to-[#0D6D65] disabled:opacity-50 flex items-center justify-center gap-2">
              <Sparkles size={18} />
              {simulating ? 'Simulating...' : `Simulate ${TREATMENT_TYPES.find(t => t.value === treatmentType)?.label}`}
            </button>
          </div>

          {result && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Simulation Results</h3>
                <span className={`text-xs px-3 py-1 rounded-full ${result.source === 'gemini' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {result.source === 'gemini' ? 'AI-Powered' : 'Demo Mode'}
                </span>
              </div>

              {result.current_analysis && result.simulated_result && (
                <ScoreBar current={result.current_analysis.smile_score} simulated={result.simulated_result.smile_score} label="Smile Score" />
              )}

              {result.simulated_result?.description && (
                <div className="p-4 bg-gradient-to-r from-[#F0FDFA] to-[#F0FDFA] rounded-lg border border-slate-200 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-[#0F766E]" />
                    <span className="text-sm font-bold text-slate-900">Expected Outcome</span>
                  </div>
                  <p className="text-sm text-gray-700">{result.simulated_result.description}</p>
                  {result.simulated_result.estimated_shade_change && (
                    <p className="text-xs text-[#0F766E] mt-1 font-medium">{result.simulated_result.estimated_shade_change}</p>
                  )}
                </div>
              )}

              {Array.isArray(result.simulated_result?.changes) && result.simulated_result.changes.length > 0 && (
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

              {Array.isArray(result.current_analysis?.observations) && result.current_analysis.observations.length > 0 && (
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

              {Array.isArray(result.procedures) && result.procedures.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Recommended Procedures</h4>
                  <div className="space-y-2">
                    {result.procedures.map((proc, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="font-medium text-slate-900 text-sm">{proc.name}</div>
                        <p className="text-xs text-gray-600 mt-0.5">{proc.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">{proc.cost}</span>
                          <span className="flex items-center gap-1"><Clock size={12} />{proc.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.timeline && (
                <div className="p-3 bg-[#F0FDFA] rounded-lg border border-[#99F6E4] mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-[#0F766E]" />
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

              <Disclaimer text={result.disclaimer || "This is an AI-generated simulation for informational purposes only. Actual results may vary. A licensed dentist must evaluate before any treatment."} />

              <button onClick={handleReset} className="w-full mt-4 bg-white border border-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Camera size={16} /> Upload Another Photo
              </button>
            </div>
          )}
        </div>
      )}

      {!preview && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Sparkles size={48} className="text-[#14B8A6] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">See Your Smile Transformation</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Upload a clear photo of your smile, choose a treatment type, and let our AI show you what your new smile could look like.
          </p>
        </div>
      )}
    </>
  );
}

function TreatmentTab({ toast }) {
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
      toast.error('Error getting suggestions. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Stethoscope size={18} /> Patient Information
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Age</label>
            <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
              placeholder="e.g. 35" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select value={patientGender} onChange={e => setPatientGender(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none">
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
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
            placeholder="e.g. Diabetes, allergies, current medications" />
        </div>

        <h4 className="text-sm font-bold text-slate-900 mb-3">Symptoms</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {SYMPTOMS.map(({ id, label, severity }) => (
            <button key={id} onClick={() => toggleSymptom(id)}
              className={`p-3 rounded-lg border text-left text-sm transition-all ${
                symptoms.includes(id)
                  ? 'bg-[#F0FDFA] border-[#14B8A6] text-[#064E3B]'
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
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
            placeholder="e.g., Visible cavity on tooth #19, gum inflammation, etc." />
        </div>

        <button onClick={handleAnalyze} disabled={symptoms.length === 0 || loading}
          className="w-full bg-[#0F766E] text-white py-3 rounded-lg font-medium hover:bg-[#0D6D65] disabled:opacity-50 flex items-center justify-center gap-2">
          <Brain size={18} />
          {loading ? 'Analyzing...' : 'Analyze & Suggest Treatments'}
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Recommendation Results</h3>
          {results && (
            <span className={`text-xs px-3 py-1 rounded-full ${results.source === 'gemini' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {results.source === 'gemini' ? 'AI-Powered' : 'Demo Mode'}
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
  );
}
