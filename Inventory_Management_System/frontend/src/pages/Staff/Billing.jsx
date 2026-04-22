import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Search, ShoppingCart, UserPlus, Trash2, CheckCircle, Printer } from 'lucide-react';

const StaffBilling = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(null);

  // Customer Search/Add State
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [custFormData, setCustFormData] = useState({ name: '', phone: '', email: '' });

  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pRes, cRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/customers')
      ]);
      setProducts(pRes.data);
      setCustomers(cRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load POS data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    const totalStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
    
    if (existing) {
      if (existing.qty + 1 > totalStock) {
        alert('Insufficient stock!');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      if (totalStock === 0) {
        alert('Out of stock!');
        return;
      }
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const totalStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
        const newQty = item.qty + delta;
        if (newQty > 0 && newQty <= totalStock) {
          return { ...item, qty: newQty };
        }
        if (newQty > totalStock) alert('Insufficient stock!');
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      // Sanitize payload: don't send empty email strings
      const payload = { ...custFormData };
      if (!payload.email) delete payload.email;
      
      const res = await apiClient.post('/customers', payload);
      setCustomers([...customers, res.data]);
      setSelectedCustomer(res.data);
      setShowCustomerForm(false);
      setCustFormData({ name: '', phone: '', email: '' });
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating customer');
    }
  };

  const finalizeBill = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      const invoiceData = {
        customer_id: selectedCustomer.id,
        total_amount: totalAmount,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty,
          price: item.price
        }))
      };

      const res = await apiClient.post('/invoices', invoiceData);
      setShowInvoice(res.data);
      setCart([]);
      setSelectedCustomer(null);
      fetchData(); // Refresh stock
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating invoice');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontSize: '1.5rem' }}>Loading POS...</div>;

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', border: '1px solid var(--danger)' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Connection Error</h2>
          <p style={{ marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={fetchData} className="btn btn-primary">Retry Connection</button>
        </div>
      </div>
    );
  }

  if (showInvoice) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem' }}>
          <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Bill Generated!</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Invoice ID: INV-{showInvoice.id.toString().padStart(3, '0')}</p>
          
          <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', padding: '1.5rem 0' }}>
            <p><strong>Customer:</strong> {customers.find(c => c.id === showInvoice.customer_id)?.name}</p>
            <p><strong>Date:</strong> {new Date(showInvoice.created_at).toLocaleString()}</p>
            <div style={{ marginTop: '1rem' }}>
              {showInvoice.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>{products.find(p => p.id === item.product_id)?.name} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '2px solid var(--text-main)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem' }}>
              <span>Total</span>
              <span>${showInvoice.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button onClick={() => window.print()} className="btn btn-secondary" style={{ flex: 1 }}>
              <Printer size={20} /> Print
            </button>
            <button onClick={() => setShowInvoice(null)} className="btn btn-primary" style={{ flex: 1 }}>
              New Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', height: 'calc(100vh - 120px)' }}>
      {/* Product Selection Side */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              placeholder="Search by SKU or Name..." 
              style={{ width: '100%', paddingLeft: '3rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())).map(p => {
              const stock = p.batches.reduce((sum, b) => sum + b.quantity, 0);
              return (
                <div key={p.id} onClick={() => addToCart(p)} style={{ 
                  padding: '1rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.75rem', 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: stock === 0 ? '#f8fafc' : 'white',
                  opacity: stock === 0 ? 0.6 : 1
                }}
                onMouseOver={(e) => { if(stock > 0) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</p>
                  <p style={{ fontWeight: '600' }}>{p.name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--primary)' }}>${p.price.toFixed(2)}</span>
                    <span style={{ fontSize: '0.75rem' }} className={stock < 10 ? 'badge badge-low' : 'badge badge-in'}>
                      {stock} Left
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart Side */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <ShoppingCart size={24} /> Current Order
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            {selectedCustomer ? (
              <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: '600' }}>{selectedCustomer.name}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selectedCustomer.phone}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Change</button>
              </div>
            ) : showCustomerForm ? (
              <form onSubmit={handleCreateCustomer} className="card" style={{ padding: '1rem', background: '#f8fafc', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <p style={{ marginBottom: '0.75rem', fontWeight: 'bold' }}>New Customer</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input placeholder="Full Name" value={custFormData.name} onChange={e => setCustFormData({...custFormData, name: e.target.value})} required />
                  <input placeholder="Phone Number" value={custFormData.phone} onChange={e => setCustFormData({...custFormData, phone: e.target.value})} required />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setShowCustomerForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                  </div>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <select 
                    style={{ width: '100%' }} 
                    onChange={e => {
                      const cust = customers.find(c => c.id === parseInt(e.target.value));
                      if (cust) setSelectedCustomer(cust);
                    }}
                    value=""
                  >
                    <option value="">Select Existing Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                  </select>
                </div>
                <button onClick={() => setShowCustomerForm(true)} className="btn btn-secondary">
                  <UserPlus size={18} />
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '500' }}>{item.name}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>${item.price.toFixed(2)} / unit</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button onClick={() => updateCartQty(item.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border)', background: 'white' }}>-</button>
                  <span style={{ fontWeight: 'bold' }}>{item.qty}</span>
                  <button onClick={() => updateCartQty(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border)', background: 'white' }}>+</button>
                </div>
                <div style={{ minWidth: '80px', textAlign: 'right' }}>
                  <p style={{ fontWeight: 'bold' }}>${(item.price * item.qty).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', padding: 0 }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>Cart is empty</p>}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
              <span>Total Amount</span>
              <span style={{ color: 'var(--primary)' }}>${totalAmount.toFixed(2)}</span>
            </div>
            <button 
              onClick={finalizeBill} 
              disabled={cart.length === 0 || !selectedCustomer}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1.25rem', justifyContent: 'center', opacity: (cart.length === 0 || !selectedCustomer) ? 0.5 : 1 }}
            >
              Generate Invoice & Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffBilling;
