import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import {
  Users, Search, Phone, Mail, ShoppingBag, DollarSign,
  X, ChevronDown, ChevronUp, Package, Calendar, Hash, Eye, Edit
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Tiny helper: format date nicely
───────────────────────────────────────────── */
const fmtDate = (iso) => {
  if (!iso) return '—';
  // Backend sends UTC naive strings. Append 'Z' to treat as UTC and convert to local.
  const date = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

/* ─────────────────────────────────────────────
   Invoice row inside the history modal
───────────────────────────────────────────── */
const InvoiceRow = ({ inv, index }) => {
  const [open, setOpen] = useState(index === 0); // first one expanded

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      marginBottom: '0.75rem'
    }}>
      {/* Invoice header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0.875rem 1.25rem',
          background: open ? '#f0f4ff' : '#f8fafc',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            background: '#e0e7ff', color: '#4f46e5',
            borderRadius: '0.4rem', padding: '0.2rem 0.6rem',
            fontWeight: 700, fontSize: '0.8rem'
          }}>
            #{inv.invoice_id}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={14} />{fmtDate(inv.created_at)}
          </span>
          <span style={{ fontSize: '0.85rem' }}>
            {inv.items.length} item{inv.items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 700, color: '#22c55e', fontSize: '1rem' }}>
            ₹{inv.total_amount.toFixed(2)}
          </span>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Item breakdown */}
      {open && (
        <div style={{ padding: '0 1.25rem 1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Product</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Qty</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Unit Price</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={14} color="#4f46e5" />
                    {item.product_name}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                  <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#4f46e5' }}>
                    ₹{item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Customer History Modal
───────────────────────────────────────────── */
const HistoryModal = ({ customer, onClose }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/customers/${customer.id}/history`);
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [customer.id]);

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
    >
      {/* Modal panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '1.25rem', width: '100%',
          maxWidth: '680px', maxHeight: '90vh', display: 'flex',
          flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.25s ease'
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {customer.name}
            </h2>
            <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={13} />{customer.phone}
              </span>
              {customer.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={13} />{customer.email}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: '0.5rem',
              padding: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats row */}
        {history && !loading && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '1rem', padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              borderRadius: '0.875rem', padding: '1rem 1.25rem', color: 'white'
            }}>
              <p style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '0.25rem' }}>Total Spent</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800 }}>₹{history.total_spent.toFixed(2)}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
              borderRadius: '0.875rem', padding: '1rem 1.25rem', color: 'white'
            }}>
              <p style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '0.25rem' }}>Total Invoices</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800 }}>{history.total_invoices}</p>
            </div>
          </div>
        )}

        {/* Invoice list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading history...
            </div>
          )}
          {!loading && history?.invoices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <ShoppingBag size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No purchase history yet.</p>
            </div>
          )}
          {!loading && history?.invoices.map((inv, i) => (
            <InvoiceRow key={inv.invoice_id} inv={inv} index={i} />
          ))}
        </div>
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Customer Edit Modal
───────────────────────────────────────────── */
const EditModal = ({ customer, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '',
    telegram_chat_id: customer.telegram_chat_id || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.put(`/customers/${customer.id}`, formData);
      onUpdate(res.data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error updating customer');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)', zIndex: 1100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '1.25rem', width: '100%',
          maxWidth: '450px', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.25)'
        }}
      >
        <h2 style={{ marginBottom: '1.5rem' }}>Edit Customer</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Full Name</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Phone Number</label>
            <input 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              required 
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Email (optional)</label>
            <input 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Telegram Chat ID (optional)</label>
            <input 
              value={formData.telegram_chat_id} 
              onChange={e => setFormData({...formData, telegram_chat_id: e.target.value})} 
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Customers Page
───────────────────────────────────────────── */
const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // customer for history modal
  const [editing, setEditing] = useState(null); // customer for edit modal

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/customers');
        setCustomers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Customers</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            View all registered customers and their complete purchase history.
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: '1rem', padding: '1rem 1.5rem', color: 'white',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          boxShadow: '0 4px 15px rgba(79,70,229,0.35)'
        }}>
          <Users size={22} />
          <div>
            <p style={{ fontSize: '0.75rem', opacity: 0.85 }}>Total Customers</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{customers.length}</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '440px' }}>
        <Search
          size={18}
          style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search by name, phone or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '2.75rem', width: '100%', fontSize: '0.9rem' }}
        />
      </div>

      {/* Customer cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading customers…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.25 }} />
          <p>No customers found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(c => (
            <div
              key={c.id}
              className="card"
              style={{ position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0
                }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600 }}>
                    ID #{c.id}
                  </p>
                </div>
                <button 
                  onClick={() => setEditing(c)}
                  style={{ marginLeft: 'auto', background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.4rem', cursor: 'pointer' }}
                >
                  <Edit size={16} color="var(--text-muted)" />
                </button>
              </div>

              {/* Contact details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <Phone size={14} color="#4f46e5" />{c.phone}
                </span>
                {c.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <Mail size={14} color="#4f46e5" />{c.email}
                  </span>
                )}
                {c.telegram_chat_id && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4f46e5', fontWeight: 600 }}>
                    <Hash size={14} />{c.telegram_chat_id}
                  </span>
                )}
              </div>

              {/* View history button */}
              <button
                onClick={() => setSelected(c)}
                style={{
                  width: '100%', padding: '0.65rem',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white', border: 'none', borderRadius: '0.6rem',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                <Eye size={16} /> View Purchase History
              </button>
            </div>
          ))}
        </div>
      )}

      {/* History Modal */}
      {selected && (
        <HistoryModal customer={selected} onClose={() => setSelected(null)} />
      )}
      
      {/* Edit Modal */}
      {editing && (
        <EditModal 
          customer={editing} 
          onClose={() => setEditing(null)} 
          onUpdate={(updated) => {
            setCustomers(customers.map(c => c.id === updated.id ? updated : c));
          }}
        />
      )}
    </div>
  );
};

export default AdminCustomers;
