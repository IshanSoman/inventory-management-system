import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminCategories from './pages/Admin/Categories';
import AdminStock from './pages/Admin/Stock';
import AdminTransactions from './pages/Admin/Transactions';
import AdminCustomers from './pages/Admin/Customers';
import AdminInventory from './pages/Admin/Inventory';
import StaffDashboard from './pages/Staff/Dashboard';
import StaffBilling from './pages/Staff/Billing';
import StaffCatalog from './pages/Staff/ProductCatalog';
import StaffPayments from './pages/Staff/Payments';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/staff'} />;
  }
  
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute role="admin"><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute role="admin"><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/stock" element={<ProtectedRoute role="admin"><AdminStock /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute role="admin"><AdminInventory /></ProtectedRoute>} />
          <Route path="/admin/transactions" element={<ProtectedRoute role="admin"><AdminTransactions /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute role="admin"><AdminCustomers /></ProtectedRoute>} />
          
          {/* Staff Routes */}
          <Route path="/staff" element={<ProtectedRoute role="staff"><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/billing" element={<ProtectedRoute role="staff"><StaffBilling /></ProtectedRoute>} />
          <Route path="/staff/catalog" element={<ProtectedRoute role="staff"><StaffCatalog /></ProtectedRoute>} />
          <Route path="/staff/payments" element={<ProtectedRoute role="staff"><StaffPayments /></ProtectedRoute>} />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
