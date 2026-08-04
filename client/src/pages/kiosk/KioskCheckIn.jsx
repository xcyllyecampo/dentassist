import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KioskLayout from './KioskLayout';
import api, { authUrl } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { playSuccess, playClick, playError } from '../../lib/sounds';
import { TREATMENTS } from '../../lib/treatments';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Loader, CalendarCheck, Stethoscope } from 'lucide-react';

const STEPS = ['Choose Treatment', 'Choose Dentist', 'Confirm', 'Done'];

export default function KioskCheckIn() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [dentists, setDentists] = useState([]);
  const [checking, setChecking] = useState(false);
  const [entry, setEntry] = useState(null);
  const [todayAppt, setTodayAppt] = useState(null);
  const [checkingAppt, setCheckingAppt] = useState(false);

  useEffect(() => {
    api.get('/queue/my-entry').then(res => {
      if (res.data) setEntry(res.data);
    }).catch(() => {});
    const today = new Date().toLocaleDateString('en-CA');
    api.get(`/appointments?date=${today}`).then(res => {
      const myAppt = res.data.find(a =>
        (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && a.patient?.userId === user?.id
      );
      if (myAppt) setTodayAppt(myAppt);
    }).catch(() => {});
    api.get('/dentist-schedules/dentists').then(res => {
      setDentists(res.data || []);
    }).catch(() => {});
  }, []);

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      const res = await api.post('/queue/self-check-in', { dentistId: selectedDentist?.id || undefined });
      setEntry(res.data);
      playSuccess();
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error checking in. Please try again.';
      toast.error(msg);
      playError();
    }
    setChecking(false);
  };

  const handleAppointmentCheckIn = async () => {
    setCheckingAppt(true);
    try {
      const res = await api.put(`/appointments/${todayAppt.id}/check-in`);
      setEntry(res.data.queueEntry || { position: '—', estimatedWait: '—' });
      playSuccess();
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error checking in for appointment');
      playError();
    }
    setCheckingAppt(false);
  };

  const progress = entry ? 100 : step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

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
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(20,184,166,0.4)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">

        {/* Already in queue */}
        {entry && step !== 4 && (
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
                  <div className="text-4xl font-bold text-white">#{entry.effectivePosition ?? entry.position}</div>
                </div>
                <div>
                  <div className="text-white/50 text-xs mb-1">Est. Wait</div>
                  <div className="text-4xl font-bold text-amber-400">{entry.estimatedWait || '?'}<span className="text-sm text-white/50 ml-1">min</span></div>
                </div>
              </div>
            </div>
            <button onClick={() => { playClick(); navigate('/kiosk'); }} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors">
              Back to Home
            </button>
          </div>
        )}

        {/* Has an appointment today */}
        {!entry && todayAppt && step === 1 && (
          <div className="w-full mb-4">
            <div className="bg-gradient-to-br from-purple-600/30 to-purple-700/30 backdrop-blur-lg rounded-2xl border border-purple-400/40 p-5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
                  <CalendarCheck size={20} className="text-purple-300" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">You Have an Appointment Today!</h3>
                  <p className="text-purple-200/60 text-xs">Skip the queue — check in for your appointment</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 mb-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-white/40 text-[10px]">Time</div>
                    <div className="text-white font-bold text-sm">{todayAppt.time}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-[10px]">Dentist</div>
                    <div className="text-white font-bold text-sm">{todayAppt.dentist?.name || 'TBD'}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-[10px]">Reason</div>
                    <div className="text-white font-bold text-sm truncate">{todayAppt.reason || 'Checkup'}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { playClick(); handleAppointmentCheckIn(); }}
                disabled={checkingAppt}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {checkingAppt ? <><Loader size={18} className="animate-spin" /> Checking In...</> : <><CalendarCheck size={18} /> Check In for Appointment</>}
              </button>
            </div>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">or do a walk-in</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </div>
        )}

        {/* Step 1: Choose Treatment */}
        {!entry && step === 1 && (
          <div className="w-full">
            <h2 className="kiosk-heading text-lg text-white mb-1 text-center">What brings you in today?</h2>
            <p className="text-white/50 text-center text-sm mb-4">Choose a treatment to continue</p>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {TREATMENTS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => { playClick(); setSelectedTreatment(t); }}
                  className={`p-3 rounded-xl border-2 text-center transition-all active:scale-[0.97] ${
                    selectedTreatment?.name === t.name
                      ? 'border-teal-400 bg-teal-500/20 scale-[1.03] shadow-lg shadow-teal-500/20'
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
              onClick={() => { playClick(); setStep(2); }}
              disabled={!selectedTreatment}
              className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                selectedTreatment
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/30'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Next <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Choose Dentist */}
        {!entry && step === 2 && (
          <div className="w-full">
            <h2 className="kiosk-heading text-lg text-white mb-1 text-center">Choose a Dentist</h2>
            <p className="text-white/50 text-center text-sm mb-4">Pick your preferred dentist (optional)</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => { playClick(); setSelectedDentist(null); }}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  !selectedDentist
                    ? 'border-teal-400 bg-teal-500/20 shadow-lg shadow-teal-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Stethoscope size={24} className="text-white/60" />
                </div>
                <div className="text-white font-bold text-sm">No Preference</div>
                <div className="text-white/40 text-xs">First available</div>
              </button>
              {dentists.map(d => (
                <button
                  key={d.id}
                  onClick={() => { playClick(); setSelectedDentist(d); }}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    selectedDentist?.id === d.id
                      ? 'border-teal-400 bg-teal-500/20 shadow-lg shadow-teal-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {d.avatar ? (
                    <img src={authUrl(d.avatar)} alt={d.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/20 mx-auto mb-2" />
                  ) : (
                    <div className="w-14 h-14 bg-teal-500/30 text-white rounded-full flex items-center justify-center text-lg font-bold ring-2 ring-white/20 mx-auto mb-2">
                      {d.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="text-white font-bold text-sm">{d.name}</div>
                  <div className="text-white/40 text-xs">Dentist</div>
                  {selectedDentist?.id === d.id && (
                    <CheckCircle size={16} className="text-teal-400 mx-auto mt-1.5" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { playClick(); setStep(1); }}
                className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => { playClick(); setStep(3); }}
                className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-bold text-base hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 transition-all"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {!entry && step === 3 && selectedTreatment && (
          <div className="w-full text-center">
            <h2 className="kiosk-heading text-lg text-white mb-4">Confirm Your Check-In</h2>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-5 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{selectedTreatment.icon}</span>
                <div className="text-left">
                  <div className="text-white font-bold text-base">{selectedTreatment.name}</div>
                  <div className="text-white/50 text-xs">{selectedTreatment.category}</div>
                </div>
              </div>
              {selectedDentist && (
                <div className="flex items-center gap-2.5 border-t border-white/10 pt-3 mb-3">
                  {selectedDentist.avatar ? (
                    <img src={authUrl(selectedDentist.avatar)} alt={selectedDentist.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20" />
                  ) : (
                    <div className="w-8 h-8 bg-teal-500/30 text-white rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/20">
                      <Stethoscope size={14} />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-white/40 text-[10px]">Dentist</div>
                    <div className="text-white font-medium text-sm">{selectedDentist.name}</div>
                  </div>
                </div>
              )}
              {!selectedDentist && (
                <div className="border-t border-white/10 pt-3 mb-3 text-left">
                  <div className="text-white/40 text-[10px]">Dentist</div>
                  <div className="text-white/50 text-xs italic">No preference (first available)</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-left border-t border-white/10 pt-3">
                <div>
                  <div className="text-white/40 text-[10px] mb-0.5">Estimated Cost</div>
                  <div className="text-green-400 font-bold text-sm flex items-center gap-1">{selectedTreatment.cost}</div>
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
                onClick={() => { playClick(); setStep(2); }}
                className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => { playClick(); handleCheckIn(); }}
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

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center w-full kiosk-scale-in">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-green-500/40 shadow-[0_0_24px_rgba(34,197,94,0.2)]">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="kiosk-display text-2xl text-white mb-1">You're Checked In!</h2>
            <p className="text-white/50 text-sm mb-6">Please remain in the waiting area.</p>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-5 mb-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-white/50 text-xs mb-1">Position</div>
                  <div className="text-4xl font-bold text-white">#{entry?.effectivePosition ?? entry?.position}</div>
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
              {selectedDentist && (
                <div className="border-t border-white/10 pt-3">
                  <div className="text-white/40 text-[10px] mb-0.5">Dentist</div>
                  <div className="text-white font-medium text-sm">{selectedDentist.name}</div>
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
                onClick={() => { playClick(); navigate('/kiosk'); }}
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
