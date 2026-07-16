import { useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { Stethoscope, AlertTriangle, CheckCircle } from 'lucide-react';

const SYMPTOMS_DB = {
  'toothache': { possibleConditions: ['Dental cavity', 'Pulpitis', 'Abscess', 'Cracked tooth'], severity: 'high' },
  'sensitivity': { possibleConditions: ['Tooth erosion', 'Gum recession', 'Cavity', 'Worn filling'], severity: 'moderate' },
  'bleeding_gums': { possibleConditions: ['Gingivitis', 'Periodontitis', 'Vitamin deficiency'], severity: 'moderate' },
  'swelling': { possibleConditions: ['Abscess', 'Infection', 'Impacted tooth', 'TMJ disorder'], severity: 'high' },
  'bad_breath': { possibleConditions: ['Gum disease', 'Cavity', 'Tongue coating', 'Dry mouth'], severity: 'low' },
  'broken_tooth': { possibleConditions: ['Fracture', 'Enamel wear', 'Trauma'], severity: 'high' },
  'jaw_pain': { possibleConditions: ['TMJ disorder', 'Bruxism', 'Sinus issue', 'Impacted wisdom tooth'], severity: 'moderate' },
  'loose_tooth': { possibleConditions: ['Periodontitis', 'Trauma', 'Bone loss'], severity: 'high' },
};

const TREATMENTS_DB = {
  'Dental cavity': [
    { name: 'Composite Filling', description: 'Tooth-colored resin filling for small to medium cavities', cost: '$100-200', duration: '30-60 min' },
    { name: 'Crown', description: 'Full coverage for large cavities', cost: '$500-1000', duration: '2 visits' },
  ],
  'Pulpitis': [
    { name: 'Root Canal Treatment', description: 'Remove infected pulp, clean and seal the canal', cost: '$500-800', duration: '1-2 visits' },
    { name: 'Extraction + Implant', description: 'Remove tooth and place implant', cost: '$2000-3500', duration: 'Multiple visits' },
  ],
  'Abscess': [
    { name: 'Drainage + Antibiotics', description: 'Drain the abscess and prescribe antibiotics', cost: '$200-400', duration: '1 visit' },
    { name: 'Root Canal', description: 'If tooth is salvageable', cost: '$500-800', duration: '1-2 visits' },
  ],
  'Gingivitis': [
    { name: 'Professional Cleaning', description: 'Scale and polish to remove tartar', cost: '$80-150', duration: '30-45 min' },
    { name: 'Antibacterial Rinse', description: 'Chlorhexidine rinse prescription', cost: '$20-30', duration: '2 weeks' },
  ],
  'default': [
    { name: 'Consultation', description: 'Schedule a comprehensive examination', cost: '$30', duration: '30 min' },
    { name: 'X-Ray Examination', description: 'Digital X-ray for accurate diagnosis', cost: '$50-100', duration: '15 min' },
  ],
};

export default function TreatmentSupport() {
  const [symptoms, setSymptoms] = useState([]);
  const [examination, setExamination] = useState('');
  const [results, setResults] = useState(null);

  const symptomOptions = Object.entries(SYMPTOMS_DB).map(([key, val]) => ({
    id: key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    severity: val.severity,
  }));

  const toggleSymptom = (id) => {
    setSymptoms(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleAnalyze = () => {
    if (symptoms.length === 0) return;

    const conditions = new Set();
    symptoms.forEach(s => {
      SYMPTOMS_DB[s]?.possibleConditions.forEach(c => conditions.add(c));
    });

    const treatments = [];
    conditions.forEach(condition => {
      const t = TREATMENTS_DB[condition] || TREATMENTS_DB['default'];
      treatments.push({ condition, treatments: t });
    });

    const highSeverity = symptoms.some(s => SYMPTOMS_DB[s]?.severity === 'high');

    setResults({
      conditions: [...conditions],
      treatments,
      urgency: highSeverity ? 'HIGH — Recommend immediate consultation' : 'MODERATE — Schedule appointment within 1-2 days',
      disclaimer: 'This is a clinical decision support tool. The final treatment decision must be made by the licensed dentist after a thorough examination.',
    });
  };

  return (
    <Layout>
      <Header title="Treatment Recommendation Support" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6">
            <h3 className="font-bold text-sky-900 mb-4 flex items-center gap-2">
              <Stethoscope size={18} /> Patient Symptoms
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {symptomOptions.map(({ id, label, severity }) => (
                <button key={id} onClick={() => toggleSymptom(id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-all ${
                    symptoms.includes(id)
                      ? 'bg-sky-100 border-sky-400 text-sky-800'
                      : 'bg-white border-sky-200 text-gray-600 hover:bg-sky-50'
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
                className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
                placeholder="e.g., Visible cavity on tooth #19, gum inflammation, etc." />
            </div>

            <button onClick={handleAnalyze} disabled={symptoms.length === 0}
              className="w-full bg-sky-600 text-white py-3 rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50">
              Analyze & Suggest Treatments
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6">
            <h3 className="font-bold text-sky-900 mb-4">Recommendation Results</h3>

            {!results ? (
              <div className="text-center py-12 text-gray-400">
                <Stethoscope size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Select symptoms and click Analyze to see treatment recommendations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg border text-sm font-medium ${
                  results.urgency.includes('HIGH') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {results.urgency}
                </div>

                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Possible Conditions</div>
                  <div className="flex flex-wrap gap-2">
                    {results.conditions.map(c => (
                      <span key={c} className="text-xs px-3 py-1 bg-sky-100 text-sky-700 rounded-full">{c}</span>
                    ))}
                  </div>
                </div>

                {results.treatments.map((item, i) => (
                  <div key={i}>
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">{item.condition}</div>
                    <div className="space-y-2">
                      {item.treatments.map((t, j) => (
                        <div key={j} className="p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={14} className="text-green-600" />
                            <span className="font-medium text-sm text-green-800">{t.name}</span>
                          </div>
                          <div className="text-xs text-gray-600 ml-6">{t.description}</div>
                          <div className="flex gap-4 mt-1 ml-6 text-xs text-gray-500">
                            <span>Cost: {t.cost}</span>
                            <span>Duration: {t.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700 mt-4">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {results.disclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
