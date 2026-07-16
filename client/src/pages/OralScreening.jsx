import { useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { Camera, AlertTriangle, CheckCircle } from 'lucide-react';

export default function OralScreening() {
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

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setResult({
        areas: [
          { region: 'Upper left molar area', concern: 'Possible plaque buildup', severity: 'mild', confidence: 0.78 },
          { region: 'Lower front teeth', concern: 'Slight gum recession detected', severity: 'moderate', confidence: 0.65 },
          { region: 'Right wisdom tooth area', concern: 'Appears normal', severity: 'none', confidence: 0.92 },
        ],
        overallScore: 72,
        recommendation: 'Schedule a professional cleaning within the next 2 weeks. Monitor gum recession in lower front teeth area.',
      });
      setAnalyzing(false);
    }, 2500);
  };

  return (
    <Layout>
      <Header title="AI Oral Screening" />
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-8 mb-6">
          <div className="text-center">
            <Camera size={48} className="text-sky-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-sky-900 mb-2">Upload Mouth Photo for Screening</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              Take a clear photo of the inside of your mouth. The AI will analyze it and highlight any areas of concern.
            </p>
            <label className="inline-flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 cursor-pointer font-medium">
              <Camera size={18} /> Choose Photo
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        </div>

        {preview && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6">
              <h3 className="font-bold text-sky-900 mb-4">Uploaded Photo</h3>
              <img src={preview} alt="Oral photo" className="w-full rounded-lg" />
              <button onClick={handleAnalyze} disabled={analyzing}
                className="w-full mt-4 bg-sky-600 text-white py-3 rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50">
                {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            </div>

            {result && (
              <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6">
                <h3 className="font-bold text-sky-900 mb-4">Analysis Results</h3>

                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Overall Oral Health Score</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${result.overallScore > 80 ? 'bg-green-500' : result.overallScore > 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${result.overallScore}%` }} />
                    </div>
                    <span className="text-lg font-bold text-sky-900">{result.overallScore}/100</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {result.areas.map((area, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${
                      area.severity === 'none' ? 'bg-green-50 border-green-200' :
                      area.severity === 'mild' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-sky-900">{area.region}</span>
                        <span className="text-xs text-gray-500">{(area.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{area.concern}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 text-sm text-sky-800 mb-4">
                  <strong>Recommendation:</strong> {result.recommendation}
                </div>

                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <strong>Disclaimer:</strong> This is an AI-generated screening and is NOT a medical diagnosis. 
                    Please consult a licensed dentist for professional evaluation and treatment.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
