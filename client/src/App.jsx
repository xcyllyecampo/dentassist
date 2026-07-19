import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import FloatingAI from './components/FloatingAI';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import Queue from './pages/Queue';
import Records from './pages/Records';
import XrayAnalysis from './pages/XrayAnalysis';
import OralScreening from './pages/OralScreening';
import Analytics from './pages/Analytics';
import DigitalTwin from './pages/DigitalTwin';
import TreatmentSupport from './pages/TreatmentSupport';
import SmileSimulation from './pages/SmileSimulation';
import DentistSchedules from './pages/DentistSchedules';
import KioskHome from './pages/kiosk/KioskHome';
import KioskCheckIn from './pages/kiosk/KioskCheckIn';
import KioskQueueStatus from './pages/kiosk/KioskQueueStatus';
import KioskRecords from './pages/kiosk/KioskRecords';
import KioskOralScreening from './pages/kiosk/KioskOralScreening';
import KioskSmileSimulation from './pages/kiosk/KioskSmileSimulation';
import KioskBookAppointment from './pages/kiosk/KioskBookAppointment';
import Spinner from './components/Spinner';

const STAFF_ROLES = ["ADMIN", "DENTIST", "ASSISTANT"];

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" />;
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
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <FloatingAI />
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
          <Route path="/oral-screening" element={<ProtectedRoute><OralScreening /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute roles={["ADMIN", "DENTIST"]}><Analytics /></ProtectedRoute>} />
          <Route path="/digital-twin" element={<ProtectedRoute roles={STAFF_ROLES}><DigitalTwin /></ProtectedRoute>} />
          <Route path="/treatment-support" element={<ProtectedRoute roles={["ADMIN", "DENTIST"]}><TreatmentSupport /></ProtectedRoute>} />
          <Route path="/smile-simulation" element={<ProtectedRoute roles={["ADMIN", "DENTIST"]}><SmileSimulation /></ProtectedRoute>} />
          <Route path="/schedules" element={<ProtectedRoute roles={STAFF_ROLES}><DentistSchedules /></ProtectedRoute>} />

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
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
