import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Eye, EyeOff, QrCode, AlertCircle, X, FileText, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { playClick, playSuccess, playError } from '../lib/sounds';

const validateField = (name, value) => {
  const fieldLabels = { firstName: 'First name', lastName: 'Last name', phone: 'Phone number' };
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldLabels[name] || name.charAt(0).toUpperCase() + name.slice(1)} is required`;
  }
  switch (name) {
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
      break;
    case 'password':
      if (value.length < 6) return 'Password must be at least 6 characters';
      break;
    case 'firstName':
    case 'lastName':
      if (value.trim().length < 2) return 'Must be at least 2 characters';
      break;
    case 'phone':
      if (!/^[\d\s\-+()]{7,}$/.test(value.trim())) return 'Enter a valid phone number';
      break;
    default:
      break;
  }
  return '';
};

const tosSections = [
  { title: '1. Acceptance of Terms', content: 'Welcome to DentASSIST. By accessing or using DentASSIST, you agree to comply with these Terms of Service. If you do not agree, you must discontinue use. DentASSIST is a dental clinic management platform for appointment scheduling, patient management, AI-assisted dental screening, and clinic operations.' },
  { title: '2. Eligibility', content: 'You must be legally capable of entering into agreements under Philippine law. Patients under 18 must use the application with parental or guardian consent.' },
  { title: '3. User Accounts', content: 'Users are responsible for maintaining password confidentiality, protecting login credentials, providing accurate information, and updating personal information. The clinic may suspend accounts involved in fraudulent or unauthorized activities.' },
  { title: '4. Services', content: 'DentASSIST may provide: appointment booking, queue management, patient records, dental treatment history, AI-assisted oral screening, AI-assisted smile simulation, AI-assisted X-ray analysis, treatment support recommendations, notifications, and loyalty rewards. Services may change without notice.' },
  { title: '5. AI Disclaimer', content: 'DentASSIST uses AI to assist dentists. AI outputs are informational only, not medical diagnoses, not medical advice, and not a substitute for licensed dental professionals. Only a licensed dentist may provide a final diagnosis and treatment plan. Patients should never rely solely on AI-generated recommendations.', highlight: true },
  { title: '6. Medical Disclaimer', content: 'DentASSIST does not provide emergency medical services. If you experience severe pain, bleeding, swelling, trauma, or any medical emergency, seek immediate care from a licensed healthcare provider.' },
  { title: '7. User Responsibilities', content: 'Users agree NOT to: submit false information, access another person\'s account, upload malicious software, attempt unauthorized access, disrupt clinic operations, or use the application for illegal purposes.' },
  { title: '8. Appointments', content: 'Appointments submitted through DentASSIST are requests. Confirmation depends on dentist availability, clinic operating hours, and clinic approval. The clinic may reschedule or cancel appointments when necessary.' },
  { title: '9. Intellectual Property', content: 'All content including the DentASSIST name, logos, software, UI, graphics, source code, and AI workflows remain the property of DentASSIST or its licensors. Users may not copy, modify, distribute, or reverse engineer the application.' },
  { title: '10. Limitation of Liability', content: 'DentASSIST shall not be liable for delayed appointments, internet interruptions, device failures, data loss from user negligence, incorrect user information, or AI prediction inaccuracies, to the maximum extent permitted under Philippine law.' },
  { title: '11. Account Termination', content: 'Accounts may be suspended or terminated if users violate these Terms, abuse clinic staff, attempt unauthorized access, or commit fraud.' },
  { title: '12. Governing Law', content: 'These Terms are governed by the laws of the Republic of the Philippines. Disputes are subject to the jurisdiction of appropriate Philippine courts.' },
  { title: '13. Changes', content: 'DentASSIST may modify these Terms at any time. Continued use after updates constitutes acceptance of the revised Terms.' },
  { title: '14. Contact', content: 'For questions regarding these Terms, contact your dental clinic directly through the official contact information provided.' },
];

const privacySections = [
  { title: '1. Information We Collect', content: 'We may collect: personal information (name, birthdate, gender, contact, email, address), dental information (dental history, treatment records, X-ray images, AI screening results, prescriptions), account information (encrypted password, login history, role), and device information (browser, IP, OS).' },
  { title: '2. How We Use Information', content: 'We use your information to: manage appointments, maintain patient records, improve clinic operations, provide AI-assisted dental analysis, generate treatment recommendations, improve performance, send notifications, and comply with legal obligations.' },
  { title: '3. AI Processing', content: 'DentASSIST uses AI to analyze dental X-rays, oral images, and smile simulations. AI outputs are reviewed by licensed dental professionals before clinical decisions. AI-generated information should not be interpreted as medical diagnoses.', highlight: true },
  { title: '4. Legal Basis', content: 'Personal information is processed based on: your consent, performance of healthcare services, compliance with legal obligations, and legitimate interests of the clinic.' },
  { title: '5. Data Sharing', content: 'We do not sell your personal information. Information may be shared with licensed dentists, authorized assistants, clinic administrators, technology providers necessary to operate DentASSIST, and government authorities when required by Philippine law.' },
  { title: '6. Data Security', content: 'We use reasonable safeguards including encrypted passwords, authentication controls, role-based access, secure database storage, secure communications, audit logging, and regular backups. No system is 100% secure.' },
  { title: '7. Data Retention', content: 'Patient records are retained only as long as necessary to provide healthcare services, meet legal requirements, resolve disputes, and maintain clinic records. Records may be securely deleted or anonymized after the retention period.' },
  { title: '8. Your Rights', content: 'Under the Data Privacy Act, you may: be informed, access your data, correct inaccuracies, object to processing, request deletion (subject to legal retention), request data portability, and file a complaint with the National Privacy Commission.' },
  { title: '9. Cookies', content: 'DentASSIST may use cookies for login sessions, security, preferences, analytics, and performance. You may disable cookies in your browser, though some features may not function properly.' },
  { title: "10. Children's Privacy", content: 'Patients under 18 should use DentASSIST with parental or guardian consent.' },
  { title: '11. Third-Party Services', content: 'DentASSIST may integrate with cloud database providers, AI service providers, notification services, and payment gateways. These providers process information under their own privacy policies.' },
  { title: '12. Changes', content: 'This Privacy Policy may be updated periodically. Material changes will be communicated through the application.' },
  { title: '13. Contact', content: 'For privacy concerns or data requests, contact your dental clinic or its designated Data Protection Officer using the official contact information provided.' },
];

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'PATIENT' });
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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modalChecked, setModalChecked] = useState(false);
  const termsModalRef = useRef(null);

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

  useEffect(() => {
    if (showTermsModal) {
      document.body.style.overflow = 'hidden';
      setModalChecked(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showTermsModal]);

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
  };

  const validateAll = () => {
    const fields = isLogin ? ['email', 'password'] : ['firstName', 'lastName', 'phone', 'email', 'password'];
    const newTouched = {};
    const newErrors = {};
    let hasError = false;

    fields.forEach((f) => {
      newTouched[f] = true;
      const err = validateField(f, form[f]);
      newErrors[f] = err;
      if (err) hasError = true;
    });

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setFieldErrors((prev) => ({ ...prev, ...newErrors }));
    return hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && !agreedToTerms) {
      setShowTermsModal(true);
      return;
    }

    if (validateAll()) return;

    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await login(form.email, form.password);
      } else {
        res = await register({ ...form, name: `${form.firstName} ${form.lastName}` });
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

  const handleAgree = () => {
    setAgreedToTerms(true);
    setShowTermsModal(false);
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

  const canSubmit = isLogin || agreedToTerms;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <video autoPlay loop muted playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">First Name</label>
                    <input type="text" required value={form.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      onBlur={() => handleBlur('firstName')}
                      ref={nameRef}
                      className={inputClass('firstName')}
                      placeholder="Juan" />
                    {renderError('firstName')}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Last Name</label>
                    <input type="text" required value={form.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      onBlur={() => handleBlur('lastName')}
                      className={inputClass('lastName')}
                      placeholder="Dela Cruz" />
                    {renderError('lastName')}
                  </div>
                </div>
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

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button type="submit" disabled={loading || !canSubmit}
                className={`w-full py-3 rounded-xl font-semibold text-sm mt-2 transition-all ${
                  canSubmit
                    ? 'btn-premium text-white disabled:opacity-50'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Please wait...
                  </span>
                ) : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </div>

            {!isLogin && (
              <div className="text-center -mt-1">
                {agreedToTerms ? (
                  <p className="text-xs text-[#0F766E] font-medium flex items-center justify-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3" /></svg>
                    Terms and Privacy Policy agreed
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    You must agree to the{' '}
                    <button type="button" onClick={() => { playClick(); setShowTermsModal(true); }}
                      className="font-semibold text-[#0F766E] hover:text-[#0D6D65] underline underline-offset-2 cursor-pointer">
                      Terms of Service and Privacy Policy
                    </button>
                  </p>
                )}
              </div>
            )}
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

      {/* Terms & Privacy Policy Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { playClick(); setShowTermsModal(false); } }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div ref={termsModalRef}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center">
                  <FileText size={16} className="text-[#0F766E]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Terms of Service & Privacy Policy</h2>
                  <p className="text-xs text-slate-400">Last Updated: July 27, 2026</p>
                </div>
              </div>
              <button onClick={() => { playClick(); setShowTermsModal(false); }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - Two Column Scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Terms of Service */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={16} className="text-[#0F766E]" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Terms of Service</h3>
                  </div>
                  <div className="space-y-4">
                    {tosSections.map((section, i) => (
                      <div key={i}>
                        <h4 className={`text-xs font-bold mb-1.5 ${section.highlight ? 'text-amber-600' : 'text-slate-800'}`}>
                          {section.title}
                        </h4>
                        {section.highlight && (
                          <p className="text-[11px] text-amber-600 font-medium mb-1">&#9888; Important — please read carefully</p>
                        )}
                        <p className="text-xs text-slate-500 leading-relaxed">{section.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Privacy Policy */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={16} className="text-[#0F766E]" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Privacy Policy</h3>
                  </div>
                  <div className="mb-4 p-3 bg-[#0F766E]/5 border border-[#0F766E]/15 rounded-xl text-xs text-slate-500 leading-relaxed">
                    DentASSIST respects your privacy and protects your personal information in accordance with the <strong className="text-slate-700">Data Privacy Act of 2012 (RA 10173)</strong> and the <strong className="text-slate-700">National Privacy Commission</strong>.
                  </div>
                  <div className="space-y-4">
                    {privacySections.map((section, i) => (
                      <div key={i}>
                        <h4 className={`text-xs font-bold mb-1.5 ${section.highlight ? 'text-amber-600' : 'text-slate-800'}`}>
                          {section.title}
                        </h4>
                        {section.highlight && (
                          <p className="text-[11px] text-amber-600 font-medium mb-1">&#9888; AI processing disclosure</p>
                        )}
                        <p className="text-xs text-slate-500 leading-relaxed">{section.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Checkbox + Agree Button */}
            <div className="border-t border-slate-200 px-6 py-4 shrink-0 bg-slate-50/80">
              <label className="flex items-start gap-3 cursor-pointer group mb-3">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={modalChecked}
                    onChange={(e) => setModalChecked(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all ${
                    modalChecked
                      ? 'bg-[#0F766E] border-[#0F766E]'
                      : 'border-slate-300 bg-white group-hover:border-[#14B8A6]'
                  }`}>
                    {modalChecked && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-600 leading-relaxed">
                  I have read and agree to the <strong className="text-slate-800">Terms of Service</strong> and <strong className="text-slate-800">Privacy Policy</strong>
                </span>
              </label>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => { playClick(); setShowTermsModal(false); }}
                  className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100">
                  Cancel
                </button>
                <button type="button" disabled={!modalChecked} onClick={() => { playClick(); handleAgree(); }}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    modalChecked
                      ? 'btn-premium text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}>
                  I Agree
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
