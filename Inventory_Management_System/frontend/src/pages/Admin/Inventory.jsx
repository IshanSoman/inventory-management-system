import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { TrendingUp, AlertTriangle, Package, CheckCircle, BarChart3, Filter } from 'lucide-react';

const AdminInventory = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, low, high-demand

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleRestock = (productId) => {
    navigate('/admin/stock', { state: { preSelectId: productId } });
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/reports/inventory-status');
      setData(res.data);
    } catch (err) {
      console.error("Error fetching inventory analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    if (filter === 'low') return item.current_stock < 10;
    if (filter === 'high-demand') return item.total_sold > 20; // Example threshold
    return true;
  });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading Inventory Data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Inventory Analysis</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track stock levels and sales demand</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
          >
            <option value="all">All Products</option>
            <option value="low">Low Stock</option>
            <option value="high-demand">High Demand</option>
          </select>
          <button onClick={fetchInventory} className="btn btn-secondary">Refresh</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#e0e7ff', padding: '1rem', borderRadius: '0.75rem', color: '#4338ca' }}>
            <Package size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Products</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.length}</p>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '0.75rem', color: '#b91c1c' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Low Stock</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.filter(i => i.current_stock < 10).length}</p>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.75rem', color: '#15803d' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Best Seller</p>
            <p style={{ fontSize: '1rem', fontWeight: 'bold' }}>{data[0]?.name || 'N/A'}</p>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '0.75rem', color: '#1d4ed8' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Avg. Sold / Item</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {data.length ? (data.reduce((acc, curr) => acc + curr.total_sold, 0) / data.length).toFixed(1) : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Product Info</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Current Stock</th>
              <th style={{ padding: '1rem' }}>Total Sold</th>
              <th style={{ padding: '1rem' }}>Demand Status</th>
              <th style={{ padding: '1rem' }}>Action Needed</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>
                  <p style={{ fontWeight: '600' }}>{item.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sku}</p>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className="badge badge-in">{item.category}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <p style={{ fontWeight: 'bold', color: item.current_stock < 10 ? '#ef4444' : 'inherit' }}>
                    {item.current_stock} Units
                  </p>
                  {item.current_stock < 10 && <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>Critical Stock</span>}
                </td>
                <td style={{ padding: '1rem' }}>
                  <p style={{ fontWeight: 'bold' }}>{item.total_sold}</p>
                </td>
                <td style={{ padding: '1rem' }}>
                  {item.total_sold > 50 ? (
                    <span style={{ color: '#8b5cf6', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <TrendingUp size={14} /> High Demand
                    </span>
                  ) : item.total_sold > 0 ? (
                    <span style={{ color: '#6366f1', fontWeight: '500' }}>Moderate</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>No Demand</span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  {item.current_stock < 10 ? (
                    <button 
                      onClick={() => handleRestock(item.id)}
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    >
                      Restock Now
                    </button>
                  ) : item.total_sold > 50 && item.current_stock < 30 ? (
                    <button 
                      onClick={() => handleRestock(item.id)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                    >
                      Order Buffering
                    </button>
                  ) : (
                    <span style={{ color: '#22c55e', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={14} /> Optimized
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInventory;
