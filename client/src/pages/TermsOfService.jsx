import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `Welcome to DentASSIST.

By accessing or using DentASSIST, you agree to comply with these Terms of Service. If you do not agree with these Terms, you must discontinue use of the application.

DentASSIST is a dental clinic management platform intended to improve appointment scheduling, patient management, AI-assisted dental screening, and clinic operations.`,
  },
  {
    title: '2. Eligibility',
    content: `You must be legally capable of entering into agreements under Philippine law.

Patients under 18 years old must use the application with the consent of a parent or legal guardian.`,
  },
  {
    title: '3. User Accounts',
    content: `Users are responsible for:

Maintaining password confidentiality
Protecting their login credentials
Providing accurate information
Updating personal information when necessary

The clinic reserves the right to suspend accounts involved in fraudulent or unauthorized activities.`,
  },
  {
    title: '4. Services',
    content: `DentASSIST may provide:

Appointment booking
Queue management
Patient records
Dental treatment history
AI-assisted oral screening
AI-assisted smile simulation
AI-assisted X-ray analysis
Treatment support recommendations
Notifications
Loyalty rewards (if applicable)

Services may change without prior notice.`,
  },
  {
    title: '5. AI Disclaimer',
    content: `DentASSIST uses Artificial Intelligence to assist dentists.

AI-generated outputs are:

Informational only
Not medical diagnoses
Not medical advice
Not a substitute for licensed dental professionals

Only a licensed dentist may provide a final diagnosis and treatment plan.

Patients should never rely solely on AI-generated recommendations.`,
    highlight: true,
  },
  {
    title: '6. Medical Disclaimer',
    content: `DentASSIST does not provide emergency medical services.

If you experience severe pain, bleeding, swelling, trauma, or any medical emergency, seek immediate care from a licensed healthcare provider.`,
  },
  {
    title: '7. User Responsibilities',
    content: `Users agree NOT to:

Submit false information
Access another person's account
Upload malicious software
Attempt unauthorized access
Disrupt clinic operations
Use the application for illegal purposes`,
  },
  {
    title: '8. Appointments',
    content: `Appointments submitted through DentASSIST are requests.

Appointment confirmation depends on:

Dentist availability
Clinic operating hours
Clinic approval

The clinic reserves the right to reschedule or cancel appointments when necessary.`,
  },
  {
    title: '9. Intellectual Property',
    content: `All content including:

DentASSIST name
Logos
Software
User interface
Graphics
Source code
AI workflows

remain the property of DentASSIST or its licensors.

Users may not copy, modify, distribute, or reverse engineer the application without permission.`,
  },
  {
    title: '10. Limitation of Liability',
    content: `DentASSIST shall not be liable for:

Delayed appointments
Internet interruptions
Device failures
Data loss caused by user negligence
Incorrect information provided by users
AI prediction inaccuracies

To the maximum extent permitted under Philippine law.`,
  },
  {
    title: '11. Account Termination',
    content: `Accounts may be suspended or terminated if users:

Violate these Terms
Abuse clinic staff
Attempt unauthorized access
Commit fraud`,
  },
  {
    title: '12. Governing Law',
    content: `These Terms shall be governed by the laws of the Republic of the Philippines.

Any disputes shall be subject to the jurisdiction of the appropriate Philippine courts.`,
  },
  {
    title: '13. Changes',
    content: `DentASSIST may modify these Terms at any time.

Continued use after updates constitutes acceptance of the revised Terms.`,
  },
  {
    title: '14. Contact',
    content: `For questions regarding these Terms, contact your dental clinic directly through the official contact information provided by the clinic.`,
  },
];

export default function TermsOfService() {
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
              <FileText size={20} className="text-[#0F766E]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-8 ml-[52px]">Last Updated: July 27, 2026</p>

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
                    <span className="text-amber-500">&#9888;</span> Important — please read carefully
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
