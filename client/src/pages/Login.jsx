import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
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
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c0f1a] via-[#1a1040] to-[#0f172a]"
        style={{ backgroundSize: '400% 400%', animation: 'gradient-shift 15s ease infinite' }} />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-sky-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="glass-card rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Logo header */}
          <div className="relative p-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-indigo-500/30 animate-glow-pulse">
                🦷
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">DentAssist</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">AI-Powered Dental Clinic System</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 mx-6">
            <button onClick={() => { playClick(); setIsLogin(true); }}
              className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
                isLogin ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}>
              <LogIn size={15} className="inline mr-1.5" /> Sign In
            </button>
            <button onClick={() => { playClick(); setIsLogin(false); }}
              className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
                !isLogin ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:outline-none text-sm transition-all"
                  placeholder="Dr. Juan Dela Cruz" />
              </div>
            )}

            {!isLogin && (
              <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:outline-none text-sm transition-all">
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:outline-none text-sm transition-all"
                placeholder="you@example.com" />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:outline-none text-sm transition-all pr-10"
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
      </div>
    </div>
  );
}
