import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    price: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, formData);
      } else {
        await apiClient.post('/products', formData);
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ name: '', sku: '', category_id: '', price: 0 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiClient.delete(`/products/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      price: product.price
    });
    setShowModal(true);
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Product Management</h1>
        <button onClick={() => { setShowModal(true); setEditingProduct(null); }} className="btn btn-primary">
          <Plus size={20} /> Add New Product
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.sku}</td>
                <td>{p.name}</td>
                <td>{categories.find(c => c.id === p.category_id)?.name || 'N/A'}</td>
                <td>${p.price.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--primary)', marginRight: '1rem' }}><Edit size={18} /></button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Product Name</label>
                <input required style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>SKU (Unique)</label>
                <input required style={{ width: '100%' }} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Category</label>
                <select required style={{ width: '100%' }} value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Price ($)</label>
                <input type="number" step="0.01" required style={{ width: '100%' }} value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
