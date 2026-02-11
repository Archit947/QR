import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import QRManagement from './pages/QRManagement';
import ContentManagement from './pages/ContentManagement';
import EmployeeTracking from './pages/EmployeeTracking';
import Certificates from './pages/Certificates';
import Login from './pages/Login';
import UserScan from './pages/UserScan';
import UserDashboard from './pages/UserDashboard';

const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin Routes - Protected */}
          <Route path="/admin" element={
            // In a real app, check role === 'admin'
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="qr-codes" element={<QRManagement />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="employees" element={<EmployeeTracking />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="settings" element={<div className="p-4">Settings Placeholder</div>} />
          </Route>

          {/* User Side - Protected */}
          <Route path="/scan/:qrId" element={
            <RequireAuth>
              <UserScan />
            </RequireAuth>
          } />
          
          {/* Default User Dashboard if they login without scan */}
          <Route path="/user/dashboard" element={
            <RequireAuth>
              <UserDashboard />
            </RequireAuth>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
