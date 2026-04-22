import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, Trash2 } from 'lucide-react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/categories', { name });
      setName('');
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error adding category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this category?')) {
      try {
        await apiClient.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err) {
        alert('Cannot delete category with active products');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Category Management</h1>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            placeholder="New Category Name" 
            style={{ flex: 1 }} 
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">
            <Plus size={20} /> Add
          </button>
        </form>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCategories;
