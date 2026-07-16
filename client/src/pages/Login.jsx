import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'PATIENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-sky-900 p-8 text-center text-white">
          <span className="text-4xl block mb-2">🦷</span>
          <h1 className="text-2xl font-bold">DentAssist</h1>
          <p className="text-sky-200 text-sm mt-1">AI-Powered Dental Clinic System</p>
        </div>

        <div className="flex border-b border-sky-100">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${isLogin ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-400'}`}
          >
            <LogIn size={16} className="inline mr-1" /> Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${!isLogin ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-400'}`}
          >
            <UserPlus size={16} className="inline mr-1" /> Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text" required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  placeholder="Dr. Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:outline-none"
                >
                  <option value="PATIENT">Patient</option>
                  <option value="DENTIST">Dentist</option>
                  <option value="ASSISTANT">Assistant</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white py-3 rounded-lg font-medium hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

          <div className="text-center text-xs text-gray-400 mt-4">
            <p>Demo: admin@dentassist.com / password123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
