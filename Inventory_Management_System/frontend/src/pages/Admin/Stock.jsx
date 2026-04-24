import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Plus, Database } from 'lucide-react';

const AdminStock = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    product_id: location.state?.preSelectId || '',
    batch_number: '',
    expiry_date: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await apiClient.get('/products');
      setProducts(res.data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/batches', {
        ...formData,
        product_id: parseInt(formData.product_id),
        quantity: parseInt(formData.quantity),
        expiry_date: new Date(formData.expiry_date).toISOString()
      });
      setSuccess('Stock added successfully!');
      setFormData({ product_id: '', batch_number: '', expiry_date: '', quantity: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error adding stock');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Stock Management (IN)</h1>
      
      {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Product</label>
            <select 
              required 
              style={{ width: '100%' }} 
              value={formData.product_id}
              onChange={e => setFormData({...formData, product_id: e.target.value})}
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Batch Number</label>
              <input 
                required 
                style={{ width: '100%' }} 
                placeholder="e.g. B-001"
                value={formData.batch_number}
                onChange={e => setFormData({...formData, batch_number: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Expiry Date</label>
              <input 
                type="date" 
                required 
                style={{ width: '100%' }} 
                value={formData.expiry_date}
                onChange={e => setFormData({...formData, expiry_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Quantity IN</label>
            <input 
              type="number" 
              required 
              min="1"
              style={{ width: '100%' }} 
              placeholder="0"
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '1rem', justifyContent: 'center' }}>
            <Plus size={20} /> Add to Inventory
          </button>
        </form>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fef3c7', borderRadius: '0.75rem', color: '#92400e', fontSize: '0.875rem' }}>
        <strong>Note:</strong> Adding stock creates a new batch for the product. Stock reduction will follow FIFO logic based on expiry date.
      </div>
    </div>
  );
};

export default AdminStock;
