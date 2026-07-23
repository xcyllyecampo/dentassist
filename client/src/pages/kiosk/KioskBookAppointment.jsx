import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { playClick, playSuccess, playError } from '../../lib/sounds';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { KIOSK_TREATMENTS as TREATMENTS } from '../../lib/treatments';
import { CalendarCheck, Clock, User, ChevronLeft, CheckCircle, Calendar, ChevronLeft as ArrowLeftIcon, ChevronRight, Stethoscope } from 'lucide-react';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function KioskBookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [treatment, setTreatment] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [dentists, setDentists] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return now.getMonth();
  });
  const [calYear, setCalYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });

  const today = new Date();
  const maxDate = new Date(Date.now() + 30 * 86400000);
  const todayStr = today.toLocaleDateString('en-CA');
  const maxDateStr = maxDate.toLocaleDateString('en-CA');

  useEffect(() => {
    api.get('/dentist-schedules/dentists').then(res => {
      setDentists(res.data || []);
    }).catch(() => {});
  }, []);

  function isDateDisabled(dateStr) {
    if (!dateStr) return true;
    return dateStr < todayStr || dateStr > maxDateStr;
  }

  function formatDate(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return year + "-" + m + "-" + d;
  }

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();
    const grid = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = calMonth === 0 ? 11 : calMonth - 1;
      const y = calMonth === 0 ? calYear - 1 : calYear;
      grid.push({ day: d, month: m, year: y, dateStr: formatDate(y, m, d), otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({ day: d, month: calMonth, year: calYear, dateStr: formatDate(calYear, calMonth, d), otherMonth: false });
    }
    const remaining = 42 - grid.length;
    for (let d = 1; d <= remaining; d++) {
      const m = calMonth === 11 ? 0 : calMonth + 1;
      const y = calMonth === 11 ? calYear + 1 : calYear;
      grid.push({ day: d, month: m, year: y, dateStr: formatDate(y, m, d), otherMonth: true });
    }
    return grid;
  }, [calMonth, calYear]);

  function goToPrevMonth() {
    const prevMonth = calMonth === 0 ? 11 : calMonth - 1;
    const prevYear = calMonth === 0 ? calYear - 1 : calYear;
    const lastDayPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
    const lastDate = formatDate(prevYear, prevMonth, lastDayPrev);
    if (lastDate >= todayStr) {
      setCalMonth(prevMonth);
      setCalYear(prevYear);
    }
  }

  function goToNextMonth() {
    const nextMonth = calMonth === 11 ? 0 : calMonth + 1;
    const nextYear = calMonth === 11 ? calYear + 1 : calYear;
    const firstDate = formatDate(nextYear, nextMonth, 1);
    if (firstDate <= maxDateStr) {
      setCalMonth(nextMonth);
      setCalYear(nextYear);
    }
  }

  const canGoPrev = useMemo(() => {
    const prevMonth = calMonth === 0 ? 11 : calMonth - 1;
    const prevYear = calMonth === 0 ? calYear - 1 : calYear;
    const lastDayPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
    return formatDate(prevYear, prevMonth, lastDayPrev) >= todayStr;
  }, [calMonth, calYear, todayStr]);

  const canGoNext = useMemo(() => {
    const nextMonth = calMonth === 11 ? 0 : calMonth + 1;
    const nextYear = calMonth === 11 ? calYear + 1 : calYear;
    return formatDate(nextYear, nextMonth, 1) <= maxDateStr;
  }, [calMonth, calYear, maxDateStr]);

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      api.get('/appointments/available-slots?date=' + selectedDate)
        .then(function(res) { setAvailableSlots(res.data.availableSlots); })
        .catch(function() { setAvailableSlots([]); })
        .finally(function() { setLoading(false); });
    }
  }, [selectedDate]);

  const handleBook = async () => {
    setSubmitting(true);
    try {
      const payload = {
        date: selectedDate,
        time: selectedTime,
        duration: treatment?.duration || 30,
        reason: treatment?.label || 'General visit',
        notes: 'Booked via kiosk by ' + user.name,
      };
      if (selectedDentist) {
        payload.dentistId = selectedDentist.id;
      }
      await api.post('/appointments', payload);
      playSuccess();
      setStep(5);
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
          {[1,2,3,4].map(function(s) {
            return (
              <div key={s} className={"h-1.5 flex-1 rounded-full transition-colors " + (step >= s ? "bg-white" : "bg-white/20")} />
            );
          })}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2 text-center">What do you need?</h2>
            <p className="text-white/50 text-sm text-center mb-6">Select your treatment type</p>
            <div className="grid grid-cols-2 gap-3">
              {TREATMENTS.map(function(t) {
                return (
                  <button key={t.id} onClick={function() { playClick(); setTreatment(t); setStep(2); }}
                    className={"p-4 rounded-xl text-left transition-all duration-200 border-2 " + (
                      treatment?.id === t.id
                        ? "bg-white/20 border-white/50 shadow-xl"
                        : "bg-white/10 border-white/10 hover:bg-white/15 hover:border-white/30"
                    )}>
                    <div className="font-bold text-white text-sm">{t.label}</div>
                    <div className="text-white/40 text-xs mt-1">{t.duration} min</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <button onClick={function() { playClick(); setStep(1); }} className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-4">
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-xl font-bold text-white mb-2 text-center">Choose a Dentist</h2>
            <p className="text-white/50 text-sm text-center mb-6">Pick your preferred dentist (optional)</p>

            <div className="space-y-2 mb-5">
              <button
                onClick={function() { playClick(); setSelectedDentist(null); }}
                className={"w-full p-3 rounded-xl border-2 text-center transition-all " + (
                  !selectedDentist
                    ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                )}>
                <div className="text-white font-bold text-sm">No Preference</div>
                <div className="text-white/40 text-xs">First available dentist</div>
              </button>
              {dentists.map(function(d) {
                return (
                  <button key={d.id}
                    onClick={function() { playClick(); setSelectedDentist(d); }}
                    className={"w-full p-3 rounded-xl border-2 flex items-center gap-3 text-left transition-all " + (
                      selectedDentist?.id === d.id
                        ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    )}>
                    <div className="w-10 h-10 bg-blue-500/30 text-white rounded-full flex items-center justify-center text-lg font-bold ring-2 ring-white/20">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{d.name}</div>
                      <div className="text-white/40 text-xs">Dentist</div>
                    </div>
                    {selectedDentist?.id === d.id && (
                      <div className="ml-auto">
                        <CheckCircle size={18} className="text-blue-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={function() { playClick(); setStep(1); }}
                className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center gap-1.5">
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={function() { playClick(); setStep(3); }}
                className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-base hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <button onClick={function() { playClick(); setStep(2); }} className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-4">
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-xl font-bold text-white mb-2 text-center">Pick a date</h2>
            <p className="text-white/50 text-sm text-center mb-6">{treatment?.label} &mdash; {treatment?.duration} min</p>

            {/* Calendar grid */}
            <div className="bg-white/10 rounded-xl border border-white/20 p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={function() { playClick(); goToPrevMonth(); }} disabled={!canGoPrev}
                  className={"p-1.5 rounded-lg transition-colors " + (canGoPrev ? "text-white/60 hover:text-white hover:bg-white/10" : "text-white/20 cursor-not-allowed")}>
                  <ChevronLeft size={20} />
                </button>
                <span className="text-white font-bold text-base">{MONTHS[calMonth]} {calYear}</span>
                <button onClick={function() { playClick(); goToNextMonth(); }} disabled={!canGoNext}
                  className={"p-1.5 rounded-lg transition-colors " + (canGoNext ? "text-white/60 hover:text-white hover:bg-white/10" : "text-white/20 cursor-not-allowed")}>
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(function(d) {
                  return (
                    <div key={d} className="text-center text-[11px] text-white/40 font-semibold uppercase tracking-wider py-1">{d}</div>
                  );
                })}
              </div>

              <div className="grid grid-cols-7">
                {calendarGrid.map(function(cell, i) {
                  const disabled = isDateDisabled(cell.dateStr);
                  const isSelected = cell.dateStr === selectedDate;
                  const isToday = cell.dateStr === todayStr;
                  return (
                    <button key={i}
                      onClick={function() {
                        if (disabled || cell.otherMonth) return;
                        playClick();
                        setSelectedDate(cell.dateStr);
                        setSelectedTime('');
                      }}
                      disabled={disabled}
                      className={"relative py-2 text-sm rounded-lg transition-all " + (
                        cell.otherMonth
                          ? "text-white/10 cursor-default"
                          : disabled
                            ? "text-white/15 cursor-not-allowed"
                            : isSelected
                              ? "bg-white text-[#004aad] font-bold"
                              : "text-white/70 hover:bg-white/15 hover:text-white font-medium"
                      )}>
                      {cell.day}
                      {isToday && !isSelected && !disabled && !cell.otherMonth && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/40" />
                      )}
                    </button>
                  );
                })}
              </div>
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
                    {timeSlots.map(function(t) {
                      const available = availableSlots.includes(t);
                      return (
                        <button key={t} disabled={!available}
                          onClick={function() { playClick(); setSelectedTime(t); setStep(4); }}
                          className={"py-2.5 rounded-lg text-sm font-medium transition-all " + (
                            !available ? "bg-white/5 text-white/20 cursor-not-allowed line-through" :
                            selectedTime === t ? "bg-white text-[#004aad]" :
                            "bg-white/10 text-white hover:bg-white/20"
                          )}>{t}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <button onClick={function() { playClick(); setStep(3); }} className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-4">
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
              {selectedDentist && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
                      <Stethoscope size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-white/50 text-xs">Dentist</div>
                      <div className="text-white font-bold text-sm">{selectedDentist.name}</div>
                    </div>
                  </div>
                  <div className="h-px bg-white/10" />
                </>
              )}
              {!selectedDentist && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
                      <Stethoscope size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-white/50 text-xs">Dentist</div>
                      <div className="text-white/60 text-xs italic">No preference (first available)</div>
                    </div>
                  </div>
                  <div className="h-px bg-white/10" />
                </>
              )}
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

        {step === 5 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Appointment Booked!</h2>
            <p className="text-white/60 text-sm mb-1">{treatment?.label}</p>
            <p className="text-white/60 text-sm mb-2">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {selectedTime}
            </p>
            {selectedDentist && (
              <p className="text-white/60 text-sm mb-8">with {selectedDentist.name}</p>
            )}
            {!selectedDentist && (
              <p className="text-white/60 text-sm mb-8">First available dentist</p>
            )}
            <button onClick={function() { playClick(); navigate('/kiosk'); }}
              className="bg-white/20 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/30 transition-all">
              Back to Home
            </button>
          </div>
        )}
      </div>
    </KioskLayout>
  );
}
