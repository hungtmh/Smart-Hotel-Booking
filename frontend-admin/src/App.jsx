import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import './App.css';

function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-spinner"></div>
        <p>Đang kiểm tra đặc quyền quản trị...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated && isAdmin ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedAdminRoute>
            <AdminPage />
          </ProtectedAdminRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
