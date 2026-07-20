import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Eye, EyeOff, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { playClick, playSuccess, playError } from '../lib/sounds';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'PATIENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      playSuccess();
      navigate('/dashboard');
    } catch (err) {
      playError();
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Video background */}
      <video autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%230f172a' width='1920' height='1080'/%3E%3C/svg%3E"
        src="/videos/DentASSISTadvertisementvideo.mp4" />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo above card */}
        <div className="mb-5 text-center">
          <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-32 mx-auto object-contain drop-shadow-lg" />
        </div>
        <div className="glass-card rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 mx-6">
            <button onClick={() => { playClick(); setIsLogin(true); }}
              className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
                isLogin ? 'text-[#004aad] border-[#004aad]' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}>
              <LogIn size={15} className="inline mr-1.5" /> Sign In
            </button>
            <button onClick={() => { playClick(); setIsLogin(false); }}
              className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
                !isLogin ? 'text-[#004aad] border-[#004aad]' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}>
              <UserPlus size={15} className="inline mr-1.5" /> Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-xl border border-rose-100 animate-scale-in flex items-center gap-2">
                <span className="text-rose-400">⚠</span> {error}
              </div>
            )}

            {!isLogin && (
              <div className="animate-slide-up">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004aad]/30 focus:border-[#4a85d6] focus:outline-none text-sm transition-all"
                  placeholder="Dr. Juan Dela Cruz" />
              </div>
            )}

            {!isLogin && (
              <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004aad]/30 focus:border-[#4a85d6] focus:outline-none text-sm transition-all">
                  <option value="PATIENT">Patient</option>
                  <option value="DENTIST">Dentist</option>
                  <option value="ASSISTANT">Assistant</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            )}

            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004aad]/30 focus:border-[#4a85d6] focus:outline-none text-sm transition-all"
                placeholder="you@example.com" />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004aad]/30 focus:border-[#4a85d6] focus:outline-none text-sm transition-all pr-10"
                  placeholder="••••••••" />
                <button type="button" onClick={() => { playClick(); setShowPassword(!showPassword); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
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
        <div className="mt-4 glass-card rounded-3xl shadow-2xl shadow-black/30 p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <QrCode size={16} className="text-slate-500" />
            <span className="text-slate-700 text-xs font-semibold uppercase tracking-wider">or scan to access on your phone</span>
          </div>
          <div className="inline-block bg-white p-3 rounded-2xl mb-3">
            <QRCodeSVG
              value={typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
              size={140}
              bgColor="#ffffff"
              fgColor="#003782"
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-slate-500 text-xs">Scan with your phone camera to open</p>
        </div>
      </div>
    </div>
  );
}
