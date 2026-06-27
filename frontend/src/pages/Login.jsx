import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { Sparkles, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(usernameOrEmail, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      if (!err.response) {
        setError('Network error: Unable to connect to the server. Please verify the backend is running.');
      } else if (err.response.data?.error) {
        setError(err.response.data.error);
      } else if (err.response.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center min-vh-100" style={{ position: 'relative' }}>
      <div className="glass-card p-5 fade-in-up" style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center btn-grad rounded-3 p-3 mb-3" style={{ width: '56px', height: '56px' }}>
            <Sparkles size={28} className="text-white" />
          </div>
          <h2 className="text-white fw-bold mb-1" style={{ fontFamily: 'Outfit' }}>Welcome Back</h2>
          <p className="text-secondary small">Access your SaaS subscription cost optimizer with SubGuard</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="custom-alert-danger mb-4 small" role="alert">
            <AlertCircle size={18} className="flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label text-secondary small fw-medium">Username or Email</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-color" style={{ borderColor: 'var(--border-color)' }}>
                <Mail size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control glass-input border-start-0"
                placeholder="Enter username or email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-secondary small fw-medium">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-color" style={{ borderColor: 'var(--border-color)' }}>
                <Lock size={16} className="text-muted" />
              </span>
              <input
                type="password"
                className="form-control glass-input border-start-0"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-grad w-100 mb-3"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : null}
            Sign In
          </button>
        </form>

        <div className="text-center mt-3">
          <span className="text-secondary small">Don't have an account? </span>
          <Link to="/register" className="text-decoration-none fw-semibold" style={{ color: 'var(--color-primary)' }}>
            Sign Up
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
