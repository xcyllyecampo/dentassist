import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { playClick, playSuccess, playError } from '../../lib/sounds';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { CalendarCheck, Clock, User, ChevronLeft, CheckCircle, Calendar } from 'lucide-react';

const TREATMENTS = [
  { id: 'checkup', label: 'General Checkup', duration: 30 },
  { id: 'cleaning', label: 'Teeth Cleaning', duration: 45 },
  { id: 'filling', label: 'Tooth Filling', duration: 45 },
  { id: 'extraction', label: 'Tooth Extraction', duration: 30 },
  { id: 'whitening', label: 'Teeth Whitening', duration: 60 },
  { id: 'braces', label: 'Braces Consultation', duration: 30 },
  { id: 'rootcanal', label: 'Root Canal', duration: 60 },
  { id: 'other', label: 'Other', duration: 30 },
];

export default function KioskBookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [treatment, setTreatment] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDentist, setSelectedDentist] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      api.get(`/appointments/available-slots?date=${selectedDate}`)
        .then(res => { setAvailableSlots(res.data.availableSlots); setDentists(res.data.dentists); })
        .catch(() => { setAvailableSlots([]); setDentists([]); })
        .finally(() => setLoading(false));
    }
  }, [selectedDate]);

  const handleBook = async () => {
    setSubmitting(true);
    try {
      await api.post('/appointments', {
        patientId: user.patientId || user.id,
        dentistId: selectedDentist || undefined,
        date: selectedDate,
        time: selectedTime,
        duration: treatment?.duration || 30,
        reason: treatment?.label || 'General visit',
        notes: `Booked via kiosk by ${user.name}`,
      });
      playSuccess();
      setStep(4);
    } catch (err) {
      playError();
      toast.error(err.response?.data?.error || 'Error booking appointment');
    }
    setSubmitting(false);
  };

  const timeSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];

  return (
    <KioskLayout>
      <div className="max-w-lg mx-auto py-6 px-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-white' : 'bg-white/20'}`} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2 text-center">What do you need?</h2>
            <p className="text-white/50 text-sm text-center mb-6">Select your treatment type</p>
            <div className="grid grid-cols-2 gap-3">
              {TREATMENTS.map(t => (
                <button key={t.id} onClick={() => { playClick(); setTreatment(t); setStep(2); }}
                  className={`p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                    treatment?.id === t.id
                      ? 'bg-white/20 border-white/50 shadow-xl'
                      : 'bg-white/10 border-white/10 hover:bg-white/15 hover:border-white/30'
                  }`}>
                  <div className="font-bold text-white text-sm">{t.label}</div>
                  <div className="text-white/40 text-xs mt-1">{t.duration} min</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <button onClick={() => { playClick(); setStep(1); }} className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-4">
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-xl font-bold text-white mb-2 text-center">Pick a date</h2>
            <p className="text-white/50 text-sm text-center mb-6">{treatment?.label} — {treatment?.duration} min</p>
            <div className="bg-white/10 rounded-xl border border-white/20 p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={18} className="text-white/60" />
                <span className="text-white/80 text-sm font-medium">Select Date</span>
              </div>
              <input type="date" min={today} max={maxDate} value={selectedDate} onChange={e => { playClick(); setSelectedDate(e.target.value); setSelectedTime(''); }}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-white/50 [color-scheme:dark]" />
            </div>
            {selectedDate && (
              <div className="bg-white/10 rounded-xl border border-white/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={18} className="text-white/60" />
                  <span className="text-white/80 text-sm font-medium">{loading ? 'Loading slots...' : 'Available Times'}</span>
                </div>
                {loading ? (
                  <div className="text-white/40 text-sm text-center py-4">Checking availability...</div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(t => {
                      const available = availableSlots.includes(t);
                      return (
                        <button key={t} disabled={!available}
                          onClick={() => { playClick(); setSelectedTime(t); setStep(3); }}
                          className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                            !available ? 'bg-white/5 text-white/20 cursor-not-allowed line-through' :
                            selectedTime === t ? 'bg-white text-[#004aad]' :
                            'bg-white/10 text-white hover:bg-white/20'
                          }`}>{t}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <button onClick={() => { playClick(); setStep(2); }} className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-4">
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-xl font-bold text-white mb-6 text-center">Confirm Booking</h2>
            <div className="bg-white/10 rounded-xl border border-white/20 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-white/50 text-xs">Patient</div>
                  <div className="text-white font-bold text-sm">{user.name}</div>
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                  <CalendarCheck size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-white/50 text-xs">Treatment</div>
                  <div className="text-white font-bold text-sm">{treatment?.label}</div>
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/30 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-white/50 text-xs">Date & Time</div>
                  <div className="text-white font-bold text-sm">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {selectedTime}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={handleBook} disabled={submitting}
              className="w-full mt-6 bg-white text-[#004aad] font-bold py-4 rounded-xl text-lg hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50">
              {submitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Appointment Booked!</h2>
            <p className="text-white/60 text-sm mb-1">{treatment?.label}</p>
            <p className="text-white/60 text-sm mb-8">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {selectedTime}
            </p>
            <button onClick={() => { playClick(); navigate('/kiosk'); }}
              className="bg-white/20 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/30 transition-all">
              Back to Home
            </button>
          </div>
        )}
      </div>
    </KioskLayout>
  );
}
