import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { playClick, playSuccess, playError } from '../lib/sounds';
import { AlertCircle, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      playSuccess();
      setDone(true);
      setTimeout(() => navigate('/login'), 2600);
    } catch (err) {
      playError();
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <video autoPlay loop muted playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/DentASSISTadvertisementvideo.mp4" />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-[403px] animate-slide-up">
        <div className="mb-5 text-center">
          <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-[115px] mx-auto object-contain drop-shadow-lg" />
          <p className="text-white/60 text-xs font-semibold tracking-[0.2em] uppercase mt-3">Choose a new password</p>
        </div>

        <div className="glass-card rounded-3xl shadow-2xl shadow-black/30 p-6">
          {!token ? (
            <div className="text-center py-4">
              <AlertCircle size={32} className="mx-auto mb-3 text-rose-500" />
              <p className="text-sm text-slate-600 mb-4">This reset link is invalid or incomplete.</p>
              <Link to="/forgot-password" className="text-sm font-semibold text-[#0F766E] hover:text-[#0D6D65]">
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Password updated</h2>
              <p className="text-sm text-slate-500">You can now sign in with your new password.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center">
                  <KeyRound size={20} className="text-[#0F766E]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Set New Password</h2>
                  <p className="text-xs text-slate-400">Must be at least 6 characters</p>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-xl border border-rose-100 flex items-center gap-2 mb-4">
                  <AlertCircle size={16} className="text-rose-400 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">New Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#14B8A6] focus:outline-none text-sm transition-all pr-10"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => { playClick(); setShowPassword(!showPassword); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                  <input type={showPassword ? 'text' : 'password'} required value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#14B8A6] focus:outline-none text-sm transition-all"
                    placeholder="••••••••" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm btn-premium text-white disabled:opacity-50">
                  {loading ? 'Saving...' : 'Reset Password'}
                </button>

                <Link to="/login"
                  className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
