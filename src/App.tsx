import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './pages/Login';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { PendingApproval } from './pages/PendingApproval';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, profile, loading, isAdmin, isApproved } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-orange-600" size={48} />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/" />} 
      />
      <Route 
        path="/" 
        element={
          user ? (
            isApproved ? (
              isAdmin ? <AdminDashboard /> : <UserDashboard />
            ) : (
              <PendingApproval />
            )
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/admin/users" 
        element={isAdmin ? <AdminUsers /> : <Navigate to="/" />} 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
