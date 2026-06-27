import React, { useState, useEffect } from 'react';
import dashboardService from '../services/dashboard.service';
import expenseService from '../services/expense.service';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  Activity, 
  IndianRupee, 
  CheckCircle,
  Clock
} from 'lucide-react';

// Register ChartJS modules
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
);

const Dashboard = () => {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [data, setData] = useState(null);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const dashData = await dashboardService.getDashboardData(month);
      setData(dashData);
      
      const subscriptions = await expenseService.getAll();
      setAllSubscriptions(subscriptions);
    } catch (err) {
      setError('Could not load SaaS dashboard information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [month]);

  if (loading && !data) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading SaaS Dashboard...</span>
        </div>
      </div>
    );
  }

  // 1. Chart Configuration: Pie Chart (Cost by Category)
  const categories = Object.keys(data?.categoryExpenses || {});
  const expenseValues = Object.values(data?.categoryExpenses || {});
  
  const pieData = {
    labels: categories.length > 0 ? categories : ['No subscriptions active'],
    datasets: [{
      data: expenseValues.length > 0 ? expenseValues : [1],
      backgroundColor: categories.length > 0 ? [
        'rgba(99, 102, 241, 0.75)',  // Indigo (Cloud)
        'rgba(16, 185, 129, 0.75)',  // Emerald (DevTools)
        'rgba(236, 72, 153, 0.75)',  // Pink (Entertainment)
        'rgba(245, 158, 11, 0.75)',  // Amber (Collaboration)
        'rgba(6, 182, 212, 0.75)',   // Cyan (Utilities)
        'rgba(239, 68, 68, 0.75)',   // Rose
        'rgba(156, 163, 175, 0.75)'  // Gray (Other)
      ] : ['rgba(255, 255, 255, 0.05)'],
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
    }]
  };

  // 2. Chart Configuration: Bar Chart (Budgets vs Spend)
  const budgetLabels = Object.keys(data?.categoryBudgets || {});
  const budgetValues = Object.values(data?.categoryBudgets || {});
  const spendValues = budgetLabels.map(cat => data?.categoryExpenses?.[cat] || 0);

  const barData = {
    labels: budgetLabels.length > 0 ? budgetLabels : ['No Budgets Set'],
    datasets: [
      {
        label: 'Budget Limit',
        data: budgetValues.length > 0 ? budgetValues : [0],
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderRadius: 6,
      },
      {
        label: 'Current Spend',
        data: spendValues.length > 0 ? spendValues : [0],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 6,
      }
    ]
  };

  // 3. Subscription renewal order list
  const upcomingRenewals = [...allSubscriptions]
    .filter(sub => new Date(sub.nextRenewalDate) >= new Date())
    .sort((a, b) => new Date(a.nextRenewalDate) - new Date(b.nextRenewalDate))
    .slice(0, 5);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#f3f4f6', font: { family: 'Inter' } }
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#fff',
        bodyColor: '#f3f4f6',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
    }
  };

  return (
    <div className="container-fluid p-4 fade-in-up">
      {/* Header and Month Selector */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="text-white mb-1" style={{ fontFamily: 'Outfit' }}>SaaS Overview Dashboard</h1>
          <p className="text-secondary mb-0">Track recurring spending, annualized run rates, and software utilization.</p>
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

      {/* Error Message */}
      {error && (
        <div className="custom-alert-danger mb-4 small">
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Subscription Warnings and Reminders Banner */}
      {data?.budgetAlerts && data.budgetAlerts.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="glass-card p-3 d-flex flex-column gap-2 border-warning-subtle" style={{ borderLeft: '4px solid var(--color-warning)' }}>
              <span className="text-warning small fw-bold d-flex align-items-center gap-2">
                <AlertTriangle size={16} /> SubGuard Alerts & Renewals:
              </span>
              <ul className="mb-0 text-white-50 ps-4 small">
                {data.budgetAlerts.map((alert, idx) => (
                  <li key={idx} className="mb-1">{alert}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SaaS Optimization Metric Cards */}
      <div className="row g-4 mb-4">
        {/* Active Subscriptions Card */}
        <div className="col-md-3">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary small fw-medium">Active Subscriptions</span>
              <h3 className="text-white mt-1 mb-0" style={{ fontSize: '1.85rem' }}>
                {data?.totalIncome ? Math.round(data.totalIncome) : 0}
              </h3>
            </div>
            <div className="btn-grad rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ background: 'var(--grad-info)', width: '52px', height: '52px' }}>
              <CreditCard size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* Monthly software spend Card */}
        <div className="col-md-3">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary small fw-medium">Monthly Cost</span>
              <h3 className="text-white mt-1 mb-0" style={{ fontSize: '1.85rem' }}>
                ₹{data?.totalExpenses ? data.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
              </h3>
            </div>
            <div className="btn-grad rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ background: 'var(--grad-danger)', width: '52px', height: '52px' }}>
              <IndianRupee size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* ARR Card */}
        <div className="col-md-3">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary small fw-medium">Annual Run Rate (ARR)</span>
              <h3 className="text-white mt-1 mb-0" style={{ fontSize: '1.85rem' }}>
                ₹{data?.savings ? data.savings.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
              </h3>
            </div>
            <div className="btn-grad rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ background: 'var(--grad-primary)', width: '52px', height: '52px' }}>
              <Activity size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* Average Utilization Card */}
        <div className="col-md-3">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary small fw-medium">Avg License Utilization</span>
              <h3 className={`mt-1 mb-0 ${data?.budgetUtilization >= 75 ? 'text-success' : data?.budgetUtilization >= 50 ? 'text-warning' : 'text-danger'}`} style={{ fontSize: '1.85rem' }}>
                {data?.budgetUtilization ? data.budgetUtilization.toFixed(1) : 0}%
              </h3>
            </div>
            <div className="btn-grad rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ background: 'var(--grad-success)', width: '52px', height: '52px' }}>
              <CheckCircle size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Utilization progress bar */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="glass-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-medium">Average SaaS Utilization Rate</span>
              <span className="text-white small fw-bold">{data?.budgetUtilization ? data.budgetUtilization.toFixed(1) : 0}%</span>
            </div>
            <div className="progress bg-secondary" style={{ height: '12px', borderRadius: '6px' }}>
              <div 
                className={`progress-bar rounded-pill ${data?.budgetUtilization >= 75 ? 'bg-success' : data?.budgetUtilization >= 50 ? 'bg-warning' : 'bg-danger'}`} 
                role="progressbar" 
                style={{ width: `${Math.min(data?.budgetUtilization || 0, 100)}%`, transition: 'width 1s ease-in-out' }}
                aria-valuenow={data?.budgetUtilization || 0} 
                aria-valuemin="0" 
                aria-valuemax="100"
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphs & Renewals Timeline */}
      <div className="row g-4">
        {/* Cost by category */}
        <div className="col-lg-4 col-md-6">
          <div className="glass-card p-4" style={{ height: '380px' }}>
            <h5 className="text-white mb-3 d-flex align-items-center gap-2">
              <Activity size={18} className="text-primary" />
              SaaS Category Spend
            </h5>
            <div className="position-relative w-100 h-100" style={{ maxHeight: '280px' }}>
              {categories.length > 0 ? (
                <Pie data={pieData} options={{...chartOptions, maintainAspectRatio: false}} />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                  No subscription records found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Budgets vs Spend */}
        <div className="col-lg-4 col-md-6">
          <div className="glass-card p-4" style={{ height: '380px' }}>
            <h5 className="text-white mb-3 d-flex align-items-center gap-2">
              <IndianRupee size={18} className="text-success" />
              Software Budgets vs Spend
            </h5>
            <div className="w-100 h-100" style={{ maxHeight: '280px' }}>
              {budgetLabels.length > 0 ? (
                <Bar data={barData} options={chartOptions} />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                  Establish software budget limits in the Sidebar.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Renewals list */}
        <div className="col-lg-4 col-12">
          <div className="glass-card p-4" style={{ height: '380px' }}>
            <h5 className="text-white mb-3 d-flex align-items-center gap-2">
              <Clock size={18} className="text-info" />
              Upcoming Renewals
            </h5>
            <div className="d-flex flex-column gap-3 overflow-y-auto" style={{ maxHeight: '280px' }}>
              {upcomingRenewals.length > 0 ? (
                upcomingRenewals.map((sub) => {
                  const diffTime = Math.abs(new Date(sub.nextRenewalDate) - new Date());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return (
                    <div key={sub.id} className="d-flex justify-content-between align-items-center p-2 rounded-3 border border-secondary" style={{ backgroundColor: 'rgba(255, 255, 255, 0.015)' }}>
                      <div>
                        <div className="fw-semibold text-white small">{sub.name}</div>
                        <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                          Renews in {diffDays} day(s) ({sub.nextRenewalDate})
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-danger-subtle text-danger fw-bold text-end">₹{sub.amount}</span>
                        <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>{sub.billingCycle}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted small py-5">
                  No upcoming renewals.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
