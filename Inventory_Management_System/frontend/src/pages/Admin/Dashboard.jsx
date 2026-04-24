import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Package, DollarSign, AlertTriangle, Activity, Download, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    // Backend sends UTC naive strings. Append 'Z' to treat as UTC and convert to local.
    return new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/reports/stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExport = async (type) => {
    try {
      const response = await apiClient.get(`/reports/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => handleExport('products')} className="btn btn-secondary">
            <Download size={18} /> Products CSV
          </button>
          <button onClick={() => handleExport('sales')} className="btn btn-secondary">
            <Download size={18} /> Sales CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#e0e7ff', padding: '1rem', borderRadius: '1rem' }}>
            <Package color="#4f46e5" size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Products</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.total_products}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '1rem' }}>
            <DollarSign color="#22c55e" size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Inventory Value</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${stats?.total_inventory_value.toFixed(2)}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '1rem' }}>
            <AlertTriangle color="#ef4444" size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Low Stock Items</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.low_stock_alerts.length}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '1rem' }}>
            <Activity color="#f59e0b" size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Recent Movement</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.recent_transactions.length}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: stats?.expired_products?.length > 0 ? '1px solid #fca5a5' : undefined }}>
          <div style={{ background: '#ffe4e6', padding: '1rem', borderRadius: '1rem' }}>
            <Clock color="#e11d48" size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Expired Items</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats?.expired_products?.length > 0 ? '#e11d48' : 'inherit' }}>
              {stats?.expired_products?.length ?? 0}
            </h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Low Stock Alerts</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.low_stock_alerts.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td><span className="badge badge-low">Low Stock</span></td>
                  </tr>
                ))}
                {stats?.low_stock_alerts.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No low stock alerts</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Recent Transactions</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>QTY</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_transactions.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span className={`badge badge-${t.type.toLowerCase()}`}>
                        {t.type}
                      </span>
                    </td>
                    <td>{t.quantity}</td>
                    <td style={{ fontSize: '0.875rem' }}>{formatDate(t.timestamp)?.toLocaleTimeString()}</td>
                  </tr>
                ))}
                {stats?.recent_transactions.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No recent activity</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Expired Products Section */}
      <div className="card" style={{ borderLeft: '4px solid #e11d48' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Clock color="#e11d48" size={22} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#e11d48' }}>Expired Products</h2>
          {stats?.expired_products?.length > 0 && (
            <span style={{
              background: '#fee2e2',
              color: '#e11d48',
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px'
            }}>
              {stats.expired_products.length} batch{stats.expired_products.length !== 1 ? 'es' : ''} expired
            </span>
          )}
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Batch Number</th>
                <th>Expiry Date</th>
                <th>Qty in Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.expired_products?.length > 0 ? (
                stats.expired_products.map((item, idx) => (
                  <tr key={item.id} style={{ background: '#fff5f5' }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
                    <td style={{ fontWeight: '600' }}>{item.product_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{item.batch_number}</td>
                    <td style={{ color: '#e11d48', fontWeight: '600' }}>
                      {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td>{item.quantity}</td>
                    <td>
                      <span style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        letterSpacing: '0.03em'
                      }}>EXPIRED</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    ✅ No expired products in stock
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
