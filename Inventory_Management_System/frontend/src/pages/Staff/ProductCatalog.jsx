import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Search, Package } from 'lucide-react';

const StaffCatalog = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [pRes, cRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/categories')
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div>Loading Catalog...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Product Catalog</h1>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            placeholder="Search products..." 
            style={{ width: '100%', paddingLeft: '3rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const totalStock = p.batches.reduce((sum, b) => sum + b.quantity, 0);
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{categories.find(c => c.id === p.category_id)?.name || 'N/A'}</td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>
                    {totalStock > 10 ? (
                      <span className="badge badge-in">In Stock ({totalStock})</span>
                    ) : totalStock > 0 ? (
                      <span className="badge badge-low">Low Stock ({totalStock})</span>
                    ) : (
                      <span className="badge badge-out">Out of Stock</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffCatalog;
