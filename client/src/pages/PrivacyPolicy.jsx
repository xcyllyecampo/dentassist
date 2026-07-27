import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const sections = [
  {
    title: '1. Information We Collect',
    content: `We may collect:

Personal Information
Full name
Birthdate
Gender
Contact number
Email address
Home address

Dental Information
Dental history
Treatment records
Appointment history
X-ray images
Oral photographs
AI screening results
Smile simulation images
Dentist notes
Prescriptions

Account Information
Username
Encrypted password
Login history
User role
Notifications

Device Information
Browser
Device type
IP address
Operating system
Log information`,
  },
  {
    title: '2. How We Use Information',
    content: `We use your information to:

Manage appointments
Maintain patient records
Improve clinic operations
Provide AI-assisted dental analysis
Generate treatment recommendations
Improve application performance
Send notifications
Comply with legal obligations`,
  },
  {
    title: '3. AI Processing',
    content: `DentASSIST uses Artificial Intelligence to analyze:

Dental X-rays
Oral images
Smile simulations

AI outputs are reviewed by licensed dental professionals before clinical decisions are made.

AI-generated information should not be interpreted as medical diagnoses.`,
    highlight: true,
  },
  {
    title: '4. Legal Basis',
    content: `Personal information is processed based on:

Your consent
Performance of healthcare services
Compliance with legal obligations
Legitimate interests of the clinic`,
  },
  {
    title: '5. Data Sharing',
    content: `We do not sell your personal information.

Information may be shared with:

Licensed dentists
Authorized dental assistants
Authorized clinic administrators
Technology providers necessary to operate DentASSIST
Government authorities when required by Philippine law`,
  },
  {
    title: '6. Data Security',
    content: `DentASSIST uses reasonable administrative, physical, and technical safeguards, including:

Encrypted passwords
Authentication controls
Role-based access
Secure database storage
Secure communications where supported
Audit logging
Regular backups

No internet transmission or storage system can be guaranteed to be 100% secure.`,
  },
  {
    title: '7. Data Retention',
    content: `Patient records are retained only as long as necessary to:

Provide healthcare services
Meet legal requirements
Resolve disputes
Maintain clinic records

After the retention period, records may be securely deleted or anonymized in accordance with applicable laws and regulations.`,
  },
  {
    title: '8. Your Rights',
    content: `Under the Data Privacy Act, you may have the right to:

Be informed
Access your personal data
Correct inaccurate information
Object to certain processing
Request deletion, subject to legal and healthcare record retention requirements
Request data portability where applicable
File a complaint with the National Privacy Commission

Requests may require identity verification before processing.`,
  },
  {
    title: '9. Cookies',
    content: `DentASSIST may use cookies and similar technologies for:

Login sessions
Security
Preferences
Analytics
Performance improvements

You may disable cookies in your browser, although some features may not function properly.`,
  },
  {
    title: "10. Children's Privacy",
    content: `Patients under 18 years old should use DentASSIST with the consent of a parent or legal guardian.`,
  },
  {
    title: '11. Third-Party Services',
    content: `DentASSIST may integrate with trusted third-party services such as:

Cloud database providers
AI service providers
Notification services
Payment gateways (if enabled)

These providers process information in accordance with their own privacy policies and contractual obligations.`,
  },
  {
    title: '12. Changes',
    content: `This Privacy Policy may be updated periodically.

Material changes will be communicated through the application when appropriate.`,
  },
  {
    title: '13. Contact',
    content: `For privacy concerns or requests regarding your personal information, contact your dental clinic or its designated Data Protection Officer (if applicable) using the official contact information provided by the clinic.`,
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0F766E] transition-colors font-medium"
          >
            <ArrowLeft size={16} /> Back to Sign In
          </button>
          <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-7 object-contain" />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-10">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center">
              <Shield size={20} className="text-[#0F766E]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-8 ml-[52px]">Last Updated: July 27, 2026</p>

          {/* Intro */}
          <div className="mb-8 p-4 bg-[#0F766E]/5 border border-[#0F766E]/15 rounded-xl text-sm text-slate-600 leading-relaxed">
            DentASSIST respects your privacy and is committed to protecting your personal information in accordance with the <strong className="text-slate-800">Data Privacy Act of 2012 (Republic Act No. 10173)</strong> and applicable regulations of the <strong className="text-slate-800">National Privacy Commission</strong>.
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, i) => (
              <div key={i}>
                <h2 className={`text-base font-bold mb-3 ${
                  section.highlight ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  {section.title}
                </h2>
                {section.highlight && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium flex items-center gap-2">
                    <span className="text-amber-500">&#9888;</span> AI processing disclosure
                  </div>
                )}
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
