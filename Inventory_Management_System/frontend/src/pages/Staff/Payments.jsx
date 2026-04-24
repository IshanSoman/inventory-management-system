import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Search, IndianRupee, History, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const StaffPayments = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState('');

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    // Backend sends UTC naive strings. Append 'Z' to treat as UTC and convert to local.
    return new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await apiClient.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerHistory = async (id) => {
    try {
      const res = await apiClient.get(`/customers/${id}/ledger`);
      setPaymentHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setSuccess('');
    fetchCustomerHistory(customer.id);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
    
    setProcessing(true);
    try {
      await apiClient.post('/payments', {
        customer_id: selectedCustomer.id,
        amount: parseFloat(paymentAmount)
      });
      
      setSuccess('Payment recorded successfully!');
      setPaymentAmount('');
      
      // Refresh customer data and history
      const updatedCustRes = await apiClient.get(`/customers/by-phone/${selectedCustomer.phone}`);
      setSelectedCustomer(updatedCustRes.data);
      fetchCustomerHistory(selectedCustomer.id);
      fetchCustomers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error recording payment');
    } finally {
      setProcessing(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" /></div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', height: 'calc(100vh - 120px)' }}>
      {/* Customer List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              placeholder="Search customers..." 
              style={{ width: '100%', paddingLeft: '3rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          {filteredCustomers.map(c => (
            <div 
              key={c.id} 
              onClick={() => handleSelectCustomer(c)}
              style={{ 
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid var(--border)', 
                cursor: 'pointer',
                background: selectedCustomer?.id === c.id ? '#eff6ff' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <p style={{ fontWeight: '600' }}>{c.name}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{c.phone}</p>
              </div>
              {c.pending_balance > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#ef4444', fontWeight: 'bold' }}>₹{c.pending_balance.toFixed(2)}</p>
                  <p style={{ fontSize: '0.7rem', color: '#ef4444', textTransform: 'uppercase' }}>Due</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Interface */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {selectedCustomer ? (
          <>
            <div className="card" style={{ background: selectedCustomer.pending_balance > 2000 ? '#fff1f2' : 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedCustomer.name}</h2>
                  <p style={{ color: 'var(--text-muted)' }}>Customer ID: #{selectedCustomer.id}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pending Balance</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: selectedCustomer.pending_balance > 0 ? '#ef4444' : '#22c55e' }}>
                    ₹{selectedCustomer.pending_balance.toFixed(2)}
                  </h3>
                </div>
              </div>

              {selectedCustomer.pending_balance > 2000 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#fee2e2', borderRadius: '0.75rem', color: '#b91c1c', marginBottom: '1.5rem' }}>
                  <AlertCircle size={20} />
                  <p style={{ fontWeight: '600' }}>⚠️ High pending dues detected</p>
                </div>
              )}

              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#dcfce7', borderRadius: '0.75rem', color: '#15803d', marginBottom: '1.5rem' }}>
                  <CheckCircle size={20} />
                  <p style={{ fontWeight: '600' }}>{success}</p>
                </div>
              )}

              <form onSubmit={handlePayment} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>₹</span>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="Enter amount to pay..."
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    max={selectedCustomer.pending_balance}
                    required
                  />
                </div>
                <button type="submit" disabled={processing || !paymentAmount} className="btn btn-primary" style={{ padding: '0 2rem' }}>
                  {processing ? 'Processing...' : 'Record Payment'}
                </button>
              </form>
            </div>

            <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 'bold' }}>
                <History size={20} /> Payment History
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Time & Date</th>
                      <th>Type</th>
                      <th>Reference</th>
                      <th>Transaction Info</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map(p => (
                      <tr key={`${p.type}-${p.id}`}>
                        <td>
                          <p style={{ fontWeight: '600', margin: 0 }}>
                            {formatDate(p.date)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                            {formatDate(p.date)?.toLocaleDateString()}
                          </p>
                        </td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: p.type === 'BILL' ? '#fef3c7' : '#dcfce7',
                            color: p.type === 'BILL' ? '#92400e' : '#166534'
                          }}>
                            {p.type}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          {p.reference}
                        </td>
                        <td>
                          {p.type === 'BILL' ? (
                            <div style={{ fontSize: '0.8rem' }}>
                              <p style={{ margin: 0 }}>Total: ₹{p.total_amount}</p>
                              {p.amount_due > 0 ? (
                                <p style={{ margin: 0, color: '#e11d48' }}>Due: ₹{p.amount_due}</p>
                              ) : (
                                <p style={{ margin: 0, color: '#16a34a' }}>Fully Paid</p>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Received Payment</span>
                          )}
                        </td>
                        <td style={{ 
                          fontWeight: 'bold', 
                          color: p.type === 'BILL' ? '#e11d48' : '#22c55e' 
                        }}>
                          {p.type === 'BILL' ? '-' : '+'} ₹{p.type === 'BILL' ? p.total_amount.toFixed(2) : p.total_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {paymentHistory.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No transaction history found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <IndianRupee size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
            <p>Select a customer to manage payments</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPayments;
