import React, { useState, useEffect } from 'react';
import budgetService from '../services/budget.service';
import dashboardService from '../services/dashboard.service';
import {
  PiggyBank,
  Calendar,
  Trash2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  DollarSign
} from 'lucide-react';

const CATEGORIES = ['TOTAL', 'Cloud', 'DevTools', 'Entertainment', 'Collaboration', 'Utilities', 'Other'];

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected month
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Form input states
  const [category, setCategory] = useState('TOTAL');
  const [amount, setAmount] = useState('');

  const loadBudgetsAndSpending = async () => {
    setLoading(true);
    setError('');
    try {
      const budgetList = await budgetService.getBudgets(month);
      setBudgets(budgetList);

      const dashData = await dashboardService.getDashboardData(month);
      setDashboardData(dashData);
    } catch (err) {
      setError('Could not pull budgets or actual monthly expenditures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetsAndSpending();
  }, [month]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (parseFloat(amount) <= 0) {
      setError('Budget amount must be positive.');
      return;
    }

    const payload = { category, amount: parseFloat(amount), month };

    try {
      await budgetService.setBudget(payload);
      setSuccess(`Budget for '${category}' updated successfully!`);
      setAmount('');
      loadBudgetsAndSpending();
    } catch (err) {
      setError('Failed to establish budget limit.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this budget ceiling?')) return;
    setError('');
    setSuccess('');
    try {
      await budgetService.removeBudget(id);
      setSuccess('Budget limit removed.');
      loadBudgetsAndSpending();
    } catch (err) {
      setError('Failed to remove budget limit.');
    }
  };

  // Helper to get spending for a category
  const getCategorySpending = (catName) => {
    if (!dashboardData) return 0;
    if (catName === 'TOTAL') {
      return dashboardData.totalExpenses || 0;
    }
    return dashboardData.categoryExpenses?.[catName] || 0;
  };

  return (
    <div className="container-fluid p-4 fade-in-up">
      {/* Header & Selector */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-white mb-1 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit' }}>
            <PiggyBank className="text-warning" size={28} />
            Software Budget Caps
          </h1>
          <p className="text-secondary mb-0">Establish spending limits on software packages per category.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Calendar size={18} className="text-muted" />
          <input
            type="month"
            className="form-control glass-input py-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ width: '180px' }}
          />
        </div>
      </div>

      {/* Message alerts */}
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

      <div className="row g-4">
        {/* Left Side: Create / Update Budgets */}
        <div className="col-lg-4">
          <div className="glass-card p-4">
            <h5 className="text-white mb-4" style={{ fontFamily: 'Outfit' }}>Set Budget Allocations</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium">Budget Category</label>
                <select
                  className="form-select glass-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'TOTAL' ? 'TOTAL (Overall Budget)' : cat}
                    </option>
                  ))}
                </select>
                <div className="form-text text-muted small mt-1">
                  Select 'TOTAL' to set a global monthly limit, or choose individual categories for custom limits.
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small fw-medium">Monthly Limit (₹)</label>
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

              <button type="submit" className="btn btn-grad w-100" style={{ background: 'var(--grad-warning)' }}>
                Apply Budget Limit
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Active Budgets with Progress Bars */}
        <div className="col-lg-8">
          <div className="glass-card p-4">
            <h5 className="text-white mb-4" style={{ fontFamily: 'Outfit' }}>Budgets and Spending Progress ({month})</h5>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status"></div>
              </div>
            ) : budgets.length > 0 ? (
              <div className="d-flex flex-column gap-4">
                {budgets.map((bud) => {
                  const spent = getCategorySpending(bud.category);
                  const limit = parseFloat(bud.amount);
                  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                  const remaining = limit - spent;

                  return (
                    <div key={bud.id} className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                        <div>
                          <span className="fw-semibold text-white fs-6">
                            {bud.category === 'TOTAL' ? '⭐ Overall Monthly Budget' : bud.category}
                          </span>
                          <div className="text-muted small mt-1">
                            Spent: ₹{spent.toLocaleString(undefined, { minimumFractionDigits: 2 })} of ₹{limit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="text-end">
                          <span className={`fw-bold small px-2 py-1 rounded ${remaining >= 0 ? 'text-success bg-success-subtle' : 'text-danger bg-danger-subtle'}`} style={{ fontSize: '0.75rem' }}>
                            {remaining >= 0 ? `Remaining: ₹${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `Over Budget: ₹${Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                          </span>

                          <button
                            onClick={() => handleDelete(bud.id)}
                            className="btn btn-sm btn-outline-danger border-0 p-1 ms-2"
                            title="Delete budget limit"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="progress bg-secondary mt-2" style={{ height: '8px', borderRadius: '4px' }}>
                        <div
                          className={`progress-bar rounded-pill ${percentage > 100 ? 'bg-danger' : percentage > 80 ? 'bg-warning' : 'bg-success'}`}
                          role="progressbar"
                          style={{ width: `${Math.min(percentage, 100)}%`, transition: 'width 0.8s ease-in-out' }}
                          aria-valuenow={percentage}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div className="text-end text-white-50 small mt-1" style={{ fontSize: '0.75rem' }}>
                        {percentage.toFixed(1)}% utilized
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5 text-secondary">
                No budget allocations have been established for {month}. Set some limits on the left to start tracking thresholds.
              </div>
            )}
          </div>
        </div>
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

export default Budgets;
