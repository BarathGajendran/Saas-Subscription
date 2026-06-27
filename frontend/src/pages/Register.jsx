import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { Sparkles, User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.register(username, email, password);
      setSuccess('Registration successful! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      if (!err.response) {
        setError('Network error: Unable to connect to the server. Please verify the backend is running.');
      } else if (err.response.data?.error && err.response.data.error !== 'Bad Request') {
        setError(err.response.data.error);
      } else if (err.response.data?.errors && Array.isArray(err.response.data.errors)) {
        const validationMsg = err.response.data.errors.map(e => `${e.field}: ${e.defaultMessage}`).join(', ');
        setError(validationMsg || 'Validation error');
      } else if (err.response.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Username or email may already be taken.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center min-vh-100">
      <div className="glass-card p-5 fade-in-up" style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center btn-grad rounded-3 p-3 mb-3" style={{ width: '56px', height: '56px' }}>
            <Sparkles size={28} className="text-white" />
          </div>
          <h2 className="text-white fw-bold mb-1" style={{ fontFamily: 'Outfit' }}>Create Account</h2>
          <p className="text-secondary small">Start optimizing your savings today</p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="custom-alert-danger mb-4 small" role="alert">
            <AlertCircle size={18} className="flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="custom-alert mb-4 small" style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }} role="alert">
            <CheckCircle size={18} className="flex-shrink-0" />
            <div>{success}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label className="form-label text-secondary small fw-medium">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-color" style={{ borderColor: 'var(--border-color)' }}>
                <User size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control glass-input border-start-0"
                placeholder="Choose username (at least 3 characters)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-secondary small fw-medium">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-color" style={{ borderColor: 'var(--border-color)' }}>
                <Mail size={16} className="text-muted" />
              </span>
              <input
                type="email"
                className="form-control glass-input border-start-0"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
            Sign Up
          </button>
        </form>

        <div className="text-center mt-3">
          <span className="text-secondary small">Already have an account? </span>
          <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: 'var(--color-primary)' }}>
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
