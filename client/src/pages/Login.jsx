import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Eye, EyeOff, QrCode, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { playClick, playSuccess, playError } from '../lib/sounds';

const validateField = (name, value) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${name === 'name' ? 'Full name' : name === 'phone' ? 'Phone number' : name.charAt(0).toUpperCase() + name.slice(1)} is required`;
  }
  switch (name) {
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
      break;
    case 'password':
      if (value.length < 6) return 'Password must be at least 6 characters';
      break;
    case 'name':
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      break;
    case 'phone':
      if (!/^[\d\s\-+()]{7,}$/.test(value.trim())) return 'Enter a valid phone number';
      break;
    default:
      break;
  }
  return '';
};

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'PATIENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [qrSize, setQrSize] = useState(240);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const nameRef = useRef(null);
  const loginTabRef = useRef(null);
  const registerTabRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [welcomeUser, setWelcomeUser] = useState(null);
  const navTimeoutRef = useRef(null);
  const isLogin = mode === 'login';

  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);

  useEffect(() => {
    return () => { if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current); };
  }, []);

  const updateIndicator = useCallback(() => {
    const activeRef = isLogin ? loginTabRef : registerTabRef;
    if (activeRef.current) {
      const parent = activeRef.current.parentElement;
      const rect = activeRef.current.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      setIndicator({ left: rect.left - parentRect.left, width: rect.width });
    }
  }, [isLogin]);

  useEffect(() => { updateIndicator(); }, [updateIndicator]);

  useEffect(() => {
    setQrUrl(window.location.origin);
  }, []);

  useEffect(() => {
    const calc = () => setQrSize(Math.min(240, Math.max(160, window.innerWidth - 100)));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  useEffect(() => {
    if (mode === 'login') {
      emailRef.current?.focus();
    } else {
      nameRef.current?.focus();
    }
  }, [mode]);

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const err = validateField(fieldName, form[fieldName]);
    setFieldErrors((prev) => ({ ...prev, [fieldName]: err }));
  };

  const handleChange = (fieldName, value) => {
    setForm((prev) => ({ ...prev, [fieldName]: value }));
    if (touched[fieldName]) {
      const err = validateField(fieldName, value);
      setFieldErrors((prev) => ({ ...prev, [fieldName]: err }));
    }
  };

  const handleModeSwitch = (newMode) => {
    playClick();
    setError('');
    setMode(newMode);
    setTouched({});
    setFieldErrors({});
    setAgreedToTerms(false);
    setTermsTouched(false);
  };

  const validateAll = () => {
    const fields = isLogin ? ['email', 'password'] : ['name', 'phone', 'email', 'password'];
    const newTouched = {};
    const newErrors = {};
    let hasError = false;

    fields.forEach((f) => {
      newTouched[f] = true;
      const err = validateField(f, form[f]);
      newErrors[f] = err;
      if (err) hasError = true;
    });

    if (!isLogin) {
      if (!agreedToTerms) {
        setTermsTouched(true);
        hasError = true;
      }
    }

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setFieldErrors((prev) => ({ ...prev, ...newErrors }));
    return hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (validateAll()) return;

    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await login(form.email, form.password);
      } else {
        res = await register(form);
      }
      playSuccess();
      setWelcomeUser(res.user);
      const dest = res.user.role === 'PATIENT' ? '/kiosk' : '/dashboard';
      navTimeoutRef.current = setTimeout(() => navigate(dest), 2600);
    } catch (err) {
      playError();
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderError = (fieldName) => {
    if (touched[fieldName] && fieldErrors[fieldName]) {
      return (
        <p className="text-rose-500 text-xs mt-1 flex items-center gap-1 animate-scale-in">
          <AlertCircle size={12} /> {fieldErrors[fieldName]}
        </p>
      );
    }
    return null;
  };

  const inputClass = (fieldName) =>
    `w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#14B8A6] focus:outline-none text-sm transition-all ${
      touched[fieldName] && fieldErrors[fieldName]
        ? 'border-rose-400 bg-rose-50/50'
        : 'border-slate-200'
    }`;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <video autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%230f172a' width='1920' height='1080'/%3E%3C/svg%3E"
        src="/videos/DentASSISTadvertisementvideo.mp4" />

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-[403px] animate-slide-up">
        <div className="mb-5 text-center">
          <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-[115px] mx-auto object-contain drop-shadow-lg" />
        </div>
        <div className="glass-card rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* Tabs with sliding indicator */}
          <div className="relative mx-6 border-b border-slate-100">
            <div className="flex">
              <button ref={loginTabRef} onClick={() => handleModeSwitch('login')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors duration-200 ${
                  isLogin ? 'text-[#0F766E]' : 'text-slate-400 hover:text-slate-600'
                }`}>
                <LogIn size={15} className="inline mr-1.5" /> Sign In
              </button>
              <button ref={registerTabRef} onClick={() => handleModeSwitch('register')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors duration-200 ${
                  !isLogin ? 'text-[#0F766E]' : 'text-slate-400 hover:text-slate-600'
                }`}>
                <UserPlus size={15} className="inline mr-1.5" /> Register
              </button>
            </div>
            <div className="absolute bottom-0 h-[2.5px] bg-[#0F766E] rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ left: indicator.left, width: indicator.width }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-xl border border-rose-100 animate-scale-in flex items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-rose-400 shrink-0" /> {error}
              </div>
            )}

            {!isLogin && (
              <div className="animate-slide-up">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input type="text" required value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  ref={nameRef}
                  className={inputClass('name')}
                  placeholder="Juan Dela Cruz" />
                {renderError('name')}
              </div>
            )}

            {!isLogin && (
              <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Phone Number</label>
                <input type="tel" required value={form.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  className={inputClass('phone')}
                  placeholder="XXX-XXX-XXXX" />
                {renderError('phone')}
              </div>
            )}

            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" required value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                ref={emailRef}
                className={inputClass('email')}
                placeholder="you@example.com" />
              {renderError('email')}
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`${inputClass('password')} pr-10`}
                  placeholder="••••••••" />
                <button type="button" onClick={() => { playClick(); setShowPassword(!showPassword); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {renderError('password')}
            </div>

            {!isLogin && (
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (e.target.checked) setTermsTouched(true);
                      }}
                      onBlur={() => setTermsTouched(true)}
                      className="peer sr-only"
                    />
                    <div className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all ${
                      agreedToTerms
                        ? 'bg-[#0F766E] border-[#0F766E]'
                        : termsTouched && !agreedToTerms
                          ? 'border-rose-400 bg-rose-50/50'
                          : 'border-slate-300 bg-white group-hover:border-[#14B8A6]'
                    }`}>
                      {agreedToTerms && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2 6 5 9 10 3" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 leading-relaxed">
                    I agree to the{' '}
                    <a href="#" onClick={(e) => e.stopPropagation()} className="font-semibold text-[#0F766E] hover:text-[#0D6D65] underline underline-offset-2">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" onClick={(e) => e.stopPropagation()} className="font-semibold text-[#0F766E] hover:text-[#0D6D65] underline underline-offset-2">Privacy Policy</a>
                  </span>
                </label>
                {termsTouched && !agreedToTerms && (
                  <p className="text-rose-500 text-xs mt-1.5 ml-[30px] flex items-center gap-1 animate-scale-in">
                    <AlertCircle size={12} /> You must agree to the terms to continue
                  </p>
                )}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full btn-premium text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Please wait...
                </span>
              ) : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* QR Code Section - Login only */}
        {isLogin && (
          <div className="mt-4 glass-card rounded-3xl shadow-2xl shadow-black/30 p-5 md:p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode size={16} className="text-slate-500" />
              <span className="text-slate-700 text-xs font-semibold uppercase tracking-wider">or scan to access on your phone</span>
            </div>
            <div className="flex justify-center w-full mb-3">
              <div className="bg-white p-3 rounded-2xl" style={{ width: qrSize, height: qrSize }}>
                {qrUrl ? (
                  <QRCodeSVG
                    value={qrUrl}
                    size={qrSize - 24}
                    bgColor="#ffffff"
                    fgColor="#0D6D65"
                    level="M"
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Loading...</div>
                )}
              </div>
            </div>
            <p className="text-slate-500 text-xs">Scan with your phone camera to open</p>
          </div>
        )}
      </div>

      {/* Welcome splash */}
      {welcomeUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#0D6D65] via-[#0F766E] to-[#115E59]">
          <div className="text-center animate-welcome-fade-in">
            <img src="/images/DentASSISTlogo.png" alt="DentAssist"
              className="h-20 mx-auto mb-6 animate-welcome-logo-in drop-shadow-2xl" />
            <div className="animate-welcome-text-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
              <p className="text-white/60 text-sm font-medium tracking-wider uppercase mb-2">Welcome</p>
            </div>
            <div className="animate-welcome-text-in" style={{ animationDelay: '0.6s', opacity: 0 }}>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                {welcomeUser.name?.split(' ')[0]}
              </h1>
            </div>
            <div className="animate-welcome-text-in" style={{ animationDelay: '0.9s', opacity: 0 }}>
              <span className="inline-block mt-4 px-4 py-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold rounded-full border border-white/20 tracking-wide">
                {welcomeUser.role}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
