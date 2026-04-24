import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Search, ShoppingCart, UserPlus, Trash2, CheckCircle, Printer, HelpCircle, Edit } from 'lucide-react';

const StaffBilling = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(null);
  const [error, setError] = useState(null);
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`);
  };

  // Customer Search/Add State
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [custFormData, setCustFormData] = useState({ name: '', phone: '', email: '', telegram_chat_id: '' });

  // Payment State
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' or 'udhari'
  const [amountPaid, setAmountPaid] = useState('');
  const [customerSummary, setCustomerSummary] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerSummary(selectedCustomer.id);
      setPaymentType('cash');
      setAmountPaid('');
    } else {
      setCustomerSummary(null);
    }
  }, [selectedCustomer]);

  const fetchCustomerSummary = async (id) => {
    try {
      const res = await apiClient.get(`/customers/${id}/summary`);
      setCustomerSummary(res.data);
    } catch (err) {
      console.error("Summary fetch error:", err);
    }
  };

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
  const amountDue = paymentType === 'cash' ? 0 : Math.max(0, totalAmount - (parseFloat(amountPaid) || 0));

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...custFormData };
      if (!payload.email) delete payload.email;
      
      let res;
      if (editMode && selectedCustomer) {
        res = await apiClient.put(`/customers/${selectedCustomer.id}`, payload);
        setCustomers(customers.map(c => c.id === res.data.id ? res.data : c));
        alert('Customer updated successfully!');
      } else {
        res = await apiClient.post('/customers', payload);
        setCustomers([...customers, res.data]);
      }
      
      setSelectedCustomer(res.data);
      setShowCustomerForm(false);
      setEditMode(false);
      setCustFormData({ name: '', phone: '', email: '', telegram_chat_id: '' });
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving customer');
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
        payment_type: paymentType,
        amount_paid: paymentType === 'cash' ? totalAmount : (parseFloat(amountPaid) || 0),
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
            <p><strong>Payment Type:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{showInvoice.payment_type}</span></p>
            <p><strong>Date:</strong> {formatDate(showInvoice.created_at)?.toLocaleString()}</p>
            
            <div style={{ marginTop: '1rem' }}>
              {showInvoice.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>{products.find(p => p.id === item.product_id)?.name} x {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                <span>Paid</span>
                <span>₹{showInvoice.amount_paid.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#ef4444' }}>
                <span>Due</span>
                <span>₹{showInvoice.amount_due.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '2px solid var(--text-main)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem' }}>
                <span>Total</span>
                <span>₹{showInvoice.total_amount.toFixed(2)}</span>
              </div>
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
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', height: 'calc(100vh - 120px)' }}>
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
                    <span style={{ fontWeight: '700', color: 'var(--primary)' }}>₹{p.price.toFixed(2)}</span>
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

      {/* Cart & Customer Side */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
        {/* Customer Section */}
        <div className="card">
            {selectedCustomer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{ fontWeight: '700', fontSize: '1.125rem' }}>{selectedCustomer.name}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selectedCustomer.phone}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => {
                            setCustFormData({
                              name: selectedCustomer.name,
                              phone: selectedCustomer.phone,
                              email: selectedCustomer.email || '',
                              telegram_chat_id: selectedCustomer.telegram_chat_id || ''
                            });
                            setEditMode(true);
                            setShowCustomerForm(true);
                          }} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem' }}
                          title="Edit Customer"
                        >
                            <Edit size={16} />
                        </button>
                        <button onClick={() => setSelectedCustomer(null)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Change</button>
                    </div>
                </div>
                
                {editMode ? (
                  <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    <p style={{ fontWeight: 'bold' }}>Edit Customer Details</p>
                    <input placeholder="Full Name" value={custFormData.name} onChange={e => setCustFormData({...custFormData, name: e.target.value})} required />
                    <input placeholder="Phone Number" value={custFormData.phone} onChange={e => setCustFormData({...custFormData, phone: e.target.value})} required />
                    <div style={{ position: 'relative' }}>
                      <input 
                        placeholder="Telegram Chat ID (optional)" 
                        value={custFormData.telegram_chat_id} 
                        onChange={e => setCustFormData({...custFormData, telegram_chat_id: e.target.value})} 
                        style={{ width: '100%' }}
                      />
                      <HelpCircle 
                        size={16} 
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'help', color: 'var(--text-muted)' }} 
                        title="Ask customer to message @userinfobot on Telegram to get their ID. They MUST also 'Start' your shop's bot!"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={() => { setEditMode(false); }} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                    </div>
                  </form>
                ) : customerSummary && (
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem' }}>Pending Balance:</span>
                            <span style={{ fontWeight: '700', color: customerSummary.pending_balance > 0 ? '#ef4444' : '#22c55e' }}>₹{customerSummary.pending_balance.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem' }}>Unpaid Invoices:</span>
                            <span style={{ fontWeight: '700' }}>{customerSummary.total_unpaid_invoices}</span>
                        </div>
                        {customerSummary.telegram_chat_id && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem' }}>Telegram ID:</span>
                                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{customerSummary.telegram_chat_id}</span>
                            </div>
                        )}
                        {customerSummary.pending_balance > 2000 && (
                            <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', marginTop: '0.5rem' }}>
                                ⚠️ Customer has high pending dues!
                            </p>
                        )}
                    </div>
                )}
              </div>
            ) : showCustomerForm ? (
              <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontWeight: 'bold' }}>New Customer</p>
                <input placeholder="Full Name" value={custFormData.name} onChange={e => setCustFormData({...custFormData, name: e.target.value})} required />
                <input placeholder="Phone Number" value={custFormData.phone} onChange={e => setCustFormData({...custFormData, phone: e.target.value})} required />
                <div style={{ position: 'relative' }}>
                  <input 
                    placeholder="Telegram Chat ID (optional)" 
                    value={custFormData.telegram_chat_id} 
                    onChange={e => setCustFormData({...custFormData, telegram_chat_id: e.target.value})} 
                    style={{ width: '100%' }}
                  />
                  <HelpCircle 
                    size={16} 
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'help', color: 'var(--text-muted)' }} 
                    title="Ask customer to message @userinfobot on Telegram to get their ID. They MUST also 'Start' your shop's bot!"
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => { setShowCustomerForm(false); }} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                    style={{ flex: 1 }} 
                    onChange={e => {
                        const cust = customers.find(c => c.id === parseInt(e.target.value));
                        if (cust) setSelectedCustomer(cust);
                    }}
                    value=""
                >
                    <option value="">Select Existing Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
                <button onClick={() => { setEditMode(false); setCustFormData({ name: '', phone: '', email: '', telegram_chat_id: '' }); setShowCustomerForm(true); }} className="btn btn-secondary">
                    <UserPlus size={18} />
                </button>
              </div>
            )}
        </div>

        {/* Order Details */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <ShoppingCart size={22} /> Order Items
          </h2>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '500' }}>{item.name}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>₹{item.price.toFixed(2)} / unit</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button onClick={() => updateCartQty(item.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border)', background: 'white' }}>-</button>
                  <span style={{ fontWeight: 'bold' }}>{item.qty}</span>
                  <button onClick={() => updateCartQty(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border)', background: 'white' }}>+</button>
                </div>
                <div style={{ minWidth: '80px', textAlign: 'right' }}>
                  <p style={{ fontWeight: 'bold' }}>₹{(item.price * item.qty).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', padding: 0 }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>Order is empty</p>}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            {/* Payment Section */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <label style={{ flex: 1, cursor: 'pointer' }}>
                        <input type="radio" name="payment" value="cash" checked={paymentType === 'cash'} onChange={() => setPaymentType('cash')} style={{ marginRight: '0.5rem' }} />
                        Full Cash
                    </label>
                    <label style={{ flex: 1, cursor: 'pointer' }}>
                        <input type="radio" name="payment" value="udhari" checked={paymentType === 'udhari'} onChange={() => setPaymentType('udhari')} style={{ marginRight: '0.5rem' }} />
                        Pay Later (Udhari)
                    </label>
                </div>

                {paymentType === 'udhari' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Amount Paid Now (optional)</label>
                        <input 
                            type="number" 
                            placeholder="0.00" 
                            value={amountPaid} 
                            onChange={e => setAmountPaid(e.target.value)} 
                            style={{ width: '100%' }}
                        />
                        <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.25rem' }}>
                            Amount to be added to credit: <strong>₹{amountDue.toFixed(2)}</strong>
                        </p>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
              <span>Total Amount</span>
              <span style={{ color: 'var(--primary)' }}>₹{totalAmount.toFixed(2)}</span>
            </div>
            <button 
              onClick={finalizeBill} 
              disabled={cart.length === 0 || !selectedCustomer}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1.25rem', justifyContent: 'center', opacity: (cart.length === 0 || !selectedCustomer) ? 0.5 : 1 }}
            >
              Generate Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffBilling;
