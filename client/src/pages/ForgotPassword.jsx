import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { playSuccess, playError } from '../lib/sounds';
import { AlertCircle, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      playSuccess();
      setSent(true);
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
          <p className="text-white/60 text-xs font-semibold tracking-[0.2em] uppercase mt-3">Reset your password</p>
        </div>

        <div className="glass-card rounded-3xl shadow-2xl shadow-black/30 p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                If an account exists for <strong className="text-slate-700">{email}</strong>, we've sent a password reset link. The link expires in 15 minutes.
              </p>
              <Link to="/login"
                className="block mt-6 w-full py-3 rounded-xl font-semibold text-sm text-center btn-premium text-white">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center">
                  <KeyRound size={20} className="text-[#0F766E]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Forgot Password</h2>
                  <p className="text-xs text-slate-400">We'll email you a reset link</p>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-xl border border-rose-100 flex items-center gap-2 mb-4">
                  <AlertCircle size={16} className="text-rose-400 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#14B8A6] focus:outline-none text-sm transition-all"
                    placeholder="you@example.com" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm btn-premium text-white disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Reset Link'}
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
