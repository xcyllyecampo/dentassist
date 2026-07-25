import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Eye, EyeOff, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { playClick, playSuccess, playError } from '../lib/sounds';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'PATIENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
              <button ref={loginTabRef} onClick={() => { playClick(); setAgreedToTerms(false); setError(''); setMode('login'); }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors duration-200 ${
                  isLogin ? 'text-[#0F766E]' : 'text-slate-400 hover:text-slate-600'
                }`}>
                <LogIn size={15} className="inline mr-1.5" /> Sign In
              </button>
              <button ref={registerTabRef} onClick={() => { playClick(); setError(''); setMode('register'); }}
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
                <span className="text-rose-400">⚠</span> {error}
              </div>
            )}

            {!isLogin && (
              <div className="animate-slide-up">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  ref={nameRef}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#14B8A6] focus:outline-none text-sm transition-all"
                  placeholder="" />
              </div>
            )}

            {!isLogin && (
              <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <input type="tel" required value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#14B8A6] focus:outline-none text-sm transition-all"
                  placeholder="XXX-XXX-XXXX" />
              </div>
            )}

            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                ref={emailRef}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#14B8A6] focus:outline-none text-sm transition-all"
                placeholder="you@example.com" />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#14B8A6] focus:outline-none text-sm transition-all pr-10"
                  placeholder="••••••••" />
                <button type="button" onClick={() => { playClick(); setShowPassword(!showPassword); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" checked={agreedToTerms}
                    onChange={(e) => { playClick(); setAgreedToTerms(e.target.checked); }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]/30 cursor-pointer" />
                  <span className="text-[11px] text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                    I have read and agree to the DentAssist Terms and Agreement and Privacy Policy, and I consent to the collection and processing of my personal information in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173).
                  </span>
                </label>
              </div>
            )}

            <button type="submit" disabled={loading || (!isLogin && !agreedToTerms)}
              className="w-full btn-premium text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Please wait...
                </span>
              ) : isLogin ? 'Sign In' : 'Create Account'}
            </button>

            <div className="text-center text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
              <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-mono text-[11px]">
                Demo: admin@dentassist.com / password123
              </span>
            </div>
          </form>
        </div>

        {/* QR Code Section */}
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
