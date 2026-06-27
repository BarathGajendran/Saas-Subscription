import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import dashboardService from '../services/dashboard.service';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  LogOut, 
  CreditCard, 
  Activity, 
  CheckCircle,
  IndianRupee,
  Lock,
  ChevronRight
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const d = new Date();
        const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const data = await dashboardService.getDashboardData(currentMonth);
        setStats(data);
      } catch (err) {
        console.error('Failed to load user stats for profile page:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchStats();
    } else {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSignOut = () => {
    authService.logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <div className="container-fluid p-4 fade-in-up">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-white mb-1" style={{ fontFamily: 'Outfit' }}>User Account Profile</h1>
        <p className="text-secondary mb-0">View credentials, optimization statistics, and manage your active security session.</p>
      </div>

      <div className="row g-4">
        {/* Left Column: Profile Card */}
        <div className="col-lg-5 col-12">
          <div className="glass-card p-4 text-center d-flex flex-column align-items-center">
            {/* Profile Avatar */}
            <div 
              className="d-flex align-items-center justify-content-center rounded-circle mb-3 border border-secondary"
              style={{ 
                width: '100px', 
                height: '100px', 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(4, 10, 5, 0.4) 100%)',
                borderColor: 'rgba(16, 185, 129, 0.3) !important'
              }}
            >
              <User size={48} className="text-primary" />
            </div>

            <h3 className="text-white mb-1" style={{ fontFamily: 'Outfit' }}>{currentUser.username}</h3>
            <span className="badge bg-success-subtle text-success mb-4 px-3 py-2 fw-semibold" style={{ fontSize: '0.8rem' }}>
              Standard Optimizer
            </span>

            {/* User Details list */}
            <div className="w-100 text-start border-top border-bottom border-secondary py-3 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary small d-flex align-items-center gap-2">
                  <User size={16} className="text-primary" /> Username
                </span>
                <span className="text-white fw-medium">{currentUser.username}</span>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary small d-flex align-items-center gap-2">
                  <Mail size={16} className="text-primary" /> Email
                </span>
                <span className="text-white fw-medium text-truncate ms-2" title={currentUser.email}>{currentUser.email}</span>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary small d-flex align-items-center gap-2">
                  <Shield size={16} className="text-primary" /> User ID
                </span>
                <span className="text-white-50 small font-monospace">UID-{currentUser.id || 'N/A'}</span>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <span className="text-secondary small d-flex align-items-center gap-2">
                  <Lock size={16} className="text-primary" /> Security Status
                </span>
                <span className="text-success small fw-bold d-flex align-items-center gap-1">
                  Active JWT Session
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button 
              onClick={handleSignOut} 
              className="btn btn-grad w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ background: 'var(--grad-danger)' }}
            >
              <LogOut size={18} />
              <span>Log Out of Session</span>
            </button>
          </div>
        </div>

        {/* Right Column: Optimization Stats & Security Settings */}
        <div className="col-lg-7 col-12">
          {/* Optimization Performance Metrics */}
          <div className="glass-card p-4 mb-4">
            <h5 className="text-white mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit' }}>
              <Activity className="text-primary" size={20} />
              SaaS Portfolio Metrics
            </h5>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : (
              <div className="row g-3">
                {/* Metric 1 */}
                <div className="col-md-6">
                  <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-secondary small">Active Subscriptions</span>
                      <CreditCard size={18} className="text-info" />
                    </div>
                    <h4 className="text-white mt-2 mb-0" style={{ fontFamily: 'Outfit' }}>
                      {stats?.totalIncome ? Math.round(stats.totalIncome) : 0}
                    </h4>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="col-md-6">
                  <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-secondary small">Monthly SaaS Expenses</span>
                      <IndianRupee size={18} className="text-danger" />
                    </div>
                    <h4 className="text-white mt-2 mb-0" style={{ fontFamily: 'Outfit' }}>
                      ₹{stats?.totalExpenses ? stats.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                    </h4>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="col-md-6">
                  <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-secondary small">Annualized Run Rate (ARR)</span>
                      <Activity size={18} className="text-success" />
                    </div>
                    <h4 className="text-white mt-2 mb-0" style={{ fontFamily: 'Outfit' }}>
                      ₹{stats?.savings ? stats.savings.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                    </h4>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="col-md-6">
                  <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-secondary small">Avg License Utilization</span>
                      <CheckCircle size={18} className="text-warning" />
                    </div>
                    <h4 className="text-white mt-2 mb-0" style={{ fontFamily: 'Outfit' }}>
                      {stats?.budgetUtilization ? stats.budgetUtilization.toFixed(1) : 0}%
                    </h4>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security & Settings Card */}
          <div className="glass-card p-4">
            <h5 className="text-white mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit' }}>
              <Shield className="text-success" size={20} />
              Session & Security Info
            </h5>

            <div className="d-flex flex-column gap-3">
              <div className="p-3 rounded-3 d-flex justify-content-between align-items-center" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <div>
                  <div className="text-white fw-medium small">Token Authentication</div>
                  <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>Secured via 256-bit JSON Web Token (JWT)</div>
                </div>
                <span className="badge bg-success-subtle text-success">Active</span>
              </div>

              <div className="p-3 rounded-3 d-flex justify-content-between align-items-center" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <div>
                  <div className="text-white fw-medium small">Database Connection</div>
                  <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>Encrypted link to MySQL database port 3307</div>
                </div>
                <span className="badge bg-success-subtle text-success">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
