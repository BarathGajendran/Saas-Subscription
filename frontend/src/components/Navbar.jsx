import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { 
    LayoutDashboard, 
    Receipt, 
    CreditCard, 
    PiggyBank, 
    Sparkles, 
    LogOut, 
    User 
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="d-flex flex-column flex-shrink-0 p-4 glass-card h-100 sidebar-container" style={{ minHeight: '100vh', width: '280px' }}>
      {/* Brand Logo */}
      <div className="d-flex align-items-center mb-4 text-decoration-none">
        <div className="d-flex align-items-center justify-content-center btn-grad rounded-3 p-2 me-2" style={{ width: '40px', height: '40px' }}>
          <Sparkles size={20} className="text-white" />
        </div>
        <span className="fs-4 fw-bold text-white bg-clip-text" style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Outfit' }}>
          SubGuard
        </span>
      </div>

      <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Nav Links */}
      <ul className="nav nav-pills flex-column mb-auto gap-2">
        <li className="nav-item">
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/expenses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CreditCard size={18} className="text-danger" />
            <span>SaaS Manager</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/income" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Receipt size={18} className="text-success" />
            <span>Billing Logs</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/budgets" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <PiggyBank size={18} className="text-warning" />
            <span>Budget Limits</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/ai-insights" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Sparkles size={18} className="text-info" />
            <span>SaaS Optimizer</span>
          </NavLink>
        </li>
      </ul>

      <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* User Session Footer */}
      {currentUser && (
        <div className="d-flex flex-column gap-3">
          <NavLink to="/profile" className={({ isActive }) => `d-flex align-items-center gap-3 px-2 py-2 text-decoration-none rounded-3 ${isActive ? 'active-profile' : 'hover-profile'}`} style={{ transition: 'all var(--transition-fast)' }}>
            <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
              <User size={20} className="text-light" />
            </div>
            <div className="overflow-hidden flex-grow-1">
              <p className="mb-0 fw-semibold text-white text-truncate" style={{ fontSize: '0.95rem' }}>{currentUser.username}</p>
              <p className="mb-0 text-muted text-truncate" style={{ fontSize: '0.8rem' }}>{currentUser.email}</p>
            </div>
          </NavLink>
          <button onClick={handleLogout} className="btn w-100 text-start sidebar-link border-0 text-danger hover-bg-danger" style={{ background: 'transparent' }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
