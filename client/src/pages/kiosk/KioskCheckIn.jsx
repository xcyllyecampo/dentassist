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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > i + 1 ? 'bg-green-500 text-white' :
                  step === i + 1 ? 'bg-white text-slate-900' :
                  'bg-white/10 text-white/40'
                }`}>
                  {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === i + 1 ? 'text-white' : 'text-white/40'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`w-6 h-0.5 mx-1 ${step > i + 1 ? 'bg-green-500' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">

        {/* Already in queue */}
        {entry && (
          <div className="text-center w-full">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-green-500/40">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">You're Already Checked In</h2>
            <p className="text-white/50 text-sm mb-6">Please wait in the waiting area.</p>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-5 mb-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-white/50 text-xs mb-1">Position</div>
                  <div className="text-4xl font-bold text-white">#{entry.position}</div>
                </div>
                <div>
                  <div className="text-white/50 text-xs mb-1">Est. Wait</div>
                  <div className="text-4xl font-bold text-amber-400">{entry.estimatedWait || '?'}<span className="text-sm text-white/50 ml-1">min</span></div>
                </div>
              </div>
            </div>
            <button onClick={() => navigate('/kiosk')} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors">
              Back to Home
            </button>
          </div>
        )}

        {/* Step 1: Choose Treatment */}
        {!entry && step === 1 && (
          <div className="w-full">
            <h2 className="text-lg font-bold text-white mb-1 text-center">What brings you in today?</h2>
            <p className="text-white/50 text-center text-sm mb-4">Choose a treatment to continue</p>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {TREATMENTS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTreatment(t)}
                  className={`p-3 rounded-xl border-2 text-center transition-all active:scale-[0.97] ${
                    selectedTreatment?.name === t.name
                      ? 'border-blue-400 bg-blue-500/20 scale-[1.03] shadow-lg shadow-blue-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl block mb-1">{t.icon}</span>
                  <div className="text-white font-bold text-[11px] mb-0.5 leading-tight">{t.name}</div>
                  <div className="text-green-400 text-[10px] font-medium">{t.cost}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedTreatment}
              className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                selectedTreatment
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Next <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Confirm */}
        {!entry && step === 2 && selectedTreatment && (
          <div className="w-full text-center">
            <h2 className="text-lg font-bold text-white mb-4">Confirm Your Check-In</h2>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-5 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{selectedTreatment.icon}</span>
                <div className="text-left">
                  <div className="text-white font-bold text-base">{selectedTreatment.name}</div>
                  <div className="text-white/50 text-xs">{selectedTreatment.category}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left border-t border-white/10 pt-3">
                <div>
                  <div className="text-white/40 text-[10px] mb-0.5">Estimated Cost</div>
                  <div className="text-green-400 font-bold text-sm flex items-center gap-1"><DollarSign size={12} />{selectedTreatment.cost}</div>
                </div>
                <div>
                  <div className="text-white/40 text-[10px] mb-0.5">Duration</div>
                  <div className="text-amber-400 font-bold text-sm flex items-center gap-1"><Clock size={12} />{selectedTreatment.duration}</div>
                </div>
              </div>
              <p className="text-white/40 text-xs mt-3 text-left">{selectedTreatment.description}</p>
            </div>

            <p className="text-white/50 text-xs mb-5">A staff member will call you when it's your turn.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={handleCheckIn}
                disabled={checking}
                className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-green-500/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {checking ? (
                  <><Loader size={20} className="animate-spin" /> Checking In...</>
                ) : (
                  <><CheckCircle size={20} /> CHECK ME IN</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {!entry && step === 3 && (
          <div className="text-center w-full">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-green-500/40">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">You're Checked In!</h2>
            <p className="text-white/50 text-sm mb-6">Please remain in the waiting area.</p>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-5 mb-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-white/50 text-xs mb-1">Position</div>
                  <div className="text-4xl font-bold text-white">#{entry?.position}</div>
                </div>
                <div>
                  <div className="text-white/50 text-xs mb-1">Est. Wait</div>
                  <div className="text-4xl font-bold text-amber-400">{entry?.estimatedWait || '?'}<span className="text-sm text-white/50 ml-1">min</span></div>
                </div>
              </div>
              {selectedTreatment && (
                <div className="border-t border-white/10 pt-3">
                  <div className="text-white/40 text-[10px] mb-0.5">Treatment</div>
                  <div className="text-white font-medium text-sm">{selectedTreatment.icon} {selectedTreatment.name}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/kiosk/queue')}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Clock size={14} /> Queue Status
              </button>
              <button
                onClick={() => navigate('/kiosk')}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        )}
      </div>
    </KioskLayout>
  );
}
