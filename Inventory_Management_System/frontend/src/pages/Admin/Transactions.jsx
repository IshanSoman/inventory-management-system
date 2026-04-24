import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tRes, pRes] = await Promise.all([
          apiClient.get('/transactions'),
          apiClient.get('/products')
        ]);
        setTransactions(tRes.data);
        setProducts(pRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getProductName = (id) => {
    return products.find(p => p.id === id)?.name || `ID: ${id}`;
  };

  if (loading) return <div>Loading logs...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Transaction History</h1>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Time</th>
              <th>User ID</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {t.type === 'IN' ? 
                      <ArrowDownLeft size={16} color="#22c55e" /> : 
                      <ArrowUpRight size={16} color="#ef4444" />
                    }
                    <span className={`badge badge-${t.type.toLowerCase()}`}>
                      {t.type}
                    </span>
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{getProductName(t.product_id)}</td>
                <td>{t.quantity}</td>
                <td style={{ color: 'var(--text-muted)' }}>{formatDate(t.timestamp)?.toLocaleString()}</td>
                <td>{t.user_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTransactions;
