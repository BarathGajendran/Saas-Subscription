import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import AIInsights from './pages/AIInsights';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Dashboard shell */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="d-flex w-100 min-vh-100 overflow-hidden">
              {/* Left Sidebar */}
              <Navbar />
              
              {/* Right Content Area */}
              <div 
                className="flex-grow-1 overflow-y-auto" 
                style={{ 
                  height: '100vh', 
                  backgroundColor: 'var(--bg-primary)',
                  position: 'relative'
                }}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/income" element={<Income />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/ai-insights" element={<AIInsights />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
