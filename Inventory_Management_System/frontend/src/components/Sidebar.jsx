import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Database, 
  History, 
  ShoppingCart, 
  Users, 
  LogOut,
  Files,
  IndianRupee
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  
  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/products', icon: Package, label: 'Products' },
    { to: '/admin/categories', icon: Tags, label: 'Categories' },
    { to: '/admin/inventory', icon: Database, label: 'Inventory' },
    { to: '/admin/stock', icon: Package, label: 'Stock IN (Batches)' },
    { to: '/admin/transactions', icon: History, label: 'Transactions' },
    { to: '/admin/customers', icon: Users, label: 'Customers' },
  ];

  const staffLinks = [
    { to: '/staff', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/staff/billing', icon: ShoppingCart, label: 'New Billing' },
    { to: '/staff/catalog', icon: Package, label: 'Product Catalog' },
    { to: '/staff/payments', icon: IndianRupee, label: 'Customer Payments' },
  ];

  const links = user.role === 'admin' ? adminLinks : staffLinks;

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '0 0.5rem 2rem', borderBottom: '1px solid #334155', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Database size={28} color="#818cf8" />
          IMS Pro
        </h1>
      </div>
      
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {links.map((link) => (
          <NavLink 
            key={link.to} 
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.875rem 1rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              color: isActive ? 'white' : '#94a3b8',
              backgroundColor: isActive ? '#334155' : 'transparent',
              fontWeight: isActive ? '600' : '400',
              transition: 'all 0.2s'
            })}
          >
            <link.icon size={20} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '1rem 0.5rem 0', borderTop: '1px solid #334155' }}>
        <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user.username}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>{user.role}</p>
        </div>
        <button 
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.875rem 1rem',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#ef4444',
            textAlign: 'left',
            borderRadius: '0.5rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#450a0a'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
