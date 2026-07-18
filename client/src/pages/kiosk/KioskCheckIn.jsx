import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { playSuccess } from '../../lib/sounds';
import { TREATMENTS } from '../../lib/treatments';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, DollarSign, Loader } from 'lucide-react';

const STEPS = ['Choose Treatment', 'Confirm', 'Done'];

export default function KioskCheckIn() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [checking, setChecking] = useState(false);
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    api.get('/queue/my-entry').then(res => {
      if (res.data) setEntry(res.data);
    }).catch(() => {});
  }, []);

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      const res = await api.post('/queue/self-check-in');
      setEntry(res.data);
      playSuccess();
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error checking in. Please try again.';
      toast.error(msg);
    }
    setChecking(false);
  };

  const progress = entry ? 100 : step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <KioskLayout title="Walk-In Check-In">
      {/* Step indicator */}
      {!entry && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > i + 1 ? 'bg-green-500 text-white' :
                  step === i + 1 ? 'bg-white text-slate-900' :
                  'bg-white/10 text-white/40'
                }`}>
                  {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:inline ${step === i + 1 ? 'text-white' : 'text-white/40'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`w-12 sm:w-20 h-0.5 mx-2 ${step > i + 1 ? 'bg-green-500' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-260px)]">

        {/* Already in queue */}
        {entry && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-green-500/40">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">You're Already Checked In</h2>
            <p className="text-white/50 text-lg mb-8">Please wait in the waiting area.</p>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 max-w-md mx-auto mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-white/50 text-sm mb-1">Position</div>
                  <div className="text-5xl font-bold text-white">#{entry.position}</div>
                </div>
                <div>
                  <div className="text-white/50 text-sm mb-1">Est. Wait</div>
                  <div className="text-5xl font-bold text-amber-400">{entry.estimatedWait || '?'}<span className="text-base text-white/50 ml-1">min</span></div>
                </div>
              </div>
            </div>
            <button onClick={() => navigate('/kiosk')} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors">
              Back to Home
            </button>
          </div>
        )}

        {/* Step 1: Choose Treatment */}
        {!entry && step === 1 && (
          <div className="w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">What brings you in today?</h2>
            <p className="text-white/50 text-center mb-6">Choose a treatment to continue</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {TREATMENTS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTreatment(t)}
                  className={`p-4 rounded-xl border-2 text-center transition-all active:scale-[0.97] ${
                    selectedTreatment?.name === t.name
                      ? 'border-blue-400 bg-blue-500/20 scale-[1.03] shadow-lg shadow-blue-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-3xl block mb-2">{t.icon}</span>
                  <div className="text-white font-bold text-xs mb-1">{t.name}</div>
                  <div className="text-green-400 text-xs font-medium">{t.cost}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedTreatment}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                selectedTreatment
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Next <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Confirm */}
        {!entry && step === 2 && selectedTreatment && (
          <div className="w-full max-w-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Confirm Your Check-In</h2>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{selectedTreatment.icon}</span>
                <div className="text-left">
                  <div className="text-white font-bold text-lg">{selectedTreatment.name}</div>
                  <div className="text-white/50 text-sm">{selectedTreatment.category}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left border-t border-white/10 pt-4">
                <div>
                  <div className="text-white/40 text-xs mb-1">Estimated Cost</div>
                  <div className="text-green-400 font-bold flex items-center gap-1"><DollarSign size={14} />{selectedTreatment.cost}</div>
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-1">Duration</div>
                  <div className="text-amber-400 font-bold flex items-center gap-1"><Clock size={14} />{selectedTreatment.duration}</div>
                </div>
              </div>
              <p className="text-white/40 text-xs mt-4 text-left">{selectedTreatment.description}</p>
            </div>

            <p className="text-white/50 text-sm mb-6">A staff member will call you when it's your turn.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                onClick={handleCheckIn}
                disabled={checking}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-green-500/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {checking ? (
                  <><Loader size={22} className="animate-spin" /> Checking In...</>
                ) : (
                  <><CheckCircle size={22} /> CHECK ME IN</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {!entry && step === 3 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-green-500/40">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">You're Checked In!</h2>
            <p className="text-white/50 text-lg mb-8">Please remain in the waiting area.</p>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 max-w-md mx-auto mb-4">
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <div className="text-white/50 text-sm mb-1">Position</div>
                  <div className="text-5xl font-bold text-white">#{entry?.position}</div>
                </div>
                <div>
                  <div className="text-white/50 text-sm mb-1">Est. Wait</div>
                  <div className="text-5xl font-bold text-amber-400">{entry?.estimatedWait || '?'}<span className="text-base text-white/50 ml-1">min</span></div>
                </div>
              </div>
              {selectedTreatment && (
                <div className="border-t border-white/10 pt-4">
                  <div className="text-white/40 text-xs mb-1">Treatment</div>
                  <div className="text-white font-medium">{selectedTreatment.icon} {selectedTreatment.name}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 max-w-md mx-auto">
              <button
                onClick={() => navigate('/kiosk/queue')}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Clock size={16} /> View Queue Status
              </button>
              <button
                onClick={() => navigate('/kiosk')}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </KioskLayout>
  );
}
