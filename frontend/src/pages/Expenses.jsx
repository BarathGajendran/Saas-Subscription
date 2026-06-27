import React, { useState, useEffect } from 'react';
import expenseService from '../services/expense.service'; // Keep service import to avoid extra refactors
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Filter, 
  CreditCard, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const CATEGORIES = ['Cloud', 'DevTools', 'Entertainment', 'Collaboration', 'Utilities', 'Other'];
const BILLING_CYCLES = ['MONTHLY', 'ANNUAL'];

const Expenses = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cloud');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [nextRenewalDate, setNextRenewalDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [utilizationRate, setUtilizationRate] = useState('100');
  const [lastUsedDate, setLastUsedDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Filter and Search states
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('renewal-asc');

  const loadSubscriptions = async () => {
    try {
      const data = await expenseService.getAll();
      setSubscriptions(data);
    } catch (err) {
      setError('Failed to fetch subscription records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (parseFloat(amount) <= 0) {
      setError('Amount must be positive.');
      return;
    }

    const payload = {
      name,
      category,
      amount: parseFloat(amount),
      billingCycle,
      nextRenewalDate,
      utilizationRate: parseFloat(utilizationRate) / 100.0,
      lastUsedDate
    };

    try {
      if (editingId) {
        await expenseService.update(editingId, payload);
        setSuccess('Subscription updated successfully!');
      } else {
        await expenseService.create(payload);
        setSuccess('Subscription logged successfully!');
      }
      resetForm();
      loadSubscriptions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save subscription.');
    }
  };

  const handleEdit = (sub) => {
    setEditingId(sub.id);
    setName(sub.name);
    setCategory(sub.category);
    setAmount(sub.amount.toString());
    setBillingCycle(sub.billingCycle);
    setNextRenewalDate(sub.nextRenewalDate);
    setUtilizationRate((sub.utilizationRate * 100).toString());
    setLastUsedDate(sub.lastUsedDate || '');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    setError('');
    setSuccess('');
    try {
      await expenseService.remove(id);
      setSuccess('Subscription record deleted.');
      loadSubscriptions();
    } catch (err) {
      setError('Failed to delete subscription.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('Cloud');
    setAmount('');
    setBillingCycle('MONTHLY');
    setNextRenewalDate(new Date().toISOString().substring(0, 10));
    setUtilizationRate('100');
    setLastUsedDate(new Date().toISOString().substring(0, 10));
    setShowForm(false);
  };

  // Filtered & Sorted list
  const processedSubscriptions = subscriptions
    .filter(s => {
      const matchesCategory = filterCategory === '' || s.category === filterCategory;
      const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'renewal-asc') return new Date(a.nextRenewalDate) - new Date(b.nextRenewalDate);
      if (sortBy === 'renewal-desc') return new Date(b.nextRenewalDate) - new Date(a.nextRenewalDate);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      if (sortBy === 'util-asc') return a.utilizationRate - b.utilizationRate;
      if (sortBy === 'util-desc') return b.utilizationRate - a.utilizationRate;
      return 0;
    });

  return (
    <div className="container-fluid p-4 fade-in-up">
      {/* Header and Toggle Button */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-white mb-1 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit' }}>
            <CreditCard className="text-danger" size={28} />
            SaaS Subscription Manager
          </h1>
          <p className="text-secondary mb-0">Monitor active software licenses, cycle expenditures, and feature utilization.</p>
        </div>
        <button 
          onClick={() => { showForm ? resetForm() : setShowForm(true); }}
          className="btn btn-grad d-flex align-items-center gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Subscription'}
        </button>
      </div>

      {/* Status Indicators */}
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
            {editingId ? 'Modify Subscription Profile' : 'Configure New SaaS Subscription'}
          </h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-3">
              <label className="form-label text-secondary small fw-medium">Software Name</label>
              <input 
                type="text" 
                className="form-control glass-input" 
                placeholder="AWS, Slack, GitHub, etc." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label text-secondary small fw-medium">Category</label>
              <select 
                className="form-select glass-input" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label text-secondary small fw-medium">Cost / Price (₹)</label>
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

            <div className="col-md-3">
              <label className="form-label text-secondary small fw-medium">Billing Cycle</label>
              <select 
                className="form-select glass-input" 
                value={billingCycle} 
                onChange={(e) => setBillingCycle(e.target.value)}
                required
              >
                {BILLING_CYCLES.map(cycle => <option key={cycle} value={cycle}>{cycle}</option>)}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label text-secondary small fw-medium">Next Renewal Date</label>
              <input 
                type="date" 
                className="form-control glass-input" 
                value={nextRenewalDate}
                onChange={(e) => setNextRenewalDate(e.target.value)}
                required 
              />
            </div>

            <div className="col-md-4">
              <label className="form-label text-secondary small fw-medium">Utilization Rate (%)</label>
              <input 
                type="number" 
                min="0"
                max="100"
                className="form-control glass-input" 
                placeholder="100" 
                value={utilizationRate}
                onChange={(e) => setUtilizationRate(e.target.value)}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label text-secondary small fw-medium">Last Used Date</label>
              <input 
                type="date" 
                className="form-control glass-input" 
                value={lastUsedDate}
                onChange={(e) => setLastUsedDate(e.target.value)}
              />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 mt-4">
              <button type="button" onClick={resetForm} className="btn btn-outline-secondary px-4 rounded-3 text-light border-color">
                Discard
              </button>
              <button type="submit" className="btn btn-grad px-4">
                {editingId ? 'Save Changes' : 'Register Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Options */}
      <div className="glass-card p-4 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-color">
                <Search size={16} className="text-muted" />
              </span>
              <input 
                type="text" 
                className="form-control glass-input border-start-0" 
                placeholder="Search software names..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <div className="d-flex align-items-center gap-2">
              <Filter size={16} className="text-secondary" />
              <select 
                className="form-select glass-input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="col-md-3">
            <select 
              className="form-select glass-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="renewal-asc">Sort: Renewal (Earliest)</option>
              <option value="renewal-desc">Sort: Renewal (Latest)</option>
              <option value="amount-desc">Sort: Cost (Highest)</option>
              <option value="amount-asc">Sort: Cost (Lowest)</option>
              <option value="util-desc">Sort: Utilization (Highest)</option>
              <option value="util-asc">Sort: Utilization (Lowest)</option>
            </select>
          </div>
          
          <div className="col-md-2 text-md-end text-muted small">
            Licenses: {processedSubscriptions.length}
          </div>
        </div>
      </div>

      {/* Subscription List Table */}
      <div className="glass-card p-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : processedSubscriptions.length > 0 ? (
          <div className="table-responsive">
            <table className="table glass-table align-middle">
              <thead>
                <tr>
                  <th>Software</th>
                  <th>Category</th>
                  <th>Cost</th>
                  <th>Billing Cycle</th>
                  <th>Next Renewal</th>
                  <th>Utilization</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedSubscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="text-white fw-bold">{sub.name}</td>
                    <td>
                      <span className="badge rounded-pill px-3 py-2" style={{
                        background: getCategoryBadgeColor(sub.category),
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {sub.category}
                      </span>
                    </td>
                    <td className="text-white fw-semibold">₹{parseFloat(sub.amount).toFixed(2)}</td>
                    <td className="text-white-50">{sub.billingCycle}</td>
                    <td className="text-warning fw-semibold">{sub.nextRenewalDate}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress bg-secondary flex-grow-1" style={{ height: '6px', width: '60px' }}>
                          <div 
                            className={`progress-bar ${sub.utilizationRate >= 0.75 ? 'bg-success' : sub.utilizationRate >= 0.50 ? 'bg-warning' : 'bg-danger'}`} 
                            style={{ width: `${sub.utilizationRate * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white small" style={{ minWidth: '35px' }}>{Math.round(sub.utilizationRate * 100)}%</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          onClick={() => handleEdit(sub)}
                          className="btn btn-sm btn-outline-light border-0 p-2 text-secondary hover-text-white"
                          title="Modify parameters"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(sub.id)}
                          className="btn btn-sm btn-outline-danger border-0 p-2 hover-bg-danger"
                          title="Cancel/Remove subscription"
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
            No active SaaS subscriptions matching criteria.
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

const getCategoryBadgeColor = (cat) => {
  switch (cat) {
    case 'Cloud': return 'rgba(99, 102, 241, 0.45)';
    case 'DevTools': return 'rgba(16, 185, 129, 0.45)';
    case 'Entertainment': return 'rgba(236, 72, 153, 0.45)';
    case 'Collaboration': return 'rgba(245, 158, 11, 0.45)';
    case 'Utilities': return 'rgba(6, 182, 212, 0.45)';
    default: return 'rgba(156, 163, 175, 0.45)';
  }
};

export default Expenses;
