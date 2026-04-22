import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StaffDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold' }}>Welcome, {user.username}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>Ready for a new sale?</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <NavLink to="/staff/billing" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ 
            height: '240px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '1.5rem',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1.5rem', borderRadius: '1.5rem' }}>
              <ShoppingCart size={48} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>New Billing (POS)</h2>
          </div>
        </NavLink>

        <NavLink to="/staff/catalog" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ 
            height: '240px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '1.5rem',
            border: '2px dashed var(--border)',
            background: 'transparent',
            boxShadow: 'none',
            color: 'var(--text-main)',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.backgroundColor = 'white';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          >
            <div style={{ background: '#f1f5f9', padding: '1.5rem', borderRadius: '1.5rem', color: 'var(--primary)' }}>
              <Package size={48} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>View Catalog</h2>
          </div>
        </NavLink>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Quick Search</h3>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={18} />
          </div>
          <input 
            placeholder="Search products by SKU or Name..." 
            style={{ width: '100%', paddingLeft: '3rem' }}
          />
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
