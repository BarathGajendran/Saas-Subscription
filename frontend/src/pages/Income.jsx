import React, { useState, useEffect } from 'react';
import incomeService from '../services/income.service'; // Keep service import to avoid extra refactors
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Receipt, 
  AlertCircle 
} from 'lucide-react';

const Income = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [amount, setAmount] = useState('');
  const [subscriptionName, setSubscriptionName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Search & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const loadPayments = async () => {
    try {
      const data = await incomeService.getAll();
      setPayments(data);
    } catch (err) {
      setError('Failed to fetch billing receipts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (parseFloat(amount) <= 0) {
      setError('Billing amount must be positive.');
      return;
    }

    const payload = { 
      subscriptionName, 
      amount: parseFloat(amount), 
      date 
    };

    try {
      if (editingId) {
        await incomeService.update(editingId, payload);
        setSuccess('Receipt entry updated successfully!');
      } else {
        await incomeService.create(payload);
        setSuccess('Billing receipt logged!');
      }
      resetForm();
      loadPayments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save receipt.');
    }
  };

  const handleEdit = (pay) => {
    setEditingId(pay.id);
    setAmount(pay.amount.toString());
    setSubscriptionName(pay.subscriptionName);
    setDate(pay.date);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this receipt record?')) return;
    setError('');
    setSuccess('');
    try {
      await incomeService.remove(id);
      setSuccess('Billing record deleted.');
      loadPayments();
    } catch (err) {
      setError('Failed to delete billing record.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setSubscriptionName('');
    setDate(new Date().toISOString().substring(0, 10));
    setShowForm(false);
  };

  // Filtered & Sorted list
  const processedPayments = payments
    .filter(p => {
      return p.subscriptionName?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

  return (
    <div className="container-fluid p-4 fade-in-up">
      {/* Header & Log Toggle Button */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-white mb-1 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit' }}>
            <Receipt className="text-success" size={28} />
            Billing Logs & Receipts
          </h1>
          <p className="text-secondary mb-0">Record and audit past software invoices and renewals to flag cost anomalies.</p>
        </div>
        <button 
          onClick={() => { showForm ? resetForm() : setShowForm(true); }}
          className="btn btn-grad d-flex align-items-center gap-2"
          style={{ background: 'var(--grad-success)' }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Log Receipt'}
        </button>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="custom-alert-danger mb-4 small">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="custom-alert mb-4 small" style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <CheckCircleHelper size={18} />
          <div>{success}</div>
        </div>
      )}

      {/* Input Form Collapse */}
      {showForm && (
        <div className="glass-card p-4 mb-4 fade-in-up">
          <h5 className="text-white mb-3" style={{ fontFamily: 'Outfit' }}>
            {editingId ? 'Modify Receipt Entry' : 'Log SaaS Payment Receipt'}
          </h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label text-secondary small fw-medium">Subscription Name</label>
              <input 
                type="text" 
                className="form-control glass-input" 
                placeholder="AWS Cloud, GitHub Copilot, Zoom, etc." 
                value={subscriptionName}
                onChange={(e) => setSubscriptionName(e.target.value)}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label text-secondary small fw-medium">Billing Date</label>
              <input 
                type="date" 
                className="form-control glass-input" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required 
              />
            </div>

            <div className="col-md-4">
              <label className="form-label text-secondary small fw-medium">Charged Amount (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-control glass-input" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required 
              />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 mt-4">
              <button type="button" onClick={resetForm} className="btn btn-outline-secondary px-4 rounded-3 text-light border-color">
                Discard
              </button>
              <button type="submit" className="btn btn-grad px-4" style={{ background: 'var(--grad-success)' }}>
                {editingId ? 'Save Changes' : 'Log Receipt'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtering Actions */}
      <div className="glass-card p-4 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-color">
                <Search size={16} className="text-muted" />
              </span>
              <input 
                type="text" 
                className="form-control glass-input border-start-0" 
                placeholder="Search subscription names..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <select 
              className="form-select glass-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Sort: Billing Date (Newest)</option>
              <option value="date-asc">Sort: Billing Date (Oldest)</option>
              <option value="amount-desc">Sort: Amount (Highest)</option>
              <option value="amount-asc">Sort: Amount (Lowest)</option>
            </select>
          </div>
          
          <div className="col-md-2 text-md-end text-muted small">
            Receipts: {processedPayments.length}
          </div>
        </div>
      </div>

      {/* Billing Logs Table */}
      <div className="glass-card p-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : processedPayments.length > 0 ? (
          <div className="table-responsive">
            <table className="table glass-table align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subscription Product</th>
                  <th>Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedPayments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="fw-semibold text-white-50">{pay.date}</td>
                    <td className="text-white fw-bold">{pay.subscriptionName}</td>
                    <td className="text-success fw-bold">₹{parseFloat(pay.amount).toFixed(2)}</td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          onClick={() => handleEdit(pay)}
                          className="btn btn-sm btn-outline-light border-0 p-2 text-secondary hover-text-white"
                          title="Modify entry"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(pay.id)}
                          className="btn btn-sm btn-outline-danger border-0 p-2 hover-bg-danger"
                          title="Delete entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5 text-secondary">
            No billing receipts logged yet.
          </div>
        )}
      </div>
    </div>
  );
};

const CheckCircleHelper = ({ size, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default Income;
