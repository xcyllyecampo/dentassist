import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import FloatingAI from './components/FloatingAI';
import Login from './pages/Login';
import Spinner from './components/Spinner';
import { ShieldOff, LogOut } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Patients = lazy(() => import('./pages/Patients'));
const PatientDetail = lazy(() => import('./pages/PatientDetail'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Queue = lazy(() => import('./pages/Queue'));
const Records = lazy(() => import('./pages/Records'));
const XrayAnalysis = lazy(() => import('./pages/XrayAnalysis'));
const OralScreening = lazy(() => import('./pages/OralScreening'));
const Analytics = lazy(() => import('./pages/Analytics'));
const TreatmentSupport = lazy(() => import('./pages/TreatmentSupport'));
const SmileSimulation = lazy(() => import('./pages/SmileSimulation'));
const DentistSchedules = lazy(() => import('./pages/DentistSchedules'));
const AdminManagement = lazy(() => import('./pages/AdminManagement'));
const KioskHome = lazy(() => import('./pages/kiosk/KioskHome'));
const KioskCheckIn = lazy(() => import('./pages/kiosk/KioskCheckIn'));
const KioskQueueStatus = lazy(() => import('./pages/kiosk/KioskQueueStatus'));
const KioskRecords = lazy(() => import('./pages/kiosk/KioskRecords'));
const KioskOralScreening = lazy(() => import('./pages/kiosk/KioskOralScreening'));
const KioskSmileSimulation = lazy(() => import('./pages/kiosk/KioskSmileSimulation'));
const KioskBookAppointment = lazy(() => import('./pages/kiosk/KioskBookAppointment'));

const STAFF_ROLES = ["ADMIN", "DENTIST", "ASSISTANT"];

function AccountDeactivated() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldOff size={32} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Account Deactivated</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Your account has been deactivated by the administrator. Please contact them to restore your access.
        </p>
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" />;
  if (user.active === false) return <AccountDeactivated />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === "PATIENT" ? "/kiosk" : "/dashboard"} />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === "PATIENT" ? "/kiosk" : "/dashboard"} />;
  return children;
}

function DefaultRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user?.role === "PATIENT" ? "/kiosk" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <BrowserRouter>
          <FloatingAI />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

            {/* Staff routes */}
            <Route path="/dashboard" element={<ProtectedRoute roles={STAFF_ROLES}><Dashboard /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute roles={STAFF_ROLES}><Patients /></ProtectedRoute>} />
            <Route path="/patients/:id" element={<ProtectedRoute roles={STAFF_ROLES}><PatientDetail /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute roles={STAFF_ROLES}><Appointments /></ProtectedRoute>} />
            <Route path="/queue" element={<ProtectedRoute roles={STAFF_ROLES}><Queue /></ProtectedRoute>} />
            <Route path="/records" element={<ProtectedRoute roles={STAFF_ROLES}><Records /></ProtectedRoute>} />
            <Route path="/xray" element={<ProtectedRoute roles={["ADMIN", "DENTIST"]}><XrayAnalysis /></ProtectedRoute>} />
            <Route path="/oral-screening" element={<ProtectedRoute roles={STAFF_ROLES}><OralScreening /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute roles={["ADMIN", "DENTIST"]}><Analytics /></ProtectedRoute>} />
            <Route path="/treatment-support" element={<ProtectedRoute roles={["ADMIN", "DENTIST"]}><TreatmentSupport /></ProtectedRoute>} />
            <Route path="/smile-simulation" element={<ProtectedRoute roles={["ADMIN", "DENTIST"]}><SmileSimulation /></ProtectedRoute>} />
            <Route path="/schedules" element={<ProtectedRoute roles={STAFF_ROLES}><DentistSchedules /></ProtectedRoute>} />
            <Route path="/admin/manage-users" element={<ProtectedRoute roles={["ADMIN"]}><AdminManagement /></ProtectedRoute>} />

            {/* Patient kiosk routes */}
            <Route path="/kiosk" element={<ProtectedRoute roles={["PATIENT"]}><KioskHome /></ProtectedRoute>} />
            <Route path="/kiosk/check-in" element={<ProtectedRoute roles={["PATIENT"]}><KioskCheckIn /></ProtectedRoute>} />
            <Route path="/kiosk/queue" element={<ProtectedRoute roles={["PATIENT"]}><KioskQueueStatus /></ProtectedRoute>} />
            <Route path="/kiosk/records" element={<ProtectedRoute roles={["PATIENT"]}><KioskRecords /></ProtectedRoute>} />
            <Route path="/kiosk/oral-screening" element={<ProtectedRoute roles={["PATIENT"]}><KioskOralScreening /></ProtectedRoute>} />
            <Route path="/kiosk/smile" element={<ProtectedRoute roles={["PATIENT"]}><KioskSmileSimulation /></ProtectedRoute>} />
            <Route path="/kiosk/book" element={<ProtectedRoute roles={["PATIENT"]}><KioskBookAppointment /></ProtectedRoute>} />

            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
}
