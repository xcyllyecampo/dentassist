import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import AIAssistant from './pages/AIAssistant';
import TreatmentSupport from './pages/TreatmentSupport';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-sky-600 font-medium">Loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute roles={["ADMIN","DENTIST","ASSISTANT"]}><Patients /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute roles={["ADMIN","DENTIST","ASSISTANT"]}><PatientDetail /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute roles={["ADMIN","DENTIST","ASSISTANT"]}><Appointments /></ProtectedRoute>} />
          <Route path="/queue" element={<ProtectedRoute roles={["ADMIN","DENTIST","ASSISTANT"]}><Queue /></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute roles={["ADMIN","DENTIST","ASSISTANT"]}><Records /></ProtectedRoute>} />
          <Route path="/xray" element={<ProtectedRoute roles={["ADMIN","DENTIST"]}><XrayAnalysis /></ProtectedRoute>} />
          <Route path="/oral-screening" element={<ProtectedRoute><OralScreening /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute roles={["ADMIN","DENTIST"]}><Analytics /></ProtectedRoute>} />
          <Route path="/digital-twin" element={<ProtectedRoute roles={["ADMIN","DENTIST","ASSISTANT"]}><DigitalTwin /></ProtectedRoute>} />
          <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
          <Route path="/treatment-support" element={<ProtectedRoute roles={["ADMIN","DENTIST"]}><TreatmentSupport /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
